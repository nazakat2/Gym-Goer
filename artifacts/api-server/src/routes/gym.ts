import { Router } from "express";
import jwt from "jsonwebtoken";

const router = Router();
const SECRET = process.env["SESSION_SECRET"] || "gym_secret_key_2026";

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
  const user = {
    id: "u1", name: "Alex Johnson", email,
    membershipType: "Premium", membershipExpiry: "2026-12-31", joinDate: "2024-01-15",
  };
  const token = jwt.sign({ id: user.id }, SECRET, { expiresIn: "30d" });
  return res.json({ token, user });
});

router.post("/auth/signup", (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password) return res.status(400).json({ message: "Missing fields" });
  const user = {
    id: "u_" + Date.now(), name, email, phone,
    membershipType: "Basic", membershipExpiry: "2027-01-01",
    joinDate: new Date().toISOString().split("T")[0],
  };
  const token = jwt.sign({ id: user.id }, SECRET, { expiresIn: "30d" });
  return res.json({ token, user });
});

router.post("/auth/forgot-password", (req, res) => {
  return res.json({ message: "Reset email sent" });
});

// ─── Profile ───────────────────────────────────────────────────────────────
router.get("/profile", auth, (req, res) => {
  return res.json({
    id: "u1", name: "Alex Johnson", email: "alex@example.com",
    phone: "+1 (555) 123-4567", membershipType: "Premium",
    membershipExpiry: "2026-12-31", joinDate: "2024-01-15",
  });
});

router.put("/profile", auth, (req, res) => {
  return res.json({ ...req.body, id: "u1" });
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
