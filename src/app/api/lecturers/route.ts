import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import bcrypt from "bcryptjs";

// GET - List all lecturers
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "ADMIN") {
      return NextResponse.json({ error: "Only administrators can view lecturers" }, { status: 403 });
    }

    const lecturers = await prisma.lecturer.findMany({
      include: { user: true },
      orderBy: { user: { firstName: "asc" } },
    });

    return NextResponse.json({
      lecturers: lecturers.map((l) => ({
        id: l.id,
        firstName: l.user.firstName,
        lastName: l.user.lastName,
        email: l.user.email,
        department: l.department,
      })),
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch lecturers" }, { status: 500 });
  }
}

// POST - Create a new lecturer
export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (session.role !== "ADMIN") {
      return NextResponse.json({ error: "Only administrators can add lecturers" }, { status: 403 });
    }

    const body = await request.json();
    const { firstName, lastName, email, department } = body;

    if (!firstName || !lastName || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check for existing email
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }

    // Hash default password
    const passwordHash = await bcrypt.hash("lecturer123", 12);

    // Create user + lecturer
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: "LECTURER",
        firstName,
        lastName,
        lecturer: {
          create: {
            department: department || null,
          },
        },
      },
      include: { lecturer: true },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.userId,
        action: "ADD_LECTURER",
        description: `Added lecturer ${firstName} ${lastName} (${email})`,
      },
    });

    return NextResponse.json({ success: true, id: user.lecturer?.id });
  } catch {
    return NextResponse.json({ error: "Failed to add lecturer" }, { status: 500 });
  }
}
