import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const students = await prisma.student.findMany({
      include: {
        user: true,
        performanceRecords: { orderBy: { createdAt: "desc" }, take: 1 },
        predictions: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });

    const totalStudents = students.length;
    const studentsWithRecords = students.filter((s) => s.performanceRecords.length > 0);
    const studentsWithPredictions = students.filter((s) => s.predictions.length > 0);
    const unpredicted = studentsWithRecords.filter((s) => s.predictions.length === 0).length;

    const allPredictions = await prisma.prediction.findMany({
      include: { student: { include: { user: true } } },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const highRisk = studentsWithPredictions.filter((s) => s.predictions[0]?.riskLevel === "HIGH").length;
    const mediumRisk = studentsWithPredictions.filter((s) => s.predictions[0]?.riskLevel === "MEDIUM").length;
    const lowRisk = studentsWithPredictions.filter((s) => s.predictions[0]?.riskLevel === "LOW").length;

    const totalPredictions = await prisma.prediction.count();

    const avgGpa = studentsWithRecords.length > 0
      ? studentsWithRecords.reduce((sum, s) => sum + (s.performanceRecords[0]?.gpa || 0), 0) / studentsWithRecords.length
      : null;

    const avgPredictedGpa = studentsWithPredictions.length > 0
      ? studentsWithPredictions.reduce((sum, s) => sum + (s.predictions[0]?.predictedGpa || 0), 0) / studentsWithPredictions.length
      : null;

    const recentPredictions = allPredictions.map((p) => ({
      studentName: `${p.student.user.firstName} ${p.student.user.lastName}`,
      studentNumber: p.student.studentNumber,
      predictedGpa: p.predictedGpa,
      riskLevel: p.riskLevel,
      modelUsed: p.modelUsed,
      confidence: p.confidenceScore ?? 0,
      date: new Date(p.predictionDate).toLocaleDateString(),
    }));

    return NextResponse.json({
      totalStudents,
      totalPredictions,
      highRisk,
      mediumRisk,
      lowRisk,
      unpredicted,
      avgGpa: avgGpa ? Math.round(avgGpa * 100) / 100 : null,
      avgPredictedGpa: avgPredictedGpa ? Math.round(avgPredictedGpa * 100) / 100 : null,
      recentPredictions,
    });
  } catch {
    return NextResponse.json({ error: "Failed to load stats" }, { status: 500 });
  }
}
