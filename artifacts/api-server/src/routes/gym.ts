import { Router } from "express";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

const router = Router();
const SECRET = process.env["SESSION_SECRET"] || "gym_secret_key_2026";

// ─── Email transporter ─────────────────────────────────────────────────────
const emailUser = process.env["EMAIL_USER"] || "";
const emailPass = process.env["EMAIL_PASS"] || "";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: emailUser, pass: emailPass },
});

// ─── In-memory stores ──────────────────────────────────────────────────────
const userStore = new Map<string, any>();   // userId → user data
const emailStore = new Map<string, string>(); // email → userId
const resetCodes = new Map<string, { code: string; expiresAt: number }>(); // email → {code, expiry}

function nameFromEmail(email: string): string {
  const local = email.split("@")[0];
  return local
    .split(/[._\-+]/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

function getOrCreateUserByEmail(email: string, extraData: any = {}): any {
  const existingId = emailStore.get(email.toLowerCase());
  if (existingId) {
    const existing = userStore.get(existingId);
    if (existing) return existing;
  }
  const id = "u_" + email.replace(/[^a-z0-9]/gi, "_");
  const newUser = {
    id,
    name: nameFromEmail(email),
    email,
    phone: "",
    membershipType: "Premium",
    membershipExpiry: "2026-12-31",
    joinDate: new Date().toISOString().split("T")[0],
    avatar: null,
    ...extraData,
  };
  userStore.set(id, newUser);
  emailStore.set(email.toLowerCase(), id);
  return newUser;
}

// Middleware: verify token
function auth(req: any, res: any, next: any) {
  const header = req.headers["authorization"];
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  const token = header.slice(7);
  // Allow demo tokens
  if (token.startsWith("demo_jwt_token_")) {
    req.userId = "u1";
    return next();
  }
  try {
    const decoded = jwt.verify(token, SECRET) as any;
    req.userId = decoded.id;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}

// ─── Auth ──────────────────────────────────────────────────────────────────
router.post("/auth/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: "Email and password required" });
  const user = getOrCreateUserByEmail(email.trim().toLowerCase());
  const token = jwt.sign({ id: user.id }, SECRET, { expiresIn: "30d" });
  const { avatar, ...safeUser } = user;
  return res.json({ token, user: { ...safeUser, hasAvatar: !!avatar } });
});

router.post("/auth/signup", (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: "Missing fields" });
  const emailKey = email.trim().toLowerCase();
  const id = "u_" + Date.now();
  const user = {
    id,
    name: name.trim(),
    email: emailKey,
    phone: phone || "",
    membershipType: "Basic",
    membershipExpiry: "2027-01-01",
    joinDate: new Date().toISOString().split("T")[0],
    avatar: null,
  };
  userStore.set(id, user);
  emailStore.set(emailKey, id);
  const token = jwt.sign({ id }, SECRET, { expiresIn: "30d" });
  const { avatar, ...safeUser } = user;
  return res.json({ token, user: safeUser });
});

router.post("/auth/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required" });

  if (!emailUser || !emailPass) {
    return res.status(503).json({ message: "Email service not configured. Please contact support." });
  }

  // Generate 6-digit OTP, valid for 15 minutes
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  resetCodes.set(email.toLowerCase(), { code, expiresAt: Date.now() + 15 * 60 * 1000 });

  try {
    await transporter.sendMail({
      from: `"GymFit App" <${emailUser}>`,
      to: email,
      subject: "GymFit — Your Password Reset Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #0D0D0D; color: #fff; border-radius: 16px; overflow: hidden;">
          <div style="background: #E31C25; padding: 32px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px; color: #fff;">GymFit</h1>
            <p style="margin: 8px 0 0; color: rgba(255,255,255,0.8); font-size: 14px;">Password Reset Request</p>
          </div>
          <div style="padding: 32px; text-align: center;">
            <p style="color: rgba(255,255,255,0.75); font-size: 15px; margin: 0 0 24px;">
              Use the code below to reset your password. This code expires in <strong style="color:#E31C25;">15 minutes</strong>.
            </p>
            <div style="background: #1A1A1A; border: 2px solid #E31C25; border-radius: 12px; padding: 24px; display: inline-block; margin: 0 auto;">
              <span style="font-size: 40px; font-weight: bold; letter-spacing: 12px; color: #E31C25;">${code}</span>
            </div>
            <p style="color: rgba(255,255,255,0.5); font-size: 13px; margin: 24px 0 0;">
              If you didn't request this, you can safely ignore this email.
            </p>
          </div>
          <div style="background: #1A1A1A; padding: 16px; text-align: center;">
            <p style="color: rgba(255,255,255,0.4); font-size: 12px; margin: 0;">GymFit &mdash; Your Fitness Partner</p>
          </div>
        </div>
      `,
    });
    return res.json({ message: "Reset code sent to your email" });
  } catch (err: any) {
    console.error("Email send error:", err.message);
    return res.status(500).json({ message: "Failed to send email. Check credentials or try again." });
  }
});

router.post("/auth/verify-reset-code", (req, res) => {
  const { email, code } = req.body;
  const record = resetCodes.get(email?.toLowerCase());
  if (!record || record.code !== code || Date.now() > record.expiresAt) {
    return res.status(400).json({ message: "Invalid or expired code" });
  }
  return res.json({ message: "Code verified" });
});

router.post("/auth/reset-password", (req, res) => {
  const { email, code, newPassword } = req.body;
  const record = resetCodes.get(email?.toLowerCase());
  if (!record || record.code !== code || Date.now() > record.expiresAt) {
    return res.status(400).json({ message: "Invalid or expired code" });
  }
  resetCodes.delete(email.toLowerCase());
  return res.json({ message: "Password reset successful" });
});

// ─── Profile ───────────────────────────────────────────────────────────────
router.get("/profile", auth, (req: any, res) => {
  const user = userStore.get(req.userId);
  if (!user) return res.status(404).json({ message: "Profile not found" });
  const { avatar, ...safeUser } = user;
  return res.json({ ...safeUser, hasAvatar: !!avatar });
});

router.put("/profile", auth, (req: any, res) => {
  const existing = userStore.get(req.userId) || {};
  const updated = { ...existing, ...req.body, id: req.userId };
  userStore.set(req.userId, updated);
  const { avatar, ...safeUser } = updated;
  return res.json({ ...safeUser, hasAvatar: !!avatar });
});

router.get("/profile/avatar", auth, (req: any, res) => {
  const user = userStore.get(req.userId);
  if (!user?.avatar) return res.status(404).json({ message: "No avatar" });
  return res.json({ avatar: user.avatar });
});

// ─── Membership ────────────────────────────────────────────────────────────
router.get("/membership", auth, (_req, res) => {
  return res.json({
    id: "m1", type: "Premium", startDate: "2026-01-01",
    endDate: "2026-12-31", status: "active",
    features: ["Unlimited gym access","2 personal training sessions/month","Group classes","Sauna"],
    price: 99.99, nextBillingDate: "2026-05-01", autoRenew: true,
  });
});

// ─── Attendance ────────────────────────────────────────────────────────────
router.get("/attendance", auth, (_req, res) => {
  return res.json([
    { id: "a1", date: "2026-04-13", checkIn: "07:30", checkOut: "09:00", duration: 90 },
    { id: "a2", date: "2026-04-11", checkIn: "06:45", checkOut: "08:15", duration: 90 },
    { id: "a3", date: "2026-04-09", checkIn: "18:00", checkOut: "19:30", duration: 90 },
  ]);
});

router.post("/attendance/checkin", auth, (_req, res) => {
  return res.json({ message: "Checked in successfully", time: new Date().toISOString() });
});

// ─── Workout Plans ─────────────────────────────────────────────────────────
router.get("/workout-plans", auth, (_req, res) => {
  return res.json([
    { id: "w1", name: "Strength Builder", level: "Intermediate", duration: "8 weeks", daysPerWeek: 4, isActive: true },
    { id: "w2", name: "Fat Burn HIIT", level: "Advanced", duration: "4 weeks", daysPerWeek: 5, isActive: false },
  ]);
});

router.get("/workout-plans/:id", auth, (req, res) => {
  return res.json({ id: req.params.id, name: "Strength Builder", level: "Intermediate" });
});

// ─── Diet Plans ────────────────────────────────────────────────────────────
router.get("/diet-plans", auth, (_req, res) => {
  return res.json([
    { id: "d1", name: "High Protein Bulk", calories: 3200, protein: 180, carbs: 350, fat: 90, isActive: true },
  ]);
});

router.get("/diet-plans/:id", auth, (req, res) => {
  return res.json({ id: req.params.id, name: "High Protein Bulk", calories: 3200 });
});

// ─── Classes ───────────────────────────────────────────────────────────────
router.get("/classes", auth, (_req, res) => {
  return res.json([
    { id: "c1", name: "Power Yoga", instructor: "Lisa Park", time: "7:00 AM", date: "2026-04-14", duration: 60, capacity: 20, enrolled: 15, isBooked: false },
    { id: "c2", name: "CrossFit WOD", instructor: "Marcus Reid", time: "6:00 AM", date: "2026-04-14", duration: 45, capacity: 15, enrolled: 14, isBooked: true },
  ]);
});

router.post("/classes/book", auth, (_req, res) => {
  return res.json({ message: "Class booked successfully" });
});

router.get("/classes/bookings", auth, (_req, res) => {
  return res.json([{ id: "b1", classId: "c2", className: "CrossFit WOD", date: "2026-04-14" }]);
});

router.delete("/classes/bookings/:id", auth, (_req, res) => {
  return res.json({ message: "Booking cancelled" });
});

// ─── Notifications ─────────────────────────────────────────────────────────
router.get("/notifications", auth, (_req, res) => {
  return res.json([
    { id: "n1", type: "class", title: "Class Reminder", message: "CrossFit WOD starts in 1 hour!", read: false },
    { id: "n2", type: "payment", title: "Payment Due", message: "Your membership renewal is due in 7 days.", read: false },
  ]);
});

router.put("/notifications/:id/read", auth, (req, res) => {
  return res.json({ id: req.params.id, read: true });
});

router.put("/notifications/read-all", auth, (_req, res) => {
  return res.json({ message: "All notifications marked as read" });
});

// ─── Progress ──────────────────────────────────────────────────────────────
router.get("/progress", auth, (_req, res) => {
  return res.json([
    { id: "p1", date: "2026-04-01", weight: 82.5, bodyFat: 18.2, muscleMass: 38.5, bmi: 24.1 },
    { id: "p2", date: "2026-03-01", weight: 83.8, bodyFat: 19.0, muscleMass: 38.0, bmi: 24.5 },
  ]);
});

router.post("/progress", auth, (req, res) => {
  return res.json({ id: "p_" + Date.now(), ...req.body, date: new Date().toISOString().split("T")[0] });
});

// ─── Payments ──────────────────────────────────────────────────────────────
router.get("/payments", auth, (_req, res) => {
  return res.json([
    { id: "pay1", type: "Membership", description: "Premium Membership - April 2026", amount: 99.99, date: "2026-04-01", status: "paid" },
    { id: "pay2", type: "Membership", description: "Premium Membership - March 2026", amount: 99.99, date: "2026-03-01", status: "paid" },
  ]);
});

// ─── Messages ──────────────────────────────────────────────────────────────
router.get("/messages", auth, (_req, res) => {
  return res.json([
    { id: "m1", from: "trainer", text: "Hey! How was the workout?", time: "10:00 AM", date: "2026-04-12" },
    { id: "m2", from: "user", text: "It was intense but great!", time: "10:15 AM", date: "2026-04-12" },
  ]);
});

router.post("/messages", auth, (req, res) => {
  return res.json({ id: "m_" + Date.now(), from: "user", ...req.body });
});

export default router;
