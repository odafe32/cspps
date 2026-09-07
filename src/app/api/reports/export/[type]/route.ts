import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSession } from "@/lib/auth/session";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ type: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { type } = await params;
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "csv";

    let data: Record<string, unknown>[] = [];
    let filename = "report";
    let reportTitle = "Report";

    if (type === "students") {
      reportTitle = "Student Performance Report";
      const students = await prisma.student.findMany({
        include: {
          user: true,
          performanceRecords: { orderBy: { createdAt: "desc" }, take: 1 },
          predictions: { orderBy: { createdAt: "desc" }, take: 1 },
        },
        orderBy: { user: { firstName: "asc" } },
      });
      data = students.map((s) => ({
        "Student Number": s.studentNumber,
        "First Name": s.user.firstName,
        "Last Name": s.user.lastName,
        "Email": s.user.email,
        "Semester": s.performanceRecords[0]?.semester || "N/A",
        "Current GPA": s.performanceRecords[0]?.gpa.toFixed(2) || "N/A",
        "Attendance %": s.performanceRecords[0]?.attendanceRate.toFixed(0) || "N/A",
        "Study Hours": s.performanceRecords[0]?.studyHours.toFixed(0) || "N/A",
        "Assignment Avg": s.performanceRecords[0]?.assignmentAverage?.toFixed(0) || "N/A",
        "Test Avg": s.performanceRecords[0]?.testAverage?.toFixed(0) || "N/A",
        "Library Visits": s.performanceRecords[0]?.libraryVisits ?? "N/A",
        "Class Participation": s.performanceRecords[0]?.classParticipation?.toFixed(1) || "N/A",
        "Predicted GPA": s.predictions[0]?.predictedGpa.toFixed(2) || "N/A",
        "Risk Level": s.predictions[0]?.riskLevel || "Not Predicted",
        "Confidence": s.predictions[0]?.confidenceScore ? `${(s.predictions[0].confidenceScore * 100).toFixed(0)}%` : "N/A",
      }));
      filename = "student-performance-report";
    } else if (type === "predictions") {
      reportTitle = "Prediction Report";
      const predictions = await prisma.prediction.findMany({
        include: { student: { include: { user: true, performanceRecords: { orderBy: { createdAt: "desc" }, take: 1 } } } },
        orderBy: { createdAt: "desc" },
      });
      data = predictions.map((p) => ({
        "Student Number": p.student.studentNumber,
        "Student Name": `${p.student.user.firstName} ${p.student.user.lastName}`,
        "Current GPA": p.student.performanceRecords[0]?.gpa.toFixed(2) || "N/A",
        "Predicted GPA": p.predictedGpa.toFixed(2),
        "Risk Level": p.riskLevel,
        "Model Used": p.modelUsed,
        "Confidence": p.confidenceScore ? `${(p.confidenceScore * 100).toFixed(0)}%` : "N/A",
        "Prediction Date": new Date(p.predictionDate).toLocaleDateString(),
      }));
      filename = "prediction-report";
    } else if (type === "at-risk") {
      reportTitle = "At-Risk Students Report";
      const students = await prisma.student.findMany({
        where: { predictions: { some: { riskLevel: "HIGH" } } },
        include: {
          user: true,
          performanceRecords: { orderBy: { createdAt: "desc" }, take: 1 },
          predictions: { orderBy: { createdAt: "desc" }, take: 1 },
        },
      });
      data = students.map((s) => {
        const gpa = s.predictions[0]?.predictedGpa || 0;
        const attendance = s.performanceRecords[0]?.attendanceRate || 0;
        const recommendations: string[] = [];
        if (gpa < 2.0) recommendations.push("Mandatory academic advising");
        if (attendance < 60) recommendations.push("Attendance improvement plan");
        if (gpa < 1.5) recommendations.push("Consider counseling services");
        recommendations.push("Schedule follow-up meeting within 2 weeks");

        return {
          "Student Number": s.studentNumber,
          "Name": `${s.user.firstName} ${s.user.lastName}`,
          "Email": s.user.email,
          "Current GPA": s.performanceRecords[0]?.gpa.toFixed(2) || "N/A",
          "Predicted GPA": s.predictions[0]?.predictedGpa.toFixed(2) || "N/A",
          "Attendance %": s.performanceRecords[0]?.attendanceRate.toFixed(0) || "N/A",
          "Study Hours": s.performanceRecords[0]?.studyHours.toFixed(0) || "N/A",
          "Risk Level": s.predictions[0]?.riskLevel || "N/A",
          "Confidence": s.predictions[0]?.confidenceScore ? `${(s.predictions[0].confidenceScore * 100).toFixed(0)}%` : "N/A",
          "Recommendations": recommendations.join("; "),
        };
      });
      filename = "at-risk-students-report";
    } else {
      return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
    }

    if (data.length === 0) {
      return NextResponse.json({ error: "No data to export" }, { status: 404 });
    }

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: session.userId,
        action: "EXPORT_REPORT",
        description: `Exported ${type} report as ${format.toUpperCase()}`,
      },
    });

    if (format === "pdf") {
      const doc = new jsPDF({ orientation: "landscape" });
      const headers = Object.keys(data[0]);
      const rows = data.map((row) => headers.map((h) => String(row[h] ?? "")));

      // Title
      doc.setFontSize(16);
      doc.setTextColor(30, 64, 175);
      doc.text(`CSPPS — ${reportTitle}`, 14, 18);

      // Meta info
      doc.setFontSize(9);
      doc.setTextColor(100, 100, 100);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 25);
      doc.text(`Total Records: ${data.length}`, 14, 30);
      doc.text(`Generated by: ${session.firstName} ${session.lastName}`, 14, 35);

      // Table
      autoTable(doc, {
        head: [headers],
        body: rows,
        startY: 40,
        styles: { fontSize: 7, cellPadding: 2 },
        headStyles: { fillColor: [30, 64, 175], textColor: 255, fontSize: 7 },
        alternateRowStyles: { fillColor: [245, 245, 245] },
        margin: { left: 14, right: 14 },
      });

      // Footer
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
          "CSPPS — Comprehensive Student Performance Prediction System | Implementation: Godfrey Joseph",
          14,
          doc.internal.pageSize.height - 8
        );
        doc.text(
          `Page ${i} of ${pageCount}`,
          doc.internal.pageSize.width - 30,
          doc.internal.pageSize.height - 8
        );
      }

      const pdfBuffer = doc.output("arraybuffer");

      return new NextResponse(pdfBuffer, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="${filename}.pdf"`,
        },
      });
    }

    // Default: CSV
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(","),
      ...data.map((row) =>
        headers.map((h) => {
          const val = String(row[h] ?? "");
          return `"${val.replace(/"/g, '""')}"`;
        }).join(",")
      ),
    ];
    const csv = csvRows.join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}.csv"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Failed to export report" }, { status: 500 });
  }
}
