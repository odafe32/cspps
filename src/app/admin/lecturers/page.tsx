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
import { BookOpen, Mail, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { formatTimeAgo } from "@/lib/utils/format";
import { LecturerActions } from "@/components/forms/lecturer-actions";

const PER_PAGE = 10;

export default async function AdminLecturersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  const { page, status } = await searchParams;
  const pageNum = parseInt(page || "1");
  const skip = (pageNum - 1) * PER_PAGE;

  const statusFilter = status === "suspended" ? { isActive: false } : status === "active" ? { isActive: true } : {};

  const [lecturers, totalCount, activeCount, suspendedCount] = await Promise.all([
    prisma.lecturer.findMany({
      where: { user: statusFilter },
      include: { user: true },
      orderBy: { user: { firstName: "asc" } },
      skip,
      take: PER_PAGE,
    }),
    prisma.lecturer.count({ where: { user: statusFilter } }),
    prisma.lecturer.count({ where: { user: { isActive: true } } }),
    prisma.lecturer.count({ where: { user: { isActive: false } } }),
  ]);

  const totalPages = Math.ceil(totalCount / PER_PAGE);
  const hasNext = pageNum < totalPages;
  const hasPrev = pageNum > 1;

  function pageUrl(p: number) {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    params.set("page", String(p));
    return `/admin/lecturers?${params.toString()}`;
  }

  const stats = [
    { label: "Total Lecturers", value: totalCount, color: "text-green-600", status: "" },
    { label: "Active", value: activeCount, color: "text-green-600", status: "active" },
    { label: "Suspended", value: suspendedCount, color: "text-red-600", status: "suspended" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Lecturers</h2>
          <p className="text-sm text-muted-foreground">
            View and manage lecturer accounts
          </p>
        </div>
        <Link href="/admin/lecturers/add">
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Lecturer
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((stat) => {
          const isActive = status === stat.status;
          const href = stat.status ? `/admin/lecturers?status=${stat.status}` : "/admin/lecturers";
          return (
            <Link key={stat.label} href={href}>
              <Card className={`cursor-pointer transition-all hover:shadow-md ${isActive ? "ring-2 ring-primary" : ""}`}>
                <CardContent className="flex items-center justify-between pt-6">
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  </div>
                  <BookOpen className={`h-8 w-8 ${stat.color}`} />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-muted-foreground" />
              All Lecturers ({totalCount})
            </CardTitle>
            {status && (
              <Link href="/admin/lecturers">
                <Button variant="ghost" size="sm">Clear filter</Button>
              </Link>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {lecturers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-sm font-medium">No lecturers found</p>
              <Link href="/admin/lecturers/add" className="mt-4">
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Lecturer
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lecturers.map((lecturer) => (
                    <TableRow key={lecturer.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-50 text-xs font-medium text-green-700 dark:bg-green-950 dark:text-green-400">
                            {lecturer.user.firstName[0]}
                            {lecturer.user.lastName[0]}
                          </div>
                          <span className="font-medium">
                            {lecturer.user.firstName} {lecturer.user.lastName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {lecturer.user.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        {lecturer.department ? (
                          <Badge variant="secondary">{lecturer.department}</Badge>
                        ) : (
                          <span className="text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {lecturer.user.isActive ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400">
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400">
                            Suspended
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatTimeAgo(lecturer.user.createdAt)}
                      </TableCell>
                      <TableCell>
                        <LecturerActions
                          lecturerId={lecturer.id}
                          lecturerName={`${lecturer.user.firstName} ${lecturer.user.lastName}`}
                          email={lecturer.user.email}
                          department={lecturer.department}
                          isActive={lecturer.user.isActive}
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
