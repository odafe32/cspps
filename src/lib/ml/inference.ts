import path from "path";
import fs from "fs";
import * as ort from "onnxruntime-node";

const MODELS_DIR = path.join(process.cwd(), "src", "lib", "ml", "models");

let regressorSession: ort.InferenceSession | null = null;
let classifierSession: ort.InferenceSession | null = null;

async function getRegressorSession(): Promise<ort.InferenceSession | null> {
  if (regressorSession) return regressorSession;

  const modelPath = path.join(MODELS_DIR, "gpa_regressor.onnx");
  if (!fs.existsSync(modelPath)) {
    console.warn("[ML] GPA regressor ONNX model not found at", modelPath);
    return null;
  }

  try {
    regressorSession = await ort.InferenceSession.create(modelPath);
    console.log("[ML] GPA regressor loaded successfully");
    return regressorSession;
  } catch (err) {
    console.error("[ML] Failed to load GPA regressor:", err instanceof Error ? err.message : err);
    return null;
  }
}

async function getClassifierSession(): Promise<ort.InferenceSession | null> {
  if (classifierSession) return classifierSession;

  const modelPath = path.join(MODELS_DIR, "risk_classifier.onnx");
  if (!fs.existsSync(modelPath)) {
    console.warn("[ML] Risk classifier ONNX model not found at", modelPath);
    return null;
  }

  try {
    classifierSession = await ort.InferenceSession.create(modelPath);
    console.log("[ML] Risk classifier loaded successfully");
    return classifierSession;
  } catch (err) {
    console.error("[ML] Failed to load risk classifier:", err instanceof Error ? err.message : err);
    return null;
  }
}

export interface PredictionInput {
  previousGpa: number;
  attendanceRate: number;
  studyHours: number;
  assignmentAverage: number;
  testAverage: number;
  libraryVisits: number;
  classParticipation: number;
}

export interface PredictionResult {
  predictedGpa: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
  confidence: number;
  modelUsed: string;
}

// Label mapping (must match the LabelEncoder in train_models.py)
// Index 0 = HIGH, 1 = LOW, 2 = MEDIUM (alphabetical order from sklearn)
const RISK_LABELS: Record<number, "LOW" | "MEDIUM" | "HIGH"> = {
  0: "HIGH",
  1: "LOW",
  2: "MEDIUM",
};

export async function runPrediction(
  input: PredictionInput
): Promise<PredictionResult> {
  // 7 features
  const features = new Float32Array([
    input.previousGpa,
    input.attendanceRate,
    input.studyHours,
    input.assignmentAverage,
    input.testAverage,
    input.libraryVisits,
    input.classParticipation,
  ]);

  // Try ONNX models first
  const [regSession, clsSession] = await Promise.all([
    getRegressorSession(),
    getClassifierSession(),
  ]);

  if (regSession && clsSession) {
    try {
      const inputName = regSession.inputNames[0];
      const tensor = new ort.Tensor("float32", features, [1, 7]);

      // Run regression model
      const regOutput = await regSession.run({ [inputName]: tensor });
      const regData = regOutput[regSession.outputNames[0]].data as Float32Array | number[];
      const predictedGpa = Number(regData[0]);

      // Run classifier model - only get the first output (label)
      const clsOutput = await clsSession.run({ [inputName]: tensor });
      const clsData = clsOutput[clsSession.outputNames[0]].data as Float32Array | number[];
      const riskIndex = Number(clsData[0]);
      const riskLevel = RISK_LABELS[riskIndex] || "LOW";

      return {
        predictedGpa: Math.max(0, Math.min(5.0, predictedGpa)),
        riskLevel,
        confidence: 0.90,
        modelUsed: "random_forest",
      };
    } catch (err) {
      console.error("[ML] ONNX inference failed, using fallback:", err instanceof Error ? err.message : err);
    }
  }

  // Fallback: rule-based prediction (5.0 scale)
  return fallbackPrediction(input);
}

function fallbackPrediction(input: PredictionInput): PredictionResult {
  // 5.0 GPA scale
  const predictedGpa = Math.max(
    0,
    Math.min(
      5.0,
      input.previousGpa * 0.35 +
        (input.attendanceRate / 100) * 1.0 +
        (input.studyHours / 40) * 0.8 +
        (input.assignmentAverage / 100) * 1.0 +
        (input.testAverage / 100) * 1.2 +
        (input.libraryVisits / 20) * 0.3 +
        (input.classParticipation / 10) * 0.4
    )
  );

  let riskLevel: "LOW" | "MEDIUM" | "HIGH";
  if (predictedGpa < 2.0 || input.attendanceRate < 60 || input.testAverage < 50) {
    riskLevel = "HIGH";
  } else if (predictedGpa < 3.0 || input.attendanceRate < 75 || input.testAverage < 65) {
    riskLevel = "MEDIUM";
  } else {
    riskLevel = "LOW";
  }

  return {
    predictedGpa: Number(predictedGpa.toFixed(2)),
    riskLevel,
    confidence: 0.75,
    modelUsed: "rule_based",
  };
}
