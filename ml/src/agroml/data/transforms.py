"""Image preprocessing + augmentation.

Augmentations simulate field conditions: varied lighting, cheap/blurry cameras,
odd angles, partial occlusion. The eval transform must stay in sync with
ai/app/models/classifier.py::_preprocess.
"""
from torchvision import transforms as T

MEAN = [0.485, 0.456, 0.406]
STD = [0.229, 0.224, 0.225]


def train_transform(size: int) -> T.Compose:
    return T.Compose([
        T.RandomResizedCrop(size, scale=(0.5, 1.0)),
        T.RandomHorizontalFlip(),
        T.RandomVerticalFlip(),
        T.RandomRotation(25),
        T.ColorJitter(brightness=0.35, contrast=0.3, saturation=0.25, hue=0.03),  # lighting
        T.RandomApply([T.GaussianBlur(5, sigma=(0.1, 2.0))], p=0.25),  # camera quality
        T.RandomGrayscale(p=0.02),
        T.ToTensor(),
        T.Normalize(MEAN, STD),
        T.RandomErasing(p=0.2, scale=(0.02, 0.12)),  # occlusion / background clutter
    ])


def eval_transform(size: int) -> T.Compose:
    return T.Compose([
        T.Resize(int(size * 1.14)),
        T.CenterCrop(size),
        T.ToTensor(),
        T.Normalize(MEAN, STD),
    ])
