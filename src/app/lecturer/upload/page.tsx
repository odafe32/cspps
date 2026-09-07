"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Papa from "papaparse";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Upload, FileText, CheckCircle, XCircle, Loader2, TrendingUp, ArrowRight } from "lucide-react";
import { toast } from "sonner";

interface ParsedRow {
  studentNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  semester: string;
  gpa: string;
  attendanceRate: string;
  studyHours: string;
  assignmentAverage?: string;
  testAverage?: string;
  libraryVisits?: string;
  classParticipation?: string;
}

export default function UploadPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<ParsedRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [parsed, setParsed] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [uploadResult, setUploadResult] = useState<{ total: number; created: number; updated: number } | null>(null);

  const requiredColumns = [
    "studentNumber",
    "firstName",
    "lastName",
    "semester",
    "gpa",
    "attendanceRate",
    "studyHours",
  ];

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setParsed(false);
    setData([]);
    setErrors([]);

    Papa.parse<ParsedRow>(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const newErrors: string[] = [];

        // Check columns
        const columns = results.meta.fields || [];
        const missing = requiredColumns.filter((c) => !columns.includes(c));
        if (missing.length > 0) {
          newErrors.push(`Missing columns: ${missing.join(", ")}`);
        }

        // Validate rows
        results.data.forEach((row, i) => {
          if (!row.studentNumber) newErrors.push(`Row ${i + 2}: Missing studentNumber`);
          if (!row.firstName) newErrors.push(`Row ${i + 2}: Missing firstName`);
          if (!row.lastName) newErrors.push(`Row ${i + 2}: Missing lastName`);
          if (!row.semester) newErrors.push(`Row ${i + 2}: Missing semester`);

          const gpa = parseFloat(row.gpa);
          if (isNaN(gpa) || gpa < 0 || gpa > 5.0)
            newErrors.push(`Row ${i + 2}: Invalid GPA (must be 0-5.0)`);

          const attendance = parseFloat(row.attendanceRate);
          if (isNaN(attendance) || attendance < 0 || attendance > 100)
            newErrors.push(`Row ${i + 2}: Invalid attendance (must be 0-100)`);

          const study = parseFloat(row.studyHours);
          if (isNaN(study) || study < 0)
            newErrors.push(`Row ${i + 2}: Invalid study hours`);
        });

        setErrors(newErrors);
        setData(results.data);
        setParsed(true);

        if (newErrors.length === 0) {
          toast.success("File Validated", {
            description: `${results.data.length} rows ready to upload`,
          });
        } else {
          toast.warning("Validation Issues", {
            description: `${newErrors.length} errors found`,
          });
        }
      },
      error: (err) => {
        toast.error("Parse Error", { description: err.message });
      },
    });
  }

  async function handleUpload() {
    if (errors.length > 0) {
      toast.error("Cannot Upload", { description: "Fix validation errors first" });
      return;
    }

    setUploading(true);

    try {
      const res = await fetch("/api/performance/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data }),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error("Upload Failed", { description: result.error });
        setUploading(false);
        return;
      }

      toast.success("Upload Successful", {
        description: `${result.total} records (${result.created} new, ${result.updated} updated)`,
      });
      setUploadResult({ total: result.total, created: result.created, updated: result.updated });
      setUploaded(true);
      router.refresh();
    } catch {
      toast.error("Network Error", {
        description: "Failed to upload data",
      });
      setUploading(false);
    }
  }

  function handleReset() {
    setFile(null);
    setData([]);
    setErrors([]);
    setParsed(false);
    if (fileInputRef) fileInputRef.current?.click();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Upload Student Data</h2>
        <p className="text-sm text-muted-foreground">
          Upload a CSV file with student performance records (5.0 GPA scale)
        </p>
      </div>

      {/* Upload zone */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-muted-foreground" />
            Select CSV File
          </CardTitle>
          <CardDescription>
            Required: studentNumber, firstName, lastName, semester, gpa,
            attendanceRate, studyHours. Optional: email, assignmentAverage,
            testAverage, libraryVisits, classParticipation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-4 rounded-lg border-2 border-dashed border-zinc-200 p-8 dark:border-zinc-800">
            {file ? (
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-50 dark:bg-green-950">
                  <FileText className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-sm font-medium">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
                <Button variant="outline" size="sm" onClick={handleReset}>
                  Choose Different File
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">
                  Click to select a CSV file
                </p>
                <label className="cursor-pointer">
                  <Button type="button" onClick={() => fileInputRef.current?.click()}>
                    Choose File
                  </Button>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </label>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Upload success banner */}
      {uploaded && uploadResult && (
        <Card className="border-green-200 dark:border-green-900">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50 dark:bg-green-950">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Upload Successful!</p>
                  <p className="text-xs text-muted-foreground">
                    {uploadResult.total} records processed ({uploadResult.created} new students, {uploadResult.updated} updated)
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Link href="/lecturer/students">
                  <Button variant="outline" size="sm">
                    View Students
                  </Button>
                </Link>
                <Link href="/lecturer/predictions?scope=unpredicted">
                  <Button size="sm">
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Run Prediction
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validation errors */}
      {parsed && errors.length > 0 && (
        <Card className="border-destructive/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              Validation Errors ({errors.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1 text-sm text-destructive">
              {errors.slice(0, 10).map((err, i) => (
                <li key={i}>• {err}</li>
              ))}
              {errors.length > 10 && (
                <li className="text-muted-foreground">
                  ...and {errors.length - 10} more errors
                </li>
              )}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Preview table */}
      {parsed && data.length > 0 && errors.length === 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  Preview ({data.length} rows)
                </CardTitle>
                <CardDescription>
                  Review the data before uploading
                </CardDescription>
              </div>
              <Button onClick={handleUpload} disabled={uploading}>
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Confirm & Upload
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student #</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Semester</TableHead>
                    <TableHead>GPA</TableHead>
                    <TableHead>Att %</TableHead>
                    <TableHead>Study</TableHead>
                    <TableHead>Test</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.slice(0, 10).map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">
                        {row.studentNumber}
                      </TableCell>
                      <TableCell>{row.firstName} {row.lastName}</TableCell>
                      <TableCell>{row.semester}</TableCell>
                      <TableCell>{row.gpa}</TableCell>
                      <TableCell>{row.attendanceRate}%</TableCell>
                      <TableCell>{row.studyHours}h</TableCell>
                      <TableCell>{row.testAverage || "N/A"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {data.length > 10 && (
                <p className="mt-3 text-center text-xs text-muted-foreground">
                  Showing 10 of {data.length} rows
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* CSV template */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">CSV Template</CardTitle>
          <CardDescription>Copy this format for your file</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="rounded-lg bg-muted p-4 text-xs overflow-x-auto">
{`studentNumber,firstName,lastName,email,semester,gpa,attendanceRate,studyHours,assignmentAverage,testAverage,libraryVisits,classParticipation
STU101,Chidi,Okafor,chidi@cspps.edu,2025/2026-1,4.50,92,18,88,85,15,9
STU102,Fatima,Bello,fatima@cspps.edu,2025/2026-1,3.20,78,10,72,68,6,6
STU103,Emeka,Nwosu,emeka@cspps.edu,2025/2026-1,1.80,55,5,48,42,2,3`}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
