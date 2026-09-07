"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Pencil, Trash2, Plus, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

interface Record {
  id: string;
  semester: string;
  gpa: number;
  attendanceRate: number;
  studyHours: number;
  assignmentAverage: number | null;
  testAverage: number | null;
  libraryVisits: number | null;
  classParticipation: number | null;
}

export function PerformanceRecords({
  studentId,
  records,
}: {
  studentId: string;
  records: Record[];
}) {
  const router = useRouter();
  const [addOpen, setAddOpen] = useState(false);
  const [editRecord, setEditRecord] = useState<Record | null>(null);
  const [deleteRecord, setDeleteRecord] = useState<Record | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [semester, setSemester] = useState("");
  const [gpa, setGpa] = useState("");
  const [attendanceRate, setAttendanceRate] = useState("");
  const [studyHours, setStudyHours] = useState("");
  const [assignmentAverage, setAssignmentAverage] = useState("");
  const [testAverage, setTestAverage] = useState("");
  const [libraryVisits, setLibraryVisits] = useState("");
  const [classParticipation, setClassParticipation] = useState("");

  function resetForm() {
    setSemester("");
    setGpa("");
    setAttendanceRate("");
    setStudyHours("");
    setAssignmentAverage("");
    setTestAverage("");
    setLibraryVisits("");
    setClassParticipation("");
  }

  function openAdd() {
    resetForm();
    setAddOpen(true);
  }

  function openEdit(record: Record) {
    setEditRecord(record);
    setSemester(record.semester);
    setGpa(record.gpa.toString());
    setAttendanceRate(record.attendanceRate.toString());
    setStudyHours(record.studyHours.toString());
    setAssignmentAverage(record.assignmentAverage?.toString() || "");
    setTestAverage(record.testAverage?.toString() || "");
    setLibraryVisits(record.libraryVisits?.toString() || "");
    setClassParticipation(record.classParticipation?.toString() || "");
  }

  async function handleAdd() {
    if (!semester || !gpa || !attendanceRate || !studyHours) {
      toast.error("All fields are required");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/students/${studentId}/records`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          semester,
          gpa: parseFloat(gpa),
          attendanceRate: parseFloat(attendanceRate),
          studyHours: parseFloat(studyHours),
          assignmentAverage: assignmentAverage ? parseFloat(assignmentAverage) : null,
          testAverage: testAverage ? parseFloat(testAverage) : null,
          libraryVisits: libraryVisits ? parseInt(libraryVisits) : null,
          classParticipation: classParticipation ? parseFloat(classParticipation) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Failed", { description: data.error });
        setSaving(false);
        return;
      }
      toast.success("Record Added", { description: `${semester} performance record created` });
      setAddOpen(false);
      resetForm();
      router.refresh();
    } catch {
      toast.error("Network Error");
    }
    setSaving(false);
  }

  async function handleEdit() {
    if (!editRecord) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/students/${studentId}/records/${editRecord.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          semester,
          gpa: parseFloat(gpa),
          attendanceRate: parseFloat(attendanceRate),
          studyHours: parseFloat(studyHours),
          assignmentAverage: assignmentAverage ? parseFloat(assignmentAverage) : null,
          testAverage: testAverage ? parseFloat(testAverage) : null,
          libraryVisits: libraryVisits ? parseInt(libraryVisits) : null,
          classParticipation: classParticipation ? parseFloat(classParticipation) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Failed", { description: data.error });
        setSaving(false);
        return;
      }
      toast.success("Record Updated", { description: `${semester} updated` });
      setEditRecord(null);
      resetForm();
      router.refresh();
    } catch {
      toast.error("Network Error");
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!deleteRecord) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/students/${studentId}/records/${deleteRecord.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error("Failed", { description: data.error });
        setDeleting(false);
        return;
      }
      toast.success("Record Deleted", { description: `${deleteRecord.semester} removed` });
      setDeleteRecord(null);
      router.refresh();
    } catch {
      toast.error("Network Error");
    }
    setDeleting(false);
  }

  return (
    <>
      {/* Add button + record list with edit/delete */}
      <div className="space-y-3">
        <div className="flex justify-end">
          <Button size="sm" variant="outline" onClick={openAdd}>
            <Plus className="mr-2 h-4 w-4" />
            Add Record
          </Button>
        </div>

        {records.length > 0 && (
          <div className="space-y-1">
            {records.map((record, i) => (
              <div key={record.id}>
                <div className="flex items-center justify-between py-2">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{record.semester}</p>
                    <p className="text-xs text-muted-foreground">
                      GPA: {record.gpa.toFixed(2)} · Attendance: {record.attendanceRate.toFixed(0)}% · Study: {record.studyHours.toFixed(0)} hrs
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => openEdit(record)}
                      className="h-7 w-7 p-0"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeleteRecord(record)}
                      className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                {i < records.length - 1 && <div className="border-b" />}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Performance Record</DialogTitle>
            <DialogDescription>Add a new semester record for this student</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <RecordForm
              semester={semester} setSemester={setSemester}
              gpa={gpa} setGpa={setGpa}
              attendanceRate={attendanceRate} setAttendanceRate={setAttendanceRate}
              studyHours={studyHours} setStudyHours={setStudyHours}
              assignmentAverage={assignmentAverage} setAssignmentAverage={setAssignmentAverage}
              testAverage={testAverage} setTestAverage={setTestAverage}
              libraryVisits={libraryVisits} setLibraryVisits={setLibraryVisits}
              classParticipation={classParticipation} setClassParticipation={setClassParticipation}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)} disabled={saving}>Cancel</Button>
            <Button onClick={handleAdd} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editRecord} onOpenChange={(v) => !v && setEditRecord(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Performance Record</DialogTitle>
            <DialogDescription>Update semester record details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <RecordForm
              semester={semester} setSemester={setSemester}
              gpa={gpa} setGpa={setGpa}
              attendanceRate={attendanceRate} setAttendanceRate={setAttendanceRate}
              studyHours={studyHours} setStudyHours={setStudyHours}
              assignmentAverage={assignmentAverage} setAssignmentAverage={setAssignmentAverage}
              testAverage={testAverage} setTestAverage={setTestAverage}
              libraryVisits={libraryVisits} setLibraryVisits={setLibraryVisits}
              classParticipation={classParticipation} setClassParticipation={setClassParticipation}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditRecord(null)} disabled={saving}>Cancel</Button>
            <Button onClick={handleEdit} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Update Record
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={!!deleteRecord} onOpenChange={(v) => !v && setDeleteRecord(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Record</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the {deleteRecord?.semester} record? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteRecord(null)} disabled={deleting}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function RecordForm({
  semester, setSemester,
  gpa, setGpa,
  attendanceRate, setAttendanceRate,
  studyHours, setStudyHours,
  assignmentAverage, setAssignmentAverage,
  testAverage, setTestAverage,
  libraryVisits, setLibraryVisits,
  classParticipation, setClassParticipation,
}: {
  semester: string; setSemester: (v: string) => void;
  gpa: string; setGpa: (v: string) => void;
  attendanceRate: string; setAttendanceRate: (v: string) => void;
  studyHours: string; setStudyHours: (v: string) => void;
  assignmentAverage: string; setAssignmentAverage: (v: string) => void;
  testAverage: string; setTestAverage: (v: string) => void;
  libraryVisits: string; setLibraryVisits: (v: string) => void;
  classParticipation: string; setClassParticipation: (v: string) => void;
}) {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="semester">Semester</Label>
        <Input
          id="semester"
          placeholder="e.g. 2025/2026-1"
          value={semester}
          onChange={(e) => setSemester(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-2">
          <Label htmlFor="gpa">GPA (0-5.0)</Label>
          <Input id="gpa" type="number" step="0.01" min="0" max="5" placeholder="3.50" value={gpa} onChange={(e) => setGpa(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="attendance">Attendance %</Label>
          <Input id="attendance" type="number" min="0" max="100" placeholder="85" value={attendanceRate} onChange={(e) => setAttendanceRate(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="study">Study hrs/wk</Label>
          <Input id="study" type="number" min="0" step="0.5" placeholder="12" value={studyHours} onChange={(e) => setStudyHours(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="assignment">Assignment Avg %</Label>
          <Input id="assignment" type="number" min="0" max="100" placeholder="80" value={assignmentAverage} onChange={(e) => setAssignmentAverage(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="test">Test Avg %</Label>
          <Input id="test" type="number" min="0" max="100" placeholder="75" value={testAverage} onChange={(e) => setTestAverage(e.target.value)} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="library">Library Visits/sem</Label>
          <Input id="library" type="number" min="0" placeholder="8" value={libraryVisits} onChange={(e) => setLibraryVisits(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="participation">Class Participation (0-10)</Label>
          <Input id="participation" type="number" min="0" max="10" step="0.5" placeholder="7" value={classParticipation} onChange={(e) => setClassParticipation(e.target.value)} />
        </div>
      </div>
    </>
  );
}
