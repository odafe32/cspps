"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GraduationCap, Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

interface FieldErrors {
  email?: string;
  password?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);

  function validate(): boolean {
    const newErrors: FieldErrors = {};

    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerError("");

    if (!validate()) return;

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMsg = data.error || "Login failed. Please try again.";
        setServerError(errorMsg);
        toast.error("Login Failed", { description: errorMsg });
        setLoading(false);
        return;
      }

      // Redirect based on role
      const redirectMap: Record<string, string> = {
        ADMIN: "/admin/dashboard",
        LECTURER: "/lecturer/dashboard",
        STUDENT: "/student/dashboard",
      };

      const roleLabel: Record<string, string> = {
        ADMIN: "Administrator",
        LECTURER: "Lecturer",
        STUDENT: "Student",
      };

      toast.success("Welcome back!", {
        description: `Signed in as ${roleLabel[data.role]}`,
      });

      router.push(redirectMap[data.role] || "/login");
      router.refresh();
    } catch {
      const errorMsg = "Network error. Please check your connection and try again.";
      setServerError(errorMsg);
      toast.error("Connection Error", { description: errorMsg });
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-zinc-50 to-zinc-100 px-4 dark:from-zinc-950 dark:to-zinc-900">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <GraduationCap className="h-7 w-7 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold tracking-tight">
              CSPPS
            </CardTitle>
            <CardDescription className="mt-1">
              Comprehensive Student Performance Prediction System
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) setErrors({ ...errors, email: undefined });
                  }}
                  disabled={loading}
                  className={`pl-10 ${errors.email ? "border-destructive" : ""}`}
                  autoComplete="email"
                  autoFocus
                />
              </div>
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email}</p>
              )}
            </div>

            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors({ ...errors, password: undefined });
                  }}
                  disabled={loading}
                  className={`pl-10 pr-10 ${errors.password ? "border-destructive" : ""}`}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive">{errors.password}</p>
              )}
            </div>

            {/* Server error */}
            {serverError && (
              <div className="rounded-md border border-destructive/20 bg-destructive/5 px-4 py-3">
                <p className="text-sm text-destructive">{serverError}</p>
              </div>
            )}

            {/* Submit */}
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          {/* Test accounts */}
          <div className="mt-6 rounded-lg border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="mb-2 text-xs font-semibold text-muted-foreground">
              Test Accounts
            </p>
            <div className="space-y-1 text-xs text-muted-foreground">
              <p>
                <span className="font-medium text-foreground">Admin:</span>{" "}
                admin@cspps.edu / admin123
              </p>
              <p>
                <span className="font-medium text-foreground">Lecturer:</span>{" "}
                lecturer@cspps.edu / lecturer123
              </p>
              <p>
                <span className="font-medium text-foreground">Student:</span>{" "}
                student@cspps.edu / student123
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
