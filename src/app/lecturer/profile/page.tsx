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
import { Mail, Calendar, BookOpen, Pencil } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";

export default async function ProfilePage() {
  const session = await getSession();

  if (!session) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      lecturer: true,
      activityLogs: {
        take: 5,
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">My Profile</h2>
          <p className="text-sm text-muted-foreground">
            View your account information
          </p>
        </div>
        <Link href="/lecturer/profile/edit">
          <Button variant="outline" size="sm">
            <Pencil className="mr-2 h-4 w-4" />
            Edit Profile
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Profile info */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-xl font-medium text-primary">
                {user.firstName[0]}
                {user.lastName[0]}
              </div>
              <div>
                <CardTitle>
                  {user.firstName} {user.lastName}
                </CardTitle>
                <CardDescription>Lecturer Account</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{user.email}</span>
            </div>
            {user.lecturer?.department && (
              <div className="flex items-center gap-3 text-sm">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <span>{user.lecturer.department}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                Joined {new Date(user.createdAt).toLocaleDateString()}
              </span>
            </div>
            <div>
              <Badge variant="secondary">Lecturer</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Recent activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest actions</CardDescription>
          </CardHeader>
          <CardContent>
            {user.activityLogs.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent activity</p>
            ) : (
              <div className="space-y-3">
                {user.activityLogs.map((log) => (
                  <div key={log.id} className="flex items-start gap-3 text-sm">
                    <div className="mt-1.5 h-2 w-2 rounded-full bg-primary/60" />
                    <div className="flex-1">
                      <p>{log.description || log.action}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(log.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
