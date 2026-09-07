"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  FileText,
  Settings,
  Activity,
  Loader2,
  Upload,
  TrendingUp,
} from "lucide-react";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/students", label: "Students", icon: GraduationCap },
  { href: "/admin/upload", label: "Upload Data", icon: Upload },
  { href: "/admin/predictions", label: "Predictions", icon: TrendingUp },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/lecturers", label: "Lecturers", icon: BookOpen },
  { href: "/admin/reports", label: "Reports", icon: FileText },
  { href: "/admin/activity-logs", label: "Activity Logs", icon: Activity },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [loadingHref, setLoadingHref] = useState<string | null>(null);

  useEffect(() => {
    setLoadingHref(null);
  }, [pathname]);

  function handleClick(href: string) {
    if (pathname !== href && !pathname.startsWith(href + "/")) {
      setLoadingHref(href);
    }
  }

  return (
    <ul className="space-y-1">
      {navItems.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(item.href + "/");
        const isLoading = loadingHref === item.href;
        const Icon = item.icon;
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={() => handleClick(item.href)}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${
                active
                  ? "bg-primary/10 font-medium text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Icon className="h-4 w-4" />
              )}
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
