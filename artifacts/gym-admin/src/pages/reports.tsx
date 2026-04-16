import { useState } from "react";
import {
  useGetDashboardStats, useGetRevenueChart, useGetAttendanceReport,
  useListMembers, useListBilling, useGetFinancialReport, useGetMemberReport,
  useGetBusinessSettings,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from "recharts";
import {
  FileBarChart, Users, DollarSign, CalendarCheck, Download, TrendingUp,
  FileText, CreditCard, Activity,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

const PRIMARY = "#E31C25";
const COLORS = ["#E31C25", "#22c55e", "#3b82f6", "#f59e0b", "#8b5cf6", "#06b6d4"];

// ── PDF helpers ─────────────────────────────────────────────────────────
function addPdfHeader(doc: jsPDF, gymName: string, reportTitle: string, subtitle?: string) {
  const pw = doc.internal.pageSize.getWidth();
  doc.setFillColor(227, 28, 37);
  doc.rect(0, 0, pw, 32, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(gymName, 14, 13);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(reportTitle, 14, 23);
  doc.setFontSize(9);
  doc.text(`Generated: ${format(new Date(), "dd MMM yyyy, hh:mm a")}`, pw - 14, 13, { align: "right" });
  if (subtitle) doc.text(subtitle, pw - 14, 23, { align: "right" });
  doc.setTextColor(0, 0, 0);
  return 42;
}

function addPdfFooter(doc: jsPDF, gymName: string) {
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pw = doc.internal.pageSize.getWidth();
    const ph = doc.internal.pageSize.getHeight();
    doc.setDrawColor(200, 200, 200);
    doc.line(14, ph - 12, pw - 14, ph - 12);
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(`${gymName} — Confidential`, 14, ph - 6);
    doc.text(`Page ${i} of ${pageCount}`, pw - 14, ph - 6, { align: "right" });
  }
}

function statBox(doc: jsPDF, x: number, y: number, w: number, label: string, value: string, color = "red") {
  doc.setDrawColor(230, 230, 230);
  doc.setFillColor(250, 250, 250);
  doc.roundedRect(x, y, w, 22, 2, 2, "FD");
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.setFont("helvetica", "normal");
  doc.text(label, x + 4, y + 8);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  const colorMap: Record<string, [number, number, number]> = {
    red: [227, 28, 37], green: [34, 197, 94], blue: [59, 130, 246], gray: [80, 80, 80]
  };
  const rgb = colorMap[color] || colorMap.red;
  doc.setTextColor(rgb[0], rgb[1], rgb[2]);
  doc.text(value, x + 4, y + 18);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(0, 0, 0);
}

// ════════════════════════════════════════════════════════════════════════
export default function Reports() {
  const { data: stats } = useGetDashboardStats();
  const { data: attendanceReport } = useGetAttendanceReport();
  const { data: revenueChart } = useGetRevenueChart();
  const { data: members } = useListMembers();
  const { data: billing } = useListBilling();
  const { data: financialReport } = useGetFinancialReport();
  const { data: memberReport } = useGetMemberReport();
  const { data: bizSettings } = useGetBusinessSettings();

  const [downloading, setDownloading] = useState<string | null>(null);
  const gymName: string = (bizSettings as any)?.gymName || "Core X";

  // Safe accessors
  const attendanceChart = attendanceReport?.chart || [];
  const fr = financialReport as any;
  const mr = memberReport as any;

  // ── DOWNLOAD: Overview ─────────────────────────────────────────────
  const downloadOverview = () => {
    setDownloading("overview");
    const doc = new jsPDF();
    const pw = doc.internal.pageSize.getWidth();
    let y = addPdfHeader(doc, gymName, "Overview Summary Report", format(new Date(), "MMMM yyyy"));

    const bw = (pw - 28 - 9) / 4;
    statBox(doc, 14, y, bw, "Total Members", String(stats?.totalMembers || 0), "gray");
    statBox(doc, 14 + bw + 3, y, bw, "Active Members", String(stats?.activeMembers || 0), "green");
    statBox(doc, 14 + (bw + 3) * 2, y, bw, "Monthly Revenue", `Rs ${(stats?.monthlyRevenue || 0).toLocaleString()}`, "green");
    statBox(doc, 14 + (bw + 3) * 3, y, bw, "Today Attendance", String(stats?.todayAttendance || 0), "blue");
    y += 28;
    statBox(doc, 14, y, bw, "Expired Members", String(stats?.expiredMembers || 0), "red");
    statBox(doc, 14 + bw + 3, y, bw, "Unpaid Dues", `Rs ${(stats?.unpaidDues || 0).toLocaleString()}`, "red");
    statBox(doc, 14 + (bw + 3) * 2, y, bw * 2 + 3, "Total Revenue (All Time)", `Rs ${(fr?.totalRevenue || 0).toLocaleString()}`, "green");
    y += 30;

    if (revenueChart && revenueChart.length > 0) {
      doc.setFontSize(11); doc.setFont("helvetica", "bold");
      doc.text("Revenue Trend (Last 6 Months)", 14, y); y += 4;
      autoTable(doc, {
        startY: y,
        head: [["Month", "Revenue (Rs)", "Expenses (Rs)"]],
        body: (revenueChart as any[]).map(r => [r.month, `Rs ${(r.revenue || 0).toLocaleString()}`, `Rs ${(r.expenses || 0).toLocaleString()}`]),
        headStyles: { fillColor: [227, 28, 37], textColor: 255 },
        alternateRowStyles: { fillColor: [255, 245, 245] },
        styles: { fontSize: 10 },
      });
      y = (doc as any).lastAutoTable.finalY + 8;
    }

    if (attendanceChart.length > 0) {
      doc.setFontSize(11); doc.setFont("helvetica", "bold");
      doc.text("Attendance — Last 7 Days", 14, y); y += 4;
      autoTable(doc, {
        startY: y,
        head: [["Day", "Visits"]],
        body: attendanceChart.map((r: any) => [r.day, r.count]),
        headStyles: { fillColor: [227, 28, 37], textColor: 255 },
        alternateRowStyles: { fillColor: [255, 245, 245] },
        styles: { fontSize: 10 },
      });
    }

    addPdfFooter(doc, gymName);
    doc.save(`${gymName.replace(/\s+/g,"_")}_Overview_${format(new Date(),"yyyy-MM-dd")}.pdf`);
    setDownloading(null);
  };

  // ── DOWNLOAD: Members ─────────────────────────────────────────────
  const downloadMembers = () => {
    setDownloading("members");
    const doc = new jsPDF({ orientation: "landscape" });
    const pw = doc.internal.pageSize.getWidth();
    let y = addPdfHeader(doc, gymName, "Members Report — Full List", `Total: ${(members || []).length} members`);

    const bw = (pw - 28 - 12) / 5;
    const active = (members || []).filter((m: any) => m.status === "active").length;
    const expired = (members || []).filter((m: any) => m.status === "expired").length;
    statBox(doc, 14, y, bw, "Total Members", String((members || []).length), "gray");
    statBox(doc, 14 + (bw + 3), y, bw, "Active", String(active), "green");
    statBox(doc, 14 + (bw + 3) * 2, y, bw, "Expired", String(expired), "red");
    statBox(doc, 14 + (bw + 3) * 3, y, bw, "New This Month", String(mr?.newThisMonth || 0), "blue");
    statBox(doc, 14 + (bw + 3) * 4, y, bw, "Expiring This Week", String(mr?.expiringThisWeek || 0), "red");
    y += 30;

    autoTable(doc, {
      startY: y,
      head: [["#", "Name", "Phone", "CNIC", "Plan", "Start Date", "Expiry Date", "Status", "Fitness Goal"]],
      body: (members || []).map((m: any, i: number) => [
        i + 1, m.name, m.phone, m.cnic || "—",
        (m.plan?.charAt(0).toUpperCase() + m.plan?.slice(1)) || "—",
        m.planStartDate || "—", m.planExpiryDate || "—",
        (m.status || "—").toUpperCase(),
        (m.fitnessGoal?.replace(/-/g, " ")) || "General",
      ]),
      headStyles: { fillColor: [227, 28, 37], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [253, 242, 242] },
      styles: { fontSize: 8, cellPadding: 3 },
      didParseCell: (data) => {
        if (data.column.index === 7 && data.cell.raw === "ACTIVE") { data.cell.styles.textColor = [34, 197, 94]; data.cell.styles.fontStyle = "bold"; }
        if (data.column.index === 7 && data.cell.raw === "EXPIRED") { data.cell.styles.textColor = [227, 28, 37]; }
      },
    });

    addPdfFooter(doc, gymName);
    doc.save(`${gymName.replace(/\s+/g,"_")}_Members_${format(new Date(),"yyyy-MM-dd")}.pdf`);
    setDownloading(null);
  };

  // ── DOWNLOAD: Revenue ─────────────────────────────────────────────
  const downloadRevenue = () => {
    setDownloading("revenue");
    const doc = new jsPDF({ orientation: "landscape" });
    const pw = doc.internal.pageSize.getWidth();
    let y = addPdfHeader(doc, gymName, "Revenue & Billing Report", format(new Date(), "MMMM yyyy"));

    const bw = (pw - 28 - 9) / 4;
    statBox(doc, 14, y, bw, "Total Revenue", `Rs ${(fr?.totalRevenue || 0).toLocaleString()}`, "green");
    statBox(doc, 14 + bw + 3, y, bw, "This Month Revenue", `Rs ${(stats?.monthlyRevenue || 0).toLocaleString()}`, "green");
    statBox(doc, 14 + (bw + 3) * 2, y, bw, "Net Profit", `Rs ${(fr?.netProfit || 0).toLocaleString()}`, "blue");
    statBox(doc, 14 + (bw + 3) * 3, y, bw, "Unpaid Dues", `Rs ${(stats?.unpaidDues || 0).toLocaleString()}`, "red");
    y += 30;

    if (revenueChart && revenueChart.length > 0) {
      doc.setFontSize(11); doc.setFont("helvetica", "bold");
      doc.text("Monthly Revenue Breakdown", 14, y); y += 4;
      autoTable(doc, {
        startY: y,
        head: [["Month", "Revenue (Rs)", "Expenses (Rs)", "Net (Rs)"]],
        body: (revenueChart as any[]).map(r => [
          r.month, `Rs ${(r.revenue || 0).toLocaleString()}`,
          `Rs ${(r.expenses || 0).toLocaleString()}`,
          `Rs ${((r.revenue || 0) - (r.expenses || 0)).toLocaleString()}`,
        ]),
        headStyles: { fillColor: [227, 28, 37], textColor: 255 },
        styles: { fontSize: 10 }, tableWidth: 140,
      });
      y = (doc as any).lastAutoTable.finalY + 10;
    }

    doc.setFontSize(11); doc.setFont("helvetica", "bold");
    doc.text("Invoice Log", 14, y); y += 4;
    autoTable(doc, {
      startY: y,
      head: [["#", "Member Name", "Plan", "Amount (Rs)", "Due Date", "Paid Date", "Status", "Method"]],
      body: (billing || []).slice(0, 300).map((inv: any, i: number) => [
        i + 1, inv.memberName || "—",
        (inv.plan?.charAt(0).toUpperCase() + inv.plan?.slice(1)) || "—",
        `Rs ${parseInt(inv.amount || 0).toLocaleString()}`,
        inv.dueDate || "—", inv.paidDate || "—",
        (inv.status || "").toUpperCase(), inv.paymentMethod || "—",
      ]),
      headStyles: { fillColor: [227, 28, 37], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [253, 242, 242] },
      styles: { fontSize: 8, cellPadding: 3 },
      didParseCell: (data) => {
        if (data.column.index === 6 && data.cell.raw === "PAID") { data.cell.styles.textColor = [34, 197, 94]; data.cell.styles.fontStyle = "bold"; }
        if (data.column.index === 6 && data.cell.raw === "UNPAID") { data.cell.styles.textColor = [227, 28, 37]; }
      },
    });

    addPdfFooter(doc, gymName);
    doc.save(`${gymName.replace(/\s+/g,"_")}_Revenue_${format(new Date(),"yyyy-MM-dd")}.pdf`);
    setDownloading(null);
  };

  // ── DOWNLOAD: Attendance ─────────────────────────────────────────
  const downloadAttendance = () => {
    setDownloading("attendance");
    const doc = new jsPDF();
    const pw = doc.internal.pageSize.getWidth();
    let y = addPdfHeader(doc, gymName, "Attendance Report", format(new Date(), "MMMM yyyy"));

    const bw = (pw - 28 - 6) / 3;
    statBox(doc, 14, y, bw, "Total Visits (7 days)", String(attendanceReport?.totalVisits || 0), "green");
    statBox(doc, 14 + bw + 3, y, bw, "Avg Daily Visits", String(attendanceReport?.avgDailyVisits || 0), "blue");
    statBox(doc, 14 + (bw + 3) * 2, y, bw, "Today's Visits", String(stats?.todayAttendance || 0), "gray");
    y += 30;

    if (attendanceReport?.peakDay) {
      doc.setFontSize(10); doc.setFont("helvetica", "normal");
      doc.setTextColor(80, 80, 80);
      doc.text(`Peak Day: ${attendanceReport.peakDay}  |  Unique Members: ${attendanceReport.uniqueMembers || 0}`, 14, y);
      doc.setTextColor(0, 0, 0);
      y += 8;
    }

    autoTable(doc, {
      startY: y,
      head: [["Day", "Visits"]],
      body: attendanceChart.map((r: any) => [r.day, r.count]),
      headStyles: { fillColor: [227, 28, 37], textColor: 255 },
      alternateRowStyles: { fillColor: [255, 245, 245] },
      styles: { fontSize: 11, cellPadding: 4 },
      columnStyles: { 1: { fontStyle: "bold", textColor: [227, 28, 37] } },
    });

    addPdfFooter(doc, gymName);
    doc.save(`${gymName.replace(/\s+/g,"_")}_Attendance_${format(new Date(),"yyyy-MM-dd")}.pdf`);
    setDownloading(null);
  };

  // ── DOWNLOAD: Expiring Members ──────────────────────────────────
  const downloadExpiring = () => {
    setDownloading("expiring");
    const doc = new jsPDF();
    const pw = doc.internal.pageSize.getWidth();
    let y = addPdfHeader(doc, gymName, "Expiring Members Report", "Next 30 Days");

    const today = new Date();
    const in30 = new Date(); in30.setDate(in30.getDate() + 30);
    const expiring = (members || []).filter((m: any) => {
      const exp = new Date(m.planExpiryDate);
      return exp >= today && exp <= in30;
    }).sort((a: any, b: any) => new Date(a.planExpiryDate).getTime() - new Date(b.planExpiryDate).getTime());

    const bw = (pw - 28 - 3) / 2;
    statBox(doc, 14, y, bw, "Expiring in 30 Days", String(expiring.length), "red");
    statBox(doc, 14 + bw + 3, y, bw, "Potential Renewal Revenue", `Rs ${(expiring.length * 3000).toLocaleString()}+`, "green");
    y += 30;

    autoTable(doc, {
      startY: y,
      head: [["#", "Member Name", "Phone", "Plan", "Expiry Date", "Days Left"]],
      body: expiring.map((m: any, i: number) => {
        const daysLeft = Math.ceil((new Date(m.planExpiryDate).getTime() - today.getTime()) / 86400000);
        return [i + 1, m.name, m.phone, m.plan?.charAt(0).toUpperCase() + m.plan?.slice(1), m.planExpiryDate, daysLeft <= 7 ? `⚠ ${daysLeft} days` : `${daysLeft} days`];
      }),
      headStyles: { fillColor: [227, 28, 37], textColor: 255 },
      alternateRowStyles: { fillColor: [255, 245, 245] },
      styles: { fontSize: 10 },
      didParseCell: (data) => {
        if (data.column.index === 5 && String(data.cell.raw).startsWith("⚠")) { data.cell.styles.textColor = [227, 28, 37]; data.cell.styles.fontStyle = "bold"; }
      },
    });

    addPdfFooter(doc, gymName);
    doc.save(`${gymName.replace(/\s+/g,"_")}_Expiring_${format(new Date(),"yyyy-MM-dd")}.pdf`);
    setDownloading(null);
  };

  // ── Chart data ────────────────────────────────────────────────────
  const membershipBreakdown = (mr?.byPlan || []).length > 0
    ? mr.byPlan
    : ["monthly", "quarterly", "yearly", "weekly", "daily"].map(plan => ({
        name: plan.charAt(0).toUpperCase() + plan.slice(1),
        value: (members || []).filter((m: any) => m.plan === plan).length,
      })).filter((x: any) => x.value > 0);

  const statusBreakdown = [
    { name: "Active", value: stats?.activeMembers || 0 },
    { name: "Expired", value: stats?.expiredMembers || 0 },
    { name: "Frozen", value: (members || []).filter((m: any) => m.status === "frozen").length },
  ].filter(x => x.value > 0);

  const DownloadBtn = ({ label, onClick, id }: { label: string; onClick: () => void; id: string }) => (
    <Button size="sm" variant="outline" onClick={onClick} disabled={!!downloading}
      className="gap-1.5 text-primary border-primary/40 hover:bg-primary hover:text-white transition-colors">
      <Download className="h-3.5 w-3.5" />
      {downloading === id ? "Generating..." : label}
    </Button>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
          <p className="text-muted-foreground text-sm mt-1">View analytics and download professional PDF reports</p>
        </div>
        <DownloadBtn label="Download Overview PDF" onClick={downloadOverview} id="overview" />
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats?.totalMembers || 0}</div><p className="text-xs text-muted-foreground">+{mr?.newThisMonth || 0} this month</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Members</CardTitle>
            <Users className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold text-green-600">{stats?.activeMembers || 0}</div><p className="text-xs text-muted-foreground">{mr?.renewalsThisMonth || 0} renewals this month</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">Rs {(stats?.monthlyRevenue || 0).toLocaleString()}</div><p className="text-xs text-muted-foreground">All time: Rs {(fr?.totalRevenue || 0).toLocaleString()}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Attendance</CardTitle>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{stats?.todayAttendance || 0}</div><p className="text-xs text-muted-foreground">Avg {attendanceReport?.avgDailyVisits || 0}/day this week</p></CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview"><TrendingUp className="h-4 w-4 mr-1.5"/>Overview</TabsTrigger>
          <TabsTrigger value="members"><Users className="h-4 w-4 mr-1.5"/>Members</TabsTrigger>
          <TabsTrigger value="revenue"><CreditCard className="h-4 w-4 mr-1.5"/>Revenue</TabsTrigger>
          <TabsTrigger value="attendance"><Activity className="h-4 w-4 mr-1.5"/>Attendance</TabsTrigger>
        </TabsList>

        {/* ── OVERVIEW ───────────────────────────────────────────── */}
        <TabsContent value="overview" className="mt-4 space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Revenue Trend (6 Months)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={230}>
                  <LineChart data={revenueChart || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `Rs ${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: number) => [`Rs ${v.toLocaleString()}`, "Revenue"]} />
                    <Line type="monotone" dataKey="revenue" stroke={PRIMARY} strokeWidth={2.5} dot={{ fill: PRIMARY, r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Membership Plan Split</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={230}>
                  <PieChart>
                    <Pie data={membershipBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {membershipBreakdown.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2"><FileBarChart className="h-5 w-5"/>Financial Summary</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-lg border p-4">
                  <p className="text-xs text-muted-foreground mb-1">Monthly Revenue</p>
                  <p className="text-xl font-bold text-green-600">Rs {(stats?.monthlyRevenue || 0).toLocaleString()}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-xs text-muted-foreground mb-1">Net Profit</p>
                  <p className="text-xl font-bold text-blue-600">Rs {(fr?.netProfit || 0).toLocaleString()}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-xs text-muted-foreground mb-1">Unpaid Dues</p>
                  <p className="text-xl font-bold text-destructive">Rs {(stats?.unpaidDues || 0).toLocaleString()}</p>
                </div>
                <div className="rounded-lg border p-4">
                  <p className="text-xs text-muted-foreground mb-1">Expired Members</p>
                  <p className="text-xl font-bold">{stats?.expiredMembers || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── MEMBERS ─────────────────────────────────────────────── */}
        <TabsContent value="members" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Badge variant="outline">{(members || []).length} Total</Badge>
              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">{stats?.activeMembers || 0} Active</Badge>
              <Badge variant="destructive">{stats?.expiredMembers || 0} Expired</Badge>
              {(mr?.expiringThisWeek || 0) > 0 && <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">{mr.expiringThisWeek} Expiring This Week</Badge>}
            </div>
            <div className="flex gap-2">
              <DownloadBtn label="Download Members PDF" onClick={downloadMembers} id="members" />
              <DownloadBtn label="Download Expiring PDF" onClick={downloadExpiring} id="expiring" />
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Members by Plan</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={membershipBreakdown} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={70} />
                    <Tooltip />
                    <Bar dataKey="value" fill={PRIMARY} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Status Breakdown</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={statusBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80}
                      label={({ name, value }) => `${name}: ${value}`}>
                      {statusBreakdown.map((_, i) => <Cell key={i} fill={i === 0 ? "#22c55e" : i === 1 ? "#E31C25" : "#3b82f6"} />)}
                    </Pie>
                    <Legend />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Members Expiring in 30 Days</CardTitle></CardHeader>
            <CardContent>
              {(() => {
                const today = new Date();
                const in30 = new Date(); in30.setDate(in30.getDate() + 30);
                const expiring = (members || []).filter((m: any) => {
                  const exp = new Date(m.planExpiryDate);
                  return exp >= today && exp <= in30;
                });
                if (expiring.length === 0) return <p className="text-muted-foreground text-sm py-4 text-center">No members expiring in the next 30 days</p>;
                return (
                  <div className="divide-y">
                    {expiring.slice(0, 10).map((m: any) => {
                      const days = Math.ceil((new Date(m.planExpiryDate).getTime() - today.getTime()) / 86400000);
                      return (
                        <div key={m.id} className="flex items-center justify-between py-2 text-sm">
                          <div><span className="font-medium">{m.name}</span><span className="text-muted-foreground ml-2">{m.phone}</span></div>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">{m.planExpiryDate}</span>
                            <Badge variant={days <= 7 ? "destructive" : "secondary"}>{days}d left</Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── REVENUE ──────────────────────────────────────────────── */}
        <TabsContent value="revenue" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <DownloadBtn label="Download Revenue PDF" onClick={downloadRevenue} id="revenue" />
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground mb-1">Total Revenue</p><p className="text-2xl font-bold text-green-600">Rs {(fr?.totalRevenue || 0).toLocaleString()}</p></CardContent></Card>
            <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground mb-1">Membership Income</p><p className="text-2xl font-bold">Rs {(fr?.membershipIncome || 0).toLocaleString()}</p></CardContent></Card>
            <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground mb-1">Net Profit</p><p className="text-2xl font-bold text-blue-600">Rs {(fr?.netProfit || 0).toLocaleString()}</p></CardContent></Card>
            <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground mb-1">Unpaid Dues</p><p className="text-2xl font-bold text-destructive">Rs {(stats?.unpaidDues || 0).toLocaleString()}</p></CardContent></Card>
          </div>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Revenue by Month</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={revenueChart || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `Rs ${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => [`Rs ${v.toLocaleString()}`, "Revenue"]} />
                  <Bar dataKey="revenue" fill={PRIMARY} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Recent Invoices</CardTitle>
                <Badge variant="outline">{(billing || []).length} total</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y max-h-72 overflow-y-auto">
                {(billing || []).slice(0, 20).map((inv: any) => (
                  <div key={inv.id} className="flex items-center justify-between px-4 py-2 text-sm">
                    <div><span className="font-medium">{inv.memberName || "—"}</span><span className="text-muted-foreground ml-2 capitalize">{inv.plan}</span></div>
                    <div className="flex items-center gap-2">
                      <span>Rs {parseInt(inv.amount || 0).toLocaleString()}</span>
                      <Badge variant={inv.status === "paid" ? "default" : "destructive"} className="text-xs">{inv.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── ATTENDANCE ───────────────────────────────────────────── */}
        <TabsContent value="attendance" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <DownloadBtn label="Download Attendance PDF" onClick={downloadAttendance} id="attendance" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card><CardContent className="pt-5 text-center"><div className="text-2xl font-bold text-primary">{stats?.todayAttendance || 0}</div><div className="text-sm text-muted-foreground">Today</div></CardContent></Card>
            <Card><CardContent className="pt-5 text-center"><div className="text-2xl font-bold">{attendanceReport?.totalVisits || 0}</div><div className="text-sm text-muted-foreground">Last 7 Days</div></CardContent></Card>
            <Card><CardContent className="pt-5 text-center"><div className="text-2xl font-bold">{attendanceReport?.avgDailyVisits || 0}</div><div className="text-sm text-muted-foreground">Daily Average</div></CardContent></Card>
            <Card><CardContent className="pt-5 text-center"><div className="text-sm font-medium">{attendanceReport?.peakDay || "—"}</div><div className="text-sm text-muted-foreground">Peak Day</div></CardContent></Card>
          </div>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Daily Attendance — Last 7 Days</CardTitle></CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={attendanceChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill={PRIMARY} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
