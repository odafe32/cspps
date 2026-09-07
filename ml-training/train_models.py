"""
CSPPS - Model Training and ONNX Export (5.0 GPA Scale)
Trains Random Forest, SVM, and Gradient Boosting models on the student dataset,
evaluates them, and exports the best ones to ONNX format.

Models:
  1. Random Forest Regressor -> predicted_gpa (regression, 0-5.0)
  2. Gradient Boosting Classifier -> risk_level (classification)
  3. SVM Classifier -> risk_level (classification)

Outputs:
  - src/lib/ml/models/gpa_regressor.onnx
  - src/lib/ml/models/risk_classifier.onnx
  - ml-training/results/metrics.json
"""

import os
import json
import numpy as np
import pandas as pd  # type: ignore
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import RandomForestRegressor, GradientBoostingClassifier
from sklearn.svm import SVC
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    classification_report,
)
from skl2onnx import to_onnx  # type: ignore
from skl2onnx.common.data_types import FloatTensorType  # type: ignore
import onnxruntime as rt  # type: ignore

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(BASE_DIR, "data", "student_data.csv")
MODELS_DIR = os.path.join(BASE_DIR, "..", "src", "lib", "ml", "models")
RESULTS_DIR = os.path.join(BASE_DIR, "results")

# 7 features
FEATURES = [
    "previous_gpa",
    "attendance_rate",
    "study_hours",
    "assignment_average",
    "test_average",
    "library_visits",
    "class_participation",
]
NUM_FEATURES = len(FEATURES)
REGRESSION_TARGET = "predicted_gpa"
CLASSIFICATION_TARGET = "risk_level"


def load_data():
    df = pd.read_csv(DATA_FILE)
    X = df[FEATURES].values.astype(np.float32)
    y_reg = df[REGRESSION_TARGET].values.astype(np.float32)
    le = LabelEncoder()
    y_cls = le.fit_transform(df[CLASSIFICATION_TARGET].values)

    X_train, X_test, y_reg_train, y_reg_test, y_cls_train, y_cls_test = (
        train_test_split(X, y_reg, y_cls, test_size=0.2, random_state=42)
    )

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    return X_train, X_test, X_train_scaled, X_test_scaled, y_reg_train, y_reg_test, y_cls_train, y_cls_test, le, scaler


def train_regression_models(X_train, X_test, y_train, y_test):
    results = {}

    # Random Forest Regressor
    rf = RandomForestRegressor(n_estimators=300, max_depth=12, random_state=42)
    rf.fit(X_train, y_train)
    preds = rf.predict(X_test)
    mae = mean_absolute_error(y_test, preds)
    rmse = np.sqrt(mean_squared_error(y_test, preds))
    results["random_forest"] = {"model": rf, "mae": mae, "rmse": rmse}
    print(f"Random Forest Regressor: MAE={mae:.4f}, RMSE={rmse:.4f}")

    # Feature importance
    importances = rf.feature_importances_
    for f, imp in sorted(zip(FEATURES, importances), key=lambda x: -x[1]):
        print(f"  {f}: {imp:.4f}")

    return results


def train_classification_models(X_train, X_test, y_train, y_test, label_encoder):
    results = {}

    # Gradient Boosting Classifier
    gb = GradientBoostingClassifier(n_estimators=200, max_depth=5, random_state=42)
    gb.fit(X_train, y_train)
    preds = gb.predict(X_test)
    acc = accuracy_score(y_test, preds)
    prec = precision_score(y_test, preds, average="weighted")
    rec = recall_score(y_test, preds, average="weighted")
    f1 = f1_score(y_test, preds, average="weighted")
    results["gradient_boosting"] = {"model": gb, "accuracy": acc, "precision": prec, "recall": rec, "f1": f1}
    print(f"Gradient Boosting Classifier: Acc={acc:.4f}, Prec={prec:.4f}, Rec={rec:.4f}, F1={f1:.4f}")
    print(classification_report(y_test, preds, target_names=label_encoder.classes_))

    # SVM Classifier
    svm = SVC(kernel="rbf", C=1.0, random_state=42)
    svm.fit(X_train, y_train)
    preds = svm.predict(X_test)
    acc = accuracy_score(y_test, preds)
    prec = precision_score(y_test, preds, average="weighted")
    rec = recall_score(y_test, preds, average="weighted")
    f1 = f1_score(y_test, preds, average="weighted")
    results["svm"] = {"model": svm, "accuracy": acc, "precision": prec, "recall": rec, "f1": f1}
    print(f"SVM Classifier: Acc={acc:.4f}, Prec={prec:.4f}, Rec={rec:.4f}, F1={f1:.4f}")

    return results


def export_to_onnx(regression_results, classification_results, label_encoder):
    os.makedirs(MODELS_DIR, exist_ok=True)

    initial_type = [("input", FloatTensorType([None, NUM_FEATURES]))]

    # Export Random Forest Regressor
    rf_model = regression_results["random_forest"]["model"]
    onx_reg = to_onnx(rf_model, initial_types=initial_type, target_opset=15)  # type: ignore
    reg_path = os.path.join(MODELS_DIR, "gpa_regressor.onnx")
    with open(reg_path, "wb") as f:
        f.write(onx_reg.SerializeToString())
    print(f"Exported GPA regressor -> {reg_path}")

    # Export Gradient Boosting Classifier
    gb_model = classification_results["gradient_boosting"]["model"]
    onx_cls = to_onnx(gb_model, initial_types=initial_type, target_opset=15)  # type: ignore
    cls_path = os.path.join(MODELS_DIR, "risk_classifier.onnx")
    with open(cls_path, "wb") as f:
        f.write(onx_cls.SerializeToString())
    print(f"Exported risk classifier -> {cls_path}")

    # Verify ONNX models work
    sess_reg = rt.InferenceSession(reg_path)
    sess_cls = rt.InferenceSession(cls_path)
    input_name = sess_reg.get_inputs()[0].name
    # Test: previous_gpa=3.5, attendance=85, study=15, assignment=80, test=75, library=8, participation=7
    test_input = np.array([[3.5, 85, 15, 80, 75, 8, 7]], dtype=np.float32)
    reg_pred = sess_reg.run(None, {input_name: test_input})
    cls_pred = sess_cls.run(None, {input_name: test_input})
    print(f"\nONNX verification:")
    print(f"  Input: GPA=3.5, Att=85%, Study=15h, Assign=80, Test=75, Library=8, Particip=7")
    print(f"  Predicted GPA: {reg_pred[0][0][0]:.2f}")  # type: ignore
    print(f"  Risk class: {label_encoder.inverse_transform([cls_pred[0][0]])[0]}")  # type: ignore


def save_metrics(regression_results, classification_results, label_encoder):
    os.makedirs(RESULTS_DIR, exist_ok=True)
    metrics = {
        "gpa_scale": 5.0,
        "regression": {
            "random_forest": {
                "mae": float(regression_results["random_forest"]["mae"]),
                "rmse": float(regression_results["random_forest"]["rmse"]),
            },
        },
        "classification": {
            "gradient_boosting": {
                "accuracy": float(classification_results["gradient_boosting"]["accuracy"]),
                "precision": float(classification_results["gradient_boosting"]["precision"]),
                "recall": float(classification_results["gradient_boosting"]["recall"]),
                "f1": float(classification_results["gradient_boosting"]["f1"]),
            },
            "svm": {
                "accuracy": float(classification_results["svm"]["accuracy"]),
                "precision": float(classification_results["svm"]["precision"]),
                "recall": float(classification_results["svm"]["recall"]),
                "f1": float(classification_results["svm"]["f1"]),
            },
        },
        "label_classes": list(label_encoder.classes_),
        "features": FEATURES,
    }
    metrics_path = os.path.join(RESULTS_DIR, "metrics.json")
    with open(metrics_path, "w") as f:
        json.dump(metrics, f, indent=2)
    print(f"\nSaved metrics -> {metrics_path}")


def main():
    print("=" * 60)
    print("CSPPS - Model Training Pipeline (5.0 GPA Scale)")
    print("=" * 60)

    print("\n1. Loading data...")
    X_train, X_test, X_train_s, X_test_s, y_reg_train, y_reg_test, y_cls_train, y_cls_test, le, scaler = load_data()
    print(f"   Train: {X_train.shape[0]} samples, Test: {X_test.shape[0]} samples")
    print(f"   Features: {NUM_FEATURES}")
    print(f"   Classes: {list(le.classes_)}")

    print("\n2. Training regression models (GPA prediction, 0-5.0)...")
    reg_results = train_regression_models(X_train, X_test, y_reg_train, y_reg_test)

    print("\n3. Training classification models (risk level)...")
    cls_results = train_classification_models(X_train_s, X_test_s, y_cls_train, y_cls_test, le)

    print("\n4. Exporting to ONNX...")
    export_to_onnx(reg_results, cls_results, le)

    print("\n5. Saving metrics...")
    save_metrics(reg_results, cls_results, le)

    print("\n" + "=" * 60)
    print("Training complete! Models use 5.0 GPA scale.")
    print("=" * 60)


if __name__ == "__main__":
    main()
