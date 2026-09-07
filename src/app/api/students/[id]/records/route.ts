import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";

// POST - Add a performance record to a student
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { semester, gpa, attendanceRate, studyHours, assignmentAverage, testAverage, libraryVisits, classParticipation } = body;

    if (!semester) {
      return NextResponse.json({ error: "Semester is required" }, { status: 400 });
    }

    const student = await prisma.student.findUnique({ where: { id } });
    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const record = await prisma.performanceRecord.create({
      data: {
        studentId: id,
        semester,
        gpa: parseFloat(gpa) || 0,
        attendanceRate: parseFloat(attendanceRate) || 0,
        studyHours: parseFloat(studyHours) || 0,
        assignmentAverage: assignmentAverage ? parseFloat(assignmentAverage) : null,
        testAverage: testAverage ? parseFloat(testAverage) : null,
        libraryVisits: libraryVisits ? parseInt(libraryVisits) : null,
        classParticipation: classParticipation ? parseFloat(classParticipation) : null,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.userId,
        action: "ADD_RECORD",
        description: `Added performance record for ${student.studentNumber} - ${semester}`,
      },
    });

    return NextResponse.json({ success: true, id: record.id });
  } catch {
    return NextResponse.json({ error: "Failed to add record" }, { status: 500 });
  }
}
