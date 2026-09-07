# CSPPS ML Training

This folder contains the offline Python training pipeline for CSPPS. Models are trained here and exported to ONNX format, then used by the Next.js app at runtime via `onnxruntime-node`.

## Setup

```bash
cd ml-training
pip install -r requirements.txt
```

## Pipeline

### 1. Generate Dataset

```bash
python generate_data.py
```

Generates 2,000 synthetic student records with:
- `previous_gpa` (0.0 - 4.0)
- `attendance_rate` (0 - 100)
- `study_hours` (0 - 40)
- `assignment_average` (0 - 100)
- `test_average` (0 - 100)
- `predicted_gpa` (target for regression)
- `risk_level` (target for classification: HIGH, MEDIUM, LOW)

Output: `data/student_data.csv`

### 2. Train Models & Export to ONNX

```bash
python train_models.py
```

Trains:
- **Random Forest Regressor** → GPA prediction (regression)
- **Gradient Boosting Classifier** → Risk level (classification)
- **SVM Classifier** → Risk level (classification, for comparison)

Exports:
- `src/lib/ml/models/gpa_regressor.onnx`
- `src/lib/ml/models/risk_classifier.onnx`

Saves metrics to `results/metrics.json` including:
- MAE, RMSE (regression)
- Accuracy, Precision, Recall, F1 (classification)

### 3. Runtime Inference

The Next.js app loads the ONNX models via `src/lib/ml/inference.ts`:
- If ONNX models exist → uses them for prediction
- If ONNX models don't exist → falls back to rule-based prediction

## Using Real Data

Replace `generate_data.py` with your own dataset. Ensure your CSV has the same columns as described above, then run `train_models.py` directly.

## Architecture

```
Dataset (CSV)
  → Python/scikit-learn (training)
  → skl2onnx (export)
  → .onnx files (committed to repo)
  → onnxruntime-node (runtime inference in Next.js)
```

No Python hosting required at runtime. Models run entirely inside the Next.js API routes.
