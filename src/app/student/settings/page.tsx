"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { GraduationCap, Calendar, Shield } from "lucide-react";
import { ProfileSection } from "@/components/settings/profile-section";

export default function StudentSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-sm text-muted-foreground">
          Manage your account and preferences
        </p>
      </div>

      {/* Profile + Password */}
      <ProfileSection />

      {/* Student info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-muted-foreground" />
            Student Information
          </CardTitle>
          <CardDescription>Your enrollment details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Role:</span>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400">
                Student
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">GPA Scale:</span>
              <span className="font-medium">5.0</span>
            </div>
          </div>
          <Separator />
          <p className="text-xs text-muted-foreground">
            CSPPS — Comprehensive Student Performance Prediction System
          </p>
          <p className="text-xs text-muted-foreground">
            Implementation: Godfrey Joseph
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
