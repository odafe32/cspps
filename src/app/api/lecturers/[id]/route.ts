import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import bcrypt from "bcryptjs";

// PATCH - Update lecturer (name, email, department, password, status)
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
      return NextResponse.json({ error: "Only administrators can edit lecturers" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { firstName, lastName, email, department, password, isActive } = body;

    const lecturer = await prisma.lecturer.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!lecturer) {
      return NextResponse.json({ error: "Lecturer not found" }, { status: 404 });
    }

    // Check email conflict
    if (email && email !== lecturer.user.email) {
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        return NextResponse.json({ error: "Email already in use" }, { status: 409 });
      }
    }

    // Update user fields
    const userData: Record<string, unknown> = {};
    if (firstName) userData.firstName = firstName;
    if (lastName) userData.lastName = lastName;
    if (email) userData.email = email;
    if (typeof isActive === "boolean") userData.isActive = isActive;
    if (password) {
      if (password.length < 6) {
        return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
      }
      userData.passwordHash = await bcrypt.hash(password, 12);
    }

    if (Object.keys(userData).length > 0) {
      await prisma.user.update({
        where: { id: lecturer.userId },
        data: userData,
      });
    }

    // Update lecturer fields
    if (department !== undefined) {
      await prisma.lecturer.update({
        where: { id },
        data: { department: department || null },
      });
    }

    // Log activity
    const actions: string[] = [];
    if (firstName || lastName) actions.push("updated profile");
    if (password) actions.push("reset password");
    if (typeof isActive === "boolean") actions.push(isActive ? "activated" : "suspended");

    await prisma.activityLog.create({
      data: {
        userId: session.userId,
        action: "EDIT_LECTURER",
        description: `${actions.join(", ")} for ${lecturer.user.firstName} ${lecturer.user.lastName}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to update lecturer" }, { status: 500 });
  }
}

// DELETE - Remove lecturer
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
      return NextResponse.json({ error: "Only administrators can delete lecturers" }, { status: 403 });
    }

    const { id } = await params;

    const lecturer = await prisma.lecturer.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!lecturer) {
      return NextResponse.json({ error: "Lecturer not found" }, { status: 404 });
    }

    // Prevent self-deletion
    if (lecturer.userId === session.userId) {
      return NextResponse.json({ error: "You cannot delete your own account" }, { status: 400 });
    }

    const lecturerName = `${lecturer.user.firstName} ${lecturer.user.lastName}`;

    // Delete user (cascades to lecturer)
    await prisma.user.delete({ where: { id: lecturer.userId } });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.userId,
        action: "DELETE_LECTURER",
        description: `Deleted lecturer ${lecturerName}`,
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete lecturer" }, { status: 500 });
  }
}
