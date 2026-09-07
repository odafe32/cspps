import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { lecturer: true, student: true, admin: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      department: user.lecturer?.department || "",
      studentNumber: user.student?.studentNumber || "",
      isActive: user.isActive,
      createdAt: user.createdAt,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { firstName, lastName, email, department, currentPassword, newPassword } = body;

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Handle password change
    if (currentPassword && newPassword) {
      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: "New password must be at least 6 characters" },
          { status: 400 }
        );
      }

      const valid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!valid) {
        return NextResponse.json(
          { error: "Current password is incorrect" },
          { status: 400 }
        );
      }

      const passwordHash = await bcrypt.hash(newPassword, 12);
      await prisma.user.update({
        where: { id: session.userId },
        data: { passwordHash },
      });

      await prisma.activityLog.create({
        data: {
          userId: session.userId,
          action: "CHANGE_PASSWORD",
          description: "Changed account password",
        },
      });

      return NextResponse.json({ success: true, message: "Password changed" });
    }

    // Handle profile update
    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { error: "First name, last name, and email are required" },
        { status: 400 }
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Check if email is taken by another user
    const existing = await prisma.user.findFirst({
      where: {
        email: { equals: email, mode: "insensitive" },
        NOT: { id: session.userId },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Email is already in use" },
        { status: 409 }
      );
    }

    // Update user
    await prisma.user.update({
      where: { id: session.userId },
      data: {
        firstName,
        lastName,
        email,
      },
    });

    // Update lecturer department if applicable
    if (department !== undefined && user.role === "LECTURER") {
      await prisma.lecturer.updateMany({
        where: { userId: session.userId },
        data: { department: department || null },
      });
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.userId,
        action: "UPDATE_PROFILE",
        description: "Updated profile information",
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    );
  }
}
