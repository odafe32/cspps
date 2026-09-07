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
import { Users, Shield, GraduationCap, BookOpen, ChevronLeft, ChevronRight } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { formatTimeAgo } from "@/lib/utils/format";

const PER_PAGE = 15;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; role?: string }>;
}) {
  const { page, role } = await searchParams;
  const pageNum = parseInt(page || "1");
  const skip = (pageNum - 1) * PER_PAGE;

  const roleFilter = role ? { role: role as "ADMIN" | "LECTURER" | "STUDENT" } : {};

  const [users, totalCount] = await Promise.all([
    prisma.user.findMany({
      where: roleFilter,
      orderBy: { createdAt: "desc" },
      include: {
        student: true,
        lecturer: true,
        admin: true,
      },
      skip,
      take: PER_PAGE,
    }),
    prisma.user.count({ where: roleFilter }),
  ]);

  const totalPages = Math.ceil(totalCount / PER_PAGE);
  const hasNext = pageNum < totalPages;
  const hasPrev = pageNum > 1;

  function pageUrl(p: number) {
    const params = new URLSearchParams();
    if (role) params.set("role", role);
    params.set("page", String(p));
    return `/admin/users?${params.toString()}`;
  }

  const roleBadge = (r: string) => {
    const styles: Record<string, string> = {
      ADMIN: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400",
      LECTURER: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
      STUDENT: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
    };
    return styles[r] || "bg-muted text-muted-foreground";
  };

  const roleIcon = (r: string) => {
    if (r === "ADMIN") return <Shield className="h-4 w-4 text-purple-600" />;
    if (r === "LECTURER") return <BookOpen className="h-4 w-4 text-green-600" />;
    return <GraduationCap className="h-4 w-4 text-blue-600" />;
  };

  const studentCount = await prisma.user.count({ where: { role: "STUDENT" } });
  const lecturerCount = await prisma.user.count({ where: { role: "LECTURER" } });
  const adminCount = await prisma.user.count({ where: { role: "ADMIN" } });

  const stats = [
    { label: "Total Users", value: totalCount, icon: Users, role: "" },
    { label: "Students", value: studentCount, icon: GraduationCap, role: "STUDENT" },
    { label: "Lecturers", value: lecturerCount, icon: BookOpen, role: "LECTURER" },
    { label: "Admins", value: adminCount, icon: Shield, role: "ADMIN" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
        <p className="text-sm text-muted-foreground">
          View all system users and their roles
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          const isActive = role === stat.role;
          const href = stat.role ? `/admin/users?role=${stat.role}` : "/admin/users";
          return (
            <Link key={stat.label} href={href}>
              <Card className={`cursor-pointer transition-all hover:shadow-md ${isActive ? "ring-2 ring-primary" : ""}`}>
                <CardContent className="flex items-center justify-between pt-6">
                  <div>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                  </div>
                  <Icon className="h-8 w-8 text-muted-foreground" />
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
              <Users className="h-5 w-5 text-muted-foreground" />
              All Users ({totalCount})
            </CardTitle>
            {role && (
              <Link href="/admin/users">
                <Button variant="ghost" size="sm">Clear filter</Button>
              </Link>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No users found</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-medium">
                            {user.firstName[0]}
                            {user.lastName[0]}
                          </div>
                          <span className="font-medium">
                            {user.firstName} {user.lastName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{user.email}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {roleIcon(user.role)}
                          <Badge variant="secondary" className={roleBadge(user.role)}>
                            {user.role}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.isActive ? (
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
                        {formatTimeAgo(user.createdAt)}
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
