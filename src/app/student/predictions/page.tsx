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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TrendingUp, Clock, Cpu, AlertTriangle } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { formatTimeAgo } from "@/lib/utils/format";

export default async function StudentPredictionsPage() {
  const session = await getSession();
  if (!session) return null;

  const student = await prisma.student.findFirst({
    where: { userId: session.userId },
    include: {
      predictions: {
        orderBy: { createdAt: "desc" },
        include: { record: true },
      },
    },
  });

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-sm font-medium">Student profile not found</p>
      </div>
    );
  }

  const riskBadge = (level: string) => {
    const styles: Record<string, string> = {
      HIGH: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
      MEDIUM: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
      LOW: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
    };
    return styles[level] || styles.LOW;
  };

  const latest = student.predictions[0];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">My Predictions</h2>
        <p className="text-sm text-muted-foreground">
          View your prediction history and risk classification
        </p>
      </div>

      {/* Latest prediction highlight */}
      {latest ? (
        <Card className={latest.riskLevel === "HIGH" ? "border-red-200 dark:border-red-900" : latest.riskLevel === "MEDIUM" ? "border-amber-200 dark:border-amber-900" : "border-green-200 dark:border-green-900"}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-muted-foreground" />
              Latest Prediction
            </CardTitle>
            <CardDescription>{formatTimeAgo(latest.createdAt)}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground">Predicted GPA</p>
                <p className="mt-1 text-2xl font-bold">{latest.predictedGpa.toFixed(2)}</p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground">Risk Level</p>
                <div className="mt-2">
                  <Badge variant="secondary" className={riskBadge(latest.riskLevel)}>
                    {latest.riskLevel}
                  </Badge>
                </div>
              </div>
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground">Model Used</p>
                <p className="mt-1 text-sm font-medium capitalize">{latest.modelUsed.replace(/_/g, " ")}</p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground">Confidence</p>
                <p className="mt-1 text-sm font-medium">
                  {latest.confidenceScore ? `${(latest.confidenceScore * 100).toFixed(0)}%` : "N/A"}
                </p>
              </div>
            </div>

            {latest.riskLevel === "HIGH" && (
              <div className="flex items-center gap-3 rounded-lg bg-red-50 p-3 dark:bg-red-950">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <p className="text-sm text-red-700 dark:text-red-400">
                  You are classified as high risk. Please seek academic support from your lecturers.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <TrendingUp className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4 text-sm font-medium">No predictions yet</p>
            <p className="text-xs text-muted-foreground">
              Your lecturer or administrator will run predictions for you
            </p>
          </CardContent>
        </Card>
      )}

      {/* Prediction history */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            Prediction History ({student.predictions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {student.predictions.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No prediction history</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Predicted GPA</TableHead>
                  <TableHead>Risk Level</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Confidence</TableHead>
                  <TableHead>Semester</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {student.predictions.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="text-muted-foreground">
                      {formatTimeAgo(p.createdAt)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {p.predictedGpa.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={riskBadge(p.riskLevel)}>
                        {p.riskLevel}
                      </Badge>
                    </TableCell>
                    <TableCell className="capitalize text-muted-foreground">
                      {p.modelUsed.replace(/_/g, " ")}
                    </TableCell>
                    <TableCell>
                      {p.confidenceScore ? `${(p.confidenceScore * 100).toFixed(0)}%` : "N/A"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {p.record?.semester || "N/A"}
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
