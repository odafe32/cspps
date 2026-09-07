"""
CSPPS - Realistic Dataset Generator (5.0 GPA Scale)
Generates a realistic Nigerian university student performance dataset.

Nigerian university grading (5.0 scale):
  - 4.50 - 5.00 = First Class
  - 3.50 - 4.49 = Second Class Upper (2:1)
  - 2.40 - 3.49 = Second Class Lower (2:2)
  - 1.50 - 2.39 = Third Class
  - 1.00 - 1.49 = Pass
  - 0.00 - 0.99 = Fail

Features:
  - previous_gpa (0.0 - 5.0)
  - attendance_rate (0 - 100)
  - study_hours (0 - 40, hours per week)
  - assignment_average (0 - 100)
  - test_average (0 - 100)
  - library_visits (0 - 20, visits per semester)
  - class_participation (0 - 10, rating)

Targets:
  - predicted_gpa (regression, 0.0 - 5.0)
  - risk_level (classification: HIGH, MEDIUM, LOW)

Output: ml-training/data/student_data.csv
"""

import os
import numpy as np
import pandas as pd

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "data")
OUTPUT_FILE = os.path.join(OUTPUT_DIR, "student_data.csv")
NUM_SAMPLES = 3000
SEED = 42

np.random.seed(SEED)


def generate_data(n: int) -> pd.DataFrame:
    # --- Features (realistic distributions) ---

    # Previous GPA: most students cluster around 2.5-4.0 (2:2 to 2:1)
    # Few at top (First Class), few at bottom (Pass/Fail)
    previous_gpa = np.clip(np.random.beta(2.5, 1.8, n) * 5.0, 0, 5.0)

    # Attendance: most students attend 60-95%, some skip a lot
    attendance_rate = np.clip(np.random.normal(78, 16, n), 0, 100)

    # Study hours: average 8-15 hrs/week, some study more
    study_hours = np.clip(np.random.normal(12, 6, n), 0, 40)

    # Assignment scores: correlated with GPA
    assignment_average = np.clip(
        previous_gpa * 15 + np.random.normal(15, 10, n), 0, 100
    )

    # Test scores: correlated with GPA but with more variance
    test_average = np.clip(
        previous_gpa * 14 + np.random.normal(18, 12, n), 0, 100
    )

    # Library visits: students who study more visit more
    library_visits = np.clip(
        study_hours * 0.5 + np.random.normal(2, 3, n), 0, 20
    ).astype(int)

    # Class participation: correlated with attendance
    class_participation = np.clip(
        (attendance_rate / 10) + np.random.normal(0, 2, n), 0, 10
    )

    # --- Target: Predicted GPA ---
    # Weighted combination of all factors (realistic model)
    predicted_gpa = (
        previous_gpa * 0.35
        + (attendance_rate / 100) * 1.0
        + (study_hours / 40) * 0.8
        + (assignment_average / 100) * 1.0
        + (test_average / 100) * 1.2
        + (library_visits / 20) * 0.3
        + (class_participation / 10) * 0.4
        + np.random.normal(0, 0.2, n)  # noise
    )
    predicted_gpa = np.clip(predicted_gpa, 0, 5.0)

    # --- Target: Risk Level ---
    # HIGH: GPA < 2.0 OR attendance < 60% OR test < 50
    # MEDIUM: GPA 2.0-3.0 OR attendance 60-75% OR test 50-65
    # LOW: GPA > 3.0 AND attendance > 75% AND test > 65
    risk_level = np.where(
        (predicted_gpa < 2.0) | (attendance_rate < 60) | (test_average < 50),
        "HIGH",
        np.where(
            (predicted_gpa < 3.0) | (attendance_rate < 75) | (test_average < 65),
            "MEDIUM",
            "LOW",
        ),
    )

    df = pd.DataFrame(
        {
            "previous_gpa": previous_gpa.round(2),
            "attendance_rate": attendance_rate.round(1),
            "study_hours": study_hours.round(1),
            "assignment_average": assignment_average.round(1),
            "test_average": test_average.round(1),
            "library_visits": library_visits,
            "class_participation": class_participation.round(1),
            "predicted_gpa": predicted_gpa.round(2),
            "risk_level": risk_level,
        }
    )

    return df


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    df = generate_data(NUM_SAMPLES)
    df.to_csv(OUTPUT_FILE, index=False)

    print(f"Generated {len(df)} samples -> {OUTPUT_FILE}")
    print(f"\nRisk distribution:")
    print(df["risk_level"].value_counts())
    print(f"\nGPA stats (5.0 scale):")
    print(df["predicted_gpa"].describe())
    print(f"\nClass distribution:")
    print(
        pd.cut(
            df["predicted_gpa"],
            bins=[0, 1.0, 2.4, 3.5, 4.5, 5.0],
            labels=["Fail/Pass", "Third Class", "2:2", "2:1", "First Class"],
        ).value_counts().sort_index()
    )
    print(f"\nFirst 5 rows:")
    print(df.head())


if __name__ == "__main__":
    main()
