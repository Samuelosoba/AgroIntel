"""Dataset → cleaning → train/val/test split.

    python -m agroml.data.prepare --config configs/disease_v1.yaml [--source path/to/PlantVillage]

With --source, folders are renamed through configs/label_map.yaml and copied into
data/raw. Then every image in data/raw is validated, near-duplicates are removed
(perceptual hash), and a stratified split is written as CSV manifests.
"""
import argparse
import re
import shutil
from collections import Counter
from pathlib import Path

import imagehash
import pandas as pd
import yaml
from PIL import Image, UnidentifiedImageError
from sklearn.model_selection import train_test_split
from tqdm import tqdm

from agroml.config import ML_ROOT, load_config, resolve

LABEL_RE = re.compile(r"^[a-z_]+__[a-z0-9_]+$")
EXTS = {".jpg", ".jpeg", ".png", ".webp"}


def import_source(source: Path, raw_dir: Path) -> None:
    label_map = yaml.safe_load((ML_ROOT / "configs" / "label_map.yaml").read_text())
    for folder in sorted(p for p in source.iterdir() if p.is_dir()):
        label = label_map.get(folder.name)
        if not label:
            print(f"  skip unmapped folder: {folder.name}")
            continue
        dest = raw_dir / label
        dest.mkdir(parents=True, exist_ok=True)
        for img in folder.iterdir():
            if img.suffix.lower() in EXTS:
                shutil.copy2(img, dest / f"{folder.name[:12]}_{img.name}")


def clean(raw_dir: Path, min_side: int, hamming: int) -> pd.DataFrame:
    rows = []
    stats = Counter()
    for label_dir in sorted(p for p in raw_dir.iterdir() if p.is_dir()):
        label = label_dir.name
        if not LABEL_RE.match(label):
            print(f"  skip badly named class folder: {label} (expected <crop>__<condition>)")
            continue
        hashes: list[imagehash.ImageHash] = []
        for path in tqdm(sorted(label_dir.iterdir()), desc=label, leave=False):
            if path.suffix.lower() not in EXTS:
                continue
            try:
                with Image.open(path) as im:
                    im.verify()
                with Image.open(path) as im:
                    im = im.convert("RGB")
                    if min(im.size) < min_side:
                        stats["too_small"] += 1
                        continue
                    h = imagehash.phash(im)
            except (UnidentifiedImageError, OSError):
                stats["corrupt"] += 1
                continue
            if any(h - other <= hamming for other in hashes):
                stats["duplicate"] += 1
                continue
            hashes.append(h)
            rows.append({"path": str(path.relative_to(ML_ROOT)), "label": label})
    print(f"Cleaning removed: {dict(stats) or 'nothing'}")
    return pd.DataFrame(rows)


def split(df: pd.DataFrame, ratios: list[float], seed: int) -> dict[str, pd.DataFrame]:
    train_r, val_r, test_r = ratios
    train, rest = train_test_split(df, train_size=train_r, stratify=df.label, random_state=seed)
    val, test = train_test_split(rest, test_size=test_r / (val_r + test_r), stratify=rest.label, random_state=seed)
    return {"train": train, "val": val, "test": test}


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--config", required=True)
    ap.add_argument("--source", type=Path, help="public dataset folder to import via label_map.yaml")
    args = ap.parse_args()
    cfg = load_config(args.config)
    data = cfg["data"]
    raw_dir, out_dir = resolve(data["raw_dir"]), resolve(data["processed_dir"])
    raw_dir.mkdir(parents=True, exist_ok=True)

    if args.source:
        import_source(args.source, raw_dir)

    df = clean(raw_dir, data["min_side_px"], data["dedupe_hamming"])
    counts = df.label.value_counts()
    too_few = counts[counts < data["min_images_per_class"]]
    if len(too_few):
        print(f"Dropping classes with too few images: {too_few.to_dict()}")
        df = df[~df.label.isin(too_few.index)]
    if df.empty:
        raise SystemExit(f"No usable images found in {raw_dir}")

    out_dir.mkdir(parents=True, exist_ok=True)
    for name, part in split(df, data["split"], cfg["train"]["seed"]).items():
        part.to_csv(out_dir / f"{name}.csv", index=False)
        print(f"{name}: {len(part)} images")

    print("\nClass balance (watch for imbalance — training uses a weighted sampler):")
    print(df.label.value_counts().to_string())


if __name__ == "__main__":
    main()
