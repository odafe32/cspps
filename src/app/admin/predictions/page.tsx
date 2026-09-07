"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, TrendingUp, Play, Users, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Student {
  id: string;
  name: string;
  studentNumber: string;
  gpa: number | null;
  attendanceRate: number | null;
  studyHours: number | null;
  assignmentAverage: number | null;
  testAverage: number | null;
  libraryVisits: number | null;
  classParticipation: number | null;
  semester: string | null;
  riskLevel: string | null;
  predictedGpa: number | null;
  confidence: number | null;
  modelUsed: string | null;
}

export default function PredictionsPageWrapper() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>}>
      <PredictionsPage />
    </Suspense>
  );
}

function PredictionsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<{
    total: number;
    high: number;
    medium: number;
    low: number;
    students?: Array<{
      name: string;
      studentNumber: string;
      predictedGpa: number;
      riskLevel: string;
      confidence: number;
      modelUsed: string;
    }>;
  } | null>(null);
  const paramScope = searchParams.get("scope");
  const initialScope = paramScope === "unpredicted" ? "unpredicted" : "all";

  const [students, setStudents] = useState<Student[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [recentPredictions, setRecentPredictions] = useState<Array<{
    studentName: string;
    studentNumber: string;
    predictedGpa: number;
    riskLevel: string;
    modelUsed: string;
    confidence: number;
    date: string;
  }>>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [recentPage, setRecentPage] = useState(0);
  const RECENT_PER_PAGE = 10;

  // Prediction scope
  const [scope, setScope] = useState<"all" | "selected" | "risk" | "unpredicted">(initialScope);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [riskFilter, setRiskFilter] = useState<"HIGH" | "MEDIUM" | "LOW">("HIGH");

  useEffect(() => {
    loadStudents();
    loadRecentPredictions();
  }, []);

  async function loadStudents() {
    setLoadingStudents(true);
    try {
      const res = await fetch("/api/students/list");
      if (!res.ok) return;
      const data = await res.json();
      setStudents(data.students || []);
    } catch {
      // silent
    }
    setLoadingStudents(false);
  }

  async function loadRecentPredictions() {
    setLoadingRecent(true);
    try {
      const res = await fetch("/api/reports/stats");
      if (!res.ok) return;
      const data = await res.json();
      setRecentPredictions(data.recentPredictions || []);
    } catch {
      // silent
    }
    setLoadingRecent(false);
  }

  function toggleStudent(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  }

  function toggleAll() {
    if (selectedIds.size === students.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(students.map((s) => s.id)));
    }
  }

  async function runPrediction() {
    setRunning(true);
    setResults(null);

    // Build request body based on scope
    const body: {
      scope: string;
      studentIds?: string[];
      riskLevel?: string;
    } = { scope: scope === "unpredicted" ? "unpredicted" : scope };
    if (scope === "selected") {
      body.studentIds = Array.from(selectedIds);
      if (body.studentIds.length === 0) {
        toast.error("No students selected", { description: "Select at least one student" });
        setRunning(false);
        return;
      }
    } else if (scope === "risk") {
      body.riskLevel = riskFilter;
    }

    try {
      const res = await fetch("/api/predictions/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error("Prediction Failed", { description: data.error });
        setRunning(false);
        return;
      }

      setResults(data);
      toast.success("Prediction Complete", {
        description: `${data.total} students processed`,
      });
      // Reload student list and recent predictions so everything updates
      await loadStudents();
      await loadRecentPredictions();
      router.refresh();
      setRunning(false);
    } catch {
      toast.error("Network Error", {
        description: "Failed to run prediction",
      });
      setRunning(false);
    }
  }

  const filteredStudents =
    scope === "risk"
      ? students.filter((s) => s.riskLevel === riskFilter)
      : scope === "unpredicted"
      ? students.filter((s) => !s.riskLevel)
      : students;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Run Predictions</h2>
        <p className="text-sm text-muted-foreground">
          Generate performance predictions using the trained ML models
        </p>
      </div>

      {/* Upload redirect banner */}
      {scope === "unpredicted" && students.filter((s) => !s.riskLevel).length > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
          <CheckCircle2 className="h-5 w-5 text-primary" />
          <div className="flex-1">
            <p className="text-sm font-medium">Data uploaded successfully</p>
            <p className="text-xs text-muted-foreground">
              {students.filter((s) => !s.riskLevel).length} students need predictions. Click &ldquo;Run Prediction&rdquo; below to generate them.
            </p>
          </div>
        </div>
      )}

      {/* Scope selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
            Prediction Scope
          </CardTitle>
          <CardDescription>
            Choose which students to run predictions for
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Scope tabs */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={scope === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setScope("all")}
            >
              <Users className="mr-2 h-4 w-4" />
              All Students
            </Button>
            <Button
              variant={scope === "selected" ? "default" : "outline"}
              size="sm"
              onClick={() => setScope("selected")}
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Selected ({selectedIds.size})
            </Button>
            <Button
              variant={scope === "risk" ? "default" : "outline"}
              size="sm"
              onClick={() => setScope("risk")}
            >
              <AlertTriangle className="mr-2 h-4 w-4" />
              By Risk Level
            </Button>
            <Button
              variant={scope === "unpredicted" ? "default" : "outline"}
              size="sm"
              onClick={() => setScope("unpredicted")}
            >
              <AlertTriangle className="mr-2 h-4 w-4" />
              Unpredicted Only ({students.filter((s) => !s.riskLevel).length})
            </Button>
          </div>

          {/* Risk filter */}
          {scope === "risk" && (
            <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-3">
              <Label className="text-sm">Re-predict students with risk:</Label>
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value as "HIGH" | "MEDIUM" | "LOW")}
                className="h-8 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="HIGH">High Risk</option>
                <option value="MEDIUM">Medium Risk</option>
                <option value="LOW">Low Risk</option>
              </select>
              <span className="text-xs text-muted-foreground">
                ({filteredStudents.length} students)
              </span>
            </div>
          )}

          {/* Student selector */}
          {scope === "selected" && (
            <div className="rounded-lg border p-4">
              {loadingStudents ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : students.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No students with performance records found
                </p>
              ) : (
                <>
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {selectedIds.size} of {students.length} selected
                    </span>
                    <Button variant="ghost" size="sm" onClick={toggleAll}>
                      {selectedIds.size === students.length ? "Deselect All" : "Select All"}
                    </Button>
                  </div>
                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {students.map((s) => (
                      <label
                        key={s.id}
                        className={`block cursor-pointer rounded-md border p-3 hover:bg-muted/50 ${
                          selectedIds.has(s.id) ? "border-primary bg-primary/5" : ""
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(s.id)}
                            onChange={() => toggleStudent(s.id)}
                            className="h-4 w-4 rounded border-input"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium">{s.name}</p>
                              <span className="text-xs text-muted-foreground">{s.studentNumber}</span>
                            </div>
                            <p className="text-xs text-muted-foreground">{s.semester}</p>
                          </div>
                          {s.riskLevel && (
                            <span
                              className={`rounded px-2 py-0.5 text-xs font-medium ${
                                s.riskLevel === "HIGH"
                                  ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
                                  : s.riskLevel === "MEDIUM"
                                  ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                                  : "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
                              }`}
                            >
                              {s.riskLevel}
                            </span>
                          )}
                        </div>
                        {/* Details grid */}
                        <div className="mt-2 grid grid-cols-4 gap-2 pl-7 text-xs">
                          <div>
                            <span className="text-muted-foreground">GPA:</span>{" "}
                            <span className="font-medium">{s.gpa?.toFixed(2) || "N/A"}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Att:</span>{" "}
                            <span className="font-medium">{s.attendanceRate ? `${s.attendanceRate.toFixed(0)}%` : "N/A"}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Study:</span>{" "}
                            <span className="font-medium">{s.studyHours ? `${s.studyHours.toFixed(0)}h` : "N/A"}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Test:</span>{" "}
                            <span className="font-medium">{s.testAverage ? `${s.testAverage.toFixed(0)}%` : "N/A"}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Assign:</span>{" "}
                            <span className="font-medium">{s.assignmentAverage ? `${s.assignmentAverage.toFixed(0)}%` : "N/A"}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Library:</span>{" "}
                            <span className="font-medium">{s.libraryVisits ?? "N/A"}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Particip:</span>{" "}
                            <span className="font-medium">{s.classParticipation?.toFixed(1) || "N/A"}</span>
                          </div>
                          {s.predictedGpa && (
                            <div>
                              <span className="text-muted-foreground">Pred GPA:</span>{" "}
                              <span className="font-bold text-primary">{s.predictedGpa.toFixed(2)}</span>
                            </div>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Run button */}
          <div className="flex justify-center pt-2">
            <Button onClick={runPrediction} disabled={running} size="lg">
              {running ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running Predictions...
                </>
              ) : (
                <>
                  <Play className="mr-2 h-4 w-4" />
                  Run Prediction
                  {scope === "all" && ` (All Students)`}
                  {scope === "selected" && ` (${selectedIds.size} Selected)`}
                  {scope === "risk" && ` (${filteredStudents.length} ${riskFilter} Risk)`}
                  {scope === "unpredicted" && ` (${filteredStudents.length} Unpredicted)`}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {results && (
        <Card>
          <CardHeader>
            <CardTitle>Prediction Results</CardTitle>
            <CardDescription>
              {results.total} students processed successfully
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary counts */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border bg-green-50 p-4 dark:bg-green-950">
                <p className="text-xs text-green-700 dark:text-green-400">Low Risk</p>
                <p className="mt-1 text-2xl font-bold text-green-700 dark:text-green-400">
                  {results.low}
                </p>
              </div>
              <div className="rounded-lg border bg-amber-50 p-4 dark:bg-amber-950">
                <p className="text-xs text-amber-700 dark:text-amber-400">Medium Risk</p>
                <p className="mt-1 text-2xl font-bold text-amber-700 dark:text-amber-400">
                  {results.medium}
                </p>
              </div>
              <div className="rounded-lg border bg-red-50 p-4 dark:bg-red-950">
                <p className="text-xs text-red-700 dark:text-red-400">High Risk</p>
                <p className="mt-1 text-2xl font-bold text-red-700 dark:text-red-400">
                  {results.high}
                </p>
              </div>
            </div>

            {/* Detailed breakdown by risk level */}
            {results.students && results.students.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold">Student Breakdown</h3>

                {/* HIGH risk */}
                {results.students.filter((s) => s.riskLevel === "HIGH").length > 0 && (
                  <div className="rounded-lg border border-red-200 dark:border-red-900">
                    <div className="flex items-center gap-2 border-b border-red-200 bg-red-50 px-4 py-2 dark:border-red-900 dark:bg-red-950">
                      <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                      <span className="text-sm font-semibold text-red-700 dark:text-red-400">
                        High Risk ({results.students.filter((s) => s.riskLevel === "HIGH").length})
                      </span>
                    </div>
                    <div className="divide-y">
                      {results.students.filter((s) => s.riskLevel === "HIGH").map((s) => (
                        <div key={s.studentNumber} className="flex items-center justify-between px-4 py-3">
                          <div>
                            <p className="text-sm font-medium">{s.name}</p>
                            <p className="text-xs text-muted-foreground">{s.studentNumber} · {s.modelUsed}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-red-600 dark:text-red-400">{s.predictedGpa.toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground">Confidence: {(s.confidence * 100).toFixed(0)}%</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* MEDIUM risk */}
                {results.students.filter((s) => s.riskLevel === "MEDIUM").length > 0 && (
                  <div className="rounded-lg border border-amber-200 dark:border-amber-900">
                    <div className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 dark:border-amber-900 dark:bg-amber-950">
                      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">
                        Medium Risk ({results.students.filter((s) => s.riskLevel === "MEDIUM").length})
                      </span>
                    </div>
                    <div className="divide-y">
                      {results.students.filter((s) => s.riskLevel === "MEDIUM").map((s) => (
                        <div key={s.studentNumber} className="flex items-center justify-between px-4 py-3">
                          <div>
                            <p className="text-sm font-medium">{s.name}</p>
                            <p className="text-xs text-muted-foreground">{s.studentNumber} · {s.modelUsed}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-amber-600 dark:text-amber-400">{s.predictedGpa.toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground">Confidence: {(s.confidence * 100).toFixed(0)}%</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* LOW risk */}
                {results.students.filter((s) => s.riskLevel === "LOW").length > 0 && (
                  <div className="rounded-lg border border-green-200 dark:border-green-900">
                    <div className="flex items-center gap-2 border-b border-green-200 bg-green-50 px-4 py-2 dark:border-green-900 dark:bg-green-950">
                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                      <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                        Low Risk ({results.students.filter((s) => s.riskLevel === "LOW").length})
                      </span>
                    </div>
                    <div className="divide-y">
                      {results.students.filter((s) => s.riskLevel === "LOW").map((s) => (
                        <div key={s.studentNumber} className="flex items-center justify-between px-4 py-3">
                          <div>
                            <p className="text-sm font-medium">{s.name}</p>
                            <p className="text-xs text-muted-foreground">{s.studentNumber} · {s.modelUsed}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-green-600 dark:text-green-400">{s.predictedGpa.toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground">Confidence: {(s.confidence * 100).toFixed(0)}%</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent Predictions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                Recent Predictions
              </CardTitle>
              <CardDescription>Latest prediction results across all students</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadingRecent ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : recentPredictions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
              <p className="mt-2 text-sm font-medium">No predictions yet</p>
              <p className="text-xs text-muted-foreground">
                Run your first prediction above to see results here
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Student No.</TableHead>
                    <TableHead>Predicted GPA</TableHead>
                    <TableHead>Risk Level</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentPredictions
                    .slice(recentPage * RECENT_PER_PAGE, (recentPage + 1) * RECENT_PER_PAGE)
                    .map((p, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{p.studentName}</TableCell>
                      <TableCell>{p.studentNumber}</TableCell>
                      <TableCell className="font-bold">{p.predictedGpa.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={
                            p.riskLevel === "HIGH"
                              ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
                              : p.riskLevel === "MEDIUM"
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400"
                              : "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400"
                          }
                        >
                          {p.riskLevel}
                        </Badge>
                      </TableCell>
                      <TableCell className="capitalize">{p.modelUsed.replace(/_/g, " ")}</TableCell>
                      <TableCell>{(p.confidence * 100).toFixed(0)}%</TableCell>
                      <TableCell className="text-muted-foreground">{p.date}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {recentPredictions.length > RECENT_PER_PAGE && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-xs text-muted-foreground">
                    Showing {recentPage * RECENT_PER_PAGE + 1}-
                    {Math.min((recentPage + 1) * RECENT_PER_PAGE, recentPredictions.length)}
                    {" "}of {recentPredictions.length}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRecentPage((p) => Math.max(0, p - 1))}
                      disabled={recentPage === 0}
                    >
                      Previous
                    </Button>
                    <span className="flex items-center px-2 text-xs text-muted-foreground">
                      Page {recentPage + 1} of {Math.ceil(recentPredictions.length / RECENT_PER_PAGE)}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setRecentPage((p) =>
                        Math.min(Math.ceil(recentPredictions.length / RECENT_PER_PAGE) - 1, p + 1)
                      )}
                      disabled={recentPage >= Math.ceil(recentPredictions.length / RECENT_PER_PAGE) - 1}
                    >
                      Next
                    </Button>
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
