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
      orderBy: { user: { firstName: "asc" } },
    });

    const result = students
      .filter((s) => s.performanceRecords.length > 0)
      .map((s) => ({
        id: s.id,
        name: `${s.user.firstName} ${s.user.lastName}`,
        studentNumber: s.studentNumber,
        gpa: s.performanceRecords[0]?.gpa || null,
        attendanceRate: s.performanceRecords[0]?.attendanceRate || null,
        studyHours: s.performanceRecords[0]?.studyHours || null,
        assignmentAverage: s.performanceRecords[0]?.assignmentAverage || null,
        testAverage: s.performanceRecords[0]?.testAverage || null,
        libraryVisits: s.performanceRecords[0]?.libraryVisits || null,
        classParticipation: s.performanceRecords[0]?.classParticipation || null,
        semester: s.performanceRecords[0]?.semester || null,
        riskLevel: s.predictions[0]?.riskLevel || null,
        predictedGpa: s.predictions[0]?.predictedGpa || null,
        confidence: s.predictions[0]?.confidenceScore || null,
        modelUsed: s.predictions[0]?.modelUsed || null,
      }));

    return NextResponse.json({ students: result });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch students" },
      { status: 500 }
    );
  }
}
