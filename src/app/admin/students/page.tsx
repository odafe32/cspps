import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { GraduationCap, Plus, Upload, ChevronLeft, ChevronRight } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { StudentFilters } from "@/components/forms/student-filters";
import { StudentActions } from "@/components/forms/student-actions";

const PER_PAGE = 10;

export default async function AdminStudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; risk?: string; page?: string }>;
}) {
  const { q, risk, page } = await searchParams;
  const pageNum = parseInt(page || "1");
  const skip = (pageNum - 1) * PER_PAGE;

  const whereClause = {
    AND: [
      q
        ? {
            OR: [
              { user: { firstName: { contains: q, mode: "insensitive" as const } } },
              { user: { lastName: { contains: q, mode: "insensitive" as const } } },
              { studentNumber: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {},
      risk
        ? { predictions: { some: { riskLevel: risk as "HIGH" | "MEDIUM" | "LOW" } } }
        : {},
    ],
  };

  const [students, totalCount] = await Promise.all([
    prisma.student.findMany({
      where: whereClause,
      include: {
        user: true,
        performanceRecords: { orderBy: { createdAt: "desc" }, take: 1 },
        predictions: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { user: { firstName: "asc" } },
      skip,
      take: PER_PAGE,
    }),
    prisma.student.count({ where: whereClause }),
  ]);

  const totalPages = Math.ceil(totalCount / PER_PAGE);
  const hasNext = pageNum < totalPages;
  const hasPrev = pageNum > 1;

  // Build pagination URL preserving search params
  function pageUrl(p: number) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (risk) params.set("risk", risk);
    params.set("page", String(p));
    return `/admin/students?${params.toString()}`;
  }

  const riskBadge = (level: string) => {
    const styles: Record<string, string> = {
      HIGH: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
      MEDIUM: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
      LOW: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
    };
    return styles[level] || "bg-muted text-muted-foreground";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Student Management</h2>
          <p className="text-sm text-muted-foreground">
            Add, edit, and delete student accounts
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/upload">
            <Button variant="outline" size="sm">
              <Upload className="mr-2 h-4 w-4" />
              Upload CSV
            </Button>
          </Link>
          <Link href="/admin/students/add">
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Student
            </Button>
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-muted-foreground" />
              All Students ({totalCount})
            </CardTitle>
            <StudentFilters />
          </div>
        </CardHeader>
        <CardContent>
          {students.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <GraduationCap className="h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-sm font-medium">No students found</p>
              <p className="text-xs text-muted-foreground">
                Add a student or upload a CSV to get started
              </p>
              <Link href="/admin/students/add" className="mt-4">
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Student
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Student No.</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Current GPA</TableHead>
                    <TableHead>Risk Level</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell>
                        <Link
                          href={`/admin/students/${student.id}`}
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
                      <TableCell>{student.studentNumber}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {student.user.email}
                      </TableCell>
                      <TableCell>
                        {student.performanceRecords[0]?.gpa.toFixed(2) || "N/A"}
                      </TableCell>
                      <TableCell>
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
                      </TableCell>
                      <TableCell>
                        {student.user.isActive ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400">
                            Suspended
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <StudentActions
                          studentId={student.id}
                          studentName={`${student.user.firstName} ${student.user.lastName}`}
                          email={student.user.email}
                          isActive={student.user.isActive}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-xs text-muted-foreground">
                    Showing {skip + 1}-{Math.min(skip + PER_PAGE, totalCount)} of {totalCount}
                  </p>
                  <div className="flex items-center gap-2">
                    {hasPrev ? (
                      <Link href={pageUrl(pageNum - 1)}>
                        <Button variant="outline" size="sm">
                          <ChevronLeft className="mr-1 h-4 w-4" />
                          Previous
                        </Button>
                      </Link>
                    ) : (
                      <Button variant="outline" size="sm" disabled>
                        <ChevronLeft className="mr-1 h-4 w-4" />
                        Previous
                      </Button>
                    )}
                    <span className="text-xs text-muted-foreground">
                      Page {pageNum} of {totalPages}
                    </span>
                    {hasNext ? (
                      <Link href={pageUrl(pageNum + 1)}>
                        <Button variant="outline" size="sm">
                          Next
                          <ChevronRight className="ml-1 h-4 w-4" />
                        </Button>
                      </Link>
                    ) : (
                      <Button variant="outline" size="sm" disabled>
                        Next
                        <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
