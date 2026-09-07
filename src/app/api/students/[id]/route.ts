import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import bcrypt from "bcryptjs";

// GET - Fetch single student
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        user: true,
        performanceRecords: { orderBy: { createdAt: "desc" }, take: 1 },
        predictions: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: student.id,
      firstName: student.user.firstName,
      lastName: student.user.lastName,
      email: student.user.email,
      studentNumber: student.studentNumber,
      enrollmentDate: student.enrollmentDate,
      isActive: student.user.isActive,
      latestRecord: student.performanceRecords[0] || null,
      latestPrediction: student.predictions[0] || null,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch student" }, { status: 500 });
  }
}

// PATCH - Update student info
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "ADMIN") {
      return NextResponse.json({ error: "Only administrators can edit students" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { firstName, lastName, email, studentNumber, password, isActive } = body;

    // Find student
    const student = await prisma.student.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Build user update data (only update provided fields)
    const userData: Record<string, unknown> = {};
    if (firstName) userData.firstName = firstName;
    if (lastName) userData.lastName = lastName;
    if (email) {
      if (email !== student.user.email) {
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
          return NextResponse.json({ error: "Email already in use" }, { status: 409 });
        }
      }
      userData.email = email;
    }
    if (typeof isActive === "boolean") userData.isActive = isActive;
    if (password) {
      if (password.length < 6) {
        return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
      }
      userData.passwordHash = await bcrypt.hash(password, 12);
    }

    if (Object.keys(userData).length > 0) {
      await prisma.user.update({
        where: { id: student.userId },
        data: userData,
      });
    }

    // Update student number if provided
    if (studentNumber && studentNumber !== student.studentNumber) {
      const existing = await prisma.student.findUnique({ where: { studentNumber } });
      if (existing) {
        return NextResponse.json({ error: "Student number already exists" }, { status: 409 });
      }
      await prisma.student.update({
        where: { id },
        data: { studentNumber },
      });
    }

    // Log activity
    const actions: string[] = [];
    if (firstName || lastName || email) actions.push("updated profile");
    if (password) actions.push("reset password");
    if (typeof isActive === "boolean") actions.push(isActive ? "activated" : "suspended");

    await prisma.activityLog.create({
      data: {
        userId: session.userId,
        action: "EDIT_STUDENT",
        description: `${actions.join(", ")} for ${student.user.firstName} ${student.user.lastName}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to update student" }, { status: 500 });
  }
}

// DELETE - Remove student
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "ADMIN") {
      return NextResponse.json({ error: "Only administrators can delete students" }, { status: 403 });
    }

    const { id } = await params;

    const student = await prisma.student.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    // Delete user (cascades to student, records, predictions)
    await prisma.user.delete({ where: { id: student.userId } });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.userId,
        action: "DELETE_STUDENT",
        description: `Deleted student ${student.user.firstName} ${student.user.lastName} (${student.studentNumber})`,
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete student" }, { status: 500 });
  }
}
