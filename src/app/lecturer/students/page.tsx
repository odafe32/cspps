import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { GraduationCap, TrendingUp, AlertCircle } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { StudentFilters } from "@/components/forms/student-filters";

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; risk?: string }>;
}) {
  const { q, risk } = await searchParams;

  const students = await prisma.student.findMany({
    where: {
      AND: [
        q
          ? {
              OR: [
                { user: { firstName: { contains: q, mode: "insensitive" } } },
                { user: { lastName: { contains: q, mode: "insensitive" } } },
                { studentNumber: { contains: q, mode: "insensitive" } },
              ],
            }
          : {},
        risk
          ? { predictions: { some: { riskLevel: risk as "HIGH" | "MEDIUM" | "LOW" } } }
          : {},
      ],
    },
    include: {
      user: true,
      performanceRecords: { orderBy: { createdAt: "desc" }, take: 1 },
      predictions: { orderBy: { createdAt: "desc" }, take: 1 },
    },
    orderBy: { user: { firstName: "asc" } },
  });

  const unpredictedCount = students.filter(
    (s) => s.predictions.length === 0 && s.performanceRecords.length > 0
  ).length;

  const riskBadge = (level: string) => {
    const styles: Record<string, string> = {
      HIGH: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
      MEDIUM:
        "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
      LOW: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
    };
    return styles[level] || "bg-muted text-muted-foreground";
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Students</h2>
        <p className="text-sm text-muted-foreground">
          View student performance records and run predictions
        </p>
      </div>

      {/* Unpredicted students banner */}
      {unpredictedCount > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950">
          <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
              {unpredictedCount} student{unpredictedCount > 1 ? "s" : ""} need prediction
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-500">
              These students have performance data but no predictions have been run yet
            </p>
          </div>
          <Link href="/lecturer/predictions?scope=unpredicted">
            <Button size="sm">
              <TrendingUp className="mr-2 h-4 w-4" />
              Run Prediction
            </Button>
          </Link>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-muted-foreground" />
              All Students ({students.length})
            </CardTitle>
            <StudentFilters />
          </div>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No students found
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Student No.</TableHead>
                  <TableHead>Current GPA</TableHead>
                  <TableHead>Predicted GPA</TableHead>
                  <TableHead>Risk Level</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id} className="cursor-pointer">
                    <TableCell>
                      <Link
                        href={`/lecturer/students/${student.id}`}
                        className="flex items-center gap-3"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium">
                          {student.user.firstName[0]}
                          {student.user.lastName[0]}
                        </div>
                        <span className="font-medium">
                          {student.user.firstName} {student.user.lastName}
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link href={`/lecturer/students/${student.id}`}>
                        {student.studentNumber}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link href={`/lecturer/students/${student.id}`}>
                        {student.performanceRecords[0]?.gpa.toFixed(2) || "N/A"}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link href={`/lecturer/students/${student.id}`}>
                        {student.predictions[0]?.predictedGpa.toFixed(2) || "N/A"}
                      </Link>
                    </TableCell>
                    <TableCell>
                      <Link href={`/lecturer/students/${student.id}`}>
                        {student.predictions[0] ? (
                          <Badge
                            variant="secondary"
                            className={riskBadge(student.predictions[0].riskLevel)}
                          >
                            {student.predictions[0].riskLevel}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
