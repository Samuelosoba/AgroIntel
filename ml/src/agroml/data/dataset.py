from pathlib import Path

import pandas as pd
import torch
from PIL import Image
from torch.utils.data import Dataset

from agroml.config import ML_ROOT


class ManifestDataset(Dataset):
    """Reads a split CSV (path,label) written by `prepare`."""

    def __init__(self, csv: Path, labels: list[str], transform):
        self.df = pd.read_csv(csv)
        self.index = {lbl: i for i, lbl in enumerate(labels)}
        self.df = self.df[self.df.label.isin(self.index)].reset_index(drop=True)
        self.transform = transform

    def __len__(self) -> int:
        return len(self.df)

    def targets(self) -> torch.Tensor:
        return torch.tensor([self.index[l] for l in self.df.label])

    def __getitem__(self, i: int):
        row = self.df.iloc[i]
        with Image.open(ML_ROOT / row.path) as im:
            img = self.transform(im.convert("RGB"))
        return img, self.index[row.label]
