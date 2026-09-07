import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { hashPassword } from "@/lib/auth/session";

interface UploadRow {
  studentNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  semester: string;
  gpa: string;
  attendanceRate: string;
  studyHours: string;
  assignmentAverage?: string;
  testAverage?: string;
  libraryVisits?: string;
  classParticipation?: string;
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data } = (await request.json()) as { data: UploadRow[] };

    if (!data || !Array.isArray(data) || data.length === 0) {
      return NextResponse.json({ error: "No data provided" }, { status: 400 });
    }

    let created = 0;
    let updated = 0;
    const errors: string[] = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];

      try {
        // Find or create student by studentNumber
        const existingStudent = await prisma.student.findFirst({
          where: { studentNumber: row.studentNumber },
          include: { user: true },
        });

        let studentId: string;

        if (!existingStudent) {
          // Create a new user + student
          const passwordHash = await hashPassword("student123");
          const user = await prisma.user.create({
            data: {
              email: row.email || `${row.studentNumber.toLowerCase()}@cspps.edu`,
              passwordHash,
              role: "STUDENT",
              firstName: row.firstName || row.studentNumber,
              lastName: row.lastName || "Student",
              student: {
                create: {
                  studentNumber: row.studentNumber,
                },
              },
            },
            include: { student: true },
          });
          if (!user.student) throw new Error("Failed to create student");
          studentId = user.student.id;
          created++;
        } else {
          studentId = existingStudent.id;
          // Update name/email if changed
          await prisma.user.update({
            where: { id: existingStudent.userId },
            data: {
              firstName: row.firstName || existingStudent.user.firstName,
              lastName: row.lastName || existingStudent.user.lastName,
              email: row.email || existingStudent.user.email,
            },
          });
          updated++;
        }

        // Check if record for this semester already exists
        const existingRecord = await prisma.performanceRecord.findFirst({
          where: {
            studentId: studentId,
            semester: row.semester,
          },
        });

        const recordData = {
          gpa: parseFloat(row.gpa) || 0,
          attendanceRate: parseFloat(row.attendanceRate) || 0,
          studyHours: parseFloat(row.studyHours) || 0,
          assignmentAverage: row.assignmentAverage ? parseFloat(row.assignmentAverage) : null,
          testAverage: row.testAverage ? parseFloat(row.testAverage) : null,
          libraryVisits: row.libraryVisits ? parseInt(row.libraryVisits) : null,
          classParticipation: row.classParticipation ? parseFloat(row.classParticipation) : null,
        };

        if (existingRecord) {
          // Update existing record
          await prisma.performanceRecord.update({
            where: { id: existingRecord.id },
            data: recordData,
          });
        } else {
          // Create new record
          await prisma.performanceRecord.create({
            data: {
              studentId: studentId,
              semester: row.semester,
              ...recordData,
            },
          });
        }
      } catch (err) {
        errors.push(`Row ${i + 2}: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.userId,
        action: "UPLOAD_DATASET",
        description: `Uploaded ${data.length} records (${created} new, ${updated} updated)${errors.length > 0 ? `, ${errors.length} errors` : ""}`,
      },
    });

    return NextResponse.json({
      success: true,
      total: data.length,
      created,
      updated,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: `Upload failed: ${message}` },
      { status: 500 }
    );
  }
}
