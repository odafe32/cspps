import { PrismaClient, Role, RiskLevel } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // ── Admin ──────────────────────────────────────
  const adminHash = await bcrypt.hash("admin123", 12);
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@cspps.edu" },
    update: {},
    create: {
      email: "admin@cspps.edu",
      passwordHash: adminHash,
      role: Role.ADMIN,
      firstName: "System",
      lastName: "Administrator",
      admin: { create: {} },
    },
  });
  console.log(`Admin: ${adminUser.email}`);

  // ── Lecturer ───────────────────────────────────
  const lecturerHash = await bcrypt.hash("lecturer123", 12);
  const lecturerUser = await prisma.user.upsert({
    where: { email: "lecturer@cspps.edu" },
    update: {},
    create: {
      email: "lecturer@cspps.edu",
      passwordHash: lecturerHash,
      role: Role.LECTURER,
      firstName: "Dr. Aminu",
      lastName: "Adamu",
      lecturer: {
        create: { department: "Computer Science" },
      },
    },
  });
  console.log(`Lecturer: ${lecturerUser.email}`);

  // ── Students ───────────────────────────────────
  const studentData = [
    {
      email: "student@cspps.edu",
      password: "student123",
      firstName: "Ahmed",
      lastName: "Ibrahim",
      studentNumber: "ST001",
      gpa: 2.41,
      attendance: 68,
      studyHours: 5,
      risk: RiskLevel.HIGH,
    },
    {
      email: "student2@cspps.edu",
      password: "student123",
      firstName: "Mary",
      lastName: "Johnson",
      studentNumber: "ST002",
      gpa: 2.42,
      attendance: 72,
      studyHours: 6,
      risk: RiskLevel.HIGH,
    },
    {
      email: "student3@cspps.edu",
      password: "student123",
      firstName: "John",
      lastName: "Doe",
      studentNumber: "ST003",
      gpa: 2.68,
      attendance: 75,
      studyHours: 7,
      risk: RiskLevel.MEDIUM,
    },
    {
      email: "student4@cspps.edu",
      password: "student123",
      firstName: "Aisha",
      lastName: "Muhammad",
      studentNumber: "ST004",
      gpa: 3.12,
      attendance: 82,
      studyHours: 9,
      risk: RiskLevel.LOW,
    },
    {
      email: "student5@cspps.edu",
      password: "student123",
      firstName: "David",
      lastName: "Okafor",
      studentNumber: "ST005",
      gpa: 3.55,
      attendance: 91,
      studyHours: 12,
      risk: RiskLevel.LOW,
    },
  ];

  for (const s of studentData) {
    const hash = await bcrypt.hash(s.password, 12);
    const user = await prisma.user.upsert({
      where: { email: s.email },
      update: {},
      create: {
        email: s.email,
        passwordHash: hash,
        role: Role.STUDENT,
        firstName: s.firstName,
        lastName: s.lastName,
        student: {
          create: {
            studentNumber: s.studentNumber,
            dateOfBirth: new Date("2003-05-15"),
          },
        },
      },
      include: { student: true },
    });

    if (user.student) {
      // Performance record
      const record = await prisma.performanceRecord.create({
        data: {
          studentId: user.student.id,
          semester: "2025/2026-1",
          gpa: s.gpa,
          attendanceRate: s.attendance,
          studyHours: s.studyHours,
        },
      });

      // Prediction
      await prisma.prediction.create({
        data: {
          studentId: user.student.id,
          recordId: record.id,
          predictedGpa: s.gpa + (Math.random() * 0.2 - 0.1),
          riskLevel: s.risk,
          modelUsed: "random_forest",
          confidenceScore: 0.85 + Math.random() * 0.1,
        },
      });
    }

    console.log(`Student: ${user.email}`);
  }

  // ── Activity log ───────────────────────────────
  await prisma.activityLog.create({
    data: {
      userId: adminUser.id,
      action: "SYSTEM_SEED",
      description: "Database seeded with test data",
    },
  });

  console.log("Seed complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
