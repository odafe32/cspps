import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  GraduationCap,
  BookOpen,
  AlertTriangle,
  TrendingUp,
  Activity,
  Clock,
  Shield,
  Users,
  Upload,
  FileText,
  Cpu,
  Database,
  ArrowRight,
} from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { formatTimeAgo } from "@/lib/utils/format";
import { RiskDistributionChart } from "@/components/charts/risk-distribution-chart";

export default async function AdminDashboard() {
  const [
    studentCount,
    lecturerCount,
    adminCount,
    userCount,
    highRiskCount,
    mediumRiskCount,
    lowRiskCount,
    totalPredictions,
    avgGpaResult,
    avgPredictedGpaResult,
    recentActivity,
    recentStudents,
    unpredictedCount,
    performanceRecordCount,
  ] = await Promise.all([
    prisma.student.count(),
    prisma.lecturer.count(),
    prisma.admin.count(),
    prisma.user.count(),
    prisma.prediction.count({ where: { riskLevel: "HIGH" } }),
    prisma.prediction.count({ where: { riskLevel: "MEDIUM" } }),
    prisma.prediction.count({ where: { riskLevel: "LOW" } }),
    prisma.prediction.count(),
    prisma.performanceRecord.aggregate({ _avg: { gpa: true } }),
    prisma.prediction.aggregate({ _avg: { predictedGpa: true } }),
    prisma.activityLog.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: { user: true },
    }),
    prisma.student.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: {
        user: true,
        predictions: { orderBy: { createdAt: "desc" }, take: 1 },
      },
    }),
    prisma.student.count({
      where: {
        performanceRecords: { some: {} },
        predictions: { none: {} },
      },
    }),
    prisma.performanceRecord.count(),
  ]);

  const avgGpa = avgGpaResult._avg.gpa ? Number(avgGpaResult._avg.gpa.toFixed(2)) : 0;
  const avgPredictedGpa = avgPredictedGpaResult._avg.predictedGpa
    ? Number(avgPredictedGpaResult._avg.predictedGpa.toFixed(2))
    : 0;

  const stats = [
    {
      label: "Total Students",
      value: studentCount,
      icon: GraduationCap,
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-950",
      href: "/admin/students",
      sub: `${unpredictedCount} need prediction`,
    },
    {
      label: "Lecturers",
      value: lecturerCount,
      icon: BookOpen,
      color: "text-green-600",
      bg: "bg-green-50 dark:bg-green-950",
      href: "/admin/lecturers",
      sub: "Active faculty",
    },
    {
      label: "Total Users",
      value: userCount,
      icon: Users,
      color: "text-purple-600",
      bg: "bg-purple-50 dark:bg-purple-950",
      href: "/admin/users",
      sub: `${adminCount} administrators`,
    },
    {
      label: "High-Risk Students",
      value: highRiskCount,
      icon: AlertTriangle,
      color: "text-red-600",
      bg: "bg-red-50 dark:bg-red-950",
      href: "/admin/students?risk=HIGH",
      sub: studentCount > 0 ? `${Math.round((highRiskCount / studentCount) * 100)}% of students` : "0%",
    },
  ];

  const riskData = [
    { name: "Low Risk", value: lowRiskCount, fill: "#22c55e" },
    { name: "Medium Risk", value: mediumRiskCount, fill: "#f59e0b" },
    { name: "High Risk", value: highRiskCount, fill: "#ef4444" },
  ];

  const riskBadge = (level: string) => {
    const styles: Record<string, string> = {
      HIGH: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
      MEDIUM: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
      LOW: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
    };
    return styles[level] || styles.LOW;
  };

  const actionIcon = (action: string) => {
    if (action.includes("UPLOAD")) return <Upload className="h-3.5 w-3.5 text-blue-500" />;
    if (action.includes("PREDICT")) return <TrendingUp className="h-3.5 w-3.5 text-purple-500" />;
    if (action.includes("STUDENT")) return <GraduationCap className="h-3.5 w-3.5 text-green-500" />;
    if (action.includes("EXPORT")) return <FileText className="h-3.5 w-3.5 text-amber-500" />;
    return <Activity className="h-3.5 w-3.5 text-muted-foreground" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight">Admin Dashboard</h2>
        <p className="text-sm text-muted-foreground">
          System overview and performance statistics
        </p>
      </div>

      {/* Unpredicted alert */}
      {unpredictedCount > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
              {unpredictedCount} students need predictions
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-500">
              These students have performance data but no predictions have been run
            </p>
          </div>
          <Link href="/admin/predictions?scope=unpredicted">
            <Button size="sm">
              <TrendingUp className="mr-2 h-4 w-4" />
              Run Prediction
            </Button>
          </Link>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Link key={stat.label} href={stat.href}>
              <Card className="overflow-hidden transition-shadow hover:shadow-md">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </CardTitle>
                  <div className={`rounded-lg p-2 ${stat.bg}`}>
                    <Icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stat.value}</div>
                  <p className="mt-1 text-xs text-muted-foreground">{stat.sub}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Risk distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-muted-foreground" />
              Risk Distribution
            </CardTitle>
            <CardDescription>
              Student risk classification across all predictions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {totalPredictions > 0 ? (
              <RiskDistributionChart data={riskData} />
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <TrendingUp className="h-10 w-10 text-muted-foreground/50" />
                <p className="mt-3 text-sm text-muted-foreground">No predictions yet</p>
                <Link href="/admin/predictions" className="mt-3">
                  <Button size="sm" variant="outline">
                    Run Predictions
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Performance overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              Performance Overview
            </CardTitle>
            <CardDescription>
              GPA and prediction statistics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground">Average GPA</p>
                <p className="mt-1 text-2xl font-bold">{avgGpa || "N/A"}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">5.0 scale</p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground">Avg Predicted GPA</p>
                <p className="mt-1 text-2xl font-bold">{avgPredictedGpa || "N/A"}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{totalPredictions} predictions</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-green-500" />
                  Low Risk
                </span>
                <span className="font-medium">{lowRiskCount}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                  Medium Risk
                </span>
                <span className="font-medium">{mediumRiskCount}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
                  High Risk
                </span>
                <span className="font-medium">{highRiskCount}</span>
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Records:</span>
                <span className="font-medium">{performanceRecordCount}</span>
              </div>
              <div className="flex items-center gap-2">
                <Cpu className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Model:</span>
                <span className="font-medium">ONNX</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Link href="/admin/students/add">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-3 pt-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950">
                <GraduationCap className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Add Student</p>
                <p className="text-xs text-muted-foreground">Create new account</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/lecturers/add">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-3 pt-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950">
                <BookOpen className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Add Lecturer</p>
                <p className="text-xs text-muted-foreground">Create faculty account</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/upload">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-3 pt-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 dark:bg-green-950">
                <Upload className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Upload Data</p>
                <p className="text-xs text-muted-foreground">Bulk import CSV</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/predictions">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-3 pt-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 dark:bg-purple-950">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Run Predictions</p>
                <p className="text-xs text-muted-foreground">ML inference</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
        <Link href="/admin/reports">
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-3 pt-6">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 dark:bg-amber-950">
                <FileText className="h-5 w-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Export Reports</p>
                <p className="text-xs text-muted-foreground">CSV & PDF</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Bottom row: Recent students + Activity */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recently added students */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-muted-foreground" />
                  Recent Students
                </CardTitle>
                <CardDescription>Latest student registrations</CardDescription>
              </div>
              <Link href="/admin/students">
                <Button variant="ghost" size="sm">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentStudents.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <GraduationCap className="h-10 w-10 text-muted-foreground/50" />
                <p className="mt-3 text-sm text-muted-foreground">No students yet</p>
                <Link href="/admin/students/add" className="mt-3">
                  <Button size="sm">
                    <GraduationCap className="mr-2 h-4 w-4" />
                    Add Student
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentStudents.map((student) => (
                  <Link
                    key={student.id}
                    href={`/admin/students/${student.id}`}
                    className="flex items-center justify-between gap-3 rounded-md p-2 hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-xs font-medium">
                        {student.user.firstName[0]}
                        {student.user.lastName[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {student.user.firstName} {student.user.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {student.studentNumber}
                        </p>
                      </div>
                    </div>
                    {student.predictions[0] ? (
                      <Badge
                        variant="secondary"
                        className={riskBadge(student.predictions[0].riskLevel)}
                      >
                        {student.predictions[0].riskLevel}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">No prediction</span>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-muted-foreground" />
                  Recent Activity
                </CardTitle>
                <CardDescription>Latest system events</CardDescription>
              </div>
              <Link href="/admin/activity-logs">
                <Button variant="ghost" size="sm">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentActivity.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No recent activity</p>
            ) : (
              <div className="space-y-1">
                {recentActivity.map((log, i) => (
                  <div key={log.id}>
                    <div className="flex items-start gap-3 py-2">
                      <div className="mt-0.5 shrink-0">
                        {actionIcon(log.action)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">
                          <span className="font-medium">
                            {log.user.firstName} {log.user.lastName}
                          </span>{" "}
                          <span className="text-muted-foreground">
                            {log.description || log.action.replace(/_/g, " ")}
                          </span>
                        </p>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatTimeAgo(log.createdAt)}
                        </p>
                      </div>
                    </div>
                    {i < recentActivity.length - 1 && <Separator />}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* System info footer */}
      <Card>
        <CardContent className="flex flex-col items-center gap-2 py-6 text-center">
          <Shield className="h-6 w-6 text-muted-foreground" />
          <p className="text-sm font-medium">CSPPS — Comprehensive Student Performance Prediction System</p>
          <p className="text-xs text-muted-foreground">
            Implementation: Godfrey Joseph · 5.0 GPA Scale · ONNX ML Engine
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
