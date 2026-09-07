import {
  Card,
  CardContent,
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
import { Activity, Upload, TrendingUp, GraduationCap, FileText } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { formatTimeAgo } from "@/lib/utils/format";

export default async function AdminActivityLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const pageNum = parseInt(page || "1");
  const perPage = 20;
  const skip = (pageNum - 1) * perPage;

  const [logs, totalCount] = await Promise.all([
    prisma.activityLog.findMany({
      skip,
      take: perPage,
      orderBy: { createdAt: "desc" },
      include: { user: true },
    }),
    prisma.activityLog.count(),
  ]);

  const actionIcon = (action: string) => {
    if (action.includes("UPLOAD")) return <Upload className="h-4 w-4 text-blue-500" />;
    if (action.includes("PREDICT")) return <TrendingUp className="h-4 w-4 text-purple-500" />;
    if (action.includes("STUDENT")) return <GraduationCap className="h-4 w-4 text-green-500" />;
    if (action.includes("EXPORT")) return <FileText className="h-4 w-4 text-amber-500" />;
    return <Activity className="h-4 w-4 text-muted-foreground" />;
  };

  const actionBadge = (action: string) => {
    const styles: Record<string, string> = {
      UPLOAD_DATASET: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
      ADD_STUDENT: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
      DELETE_STUDENT: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
      EXPORT_REPORT: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
      RUN_PREDICTION: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400",
    };
    return styles[action] || "bg-muted text-muted-foreground";
  };

  const totalPages = Math.ceil(totalCount / perPage);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Activity Logs</h2>
        <p className="text-sm text-muted-foreground">
          System audit trail of all user actions ({totalCount} total)
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-muted-foreground" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No activity logged</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-muted text-[10px] font-medium">
                            {log.user.firstName[0]}
                            {log.user.lastName[0]}
                          </div>
                          <span className="text-sm font-medium">
                            {log.user.firstName} {log.user.lastName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {actionIcon(log.action)}
                          <Badge variant="secondary" className={actionBadge(log.action)}>
                            {log.action.replace(/_/g, " ")}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {log.description || "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatTimeAgo(log.createdAt)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between pt-4">
                  <p className="text-xs text-muted-foreground">
                    Page {pageNum} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    {pageNum > 1 && (
                      <a href={`/admin/activity-logs?page=${pageNum - 1}`}>
                        <span className="rounded border px-3 py-1 text-sm hover:bg-muted">Previous</span>
                      </a>
                    )}
                    {pageNum < totalPages && (
                      <a href={`/admin/activity-logs?page=${pageNum + 1}`}>
                        <span className="rounded border px-3 py-1 text-sm hover:bg-muted">Next</span>
                      </a>
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
