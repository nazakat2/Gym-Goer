import { Router } from "express";
import nodemailer from "nodemailer";
import { db } from "@workspace/db";
import {
  membersTable, measurementsTable, attendanceTable, employeesTable,
  invoicesTable, suppliersTable, productsTable, salesTable,
  posOrdersTable, posOrderItemsTable,
  accountsTable, vouchersTable, adminUsersTable, adminNotificationsTable,
  businessSettingsTable,
  appAnnouncementsTable, appClassesTable, appWorkoutPlansTable, appWorkoutExercisesTable,
  appDietPlansTable, appDietMealsTable, appOnboardingSlidesTable,
} from "@workspace/db";
import { eq, desc, asc, and, like, or, sql, gte, lte, count } from "drizzle-orm";

const router = Router();

// ── Email transporter ──────────────────────────────────────────────────────
const emailUser = process.env["EMAIL_USER"] || "";
const emailPass = process.env["EMAIL_PASS"] || "";
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: emailUser, pass: emailPass },
});

// ── OTP stores ─────────────────────────────────────────────────────────────
const otpStore = new Map<string, { otp: string; expiresAt: number }>();           // password reset
const signupOtpStore = new Map<string, { otp: string; expiresAt: number; name: string; password: string; role: string }>(); // signup verify

// ── Auth ─────────────────────────────────────────────────────
router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "Email and password required" });
  const [user] = await db.select().from(adminUsersTable).where(eq(adminUsersTable.email, email.toLowerCase().trim()));
  if (!user || user.password !== password) return res.status(401).json({ message: "Invalid email or password" });
  if (user.status !== "active") return res.status(403).json({ message: "Account is inactive" });
  await db.update(adminUsersTable).set({ lastLogin: new Date().toISOString() }).where(eq(adminUsersTable.id, user.id));
  const { password: _, ...safeUser } = user;
  return res.json({ user: safeUser });
});

router.get("/auth/me", async (req, res) => {
  const email = req.headers["x-admin-email"] as string;
  if (!email) return res.status(401).json({ message: "Not authenticated" });
  const [user] = await db.select().from(adminUsersTable).where(eq(adminUsersTable.email, email));
  if (!user) return res.status(401).json({ message: "User not found" });
  const { password: _, ...safeUser } = user;
  return res.json(safeUser);
});

// POST /auth/forgot-password — generate & email OTP
router.post("/auth/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  const [user] = await db.select().from(adminUsersTable)
    .where(eq(adminUsersTable.email, email.toLowerCase().trim()));
  if (!user) return res.status(404).json({ message: "No account found with this email" });

  const otp = String(Math.floor(100000 + Math.random() * 900000));
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
  otpStore.set(email.toLowerCase(), { otp, expiresAt });

  try {
    await transporter.sendMail({
      from: `"GymAdmin" <${emailUser}>`,
      to: email,
      subject: "Password Reset OTP — GymAdmin",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #eee;border-radius:12px;">
          <h2 style="color:#E31C25;margin-top:0;">Password Reset</h2>
          <p>Hello <strong>${user.name}</strong>,</p>
          <p>Use the OTP below to reset your GymAdmin password. It expires in <strong>10 minutes</strong>.</p>
          <div style="background:#f5f5f5;border-radius:8px;padding:24px;text-align:center;margin:24px 0;">
            <span style="font-size:36px;font-weight:bold;letter-spacing:10px;color:#E31C25;">${otp}</span>
          </div>
          <p style="color:#888;font-size:13px;">If you did not request this, please ignore this email.</p>
        </div>
      `,
    });
    return res.json({ message: "OTP sent to your email" });
  } catch (err) {
    console.error("Email error:", err);
    return res.status(500).json({ message: "Failed to send email. Check server email config." });
  }
});

// POST /auth/verify-otp — check OTP is valid
router.post("/auth/verify-otp", async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ message: "Email and OTP are required" });

  const entry = otpStore.get(email.toLowerCase());
  if (!entry) return res.status(400).json({ message: "No OTP found. Please request a new one." });
  if (Date.now() > entry.expiresAt) {
    otpStore.delete(email.toLowerCase());
    return res.status(400).json({ message: "OTP has expired. Please request a new one." });
  }
  if (entry.otp !== String(otp)) return res.status(400).json({ message: "Invalid OTP" });

  return res.json({ message: "OTP verified" });
});

// POST /auth/reset-password — set new password (OTP must still be valid)
router.post("/auth/reset-password", async (req, res) => {
  const { email, otp, newPassword } = req.body;
  if (!email || !otp || !newPassword) return res.status(400).json({ message: "All fields are required" });
  if (newPassword.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters" });

  const entry = otpStore.get(email.toLowerCase());
  if (!entry) return res.status(400).json({ message: "No OTP found. Please request a new one." });
  if (Date.now() > entry.expiresAt) {
    otpStore.delete(email.toLowerCase());
    return res.status(400).json({ message: "OTP has expired. Please request a new one." });
  }
  if (entry.otp !== String(otp)) return res.status(400).json({ message: "Invalid OTP" });

  await db.update(adminUsersTable)
    .set({ password: newPassword })
    .where(eq(adminUsersTable.email, email.toLowerCase().trim()));

  otpStore.delete(email.toLowerCase());
  return res.json({ message: "Password reset successful" });
});

// POST /auth/send-signup-otp — send email verification OTP for new admin account
router.post("/auth/send-signup-otp", async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: "All fields are required" });
  if (password.length < 6) return res.status(400).json({ message: "Password must be at least 6 characters" });

  const emailKey = email.toLowerCase().trim();
  const [existing] = await db.select({ id: adminUsersTable.id })
    .from(adminUsersTable).where(eq(adminUsersTable.email, emailKey));
  if (existing) return res.status(409).json({ message: "An account with this email already exists" });

  if (!emailUser || !emailPass) return res.status(503).json({ message: "Email service not configured" });

  const validRole = role === "admin" ? "admin" : "staff";
  const otp = String(Math.floor(100000 + Math.random() * 900000));
  signupOtpStore.set(emailKey, { otp, expiresAt: Date.now() + 10 * 60 * 1000, name: name.trim(), password, role: validRole });

  try {
    await transporter.sendMail({
      from: `"GymAdmin" <${emailUser}>`,
      to: email,
      subject: "GymAdmin — Verify Your Email",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #eee;border-radius:12px;">
          <h2 style="color:#E31C25;margin-top:0;">Verify Your Email</h2>
          <p>Hi <strong>${name.trim()}</strong>, welcome to GymAdmin!</p>
          <p>Use this OTP to complete your account registration. It expires in <strong>10 minutes</strong>.</p>
          <div style="background:#f5f5f5;border-radius:8px;padding:24px;text-align:center;margin:24px 0;">
            <span style="font-size:36px;font-weight:bold;letter-spacing:10px;color:#E31C25;">${otp}</span>
          </div>
          <p style="color:#888;font-size:13px;">If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    });
    return res.json({ message: "Verification OTP sent to your email" });
  } catch (err) {
    console.error("Signup email error:", err);
    return res.status(500).json({ message: "Failed to send verification email" });
  }
});

// POST /auth/register — verify OTP and create new admin account
router.post("/auth/register", async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ message: "Email and OTP are required" });

  const emailKey = email.toLowerCase().trim();
  const entry = signupOtpStore.get(emailKey);
  if (!entry) return res.status(400).json({ message: "No OTP found. Please request a new one." });
  if (Date.now() > entry.expiresAt) {
    signupOtpStore.delete(emailKey);
    return res.status(400).json({ message: "OTP expired. Please request a new one." });
  }
  if (entry.otp !== String(otp)) return res.status(400).json({ message: "Invalid OTP" });

  const [existing] = await db.select({ id: adminUsersTable.id })
    .from(adminUsersTable).where(eq(adminUsersTable.email, emailKey));
  if (existing) return res.status(409).json({ message: "An account with this email already exists" });

  const defaultPermissions = entry.role === "admin"
    ? ["members", "measurements", "attendance", "employees", "billing", "pos", "inventory", "accounts", "reports", "admin-users", "notifications", "settings"]
    : ["members", "attendance"];

  const [newUser] = await db.insert(adminUsersTable).values({
    name: entry.name,
    email: emailKey,
    password: entry.password,
    role: entry.role,
    permissions: defaultPermissions,
    status: "active",
  }).returning();

  signupOtpStore.delete(emailKey);
  const { password: _, ...safeUser } = newUser;
  return res.status(201).json({ user: safeUser });
});

// ── Helpers ──────────────────────────────────────────────────
function calcExpiry(startDate: string, plan: string): string {
  const d = new Date(startDate);
  if (plan === "monthly") d.setMonth(d.getMonth() + 1);
  else if (plan === "quarterly") d.setMonth(d.getMonth() + 3);
  else if (plan === "yearly") d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().split("T")[0];
}

function calcBMI(weight: number, height: number): number {
  const hm = height / 100;
  return Math.round((weight / (hm * hm)) * 10) / 10;
}

function today() {
  return new Date().toISOString().split("T")[0];
}

// ── Dashboard ──────────────────────────────────────────────────────────────
router.get("/dashboard/stats", async (_req, res) => {
  const [membersAll, attending, invoicesAll, employees, products] = await Promise.all([
    db.select().from(membersTable),
    db.select().from(attendanceTable).where(eq(attendanceTable.date, today())),
    db.select().from(invoicesTable),
    db.select().from(employeesTable).where(eq(employeesTable.status, "active")),
    db.select().from(productsTable),
  ]);

  const activeMembers = membersAll.filter(m => m.status === "active").length;
  const now = today();
  const monthStart = now.slice(0, 7) + "-01";
  const monthlyRevenue = invoicesAll
    .filter(i => i.status === "paid" && i.paidDate && i.paidDate >= monthStart)
    .reduce((s, i) => s + parseFloat(i.amount as string), 0);
  const unpaidDues = invoicesAll
    .filter(i => i.status === "unpaid")
    .reduce((s, i) => s + parseFloat(i.amount as string), 0);
  const lowStockItems = products.filter(p => p.stock <= p.lowStockThreshold).length;

  res.json({
    totalMembers: membersAll.length,
    activeMembers,
    expiredMembers: membersAll.length - activeMembers,
    todayAttendance: attending.length,
    monthlyRevenue,
    unpaidDues,
    totalEmployees: employees.length,
    lowStockItems,
  });
});

router.get("/dashboard/recent-activity", async (_req, res) => {
  const [members, invoices, attendance] = await Promise.all([
    db.select().from(membersTable).orderBy(desc(membersTable.createdAt)).limit(5),
    db.select().from(invoicesTable).orderBy(desc(invoicesTable.createdAt)).limit(5),
    db.select().from(attendanceTable).orderBy(desc(attendanceTable.createdAt)).limit(5),
  ]);

  const activities = [
    ...members.map(m => ({ id: m.id * 100, type: "member", description: `New member: ${m.name}`, time: m.createdAt.toISOString(), icon: "user" })),
    ...invoices.map(i => ({ id: i.id * 100 + 1, type: "invoice", description: `Invoice ${i.status === "paid" ? "paid" : "created"} — PKR ${i.amount}`, time: i.createdAt.toISOString(), icon: "receipt" })),
    ...attendance.map(a => ({ id: a.id * 100 + 2, type: "attendance", description: `Member checked in`, time: a.createdAt.toISOString(), icon: "check" })),
  ].sort((a, b) => b.time.localeCompare(a.time)).slice(0, 10);

  res.json(activities);
});

router.get("/dashboard/revenue-chart", async (_req, res) => {
  const invoices = await db.select().from(invoicesTable);
  const vouchers = await db.select().from(vouchersTable);

  const months: Record<string, { revenue: number; expenses: number }> = {};
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const key = d.toISOString().slice(0, 7);
    months[key] = { revenue: 0, expenses: 0 };
  }

  for (const inv of invoices) {
    if (inv.status === "paid" && inv.paidDate) {
      const k = inv.paidDate.slice(0, 7);
      if (months[k]) months[k].revenue += parseFloat(inv.amount as string);
    }
  }
  for (const v of vouchers) {
    const k = v.date.slice(0, 7);
    if (months[k] && v.type === "expense") months[k].expenses += parseFloat(v.amount as string);
  }

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  res.json(Object.entries(months).map(([key, val]) => ({
    month: monthNames[parseInt(key.split("-")[1]) - 1],
    revenue: Math.round(val.revenue),
    expenses: Math.round(val.expenses),
  })));
});

router.get("/dashboard/membership-breakdown", async (_req, res) => {
  const members = await db.select().from(membersTable);
  const counts: Record<string, number> = { monthly: 0, quarterly: 0, yearly: 0 };
  for (const m of members) {
    if (counts[m.plan] !== undefined) counts[m.plan]++;
  }
  res.json([
    { name: "Monthly", value: counts.monthly, color: "#E31C25" },
    { name: "Quarterly", value: counts.quarterly, color: "#FF6B35" },
    { name: "Yearly", value: counts.yearly, color: "#22C55E" },
  ]);
});

// ── Members ───────────────────────────────────────────────────────────────
router.get("/members", async (req, res) => {
  const { status, search } = req.query as { status?: string; search?: string };
  let rows = await db.select().from(membersTable).orderBy(desc(membersTable.createdAt));

  if (status && status !== "all") rows = rows.filter(m => m.status === status);
  if (search) {
    const s = search.toLowerCase();
    rows = rows.filter(m =>
      m.name.toLowerCase().includes(s) ||
      m.phone.includes(s) ||
      m.cnic.includes(s)
    );
  }
  // Update status based on expiry
  const now = today();
  rows = rows.map(m => ({ ...m, status: m.planExpiryDate < now ? "expired" : "active" }));
  res.json(rows);
});

router.post("/members", async (req, res) => {
  const { name, phone, cnic, address, photoUrl, plan, planStartDate } = req.body;
  const planExpiryDate = calcExpiry(planStartDate, plan);
  const [member] = await db.insert(membersTable).values({
    name, phone, cnic, address: address || null, photoUrl: photoUrl || null,
    plan, planStartDate, planExpiryDate, status: "active",
  }).returning();

  // Auto-create invoice
  const planPrices: Record<string, number> = { monthly: 3000, quarterly: 8000, yearly: 28000 };
  await db.insert(invoicesTable).values({
    memberId: member.id,
    amount: String(planPrices[plan] || 3000),
    plan,
    dueDate: planStartDate,
    status: "unpaid",
  });

  // Create notification
  await db.insert(adminNotificationsTable).values({
    type: "new_member",
    title: "New Member Registered",
    message: `${name} has joined on the ${plan} plan.`,
    read: false,
  });

  res.status(201).json(member);
});

router.get("/members/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [member] = await db.select().from(membersTable).where(eq(membersTable.id, id));
  if (!member) return res.status(404).json({ message: "Member not found" });
  const now = today();
  member.status = member.planExpiryDate < now ? "expired" : "active";
  res.json(member);
});

router.put("/members/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, phone, cnic, address, photoUrl, plan, planStartDate } = req.body;
  const planExpiryDate = calcExpiry(planStartDate, plan);
  const [updated] = await db.update(membersTable).set({
    name, phone, cnic, address: address || null, photoUrl: photoUrl || null,
    plan, planStartDate, planExpiryDate,
  }).where(eq(membersTable.id, id)).returning();
  if (!updated) return res.status(404).json({ message: "Member not found" });
  res.json(updated);
});

router.delete("/members/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(membersTable).where(eq(membersTable.id, id));
  res.json({ message: "Member deleted" });
});

// ── Measurements ──────────────────────────────────────────────────────────
router.get("/measurements", async (req, res) => {
  const { memberId } = req.query as { memberId?: string };
  const measurements = await db.select({
    measurement: measurementsTable,
    memberName: membersTable.name,
  }).from(measurementsTable)
    .leftJoin(membersTable, eq(measurementsTable.memberId, membersTable.id))
    .where(memberId ? eq(measurementsTable.memberId, parseInt(memberId)) : undefined)
    .orderBy(desc(measurementsTable.createdAt));

  res.json(measurements.map(r => ({
    ...r.measurement,
    memberName: r.memberName ?? "Unknown",
    weight: parseFloat(r.measurement.weight as string),
    height: parseFloat(r.measurement.height as string),
    bmi: parseFloat(r.measurement.bmi as string),
    bodyFat: r.measurement.bodyFat ? parseFloat(r.measurement.bodyFat as string) : null,
  })));
});

router.post("/measurements", async (req, res) => {
  const { memberId, weight, height, bodyFat, date } = req.body;
  const bmi = calcBMI(weight, height);
  const [m] = await db.insert(measurementsTable).values({
    memberId, weight: String(weight), height: String(height),
    bmi: String(bmi), bodyFat: bodyFat ? String(bodyFat) : null, date,
  }).returning();
  const [member] = await db.select().from(membersTable).where(eq(membersTable.id, memberId));
  res.status(201).json({ ...m, memberName: member?.name ?? "Unknown", weight, height, bmi, bodyFat: bodyFat ?? null });
});

router.delete("/measurements/:id", async (req, res) => {
  await db.delete(measurementsTable).where(eq(measurementsTable.id, parseInt(req.params.id)));
  res.json({ message: "Deleted" });
});

// ── Attendance ─────────────────────────────────────────────────────────────
router.get("/attendance", async (req, res) => {
  const { date, memberId } = req.query as { date?: string; memberId?: string };
  const rows = await db.select({
    attendance: attendanceTable,
    memberName: membersTable.name,
  }).from(attendanceTable)
    .leftJoin(membersTable, eq(attendanceTable.memberId, membersTable.id))
    .where(
      and(
        date ? eq(attendanceTable.date, date) : undefined,
        memberId ? eq(attendanceTable.memberId, parseInt(memberId)) : undefined,
      )
    )
    .orderBy(desc(attendanceTable.createdAt));

  res.json(rows.map(r => ({ ...r.attendance, memberName: r.memberName ?? "Unknown" })));
});

router.post("/attendance", async (req, res) => {
  const { memberId } = req.body;
  const now = new Date();
  const date = now.toISOString().split("T")[0];
  const checkInTime = now.toTimeString().slice(0, 5);
  const [att] = await db.insert(attendanceTable).values({ memberId, date, checkInTime }).returning();
  const [member] = await db.select().from(membersTable).where(eq(membersTable.id, memberId));
  res.status(201).json({ ...att, memberName: member?.name ?? "Unknown" });
});

router.get("/attendance/today-stats", async (_req, res) => {
  const t = today();
  const rows = await db.select().from(attendanceTable).where(eq(attendanceTable.date, t));
  const hours: Record<string, number> = {};
  for (const r of rows) {
    const h = r.checkInTime.split(":")[0];
    hours[h] = (hours[h] || 0) + 1;
  }
  const peakHour = Object.entries(hours).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "N/A";
  res.json({ total: rows.length, present: rows.length, peakHour: peakHour === "N/A" ? "N/A" : `${peakHour}:00` });
});

router.get("/attendance/monthly-chart", async (_req, res) => {
  const rows = await db.select().from(attendanceTable).orderBy(attendanceTable.date);
  const byDay: Record<string, number> = {};
  for (const r of rows) {
    byDay[r.date] = (byDay[r.date] || 0) + 1;
  }
  const last30: { day: string; count: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    last30.push({ day: key.slice(5), count: byDay[key] || 0 });
  }
  res.json(last30);
});

// ── Employees ──────────────────────────────────────────────────────────────
router.get("/employees", async (_req, res) => {
  const rows = await db.select().from(employeesTable).orderBy(desc(employeesTable.createdAt));
  res.json(rows.map(e => ({
    ...e,
    salary: parseFloat(e.salary as string),
    commission: e.commission ? parseFloat(e.commission as string) : 0,
    assignedMembers: e.assignedMembers ?? 0,
  })));
});

router.post("/employees", async (req, res) => {
  const { name, role, phone, email, salary, commission, joinDate } = req.body;
  const [emp] = await db.insert(employeesTable).values({
    name, role, phone, email: email || null,
    salary: String(salary), commission: commission ? String(commission) : "0",
    assignedMembers: 0, joinDate, status: "active",
  }).returning();
  res.status(201).json({ ...emp, salary: parseFloat(emp.salary as string), commission: parseFloat(emp.commission as string || "0") });
});

router.put("/employees/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, role, phone, email, salary, commission, joinDate } = req.body;
  const [updated] = await db.update(employeesTable).set({
    name, role, phone, email: email || null,
    salary: String(salary), commission: commission ? String(commission) : "0",
    joinDate,
  }).where(eq(employeesTable.id, id)).returning();
  if (!updated) return res.status(404).json({ message: "Not found" });
  res.json({ ...updated, salary: parseFloat(updated.salary as string), commission: parseFloat(updated.commission as string || "0") });
});

router.delete("/employees/:id", async (req, res) => {
  await db.delete(employeesTable).where(eq(employeesTable.id, parseInt(req.params.id)));
  res.json({ message: "Deleted" });
});

// ── Billing ────────────────────────────────────────────────────────────────
router.get("/billing", async (req, res) => {
  const { status, memberId } = req.query as { status?: string; memberId?: string };
  const rows = await db.select({
    invoice: invoicesTable,
    memberName: membersTable.name,
  }).from(invoicesTable)
    .leftJoin(membersTable, eq(invoicesTable.memberId, membersTable.id))
    .orderBy(desc(invoicesTable.createdAt));

  let result = rows.map(r => ({
    ...r.invoice,
    memberName: r.memberName ?? "Unknown",
    amount: parseFloat(r.invoice.amount as string),
  }));
  if (status && status !== "all") result = result.filter(i => i.status === status);
  if (memberId) result = result.filter(i => i.memberId === parseInt(memberId));
  res.json(result);
});

router.post("/billing", async (req, res) => {
  const { memberId, amount, plan, dueDate } = req.body;
  const [inv] = await db.insert(invoicesTable).values({ memberId, amount: String(amount), plan, dueDate, status: "unpaid" }).returning();
  const [member] = await db.select().from(membersTable).where(eq(membersTable.id, memberId));
  res.status(201).json({ ...inv, memberName: member?.name ?? "Unknown", amount });
});

router.post("/billing/:id/pay", async (req, res) => {
  const id = parseInt(req.params.id);
  const { paymentMethod } = req.body;
  const [updated] = await db.update(invoicesTable).set({ status: "paid", paidDate: today(), paymentMethod }).where(eq(invoicesTable.id, id)).returning();
  if (!updated) return res.status(404).json({ message: "Not found" });
  const [member] = await db.select().from(membersTable).where(eq(membersTable.id, updated.memberId));
  res.json({ ...updated, memberName: member?.name ?? "Unknown", amount: parseFloat(updated.amount as string) });
});

router.get("/billing/dues-summary", async (_req, res) => {
  const invoices = await db.select().from(invoicesTable);
  const now = today();
  const monthStart = now.slice(0, 7) + "-01";
  const totalDues = invoices.filter(i => i.status === "unpaid").reduce((s, i) => s + parseFloat(i.amount as string), 0);
  const paidThisMonth = invoices.filter(i => i.status === "paid" && i.paidDate && i.paidDate >= monthStart).reduce((s, i) => s + parseFloat(i.amount as string), 0);
  res.json({ totalDues, totalInvoices: invoices.length, unpaidCount: invoices.filter(i => i.status === "unpaid").length, paidThisMonth });
});

// ── Products ───────────────────────────────────────────────────────────────
router.get("/products", async (_req, res) => {
  const rows = await db.select({
    product: productsTable,
    supplierName: suppliersTable.name,
  }).from(productsTable)
    .leftJoin(suppliersTable, eq(productsTable.supplierId, suppliersTable.id))
    .orderBy(desc(productsTable.createdAt));

  res.json(rows.map(r => ({
    ...r.product,
    supplierName: r.supplierName ?? null,
    price: parseFloat(r.product.price as string),
  })));
});

router.post("/products", async (req, res) => {
  const { name, category, price, stock, supplierId, lowStockThreshold } = req.body;
  const [prod] = await db.insert(productsTable).values({
    name, category, price: String(price), stock, supplierId: supplierId || null, lowStockThreshold,
  }).returning();
  res.status(201).json({ ...prod, price });
});

router.put("/products/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, category, price, stock, supplierId, lowStockThreshold } = req.body;
  const [updated] = await db.update(productsTable).set({ name, category, price: String(price), stock, supplierId: supplierId || null, lowStockThreshold }).where(eq(productsTable.id, id)).returning();
  if (!updated) return res.status(404).json({ message: "Not found" });
  res.json({ ...updated, price });
});

router.delete("/products/:id", async (req, res) => {
  await db.delete(productsTable).where(eq(productsTable.id, parseInt(req.params.id)));
  res.json({ message: "Deleted" });
});

// ── Sales ──────────────────────────────────────────────────────────────────
router.get("/sales", async (_req, res) => {
  const rows = await db.select({
    sale: salesTable,
    productName: productsTable.name,
  }).from(salesTable)
    .leftJoin(productsTable, eq(salesTable.productId, productsTable.id))
    .orderBy(desc(salesTable.createdAt));

  res.json(rows.map(r => ({
    ...r.sale,
    productName: r.productName ?? "Unknown",
    totalAmount: parseFloat(r.sale.totalAmount as string),
  })));
});

router.post("/sales", async (req, res) => {
  const { productId, quantity, status, customerName } = req.body;
  const [product] = await db.select().from(productsTable).where(eq(productsTable.id, productId));
  if (!product) return res.status(404).json({ message: "Product not found" });
  const totalAmount = parseFloat(product.price as string) * quantity;
  const date = today();
  const [sale] = await db.insert(salesTable).values({
    productId, quantity, totalAmount: String(totalAmount), status, customerName: customerName || null, date,
  }).returning();
  // Deduct stock
  await db.update(productsTable).set({ stock: product.stock - quantity }).where(eq(productsTable.id, productId));
  res.status(201).json({ ...sale, productName: product.name, totalAmount });
});

// ── POS Orders ─────────────────────────────────────────────────────────────

router.get("/pos/products", async (_req, res) => {
  const rows = await db.select().from(productsTable).where(sql`${productsTable.stock} > 0`).orderBy(productsTable.name);
  res.json(rows.map(r => ({ ...r, price: parseFloat(r.price as string) })));
});

router.get("/pos/products/low-stock", async (_req, res) => {
  const rows = await db.select().from(productsTable).where(sql`${productsTable.stock} <= ${productsTable.lowStockThreshold}`).orderBy(productsTable.stock);
  res.json(rows.map(r => ({ ...r, price: parseFloat(r.price as string) })));
});

router.get("/pos/orders", async (req, res) => {
  const { date, status, memberId } = req.query as Record<string, string>;

  const orders = await db.select({
    order: posOrdersTable,
    memberName: membersTable.name,
  }).from(posOrdersTable)
    .leftJoin(membersTable, eq(posOrdersTable.memberId, membersTable.id))
    .orderBy(desc(posOrdersTable.createdAt));

  let filtered = orders;
  if (date) filtered = filtered.filter(r => r.order.date === date);
  if (status && status !== "all") filtered = filtered.filter(r => r.order.status === status);
  if (memberId) filtered = filtered.filter(r => r.order.memberId === parseInt(memberId));

  const orderIds = filtered.map(r => r.order.id);
  const allItems = orderIds.length > 0
    ? await db.select().from(posOrderItemsTable).where(sql`${posOrderItemsTable.orderId} = ANY(ARRAY[${sql.raw(orderIds.join(","))}]::int[])`)
    : [];

  const itemsByOrder = new Map<number, typeof allItems>();
  allItems.forEach(item => {
    const list = itemsByOrder.get(item.orderId) || [];
    list.push(item);
    itemsByOrder.set(item.orderId, list);
  });

  res.json(filtered.map(r => ({
    ...r.order,
    memberName: r.memberName ?? null,
    subtotal: parseFloat(r.order.subtotal as string),
    totalAmount: parseFloat(r.order.totalAmount as string),
    paidAmount: parseFloat(r.order.paidAmount as string),
    dueAmount: parseFloat(r.order.dueAmount as string),
    discount: parseFloat(r.order.discount as string),
    items: (itemsByOrder.get(r.order.id) || []).map(i => ({
      ...i,
      unitPrice: parseFloat(i.unitPrice as string),
      subtotal: parseFloat(i.subtotal as string),
    })),
  })));
});

router.get("/pos/orders/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const [row] = await db.select({ order: posOrdersTable, memberName: membersTable.name })
    .from(posOrdersTable)
    .leftJoin(membersTable, eq(posOrdersTable.memberId, membersTable.id))
    .where(eq(posOrdersTable.id, id));
  if (!row) return res.status(404).json({ message: "Order not found" });

  const items = await db.select().from(posOrderItemsTable).where(eq(posOrderItemsTable.orderId, id));
  res.json({
    ...row.order,
    memberName: row.memberName ?? null,
    subtotal: parseFloat(row.order.subtotal as string),
    totalAmount: parseFloat(row.order.totalAmount as string),
    paidAmount: parseFloat(row.order.paidAmount as string),
    dueAmount: parseFloat(row.order.dueAmount as string),
    discount: parseFloat(row.order.discount as string),
    items: items.map(i => ({ ...i, unitPrice: parseFloat(i.unitPrice as string), subtotal: parseFloat(i.subtotal as string) })),
  });
});

router.post("/pos/orders", async (req, res) => {
  const { memberId, customerName, items, discount, discountType, paymentMethod, paidAmount, notes } = req.body;

  if (!items || items.length === 0) return res.status(400).json({ message: "Cart is empty" });

  // Calculate subtotal from items
  let subtotal = 0;
  const enrichedItems: { productId: number; productName: string; unitPrice: number; quantity: number; subtotal: number }[] = [];

  for (const item of items) {
    const [product] = await db.select().from(productsTable).where(eq(productsTable.id, item.productId));
    if (!product) return res.status(404).json({ message: `Product #${item.productId} not found` });
    if (product.stock < item.quantity) return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
    const unitPrice = parseFloat(product.price as string);
    const lineSubtotal = unitPrice * item.quantity;
    subtotal += lineSubtotal;
    enrichedItems.push({ productId: product.id, productName: product.name, unitPrice, quantity: item.quantity, subtotal: lineSubtotal });
  }

  const discountAmt = discountType === "percent" ? (subtotal * (parseFloat(discount || "0") / 100)) : parseFloat(discount || "0");
  const totalAmount = Math.max(0, subtotal - discountAmt);
  const paid = Math.min(parseFloat(paidAmount || String(totalAmount)), totalAmount);
  const due = totalAmount - paid;
  const status = due <= 0 ? "paid" : paid === 0 ? "unpaid" : "partial";
  const date = today();

  const [order] = await db.insert(posOrdersTable).values({
    memberId: memberId || null,
    customerName: customerName || null,
    discount: String(discountAmt.toFixed(2)),
    discountType: discountType || "fixed",
    subtotal: String(subtotal.toFixed(2)),
    totalAmount: String(totalAmount.toFixed(2)),
    paidAmount: String(paid.toFixed(2)),
    dueAmount: String(due.toFixed(2)),
    paymentMethod: paymentMethod || "cash",
    status,
    notes: notes || null,
    date,
  }).returning();

  // Insert items
  await db.insert(posOrderItemsTable).values(enrichedItems.map(i => ({
    orderId: order.id,
    productId: i.productId,
    productName: i.productName,
    unitPrice: String(i.unitPrice.toFixed(2)),
    quantity: i.quantity,
    subtotal: String(i.subtotal.toFixed(2)),
  })));

  // Deduct stock
  for (const item of enrichedItems) {
    const [p] = await db.select({ stock: productsTable.stock }).from(productsTable).where(eq(productsTable.id, item.productId));
    await db.update(productsTable).set({ stock: p.stock - item.quantity }).where(eq(productsTable.id, item.productId));
  }

  res.status(201).json({ ...order, items: enrichedItems, totalAmount, subtotal, paidAmount: paid, dueAmount: due });
});

router.put("/pos/orders/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { paidAmount, notes } = req.body;
  const [existing] = await db.select().from(posOrdersTable).where(eq(posOrdersTable.id, id));
  if (!existing) return res.status(404).json({ message: "Order not found" });

  const totalAmount = parseFloat(existing.totalAmount as string);
  const paid = Math.min(parseFloat(paidAmount), totalAmount);
  const due = totalAmount - paid;
  const status = due <= 0 ? "paid" : paid === 0 ? "unpaid" : "partial";

  const [updated] = await db.update(posOrdersTable)
    .set({ paidAmount: String(paid.toFixed(2)), dueAmount: String(due.toFixed(2)), status, notes: notes ?? existing.notes })
    .where(eq(posOrdersTable.id, id))
    .returning();
  res.json(updated);
});

router.post("/pos/orders/:id/return", async (req, res) => {
  const id = parseInt(req.params.id);
  const { itemId, returnQty } = req.body;
  const [item] = await db.select().from(posOrderItemsTable).where(and(eq(posOrderItemsTable.id, itemId), eq(posOrderItemsTable.orderId, id)));
  if (!item) return res.status(404).json({ message: "Item not found" });
  const canReturn = item.quantity - item.returned;
  if (returnQty > canReturn) return res.status(400).json({ message: `Can only return up to ${canReturn} units` });
  await db.update(posOrderItemsTable).set({ returned: item.returned + returnQty }).where(eq(posOrderItemsTable.id, itemId));
  if (item.productId) {
    const [p] = await db.select({ stock: productsTable.stock }).from(productsTable).where(eq(productsTable.id, item.productId));
    await db.update(productsTable).set({ stock: p.stock + returnQty }).where(eq(productsTable.id, item.productId));
  }
  res.json({ message: "Return processed" });
});

router.get("/pos/summary", async (req, res) => {
  const { date } = req.query as Record<string, string>;
  const targetDate = date || today();
  const orders = await db.select().from(posOrdersTable).where(eq(posOrdersTable.date, targetDate));
  const total = orders.reduce((s, o) => s + parseFloat(o.totalAmount as string), 0);
  const paid = orders.reduce((s, o) => s + parseFloat(o.paidAmount as string), 0);
  const due = orders.reduce((s, o) => s + parseFloat(o.dueAmount as string), 0);
  const cashTotal = orders.filter(o => o.paymentMethod === "cash").reduce((s, o) => s + parseFloat(o.paidAmount as string), 0);
  const onlineTotal = paid - cashTotal;
  const lowStock = await db.select().from(productsTable).where(sql`${productsTable.stock} <= ${productsTable.lowStockThreshold}`);
  res.json({ date: targetDate, totalSales: orders.length, totalAmount: total, paidAmount: paid, dueAmount: due, cashTotal, onlineTotal, lowStockCount: lowStock.length });
});

router.get("/pos/members", async (_req, res) => {
  const members = await db.select({ id: membersTable.id, name: membersTable.name, phone: membersTable.phone }).from(membersTable).where(eq(membersTable.status, "active")).orderBy(membersTable.name);
  res.json(members);
});

// ── Suppliers ──────────────────────────────────────────────────────────────
router.get("/suppliers", async (_req, res) => {
  const suppliers = await db.select().from(suppliersTable).orderBy(desc(suppliersTable.createdAt));
  const products = await db.select().from(productsTable);
  res.json(suppliers.map(s => ({
    ...s,
    productsCount: products.filter(p => p.supplierId === s.id).length,
  })));
});

router.post("/suppliers", async (req, res) => {
  const { name, contact, email, address } = req.body;
  const [sup] = await db.insert(suppliersTable).values({ name, contact, email: email || null, address: address || null }).returning();
  res.status(201).json({ ...sup, productsCount: 0 });
});

router.put("/suppliers/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, contact, email, address } = req.body;
  const [updated] = await db.update(suppliersTable).set({ name, contact, email: email || null, address: address || null }).where(eq(suppliersTable.id, id)).returning();
  if (!updated) return res.status(404).json({ message: "Not found" });
  res.json({ ...updated, productsCount: 0 });
});

router.delete("/suppliers/:id", async (req, res) => {
  await db.delete(suppliersTable).where(eq(suppliersTable.id, parseInt(req.params.id)));
  res.json({ message: "Deleted" });
});

// ── Accounts ───────────────────────────────────────────────────────────────
router.get("/accounts", async (_req, res) => {
  const rows = await db.select().from(accountsTable).orderBy(accountsTable.name);
  res.json(rows.map(r => ({ ...r, balance: parseFloat(r.balance as string) })));
});

router.get("/vouchers", async (_req, res) => {
  const rows = await db.select({
    voucher: vouchersTable,
    accountName: accountsTable.name,
  }).from(vouchersTable)
    .leftJoin(accountsTable, eq(vouchersTable.accountId, accountsTable.id))
    .orderBy(desc(vouchersTable.createdAt));

  res.json(rows.map(r => ({
    ...r.voucher,
    accountName: r.accountName ?? "Unknown",
    amount: parseFloat(r.voucher.amount as string),
  })));
});

router.post("/vouchers", async (req, res) => {
  const { accountId, type, amount, description, date } = req.body;
  const [v] = await db.insert(vouchersTable).values({ accountId, type, amount: String(amount), description, date }).returning();
  // Update account balance
  const [acc] = await db.select().from(accountsTable).where(eq(accountsTable.id, accountId));
  if (acc) {
    const balance = parseFloat(acc.balance as string);
    const newBalance = type === "income" ? balance + amount : balance - amount;
    await db.update(accountsTable).set({ balance: String(newBalance) }).where(eq(accountsTable.id, accountId));
  }
  const [account] = await db.select().from(accountsTable).where(eq(accountsTable.id, accountId));
  res.status(201).json({ ...v, accountName: account?.name ?? "Unknown", amount });
});

// ── Admin Users ────────────────────────────────────────────────────────────
router.get("/admin/users", async (_req, res) => {
  const rows = await db.select().from(adminUsersTable).orderBy(desc(adminUsersTable.createdAt));
  res.json(rows);
});

router.post("/admin/users", async (req, res) => {
  const { name, email, role, permissions, status } = req.body;
  const [user] = await db.insert(adminUsersTable).values({ name, email, role, permissions: permissions || [], status }).returning();
  res.status(201).json(user);
});

router.put("/admin/users/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, email, role, permissions, status } = req.body;
  const [updated] = await db.update(adminUsersTable).set({ name, email, role, permissions: permissions || [], status }).where(eq(adminUsersTable.id, id)).returning();
  if (!updated) return res.status(404).json({ message: "Not found" });
  res.json(updated);
});

router.delete("/admin/users/:id", async (req, res) => {
  await db.delete(adminUsersTable).where(eq(adminUsersTable.id, parseInt(req.params.id)));
  res.json({ message: "Deleted" });
});

// ── Notifications ──────────────────────────────────────────────────────────
router.get("/notifications", async (_req, res) => {
  const rows = await db.select().from(adminNotificationsTable).orderBy(desc(adminNotificationsTable.createdAt)).limit(50);
  res.json(rows);
});

router.post("/notifications/:id/read", async (req, res) => {
  await db.update(adminNotificationsTable).set({ read: true }).where(eq(adminNotificationsTable.id, parseInt(req.params.id)));
  res.json({ message: "Marked as read" });
});

// ── Business Settings ──────────────────────────────────────────────────────
router.get("/business", async (_req, res) => {
  const [settings] = await db.select().from(businessSettingsTable).limit(1);
  if (!settings) {
    const [created] = await db.insert(businessSettingsTable).values({
      gymName: "GymFit Pro", address: "123 Main Street, Karachi", phone: "+92-300-1234567",
      email: "admin@gymfitpro.com", currency: "PKR", timezone: "Asia/Karachi",
    }).returning();
    return res.json(created);
  }
  res.json(settings);
});

router.put("/business", async (req, res) => {
  const { gymName, address, phone, email, logoUrl, currency, timezone } = req.body;
  const [existing] = await db.select().from(businessSettingsTable).limit(1);
  if (existing) {
    const [updated] = await db.update(businessSettingsTable).set({ gymName, address, phone, email, logoUrl: logoUrl || null, currency, timezone, updatedAt: new Date() }).where(eq(businessSettingsTable.id, existing.id)).returning();
    return res.json(updated);
  }
  const [created] = await db.insert(businessSettingsTable).values({ gymName, address, phone, email, logoUrl: logoUrl || null, currency, timezone }).returning();
  res.json(created);
});

// ── Reports ────────────────────────────────────────────────────────────────
router.get("/reports/financial", async (req, res) => {
  const month = (req.query.month as string) || today().slice(0, 7);
  const monthStart = month + "-01";
  const monthEnd = month + "-31";

  const invoices = await db.select().from(invoicesTable);
  const vouchers = await db.select().from(vouchersTable);

  const membershipIncome = invoices
    .filter(i => i.status === "paid" && i.paidDate && i.paidDate >= monthStart && i.paidDate <= monthEnd)
    .reduce((s, i) => s + parseFloat(i.amount as string), 0);

  const sales = await db.select().from(salesTable);
  const salesIncome = sales
    .filter(s => s.status === "paid" && s.date >= monthStart && s.date <= monthEnd)
    .reduce((s, i) => s + parseFloat(i.totalAmount as string), 0);

  const totalExpenses = vouchers
    .filter(v => v.type === "expense" && v.date >= monthStart && v.date <= monthEnd)
    .reduce((s, v) => s + parseFloat(v.amount as string), 0);

  const totalRevenue = membershipIncome + salesIncome;

  // Build weekly breakdown
  const breakdown = [];
  for (let w = 1; w <= 4; w++) {
    const weekStart = `${month}-${String((w - 1) * 7 + 1).padStart(2, "0")}`;
    const weekEnd = `${month}-${String(w * 7).padStart(2, "0")}`;
    const rev = invoices
      .filter(i => i.status === "paid" && i.paidDate && i.paidDate >= weekStart && i.paidDate <= weekEnd)
      .reduce((s, i) => s + parseFloat(i.amount as string), 0);
    const exp = vouchers
      .filter(v => v.type === "expense" && v.date >= weekStart && v.date <= weekEnd)
      .reduce((s, v) => s + parseFloat(v.amount as string), 0);
    breakdown.push({ month: `Week ${w}`, revenue: Math.round(rev), expenses: Math.round(exp) });
  }

  res.json({ month, totalRevenue, totalExpenses, netProfit: totalRevenue - totalExpenses, membershipIncome, salesIncome, breakdown });
});

router.get("/reports/attendance", async (req, res) => {
  const month = (req.query.month as string) || today().slice(0, 7);
  const rows = await db.select().from(attendanceTable).where(
    and(gte(attendanceTable.date, month + "-01"), lte(attendanceTable.date, month + "-31"))
  );

  const uniqueMembers = new Set(rows.map(r => r.memberId)).size;
  const byDay: Record<string, number> = {};
  for (const r of rows) byDay[r.date] = (byDay[r.date] || 0) + 1;
  const counts = Object.values(byDay);
  const avgDailyVisits = counts.length ? Math.round((counts.reduce((a, b) => a + b, 0) / counts.length) * 10) / 10 : 0;
  const peakDay = Object.entries(byDay).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "N/A";

  const chart = Object.entries(byDay).sort((a, b) => a[0].localeCompare(b[0])).map(([day, count]) => ({ day: day.slice(5), count }));

  res.json({ month, totalVisits: rows.length, uniqueMembers, avgDailyVisits, peakDay, chart });
});

router.get("/reports/members", async (_req, res) => {
  const members = await db.select().from(membersTable);
  const now = today();
  const monthStart = now.slice(0, 7) + "-01";
  const weekEnd = new Date();
  weekEnd.setDate(weekEnd.getDate() + 7);
  const weekEndStr = weekEnd.toISOString().split("T")[0];

  const newThisMonth = members.filter(m => m.createdAt.toISOString().slice(0, 10) >= monthStart).length;
  const expiringThisWeek = members.filter(m => m.planExpiryDate >= now && m.planExpiryDate <= weekEndStr).length;

  const byPlan: Record<string, number> = { monthly: 0, quarterly: 0, yearly: 0 };
  for (const m of members) if (byPlan[m.plan] !== undefined) byPlan[m.plan]++;

  res.json({
    totalMembers: members.length,
    newThisMonth,
    renewalsThisMonth: 0,
    expiringThisWeek,
    byPlan: [
      { name: "Monthly", value: byPlan.monthly, color: "#E31C25" },
      { name: "Quarterly", value: byPlan.quarterly, color: "#FF6B35" },
      { name: "Yearly", value: byPlan.yearly, color: "#22C55E" },
    ],
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// MOBILE CONTENT MANAGEMENT
// ─────────────────────────────────────────────────────────────────────────────

// ── Announcements ──────────────────────────────────────────────────────────
router.get("/app-content/announcements", async (_req, res) => {
  const rows = await db.select().from(appAnnouncementsTable).orderBy(desc(appAnnouncementsTable.createdAt));
  res.json(rows);
});

router.post("/app-content/announcements", async (req, res) => {
  const { title, body, type } = req.body;
  if (!title || !body) return res.status(400).json({ message: "Title and body required" });
  const [row] = await db.insert(appAnnouncementsTable).values({ title, body, type: type || "info" }).returning();
  res.json(row);
});

router.put("/app-content/announcements/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { title, body, type, isActive } = req.body;
  const [row] = await db.update(appAnnouncementsTable)
    .set({ ...(title !== undefined && { title }), ...(body !== undefined && { body }), ...(type !== undefined && { type }), ...(isActive !== undefined && { isActive }) })
    .where(eq(appAnnouncementsTable.id, id)).returning();
  res.json(row);
});

router.delete("/app-content/announcements/:id", async (req, res) => {
  await db.delete(appAnnouncementsTable).where(eq(appAnnouncementsTable.id, parseInt(req.params.id)));
  res.json({ message: "Deleted" });
});

// ── Classes ───────────────────────────────────────────────────────────────
router.get("/app-content/classes", async (_req, res) => {
  const rows = await db.select().from(appClassesTable).orderBy(asc(appClassesTable.date), asc(appClassesTable.time));
  res.json(rows);
});

router.post("/app-content/classes", async (req, res) => {
  const { name, category, instructor, time, date, duration, capacity, location, level } = req.body;
  if (!name || !instructor || !time || !date) return res.status(400).json({ message: "Missing required fields" });
  const [row] = await db.insert(appClassesTable).values({
    name, category: category || "Other", instructor, time, date,
    duration: duration || 60, capacity: capacity || 20, enrolled: 0,
    location: location || "Main Floor", level: level || "All levels",
  }).returning();
  res.json(row);
});

router.put("/app-content/classes/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, category, instructor, time, date, duration, capacity, location, level, isActive } = req.body;
  const [row] = await db.update(appClassesTable).set({
    ...(name !== undefined && { name }), ...(category !== undefined && { category }),
    ...(instructor !== undefined && { instructor }), ...(time !== undefined && { time }),
    ...(date !== undefined && { date }), ...(duration !== undefined && { duration }),
    ...(capacity !== undefined && { capacity }), ...(location !== undefined && { location }),
    ...(level !== undefined && { level }), ...(isActive !== undefined && { isActive }),
  }).where(eq(appClassesTable.id, id)).returning();
  res.json(row);
});

router.delete("/app-content/classes/:id", async (req, res) => {
  await db.delete(appClassesTable).where(eq(appClassesTable.id, parseInt(req.params.id)));
  res.json({ message: "Deleted" });
});

// ── Workout Plans ──────────────────────────────────────────────────────────
router.get("/app-content/workout-plans", async (_req, res) => {
  const plans = await db.select().from(appWorkoutPlansTable).orderBy(asc(appWorkoutPlansTable.id));
  const result = await Promise.all(plans.map(async (p) => {
    const exercises = await db.select().from(appWorkoutExercisesTable)
      .where(eq(appWorkoutExercisesTable.planId, p.id)).orderBy(asc(appWorkoutExercisesTable.order));
    return { ...p, exercises };
  }));
  res.json(result);
});

router.post("/app-content/workout-plans", async (req, res) => {
  const { name, goal, level, duration, daysPerWeek, trainer, exercises } = req.body;
  if (!name) return res.status(400).json({ message: "Plan name required" });
  const [plan] = await db.insert(appWorkoutPlansTable).values({
    name, goal: goal || "General fitness", level: level || "Beginner",
    duration: duration || "4 weeks", daysPerWeek: daysPerWeek || 3,
    trainer: trainer || "",
  }).returning();
  if (exercises && Array.isArray(exercises)) {
    for (let i = 0; i < exercises.length; i++) {
      const ex = exercises[i];
      await db.insert(appWorkoutExercisesTable).values({
        planId: plan.id, name: ex.name, sets: ex.sets || 3, reps: ex.reps || "10", rest: ex.rest || "60s", order: i + 1,
      });
    }
  }
  const exRows = await db.select().from(appWorkoutExercisesTable).where(eq(appWorkoutExercisesTable.planId, plan.id)).orderBy(asc(appWorkoutExercisesTable.order));
  res.json({ ...plan, exercises: exRows });
});

router.put("/app-content/workout-plans/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, goal, level, duration, daysPerWeek, trainer, isActive, exercises } = req.body;
  const [plan] = await db.update(appWorkoutPlansTable).set({
    ...(name !== undefined && { name }), ...(goal !== undefined && { goal }),
    ...(level !== undefined && { level }), ...(duration !== undefined && { duration }),
    ...(daysPerWeek !== undefined && { daysPerWeek }), ...(trainer !== undefined && { trainer }),
    ...(isActive !== undefined && { isActive }),
  }).where(eq(appWorkoutPlansTable.id, id)).returning();
  if (exercises && Array.isArray(exercises)) {
    await db.delete(appWorkoutExercisesTable).where(eq(appWorkoutExercisesTable.planId, id));
    for (let i = 0; i < exercises.length; i++) {
      const ex = exercises[i];
      await db.insert(appWorkoutExercisesTable).values({
        planId: id, name: ex.name, sets: ex.sets || 3, reps: ex.reps || "10", rest: ex.rest || "60s", order: i + 1,
      });
    }
  }
  const exRows = await db.select().from(appWorkoutExercisesTable).where(eq(appWorkoutExercisesTable.planId, id)).orderBy(asc(appWorkoutExercisesTable.order));
  res.json({ ...plan, exercises: exRows });
});

router.delete("/app-content/workout-plans/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(appWorkoutExercisesTable).where(eq(appWorkoutExercisesTable.planId, id));
  await db.delete(appWorkoutPlansTable).where(eq(appWorkoutPlansTable.id, id));
  res.json({ message: "Deleted" });
});

// ── Diet Plans ─────────────────────────────────────────────────────────────
router.get("/app-content/diet-plans", async (_req, res) => {
  const plans = await db.select().from(appDietPlansTable).orderBy(asc(appDietPlansTable.id));
  const result = await Promise.all(plans.map(async (p) => {
    const meals = await db.select().from(appDietMealsTable)
      .where(eq(appDietMealsTable.planId, p.id)).orderBy(asc(appDietMealsTable.order));
    return { ...p, meals };
  }));
  res.json(result);
});

router.post("/app-content/diet-plans", async (req, res) => {
  const { name, goal, calories, protein, carbs, fat, dietitian, meals } = req.body;
  if (!name) return res.status(400).json({ message: "Plan name required" });
  const [plan] = await db.insert(appDietPlansTable).values({
    name, goal: goal || "General health", calories: calories || 2000,
    protein: protein || 100, carbs: carbs || 250, fat: fat || 70,
    dietitian: dietitian || "",
  }).returning();
  if (meals && Array.isArray(meals)) {
    for (let i = 0; i < meals.length; i++) {
      const m = meals[i];
      await db.insert(appDietMealsTable).values({
        planId: plan.id, type: m.type, time: m.time,
        items: m.items || [], calories: m.calories || 0, order: i + 1,
      });
    }
  }
  const mealRows = await db.select().from(appDietMealsTable).where(eq(appDietMealsTable.planId, plan.id)).orderBy(asc(appDietMealsTable.order));
  res.json({ ...plan, meals: mealRows });
});

router.put("/app-content/diet-plans/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { name, goal, calories, protein, carbs, fat, dietitian, isActive, meals } = req.body;
  const [plan] = await db.update(appDietPlansTable).set({
    ...(name !== undefined && { name }), ...(goal !== undefined && { goal }),
    ...(calories !== undefined && { calories }), ...(protein !== undefined && { protein }),
    ...(carbs !== undefined && { carbs }), ...(fat !== undefined && { fat }),
    ...(dietitian !== undefined && { dietitian }), ...(isActive !== undefined && { isActive }),
  }).where(eq(appDietPlansTable.id, id)).returning();
  if (meals && Array.isArray(meals)) {
    await db.delete(appDietMealsTable).where(eq(appDietMealsTable.planId, id));
    for (let i = 0; i < meals.length; i++) {
      const m = meals[i];
      await db.insert(appDietMealsTable).values({
        planId: id, type: m.type, time: m.time,
        items: m.items || [], calories: m.calories || 0, order: i + 1,
      });
    }
  }
  const mealRows = await db.select().from(appDietMealsTable).where(eq(appDietMealsTable.planId, id)).orderBy(asc(appDietMealsTable.order));
  res.json({ ...plan, meals: mealRows });
});

router.delete("/app-content/diet-plans/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  await db.delete(appDietMealsTable).where(eq(appDietMealsTable.planId, id));
  await db.delete(appDietPlansTable).where(eq(appDietPlansTable.id, id));
  res.json({ message: "Deleted" });
});

// ── Onboarding Slides ──────────────────────────────────────────────────────
router.get("/app-content/onboarding-slides", async (_req, res) => {
  const rows = await db.select().from(appOnboardingSlidesTable).orderBy(asc(appOnboardingSlidesTable.order));
  res.json(rows);
});

router.put("/app-content/onboarding-slides/:id", async (req, res) => {
  const id = parseInt(req.params.id);
  const { title, subtitle, description, isActive } = req.body;
  const [row] = await db.update(appOnboardingSlidesTable).set({
    ...(title !== undefined && { title }), ...(subtitle !== undefined && { subtitle }),
    ...(description !== undefined && { description }), ...(isActive !== undefined && { isActive }),
  }).where(eq(appOnboardingSlidesTable.id, id)).returning();
  res.json(row);
});

export default router;
