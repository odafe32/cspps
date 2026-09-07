import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  GraduationCap,
  TrendingUp,
  AlertTriangle,
  Activity,
  Clock,
  BookOpen,
  CheckCircle,
} from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { formatTimeAgo } from "@/lib/utils/format";
import { RiskDistributionChart } from "@/components/charts/risk-distribution-chart";

export default async function StudentDashboard() {
  const session = await getSession();
  if (!session) return null;

  const student = await prisma.student.findFirst({
    where: { userId: session.userId },
    include: {
      user: true,
      performanceRecords: { orderBy: { createdAt: "desc" } },
      predictions: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <GraduationCap className="h-12 w-12 text-muted-foreground" />
        <p className="mt-4 text-sm font-medium">Student profile not found</p>
        <p className="text-xs text-muted-foreground">Please contact an administrator</p>
      </div>
    );
  }

  const latestRecord = student.performanceRecords[0];
  const latestPrediction = student.predictions[0];

  const riskBadge = (level: string) => {
    const styles: Record<string, string> = {
      HIGH: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
      MEDIUM: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
      LOW: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
    };
    return styles[level] || styles.LOW;
  };

  const riskData = [
    { name: "Low Risk", value: student.predictions.filter((p) => p.riskLevel === "LOW").length, fill: "#22c55e" },
    { name: "Medium Risk", value: student.predictions.filter((p) => p.riskLevel === "MEDIUM").length, fill: "#f59e0b" },
    { name: "High Risk", value: student.predictions.filter((p) => p.riskLevel === "HIGH").length, fill: "#ef4444" },
  ];

  const stats = [
    {
      label: "Current GPA",
      value: latestRecord ? latestRecord.gpa.toFixed(2) : "N/A",
      icon: GraduationCap,
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-950",
      sub: latestRecord ? latestRecord.semester : "No records",
    },
    {
      label: "Predicted GPA",
      value: latestPrediction ? latestPrediction.predictedGpa.toFixed(2) : "N/A",
      icon: TrendingUp,
      color: "text-purple-600",
      bg: "bg-purple-50 dark:bg-purple-950",
      sub: latestPrediction ? formatTimeAgo(latestPrediction.createdAt) : "No prediction",
    },
    {
      label: "Risk Level",
      value: latestPrediction ? latestPrediction.riskLevel : "N/A",
      icon: latestPrediction?.riskLevel === "HIGH" ? AlertTriangle : CheckCircle,
      color: latestPrediction?.riskLevel === "HIGH" ? "text-red-600" : latestPrediction?.riskLevel === "MEDIUM" ? "text-amber-600" : "text-green-600",
      bg: latestPrediction?.riskLevel === "HIGH" ? "bg-red-50 dark:bg-red-950" : latestPrediction?.riskLevel === "MEDIUM" ? "bg-amber-50 dark:bg-amber-950" : "bg-green-50 dark:bg-green-950",
      sub: latestPrediction ? `${latestPrediction.modelUsed.replace(/_/g, " ")}` : "Awaiting prediction",
    },
    {
      label: "Total Records",
      value: student.performanceRecords.length,
      icon: BookOpen,
      color: "text-green-600",
      bg: "bg-green-50 dark:bg-green-950",
      sub: `${student.predictions.length} predictions`,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h2 className="text-2xl font-bold tracking-tight">
          Welcome, {student.user.firstName}
        </h2>
        <p className="text-sm text-muted-foreground">
          Your academic performance overview
        </p>
      </div>

      {/* No prediction alert */}
      {!latestPrediction && latestRecord && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
              No prediction available yet
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-500">
              Your lecturer or administrator needs to run a prediction for you
            </p>
          </div>
        </div>
      )}

      {/* High risk alert */}
      {latestPrediction?.riskLevel === "HIGH" && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950">
          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-700 dark:text-red-400">
              High Risk Alert
            </p>
            <p className="text-xs text-red-600 dark:text-red-500">
              Your predicted GPA suggests you may need additional academic support. Please consult your lecturer.
            </p>
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="overflow-hidden">
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
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Risk distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-muted-foreground" />
              Your Risk History
            </CardTitle>
            <CardDescription>
              Distribution across all your predictions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {student.predictions.length > 0 ? (
              <RiskDistributionChart data={riskData} />
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <TrendingUp className="h-10 w-10 text-muted-foreground/50" />
                <p className="mt-3 text-sm text-muted-foreground">No predictions yet</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Latest performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-muted-foreground" />
              Latest Performance
            </CardTitle>
            <CardDescription>
              {latestRecord ? latestRecord.semester : "No records"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {latestRecord ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <p className="text-xs text-muted-foreground">GPA</p>
                    <p className="mt-1 text-2xl font-bold">{latestRecord.gpa.toFixed(2)}</p>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <p className="text-xs text-muted-foreground">Attendance</p>
                    <p className="mt-1 text-2xl font-bold">{latestRecord.attendanceRate.toFixed(0)}%</p>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Study Hours/week</span>
                    <span className="font-medium">{latestRecord.studyHours.toFixed(0)}h</span>
                  </div>
                  {latestRecord.assignmentAverage != null && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Assignment Average</span>
                      <span className="font-medium">{latestRecord.assignmentAverage.toFixed(0)}%</span>
                    </div>
                  )}
                  {latestRecord.testAverage != null && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Test Average</span>
                      <span className="font-medium">{latestRecord.testAverage.toFixed(0)}%</span>
                    </div>
                  )}
                  {latestRecord.libraryVisits != null && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Library Visits</span>
                      <span className="font-medium">{latestRecord.libraryVisits}/semester</span>
                    </div>
                  )}
                  {latestRecord.classParticipation != null && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Class Participation</span>
                      <span className="font-medium">{latestRecord.classParticipation.toFixed(1)}/10</span>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <BookOpen className="h-10 w-10 text-muted-foreground/50" />
                <p className="mt-3 text-sm text-muted-foreground">No performance records yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent predictions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
            Recent Predictions
          </CardTitle>
          <CardDescription>Your latest prediction results</CardDescription>
        </CardHeader>
        <CardContent>
          {student.predictions.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No predictions yet</p>
          ) : (
            <div className="space-y-1">
              {student.predictions.slice(0, 5).map((p, i) => (
                <div key={p.id}>
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-9 w-9 items-center justify-center rounded-full ${riskBadge(p.riskLevel)}`}>
                        <TrendingUp className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">Predicted GPA: {p.predictedGpa.toFixed(2)}</p>
                        <p className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatTimeAgo(p.createdAt)}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className={riskBadge(p.riskLevel)}>
                      {p.riskLevel}
                    </Badge>
                  </div>
                  {i < Math.min(student.predictions.length, 5) - 1 && <Separator />}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
