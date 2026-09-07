# CSPPS — Comprehensive Student Performance Prediction System

A web-based predictive analytics platform for tertiary institutions that forecasts student academic performance (CGPA) and identifies at-risk students using machine learning. CSPPS moves academic monitoring from **reactive** grade tracking to **proactive**, data-informed intervention.

> **Project Title:** Design and Implementation of a Comprehensive Students' Performance Prediction System (CSPPS)
> **Implementation:** Godfrey Joseph

---

## Table of Contents

- [Overview](#overview)
- [Problem Statement](#problem-statement)
- [Objectives](#objectives)
- [Scope](#scope)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [User Roles](#user-roles)
- [Application Routes](#application-routes)
- [Database Design](#database-design)
- [Machine Learning](#machine-learning)
- [AI Layer (Optional)](#ai-layer-optional)
- [Core Workflows](#core-workflows)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Development Phases](#development-phases)
- [Testing](#testing)
- [Deployment](#deployment)
- [License](#license)

---

## Overview

CSPPS collects academic and behavioral student data, applies supervised machine-learning models to predict academic outcomes (CGPA and risk level), and presents results through role-based dashboards with visualizations, alerts, and exportable reports.

The system supports:

- Secure role-based login (Student, Lecturer, Administrator)
- Student data upload (CSV) and manual data entry
- Data preprocessing and normalization
- Predictive modeling using **Random Forest**, **SVM**, and **Gradient Boosting**
- CGPA prediction and risk classification (Low / Medium / High)
- Interactive dashboards with charts and trend visualizations
- Notification system for academic alerts
- Exportable academic and prediction reports
- Activity logging

---

## Problem Statement

Traditional student evaluation — based on tests, assignments, and exams — only provides a snapshot of outcomes and rarely reveals the underlying factors (attendance, study habits, behavior) that influence performance. Many institutions still rely on manual or spreadsheet-based tracking, which is:

- Time-consuming and error-prone
- Lacking predictive intelligence
- Unable to detect at-risk students early
- Without visualization or early-warning mechanisms

CSPPS addresses these gaps by integrating machine learning into a usable web platform that supports timely academic intervention.

---

## Objectives

1. Design a Comprehensive Student Performance Prediction System architecture
2. Develop an algorithm for the system
3. Implement the algorithm

---

## Scope

### In Scope

- Predictive web-based system for tertiary institutions
- Academic records, attendance logs, and study-related behavior as primary inputs
- Data entry, preprocessing, predictive modeling, visualization, and web interaction
- SVM, Random Forest, and Gradient Boosting models
- CGPA prediction and performance category classification
- Lecturer/admin dashboards, reports, and at-risk identification
- Simulated or department-collected data for testing

### Out of Scope

- Biometric authentication
- Third-party data sources (e.g., national exam bodies)
- Full automation of institutional grading
- Mobile application development
- Full institutional deployment and long-term model retraining

---

## Technology Stack

| Area            | Technology                              |
| --------------- | --------------------------------------- |
| Frontend        | Next.js                                 |
| Language        | TypeScript                              |
| Styling         | Tailwind CSS                            |
| UI Components   | shadcn/ui                               |
| Database        | PostgreSQL                              |
| ORM             | Prisma                                  |
| Authentication  | Auth.js / custom JWT-session auth       |
| Charts          | Recharts                                |
| Backend/API     | Next.js Route Handlers                  |
| ML Training     | Python (local, one-time)                |
| ML Framework    | scikit-learn                            |
| ML Export       | ONNX (`skl2onnx`)                       |
| ML Inference    | `onnxruntime-node` (inside Next.js)     |
| AI (optional)   | OpenAI API                              |
| File processing | CSV parser                              |
| Deployment      | Vercel + Neon (PostgreSQL)              |

---

## Architecture

CSPPS uses a three-tier architecture (Presentation, Application, Data). ML models are trained in Python locally (one-time), exported to ONNX format, and served inside Next.js via `onnxruntime-node` — no separate Python server at runtime.

```
                         CSPPS
                           |
                           v
                    +--------------+
                    |   Next.js    |
                    |  Web System  |
                    +------+-------+
                           |
            +--------------+--------------+
            |              |              |
            v              v              v
         Student       Lecturer        Admin
        Dashboard     Dashboard      Dashboard
            |              |              |
            +--------------+--------------+
                           |
                           v
                    Next.js API
                           |
              +------------+------------+
              |                         |
              v                         v
        PostgreSQL            ONNX Inference
        Database              (onnxruntime-node)
              |                         |
              |                  +------+------+
              |                  |      |      |
              |                  v      v      v
              |                 SVM   RF   Gradient
              |                            Boosting
              |                         |
              +-------------------------+
                           |
                           v
                      Prediction
                           |
                           v
                 Dashboard / Alerts

  Training (offline, one-time):
    Python + scikit-learn -> train -> skl2onnx -> .onnx files
    .onnx files committed to repo, loaded by Next.js at runtime
```

---

## User Roles

### Student

- Login
- View academic predictions and predicted standing
- Receive alerts on performance standing
- Track academic history and risk levels

### Lecturer

- Login
- Upload student data (CSV) and enter data manually
- Trigger the prediction engine
- Review prediction outcomes
- Offer academic guidance based on insights

### Administrator

- Login
- Manage user accounts (students, lecturers, admins)
- Oversee system configuration and security
- Generate reports based on predictions and student profiles

---

## Application Routes

```
/app
  /(auth)
      /login
      /forgot-password

  /(student)
      /student
          /dashboard
          /performance
          /predictions
          /history
          /notifications
          /profile

  /(lecturer)
      /lecturer
          /dashboard
          /students
          /students/[id]
          /upload
          /predictions
          /reports
          /notifications
          /profile

  /(admin)
      /admin
          /dashboard
          /users
          /students
          /lecturers
          /reports
          /settings
          /activity-logs

  /api
      /auth
      /students
      /lecturers
      /performance
      /predictions
      /reports
      /notifications
      /ml
```

Route protection:

- `/student/*` — students only
- `/lecturer/*` — lecturers only
- `/admin/*` — administrators only

---

## Database Design

PostgreSQL holds the application's main data. The schema below mirrors the tables defined in the project document (Tables 3.1–3.5) and adds the supporting entities (`users`, `notifications`, `activity_logs`) required for authentication, alerts, and the algorithm's "Log Activity" step.

### users

| Column          | Type     | Description                  |
| --------------- | -------- | ---------------------------- |
| id              | INT      | Primary Key                  |
| email           | VARCHAR  | Unique email                 |
| password_hash   | VARCHAR  | Hashed password              |
| role            | ENUM     | STUDENT / LECTURER / ADMIN   |
| first_name      | VARCHAR  | First name                   |
| last_name       | VARCHAR  | Last name                    |
| created_at      | DATETIME | Creation timestamp           |
| updated_at      | DATETIME | Last update timestamp        |

### students (Table 3.1)

| Column          | Type     | Description                  |
| --------------- | -------- | ---------------------------- |
| student_id      | INT      | Primary Key, Auto Increment  |
| user_id         | INT      | FK -> users                  |
| first_name      | VARCHAR  | Student's first name         |
| last_name       | VARCHAR  | Student's last name          |
| date_of_birth   | DATE     | Student's date of birth      |
| enrollment_date | DATETIME | Date of enrollment           |

### lecturers (Table 3.2)

| Column      | Type     | Description                          |
| ----------- | -------- | ------------------------------------ |
| lecturer_id | INT      | Primary Key, Auto Increment          |
| user_id     | INT      | FK -> users                          |
| first_name  | VARCHAR  | Lecturer's first name                |
| last_name   | VARCHAR  | Lecturer's last name                 |
| department  | VARCHAR  | Department the lecturer belongs to   |

### admins (Table 3.3)

| Column     | Type     | Description                 |
| ---------- | -------- | --------------------------- |
| admin_id   | INT      | Primary Key, Auto Increment |
| user_id    | INT      | FK -> users                 |
| first_name | VARCHAR  | Admin's first name          |
| last_name  | VARCHAR  | Admin's last name           |

### performance_records (Table 3.4)

| Column          | Type     | Description                          |
| --------------- | -------- | ------------------------------------ |
| record_id       | INT      | Primary Key, Auto Increment          |
| student_id      | INT      | FK -> students                       |
| semester        | VARCHAR  | Semester                             |
| gpa             | FLOAT    | GPA earned                           |
| attendance_rate | FLOAT    | Percentage of attendance             |
| study_hours     | FLOAT    | Weekly average study hours           |

### predictions (Table 3.5)

| Column          | Type     | Description                          |
| --------------- | -------- | ------------------------------------ |
| prediction_id   | INT      | Primary Key, Auto Increment          |
| record_id       | INT      | FK -> performance_records            |
| predicted_gpa   | FLOAT    | Forecasted GPA                       |
| risk_level      | VARCHAR  | Risk category (e.g. Low, High)       |
| prediction_date | DATE     | Date prediction was made             |

### notifications

| Column     | Type     | Description                                       |
| ---------- | -------- | ------------------------------------------------- |
| id         | INT      | Primary Key                                       |
| user_id    | INT      | FK -> users                                       |
| title      | VARCHAR  | Notification title                                |
| message    | TEXT     | Notification body                                 |
| type       | ENUM     | HIGH_RISK / PERFORMANCE_DROP / PREDICTION_READY / SYSTEM |
| is_read    | BOOLEAN  | Read status                                       |
| created_at | DATETIME | Creation timestamp                                |

### activity_logs

| Column      | Type     | Description                                              |
| ----------- | -------- | -------------------------------------------------------- |
| id          | INT      | Primary Key                                              |
| user_id     | INT      | FK -> users                                              |
| action      | VARCHAR  | e.g. Uploaded student dataset / Generated prediction    |
| description | TEXT     | Detailed description                                     |
| ip_address  | VARCHAR  | Request IP                                               |
| created_at  | DATETIME | Creation timestamp                                       |

---

## Machine Learning

Models are trained in Python using scikit-learn (offline, one-time), exported to ONNX format with `skl2onnx`, and loaded in Next.js via `onnxruntime-node` for inference. **No Python server runs at runtime** — the `.onnx` model files live in the repo and are read by Next.js API routes.

```
Training (local, one-time):
  Python + scikit-learn -> train/evaluate -> skl2onnx -> .onnx files

Inference (Next.js at runtime):
  API route -> load .onnx -> onnxruntime-node -> prediction -> PostgreSQL
```

AI chatbots are **not** used as the prediction engine.

### Prediction Tasks

**Task 1 — CGPA Prediction (Regression)**

Inputs: previous GPA, attendance, study hours, assignment average, test average, etc.
Output: predicted CGPA (e.g. `3.21`)

**Task 2 — Risk Prediction (Classification)**

Output: `LOW` / `MEDIUM` / `HIGH`

### Models

| Model             | Regressor / Classifier                               |
| ----------------- | ---------------------------------------------------- |
| Random Forest     | `RandomForestRegressor` / `RandomForestClassifier`   |
| SVM               | `SVR` / `SVC`                                        |
| Gradient Boosting | `GradientBoostingRegressor` / `GradientBoostingClassifier` |

Models are trained and evaluated on the actual dataset. Reported metrics (accuracy, precision, recall, F1, MAE, RMSE) reflect real evaluation results — not invented numbers.

### ML Training Layout

```
ml-training/
├── train.py              # Train all 3 models, evaluate, export to ONNX
├── preprocess.py         # Data cleaning, scaling, encoding
├── evaluate.py           # Accuracy, precision, recall, F1, MAE, RMSE
├── datasets/
│   └── students.csv      # Training data
├── requirements.txt      # scikit-learn, skl2onnx, onnxruntime, pandas, numpy
└── export/               # Generated .onnx files (copied to src/lib/ml/models/)
```

### ONNX Models in Next.js

```
src/lib/ml/
├── models/
│   ├── rf_regressor.onnx
│   ├── rf_classifier.onnx
│   ├── svm_regressor.onnx
│   ├── svm_classifier.onnx
│   ├── gb_regressor.onnx
│   └── gb_classifier.onnx
├── inference.ts           # Load ONNX, run prediction, return result
└── features.ts            # Feature extraction from student data
```

### Example Inference

Input (Next.js API route):

```json
{
  "previous_gpa": 2.8,
  "attendance_rate": 68,
  "study_hours": 7,
  "assignment_average": 65,
  "test_average": 58
}
```

Output (from `onnxruntime-node`):

```json
{
  "predicted_gpa": 2.74,
  "risk_level": "MEDIUM",
  "confidence_score": 0.84,
  "model_used": "random_forest"
}
```

Next.js persists the result in PostgreSQL.

---

## AI Layer (Optional)

The project document does not specify AI features. AI is an **optional** extension that sits **after** the ML prediction to provide human-readable explanations — it does not replace the ML model.

```
Student Data -> ONNX Model -> Prediction -> AI (optional) -> Explanation
```

If added, AI can:

- Explain why a student is classified as high risk
- Summarize a student's performance
- Suggest areas the lecturer should review

AI should only be implemented after the core ML pipeline works end-to-end.

---

## Core Workflows

### System Algorithm (from the document)

```
i.   Start: User launches the CSPPS platform
ii.  Login: User enters credentials to access role-based dashboard
iii. Upload Dataset: Lecturer/admin uploads CSV or manual data entry
iv.  Model Execution: System trains and applies prediction models (SVM, Random Forest)
v.   Output Prediction: Predicted CGPA and performance category are generated
vi.  Visualize Results: Dashboard displays charts and indicators of academic standing
vii. Receive Notifications: Users receive feedback or academic alerts
viii.Log Activity: Session and results logged into system history
ix.  End: Session ends or returns to dashboard for new tasks
```

### CSV Upload Flow

```
Upload -> Validate -> Preview -> Confirm -> Save -> Predict
```

Invalid CSVs are not saved. Validation covers missing fields, duplicate students, invalid GPA, and invalid attendance.

### Authentication Flow

```
Login -> Verify credentials -> Get user role -> Redirect
  STUDENT  -> /student/dashboard
  LECTURER -> /lecturer/dashboard
  ADMIN    -> /admin/dashboard
```

### CSV Format

```csv
student_id,semester,previous_gpa,attendance_rate,study_hours,assignment_average,test_average
ST001,2025/2026-1,3.2,85,10,78,72
ST002,2025/2026-1,2.4,62,5,55,49
ST003,2025/2026-1,3.7,91,12,88,82
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+ (or a Neon account)
- Python 3.10+ (for one-time model training only)

### Install dependencies

```bash
npm install
```

### Environment variables

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/cspps"
NEXTAUTH_SECRET="your-secret"
NEXTAUTH_URL="http://localhost:3000"
OPENAI_API_KEY="optional-for-ai-features"
```

### Set up the database

```bash
npx prisma migrate dev --name init
npx prisma db seed
```

### Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Train the ML models (one-time)

```bash
cd ml-training
python -m venv venv
venv\Scripts\activate              # Windows
pip install -r requirements.txt
python train.py                    # Trains RF, SVM, Gradient Boosting, exports .onnx
```

The generated `.onnx` files are copied to `src/lib/ml/models/` and loaded by Next.js at runtime. No Python process needs to run after training.

---

## Project Structure

```
cspps/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   ├── student/
│   │   ├── lecturer/
│   │   ├── admin/
│   │   └── api/
│   ├── components/
│   │   ├── ui/
│   │   ├── charts/
│   │   ├── tables/
│   │   ├── dashboard/
│   │   └── forms/
│   ├── lib/
│   │   ├── auth/
│   │   ├── db/
│   │   ├── validation/
│   │   ├── ml/
│   │   │   ├── models/          # .onnx files
│   │   │   ├── inference.ts     # ONNX runtime inference
│   │   │   └── features.ts      # Feature extraction
│   │   └── utils/
│   ├── types/
│   └── hooks/
├── ml-training/                 # Python (offline, one-time)
│   ├── train.py
│   ├── preprocess.py
│   ├── evaluate.py
│   ├── datasets/
│   ├── requirements.txt
│   └── export/
├── prisma/
│   └── schema.prisma
├── public/
└── package.json
```

---

## Development Phases

| Phase | Focus                                       |
| ----- | ------------------------------------------- |
| 1     | Project setup (Next.js, TS, Tailwind, DB)   |
| 2     | Database schema and seed data               |
| 3     | Authentication and role-based access        |
| 4     | Admin dashboard and user management         |
| 5     | Lecturer dashboard, upload, performance     |
| 6     | Student dashboard, history, predictions     |
| 7     | Train ML models in Python, export to ONNX   |
| 8     | ONNX inference in Next.js API routes        |
| 9     | Alerts and notifications                    |
| 10    | Reports (PDF/CSV export)                    |
| 11    | Testing                                     |
| 12    | Deploy                                      |

### Recommended Build Order

1. Create Next.js project
2. Configure PostgreSQL
3. Configure Prisma
4. Create database schema
5. Seed test users/data
6. Build authentication
7. Build role permissions
8. Build Admin dashboard
9. Build Lecturer dashboard
10. Build Student dashboard
11. Build performance management
12. Build CSV upload
13. Create Python training scripts
14. Train ML models, evaluate, export to ONNX
15. Load ONNX models in Next.js
16. Build prediction API route (onnxruntime-node)
17. Save predictions
18. Build prediction dashboard
19. Build risk alerts
20. Build reports
21. Test everything
22. Deploy

---

## Testing

### Authentication

- Can a student access admin routes?
- Can a lecturer access admin routes?
- Can an admin access everything?

### Data

- Invalid CSV
- Missing fields
- Duplicate students
- Out-of-range GPA
- Invalid attendance

### ML

- Accuracy
- Precision
- Recall
- F1
- MAE
- RMSE

### UI

- Desktop
- Tablet
- Mobile

---

## Deployment

The Next.js application (including ONNX inference) deploys to Vercel. PostgreSQL is hosted on Neon (or Supabase / RDS). The Python training scripts run locally — no Python hosting is required. The `.onnx` model files are committed to the repo and loaded by Next.js at runtime.

Required environment variables must be configured on each hosting platform. See [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---

## License

This project is submitted as part of the requirements for the B.Sc. degree in Computer Science at Nasarawa State University, Keffi. All referenced works are cited in the project document.
