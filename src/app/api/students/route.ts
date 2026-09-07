import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import bcrypt from "bcryptjs";

// POST - Create student with initial performance record
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "ADMIN") {
      return NextResponse.json({ error: "Only administrators can add students" }, { status: 403 });
    }

    const body = await request.json();
    const { firstName, lastName, email, studentNumber, semester, gpa, attendanceRate, studyHours, assignmentAverage, testAverage, libraryVisits, classParticipation } = body;

    // Validate
    if (!firstName || !lastName || !email || !studentNumber) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check for existing email
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }

    // Check for existing student number
    const existingNumber = await prisma.student.findUnique({ where: { studentNumber } });
    if (existingNumber) {
      return NextResponse.json({ error: "Student number already exists" }, { status: 409 });
    }

    // Hash a default password
    const passwordHash = await bcrypt.hash("student123", 12);

    // Create user + student + performance record
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: "STUDENT",
        firstName,
        lastName,
        student: {
          create: {
            studentNumber,
            performanceRecords: semester
              ? {
                  create: {
                    semester,
                    gpa: parseFloat(gpa) || 0,
                    attendanceRate: parseFloat(attendanceRate) || 0,
                    studyHours: parseFloat(studyHours) || 0,
                    assignmentAverage: assignmentAverage ? parseFloat(assignmentAverage) : null,
                    testAverage: testAverage ? parseFloat(testAverage) : null,
                    libraryVisits: libraryVisits ? parseInt(libraryVisits) : null,
                    classParticipation: classParticipation ? parseFloat(classParticipation) : null,
                  },
                }
              : undefined,
          },
        },
      },
      include: { student: true },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.userId,
        action: "ADD_STUDENT",
        description: `Added student ${firstName} ${lastName} (${studentNumber})`,
      },
    });

    return NextResponse.json({ success: true, id: user.student?.id });
  } catch {
    return NextResponse.json({ error: "Failed to add student" }, { status: 500 });
  }
}
