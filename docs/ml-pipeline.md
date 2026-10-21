# ML pipeline

```
Dataset → Clean → Preprocess/Augment → Split → Train → Evaluate → Version → Export → Serve → Feedback → Retrain
```

## Setup

```bash
cd ml
python -m venv .venv && .venv/Scripts/activate      # macOS/Linux: source .venv/bin/activate
pip install -e .
```

## 1. Get data

Labels are `<crop>__<condition>` and must match `Disease.key` in
`server/prisma/data/diseases.json` (e.g. `tomato__early_blight`, `maize__healthy`).

Good starting sources: PlantVillage (tomato, maize, pepper), the Makerere/Kaggle
cassava leaf dataset, and — most important — **field photos from Nigerian farms**.
Lab-style datasets with plain backgrounds overstate accuracy; field images are what
make the model work for farmers.

```bash
python -m agroml.data.prepare --config configs/disease_v1.yaml --source /path/to/PlantVillage
```

Folders are renamed through `configs/label_map.yaml`. The step removes corrupt and
tiny images, drops near-duplicates (perceptual hash), drops classes with too few
images, and writes stratified `data/processed/{train,val,test}.csv`.

## 2. Train

```bash
python -m agroml.train --config configs/disease_v1.yaml
```

- Any `timm` backbone (`arch`). EfficientNet-B0 is the default; MobileNetV3 for a
  future on-device model.
- Augmentation simulates field conditions: lighting, blur, angles, occlusion.
- Class imbalance is handled with a weighted sampler (or class weights).
- Best epoch chosen by **validation macro-F1**, not accuracy.

## 3. Evaluate

```bash
python -m agroml.evaluate --run runs/<version>
```

Accuracy, macro and weighted precision/recall/F1, per-class report, confusion matrix
(`runs/<version>/metrics.json`, `confusion_matrix.png`). Weak classes are listed so
you know where to collect more images.

## 4. Export & deploy

```bash
python -m agroml.export --run runs/<version> --min-macro-f1 0.85
```

Refuses to export without test metrics or below the quality bar. Verifies ONNX output
matches PyTorch, then writes `ai/artifacts/disease/<version>/` with `model.onnx`,
`labels.json` and `model_card.json`. Restart the AI service (or pin
`DISEASE_MODEL_VERSION`). Every scan records the version that produced it.

## 5. Feedback → retrain

```bash
python -m agroml.feedback --api http://localhost:4000 --token <admin JWT>
```

Pulls expert-verified scans into `data/raw/<label>/`, then repeat steps 1–4.

## Keeping inference in sync

`ml/src/agroml/data/transforms.py::eval_transform` and
`ai/app/models/classifier.py::_preprocess` must apply the same resize, crop and
normalisation. Change both together.
