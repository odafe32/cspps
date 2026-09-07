import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BookOpen, TrendingUp } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { formatTimeAgo } from "@/lib/utils/format";

export default async function StudentRecordsPage() {
  const session = await getSession();
  if (!session) return null;

  const student = await prisma.student.findFirst({
    where: { userId: session.userId },
    include: {
      performanceRecords: {
        orderBy: { createdAt: "desc" },
        include: { predictions: { orderBy: { createdAt: "desc" }, take: 1 } },
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
    return styles[level] || "bg-muted text-muted-foreground";
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">My Records</h2>
        <p className="text-sm text-muted-foreground">
          Your academic performance history
        </p>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="text-xs text-muted-foreground">Total Records</p>
              <p className="text-2xl font-bold">{student.performanceRecords.length}</p>
            </div>
            <BookOpen className="h-8 w-8 text-blue-600" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="text-xs text-muted-foreground">Latest GPA</p>
              <p className="text-2xl font-bold">
                {student.performanceRecords[0]?.gpa.toFixed(2) || "N/A"}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-600" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center justify-between pt-6">
            <div>
              <p className="text-xs text-muted-foreground">Highest GPA</p>
              <p className="text-2xl font-bold">
                {student.performanceRecords.length > 0
                  ? Math.max(...student.performanceRecords.map((r) => r.gpa)).toFixed(2)
                  : "N/A"}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </CardContent>
        </Card>
      </div>

      {/* Records table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-muted-foreground" />
            Performance History
          </CardTitle>
          <CardDescription>All your academic records by semester</CardDescription>
        </CardHeader>
        <CardContent>
          {student.performanceRecords.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-sm font-medium">No records yet</p>
              <p className="text-xs text-muted-foreground">
                Your lecturer will add performance records for you
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Semester</TableHead>
                  <TableHead>GPA</TableHead>
                  <TableHead>Attendance</TableHead>
                  <TableHead>Study Hours</TableHead>
                  <TableHead>Assignment Avg</TableHead>
                  <TableHead>Test Avg</TableHead>
                  <TableHead>Library</TableHead>
                  <TableHead>Participation</TableHead>
                  <TableHead>Prediction</TableHead>
                  <TableHead>Added</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {student.performanceRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.semester}</TableCell>
                    <TableCell className="font-bold">{record.gpa.toFixed(2)}</TableCell>
                    <TableCell>{record.attendanceRate.toFixed(0)}%</TableCell>
                    <TableCell>{record.studyHours.toFixed(0)}h</TableCell>
                    <TableCell>
                      {record.assignmentAverage != null ? `${record.assignmentAverage.toFixed(0)}%` : "—"}
                    </TableCell>
                    <TableCell>
                      {record.testAverage != null ? `${record.testAverage.toFixed(0)}%` : "—"}
                    </TableCell>
                    <TableCell>
                      {record.libraryVisits != null ? record.libraryVisits : "—"}
                    </TableCell>
                    <TableCell>
                      {record.classParticipation != null ? `${record.classParticipation.toFixed(1)}/10` : "—"}
                    </TableCell>
                    <TableCell>
                      {record.predictions[0] ? (
                        <Badge variant="secondary" className={riskBadge(record.predictions[0].riskLevel)}>
                          {record.predictions[0].riskLevel}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatTimeAgo(record.createdAt)}
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
