import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { runPrediction } from "@/lib/ml/inference";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: { scope?: string; studentIds?: string[]; riskLevel?: string } = {};
    try {
      body = await request.json();
    } catch {
      // Empty body = predict all
      body = { scope: "all" };
    }

    const scope = body.scope || "all";

    // Build the where clause based on scope
    let whereClause: Record<string, unknown> = {};

    if (scope === "selected" && body.studentIds && body.studentIds.length > 0) {
      whereClause = { id: { in: body.studentIds } };
    } else if (scope === "risk" && body.riskLevel) {
      whereClause = {
        predictions: { some: { riskLevel: body.riskLevel as "HIGH" | "MEDIUM" | "LOW" } },
      };
    } else if (scope === "unpredicted") {
      // Students with performance records but no predictions
      whereClause = {
        performanceRecords: { some: {} },
        predictions: { none: {} },
      };
    }

    // Get students with their latest performance record
    const students = await prisma.student.findMany({
      where: whereClause,
      include: {
        user: true,
        performanceRecords: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    let high = 0;
    let medium = 0;
    let low = 0;
    let processed = 0;
    const studentResults: Array<{
      name: string;
      studentNumber: string;
      predictedGpa: number;
      riskLevel: string;
      confidence: number;
      modelUsed: string;
    }> = [];

    for (const student of students) {
      const record = student.performanceRecords[0];
      if (!record) continue;

      // Run ONNX prediction (falls back to rule-based if models not available)
      const result = await runPrediction({
        previousGpa: record.gpa,
        attendanceRate: record.attendanceRate,
        studyHours: record.studyHours,
        // Use actual values if available, otherwise defaults
        assignmentAverage: record.assignmentAverage ?? 75,
        testAverage: record.testAverage ?? 70,
        libraryVisits: record.libraryVisits ?? 8,
        classParticipation: record.classParticipation ?? 7,
      });

      if (result.riskLevel === "HIGH") high++;
      else if (result.riskLevel === "MEDIUM") medium++;
      else low++;

      // Save prediction
      await prisma.prediction.create({
        data: {
          studentId: student.id,
          recordId: record.id,
          predictedGpa: result.predictedGpa,
          riskLevel: result.riskLevel,
          modelUsed: result.modelUsed,
          confidenceScore: result.confidence,
        },
      });

      // Add to results breakdown
      studentResults.push({
        name: `${student.user.firstName} ${student.user.lastName}`,
        studentNumber: student.studentNumber,
        predictedGpa: result.predictedGpa,
        riskLevel: result.riskLevel,
        confidence: result.confidence,
        modelUsed: result.modelUsed,
      });

      // Create notification for high-risk students
      if (result.riskLevel === "HIGH") {
        await prisma.notification.create({
          data: {
            userId: session.userId,
            title: "High-Risk Student Identified",
            message: `${student.studentNumber} has been classified as HIGH risk (predicted GPA: ${result.predictedGpa.toFixed(2)})`,
            type: "HIGH_RISK",
          },
        });
      }

      processed++;
    }

    // Log activity
    const scopeLabel =
      scope === "all" ? "all students" :
      scope === "selected" ? `${body.studentIds?.length || 0} selected students` :
      `${body.riskLevel} risk students`;

    await prisma.activityLog.create({
      data: {
        userId: session.userId,
        action: "RUN_PREDICTION",
        description: `Ran predictions for ${scopeLabel} (${processed} processed)`,
      },
    });

    return NextResponse.json({
      success: true,
      total: processed,
      high,
      medium,
      low,
      students: studentResults,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Prediction error:", message);
    return NextResponse.json(
      { error: `Prediction failed: ${message}` },
      { status: 500 }
    );
  }
}
