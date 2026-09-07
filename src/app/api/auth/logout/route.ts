import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";

export async function POST() {
  try {
    const session = await getSession();

    if (session) {
      await prisma.activityLog.create({
        data: {
          userId: session.userId,
          action: "LOGOUT",
          description: `${session.firstName} ${session.lastName} logged out`,
        },
      });
    }

    await destroySession();

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
