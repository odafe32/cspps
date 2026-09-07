import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";

// PATCH - Update a performance record
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; recordId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, recordId } = await params;
    const body = await request.json();
    const { semester, gpa, attendanceRate, studyHours, assignmentAverage, testAverage, libraryVisits, classParticipation } = body;

    const record = await prisma.performanceRecord.findFirst({
      where: { id: recordId, studentId: id },
    });

    if (!record) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    await prisma.performanceRecord.update({
      where: { id: recordId },
      data: {
        semester: semester || record.semester,
        gpa: gpa !== undefined ? parseFloat(gpa) : record.gpa,
        attendanceRate: attendanceRate !== undefined ? parseFloat(attendanceRate) : record.attendanceRate,
        studyHours: studyHours !== undefined ? parseFloat(studyHours) : record.studyHours,
        assignmentAverage: assignmentAverage !== undefined ? (assignmentAverage ? parseFloat(assignmentAverage) : null) : record.assignmentAverage,
        testAverage: testAverage !== undefined ? (testAverage ? parseFloat(testAverage) : null) : record.testAverage,
        libraryVisits: libraryVisits !== undefined ? (libraryVisits ? parseInt(libraryVisits) : null) : record.libraryVisits,
        classParticipation: classParticipation !== undefined ? (classParticipation ? parseFloat(classParticipation) : null) : record.classParticipation,
      },
    });

    await prisma.activityLog.create({
      data: {
        userId: session.userId,
        action: "EDIT_RECORD",
        description: `Updated performance record ${record.semester}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to update record" }, { status: 500 });
  }
}

// DELETE - Delete a performance record
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; recordId: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, recordId } = await params;

    const record = await prisma.performanceRecord.findFirst({
      where: { id: recordId, studentId: id },
    });

    if (!record) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    await prisma.performanceRecord.delete({ where: { id: recordId } });

    await prisma.activityLog.create({
      data: {
        userId: session.userId,
        action: "DELETE_RECORD",
        description: `Deleted performance record ${record.semester}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete record" }, { status: 500 });
  }
}
