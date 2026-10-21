"""Close the loop: pull expert-verified scans from the API into data/raw for retraining.

    python -m agroml.feedback --api http://localhost:4000 --token <admin JWT>

Images land in data/raw/<label>/verified_<scanId>.jpg, then re-run prepare → train.
"""
import argparse

import requests

from agroml.config import resolve


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--api", default="http://localhost:4000")
    ap.add_argument("--token", required=True)
    ap.add_argument("--raw-dir", default="data/raw")
    args = ap.parse_args()

    headers = {"Authorization": f"Bearer {args.token}"}
    rows = requests.get(f"{args.api}/api/v1/reviews/training-export", headers=headers, timeout=30).json()
    raw_dir = resolve(args.raw_dir)

    added = 0
    for row in rows:
        dest = raw_dir / row["label"] / f"verified_{row['scanId']}.jpg"
        if dest.exists():
            continue
        dest.parent.mkdir(parents=True, exist_ok=True)
        img = requests.get(row["imageUrl"], timeout=30)
        if img.ok:
            dest.write_bytes(img.content)
            added += 1
    disagreements = sum(1 for r in rows if r["modelLabel"] != r["label"])
    print(f"Added {added} verified images ({disagreements}/{len(rows)} corrected the model).")


if __name__ == "__main__":
    main()
