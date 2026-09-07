"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Download,
  Users,
  TrendingUp,
  AlertTriangle,
  Loader2,
  BarChart3,
  Calendar,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";

interface ReportStats {
  totalStudents: number;
  totalPredictions: number;
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
  unpredicted: number;
  avgGpa: number | null;
  avgPredictedGpa: number | null;
  recentPredictions: Array<{
    studentName: string;
    studentNumber: string;
    predictedGpa: number;
    riskLevel: string;
    modelUsed: string;
    date: string;
  }>;
}

export default function ReportsPage() {
  const [exporting, setExporting] = useState<string | null>(null);
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const res = await fetch("/api/reports/stats");
        if (!res.ok) return;
        const data = await res.json();
        setStats(data);
      } catch {
        // silent
      }
      setLoading(false);
    }
    loadStats();
  }, []);

  async function handleExport(type: string, format: "csv" | "pdf") {
    setExporting(`${type}-${format}`);
    try {
      const res = await fetch(`/api/reports/export/${type}?format=${format}`);

      if (!res.ok) {
        const data = await res.json();
        toast.error("Export Failed", { description: data.error });
        setExporting(null);
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type}-report.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success("Report Exported", {
        description: `${format.toUpperCase()} file has been downloaded`,
      });
    } catch {
      toast.error("Network Error", { description: "Failed to export report" });
    }
    setExporting(null);
  }

  const reports = [
    {
      type: "students",
      title: "Student Performance Report",
      description: "Complete list of all students with current GPA, attendance, study hours, predicted GPA, and risk level",
      icon: Users,
      color: "bg-blue-50 dark:bg-blue-950",
      iconColor: "text-blue-600 dark:text-blue-400",
      count: stats?.totalStudents,
    },
    {
      type: "predictions",
      title: "Prediction Report",
      description: "All predictions run with model used, confidence scores, and risk distribution breakdown",
      icon: TrendingUp,
      color: "bg-purple-50 dark:bg-purple-950",
      iconColor: "text-purple-600 dark:text-purple-400",
      count: stats?.totalPredictions,
    },
    {
      type: "at-risk",
      title: "At-Risk Students Report",
      description: "Students classified as HIGH risk with current performance data and intervention recommendations",
      icon: AlertTriangle,
      color: "bg-red-50 dark:bg-red-950",
      iconColor: "text-red-600 dark:text-red-400",
      count: stats?.highRisk,
    },
  ];

  const riskBadge = (level: string) => {
    const styles: Record<string, string> = {
      HIGH: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
      MEDIUM: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
      LOW: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
    };
    return styles[level] || "bg-muted text-muted-foreground";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Reports</h2>
        <p className="text-sm text-muted-foreground">
          Generate and export academic performance reports
        </p>
      </div>

      {/* Stats overview */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Users className="h-4 w-4" />
                Total Students
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.totalStudents}</p>
              {stats.unpredicted > 0 && (
                <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
                  {stats.unpredicted} need prediction
                </p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                Predictions Run
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stats.totalPredictions}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <BarChart3 className="h-4 w-4" />
                Avg GPA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">
                {stats.avgGpa ? stats.avgGpa.toFixed(2) : "N/A"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Predicted: {stats.avgPredictedGpa ? stats.avgPredictedGpa.toFixed(2) : "N/A"}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <AlertTriangle className="h-4 w-4" />
                High Risk
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {stats.highRisk}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                M: {stats.mediumRisk} · L: {stats.lowRisk}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Risk distribution bar */}
      {stats && stats.totalPredictions > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Risk Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-8 overflow-hidden rounded-lg">
              {stats.lowRisk > 0 && (
                <div
                  className="flex items-center justify-center bg-green-500 text-xs font-medium text-white"
                  style={{ width: `${(stats.lowRisk / stats.totalPredictions) * 100}%` }}
                >
                  {((stats.lowRisk / stats.totalPredictions) * 100).toFixed(0)}%
                </div>
              )}
              {stats.mediumRisk > 0 && (
                <div
                  className="flex items-center justify-center bg-amber-500 text-xs font-medium text-white"
                  style={{ width: `${(stats.mediumRisk / stats.totalPredictions) * 100}%` }}
                >
                  {((stats.mediumRisk / stats.totalPredictions) * 100).toFixed(0)}%
                </div>
              )}
              {stats.highRisk > 0 && (
                <div
                  className="flex items-center justify-center bg-red-500 text-xs font-medium text-white"
                  style={{ width: `${(stats.highRisk / stats.totalPredictions) * 100}%` }}
                >
                  {((stats.highRisk / stats.totalPredictions) * 100).toFixed(0)}%
                </div>
              )}
            </div>
            <div className="mt-2 flex justify-between text-xs text-muted-foreground">
              <span>Low: {stats.lowRisk}</span>
              <span>Medium: {stats.mediumRisk}</span>
              <span>High: {stats.highRisk}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Report cards */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Available Reports</h3>
        <div className="grid gap-4 md:grid-cols-3">
          {reports.map((report) => {
            const Icon = report.icon;
            return (
              <Card key={report.type} className="flex flex-col">
                <CardHeader>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${report.color}`}>
                    <Icon className={`h-5 w-5 ${report.iconColor}`} />
                  </div>
                  <CardTitle className="text-base">{report.title}</CardTitle>
                  <CardDescription>{report.description}</CardDescription>
                  {report.count !== undefined && report.count > 0 && (
                    <p className="text-xs font-medium text-muted-foreground">
                      {report.count} record{report.count > 1 ? "s" : ""} available
                    </p>
                  )}
                </CardHeader>
                <CardContent className="mt-auto space-y-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => handleExport(report.type, "csv")}
                    disabled={exporting === `${report.type}-csv`}
                  >
                    {exporting === `${report.type}-csv` ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Exporting...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-4 w-4" />
                        Download CSV
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => handleExport(report.type, "pdf")}
                    disabled={exporting === `${report.type}-pdf`}
                  >
                    {exporting === `${report.type}-pdf` ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <FileText className="mr-2 h-4 w-4" />
                        Download PDF
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Recent predictions preview */}
      {stats && stats.recentPredictions.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  Recent Predictions
                </CardTitle>
                <CardDescription>Latest prediction results</CardDescription>
              </div>
              <Link href="/lecturer/predictions">
                <Button variant="ghost" size="sm">
                  View All
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Student No.</TableHead>
                  <TableHead>Predicted GPA</TableHead>
                  <TableHead>Risk Level</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.recentPredictions.map((p, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{p.studentName}</TableCell>
                    <TableCell>{p.studentNumber}</TableCell>
                    <TableCell className="font-bold">{p.predictedGpa.toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={riskBadge(p.riskLevel)}>
                        {p.riskLevel}
                      </Badge>
                    </TableCell>
                    <TableCell className="capitalize">{p.modelUsed.replace(/_/g, " ")}</TableCell>
                    <TableCell className="text-muted-foreground">{p.date}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Empty state */}
      {stats && stats.totalStudents === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <CheckCircle2 className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-sm font-medium">No data available</p>
            <p className="text-xs text-muted-foreground">
              Upload student data first to generate reports
            </p>
            <Link href="/lecturer/upload" className="mt-4">
              <Button size="sm">
                <Users className="mr-2 h-4 w-4" />
                Upload Data
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
