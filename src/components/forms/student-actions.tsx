"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, KeyRound, Ban, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface StudentActionsProps {
  studentId: string;
  studentName: string;
  email: string;
  isActive: boolean;
}

export function StudentActions({
  studentId,
  studentName,
  email,
  isActive,
}: StudentActionsProps) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [editForm, setEditForm] = useState({
    firstName: studentName.split(" ")[0] || "",
    lastName: studentName.split(" ").slice(1).join(" ") || "",
    email,
  });

  const [newPassword, setNewPassword] = useState("");

  async function handleEdit() {
    setLoading(true);
    try {
      const res = await fetch(`/api/students/${studentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Failed to Update", { description: data.error });
        setLoading(false);
        return;
      }
      toast.success("Student Updated", { description: `${studentName} has been updated` });
      setEditOpen(false);
      router.refresh();
    } catch {
      toast.error("Network Error");
    }
    setLoading(false);
  }

  async function handlePasswordReset() {
    if (newPassword.length < 6) {
      toast.error("Password too short", { description: "Minimum 6 characters" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/students/${studentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Failed", { description: data.error });
        setLoading(false);
        return;
      }
      toast.success("Password Reset", { description: `New password set for ${studentName}` });
      setPasswordOpen(false);
      setNewPassword("");
    } catch {
      toast.error("Network Error");
    }
    setLoading(false);
  }

  async function handleToggleStatus() {
    setLoading(true);
    try {
      const res = await fetch(`/api/students/${studentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !isActive }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Failed", { description: data.error });
        setLoading(false);
        return;
      }
      toast.success(isActive ? "Student Suspended" : "Student Activated", {
        description: `${studentName} has been ${isActive ? "suspended" : "activated"}`,
      });
      setSuspendOpen(false);
      router.refresh();
    } catch {
      toast.error("Network Error");
    }
    setLoading(false);
  }

  async function handleDelete() {
    setLoading(true);
    try {
      const res = await fetch(`/api/students/${studentId}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Failed", { description: data.error });
        setLoading(false);
        return;
      }
      toast.success("Student Deleted", { description: `${studentName} has been removed` });
      setDeleteOpen(false);
      router.refresh();
    } catch {
      toast.error("Network Error");
    }
    setLoading(false);
  }

  return (
    <>
      <div className="flex justify-end gap-1">
        {!isActive && (
          <Badge variant="secondary" className="mr-2 bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400">
            Suspended
          </Badge>
        )}
        <Button variant="ghost" size="sm" onClick={() => setEditOpen(true)} title="Edit">
          <Pencil className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={() => setPasswordOpen(true)} title="Reset Password">
          <KeyRound className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSuspendOpen(true)}
          title={isActive ? "Suspend" : "Activate"}
          className={isActive ? "text-muted-foreground hover:text-amber-600" : "text-muted-foreground hover:text-green-600"}
        >
          {isActive ? <Ban className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setDeleteOpen(true)}
          title="Delete"
          className="text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Student</DialogTitle>
            <DialogDescription>Update account information</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input value={editForm.firstName} onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input value={editForm.lastName} onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setEditOpen(false)} disabled={loading}>Cancel</Button>
            <Button onClick={handleEdit} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password Reset Dialog */}
      <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>Set a new password for {studentName}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>New Password</Label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimum 6 characters"
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setPasswordOpen(false)} disabled={loading}>Cancel</Button>
            <Button onClick={handlePasswordReset} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <KeyRound className="mr-2 h-4 w-4" />}
              Reset Password
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Suspend/Activate Dialog */}
      <Dialog open={suspendOpen} onOpenChange={setSuspendOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isActive ? "Suspend Student" : "Activate Student"}</DialogTitle>
            <DialogDescription>
              {isActive
                ? `${studentName} will not be able to log in until reactivated.`
                : `${studentName} will be able to log in again.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setSuspendOpen(false)} disabled={loading}>Cancel</Button>
            <Button
              variant={isActive ? "destructive" : "default"}
              onClick={handleToggleStatus}
              disabled={loading}
            >
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : isActive ? <Ban className="mr-2 h-4 w-4" /> : <CheckCircle className="mr-2 h-4 w-4" />}
              {isActive ? "Suspend" : "Activate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Student</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {studentName}? This will permanently remove the account, all performance records, and predictions. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteOpen(false)} disabled={loading}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
