import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, AlertTriangle, TrendingDown, TrendingUp, Info } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";

export default async function NotificationsPage() {
  const session = await getSession();

  if (!session) {
    return null;
  }

  const notifications = await prisma.notification.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const iconForType = (type: string) => {
    switch (type) {
      case "HIGH_RISK":
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case "PERFORMANCE_DROP":
        return <TrendingDown className="h-5 w-5 text-amber-500" />;
      case "PREDICTION_READY":
        return <TrendingUp className="h-5 w-5 text-green-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const badgeForType = (type: string) => {
    const styles: Record<string, string> = {
      HIGH_RISK: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400",
      PERFORMANCE_DROP:
        "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
      PREDICTION_READY:
        "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
      SYSTEM: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
    };
    return styles[type] || styles.SYSTEM;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Notifications</h2>
        <p className="text-sm text-muted-foreground">
          {unreadCount > 0 ? `${unreadCount} unread notifications` : "All caught up"}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-muted-foreground" />
            All Notifications
          </CardTitle>
          <CardDescription>Academic alerts and system updates</CardDescription>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Bell className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                No notifications yet
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 rounded-lg border p-4 ${
                    !n.isRead ? "border-primary/20 bg-primary/5" : ""
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {iconForType(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{n.title}</p>
                      <Badge variant="secondary" className={badgeForType(n.type)}>
                        {n.type.replace(/_/g, " ")}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {n.message}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {new Date(n.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {!n.isRead && (
                    <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
