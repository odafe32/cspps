"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Save, Loader2, KeyRound, User, Mail, Calendar, Shield } from "lucide-react";
import { toast } from "sonner";

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  department: string;
  studentNumber: string;
  isActive: boolean;
  createdAt: string;
}

export function ProfileSection() {
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    department: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch("/api/profile");
        if (!res.ok) return;
        const data: ProfileData = await res.json();
        setProfile(data);
        setForm({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          department: data.department || "",
        });
      } catch {
        // silent
      }
      setFetching(false);
    }
    fetchProfile();
  }, []);

  function updateForm(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updatePasswordForm(key: string, value: string) {
    setPasswordForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Failed to Update", { description: data.error });
        setLoading(false);
        return;
      }
      toast.success("Profile Updated", { description: "Your profile has been updated" });
    } catch {
      toast.error("Network Error");
    }
    setLoading(false);
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Passwords Don't Match", { description: "New password and confirmation must match" });
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error("Password Too Short", { description: "Minimum 6 characters" });
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Failed", { description: data.error });
        setPasswordLoading(false);
        return;
      }
      toast.success("Password Changed", { description: "Your password has been updated" });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch {
      toast.error("Network Error");
    }
    setPasswordLoading(false);
  }

  if (fetching) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (!profile) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Failed to load profile
        </CardContent>
      </Card>
    );
  }

  const roleBadge = (role: string) => {
    const styles: Record<string, string> = {
      ADMIN: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400",
      LECTURER: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400",
      STUDENT: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
    };
    return styles[role] || "bg-muted text-muted-foreground";
  };

  return (
    <>
      {/* Profile info card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-muted-foreground" />
            My Profile
          </CardTitle>
          <CardDescription>View and update your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Summary */}
          <div className="flex items-center gap-4 rounded-lg border bg-muted/30 p-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
              {profile.firstName[0]}
              {profile.lastName[0]}
            </div>
            <div className="flex-1">
              <p className="font-semibold">{profile.firstName} {profile.lastName}</p>
              <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {profile.email}
                </span>
                <span className="flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  <Badge variant="secondary" className={roleBadge(profile.role)}>
                    {profile.role}
                  </Badge>
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Joined {new Date(profile.createdAt).toLocaleDateString()}
                </span>
                {profile.studentNumber && (
                  <span>Student No: {profile.studentNumber}</span>
                )}
                {profile.department && (
                  <span>Dept: {profile.department}</span>
                )}
              </div>
            </div>
            <div>
              {profile.isActive ? (
                <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400">
                  Active
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400">
                  Suspended
                </Badge>
              )}
            </div>
          </div>

          <Separator />

          {/* Edit form */}
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="profile-firstName">First Name</Label>
                <Input id="profile-firstName" value={form.firstName} onChange={(e) => updateForm("firstName", e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="profile-lastName">Last Name</Label>
                <Input id="profile-lastName" value={form.lastName} onChange={(e) => updateForm("lastName", e.target.value)} required />
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="profile-email">Email</Label>
                <Input id="profile-email" type="email" value={form.email} onChange={(e) => updateForm("email", e.target.value)} required />
              </div>
              {profile.role === "LECTURER" && (
                <div className="space-y-2">
                  <Label htmlFor="profile-department">Department</Label>
                  <Input id="profile-department" value={form.department} onChange={(e) => updateForm("department", e.target.value)} placeholder="e.g. Computer Science" />
                </div>
              )}
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Profile
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Change password card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-muted-foreground" />
            Change Password
          </CardTitle>
          <CardDescription>Update your account password</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => updatePasswordForm("currentPassword", e.target.value)}
                required
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) => updatePasswordForm("newPassword", e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">Minimum 6 characters</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) => updatePasswordForm("confirmPassword", e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" disabled={passwordLoading}>
                {passwordLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Changing...
                  </>
                ) : (
                  <>
                    <KeyRound className="mr-2 h-4 w-4" />
                    Change Password
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
