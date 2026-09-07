"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Menu, X, LogOut, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/dashboard/notification-bell";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function DashboardShell({
  sidebar,
  userName,
  role,
  children,
}: {
  sidebar: React.ReactNode;
  userName: string;
  role: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast.success("Logged Out", {
        description: "You have been successfully logged out.",
      });
      router.push("/login");
      router.refresh();
    } catch {
      toast.error("Logout Failed", {
        description: "Something went wrong. Please try again.",
      });
      setLoggingOut(false);
      setLogoutOpen(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Desktop sidebar - fixed */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900 md:flex">
        <div className="flex h-16 items-center gap-2 border-b border-zinc-200 px-6 dark:border-zinc-800">
          <GraduationCap className="h-6 w-6 text-primary" />
          <span className="font-semibold">CSPPS</span>
        </div>
        <nav className="flex-1 overflow-y-auto p-4">{sidebar}</nav>
        <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
          <p className="truncate text-sm font-medium">{userName}</p>
          <p className="text-xs text-muted-foreground">{role}</p>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-zinc-200 bg-white transition-transform duration-200 dark:border-zinc-800 dark:bg-zinc-900 md:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-zinc-200 px-6 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            <span className="font-semibold">CSPPS</span>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav
          className="flex-1 overflow-y-auto p-4"
          onClick={() => setMobileOpen(false)}
        >
          {sidebar}
        </nav>
        <div className="border-t border-zinc-200 p-4 dark:border-zinc-800">
          <p className="truncate text-sm font-medium">{userName}</p>
          <p className="text-xs text-muted-foreground">{role}</p>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex min-h-screen flex-col md:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-zinc-200 bg-white px-4 dark:border-zinc-800 dark:bg-zinc-900 md:px-6">
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen(true)}
              className="text-muted-foreground hover:text-foreground md:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-lg font-semibold">CSPPS</h1>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLogoutOpen(true)}
              className="text-muted-foreground hover:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 md:p-6">{children}</main>
      </div>

      {/* Logout confirmation modal */}
      <Dialog open={logoutOpen} onOpenChange={setLogoutOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Logout</DialogTitle>
            <DialogDescription>
              Are you sure you want to log out of CSPPS? You will need to sign
              in again to access your dashboard.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setLogoutOpen(false)}
              disabled={loggingOut}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleLogout}
              disabled={loggingOut}
            >
              {loggingOut ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Logging out...
                </>
              ) : (
                <>
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
