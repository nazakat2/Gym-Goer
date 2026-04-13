import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Activity, Eye, EyeOff, ArrowLeft, CheckCircle2 } from "lucide-react";

type Step = "login" | "forgot-email" | "forgot-otp" | "forgot-success";

async function apiFetch(path: string, body: object) {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  let data: Record<string, unknown> = {};
  try { data = await res.json(); } catch {}
  if (!res.ok) throw new Error((data.message as string) || "Something went wrong");
  return data;
}

export default function Login() {
  const { login } = useAuth();

  // ── Login state ─────────────────────────────────────────────
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // ── Forgot password state ────────────────────────────────────
  const [fpEmail, setFpEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");

  // ── Shared ───────────────────────────────────────────────────
  const [step, setStep] = useState<Step>("login");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const clearError = () => setError("");

  // ── Handlers ─────────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError("Email and password are required"); return; }
    setError(""); setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fpEmail) { setError("Email is required"); return; }
    setError(""); setLoading(true);
    try {
      await apiFetch("/api/auth/forgot-password", { email: fpEmail });
      setStep("forgot-otp");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) { setError("Enter the OTP"); return; }
    if (!newPassword) { setError("Enter a new password"); return; }
    if (newPassword.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (newPassword !== confirmPassword) { setError("Passwords do not match"); return; }
    setError(""); setLoading(true);
    try {
      await apiFetch("/api/auth/reset-password", { email: fpEmail, otp, newPassword });
      setStep("forgot-success");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setError(""); setLoading(true);
    try {
      await apiFetch("/api/auth/forgot-password", { email: fpEmail });
      setError(""); 
      setOtp("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Logo ─────────────────────────────────────────────────────
  const Logo = () => (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-primary shadow-lg">
        <Activity className="h-8 w-8 text-white" />
      </div>
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">GymAdmin</h1>
        <p className="text-sm text-muted-foreground">Gym Management System</p>
      </div>
    </div>
  );

  const ErrorBox = () => error ? (
    <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
      {error}
    </div>
  ) : null;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        <Logo />

        {/* ── Step 1: Login ── */}
        {step === "login" && (
          <Card className="shadow-md">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-xl">Sign In</CardTitle>
              <CardDescription>Enter your credentials to access the admin panel</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@gymfitpro.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); clearError(); }}
                    autoFocus
                    autoComplete="email"
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <button
                      type="button"
                      onClick={() => { setFpEmail(email); setStep("forgot-email"); clearError(); }}
                      className="text-xs text-primary hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); clearError(); }}
                      autoComplete="current-password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <ErrorBox />

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In"}
                </Button>
              </form>

              <div className="mt-4 rounded-md bg-muted p-3 text-xs text-muted-foreground space-y-1">
                <p className="font-medium text-foreground">Demo Credentials:</p>
                <p>Admin: <span className="font-mono">admin@gymfitpro.com</span> / <span className="font-mono">admin123</span></p>
                <p>Staff: <span className="font-mono">staff@gymfitpro.com</span> / <span className="font-mono">staff123</span></p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Step 2: Enter email for OTP ── */}
        {step === "forgot-email" && (
          <Card className="shadow-md">
            <CardHeader className="space-y-1 pb-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => { setStep("login"); clearError(); }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <CardTitle className="text-xl">Forgot Password</CardTitle>
              </div>
              <CardDescription>
                Enter your admin email and we'll send a 6-digit OTP to reset your password.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fp-email">Email Address</Label>
                  <Input
                    id="fp-email"
                    type="email"
                    placeholder="admin@gymfitpro.com"
                    value={fpEmail}
                    onChange={(e) => { setFpEmail(e.target.value); clearError(); }}
                    autoFocus
                  />
                </div>

                <ErrorBox />

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Sending OTP..." : "Send OTP"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* ── Step 3: Enter OTP + new password ── */}
        {step === "forgot-otp" && (
          <Card className="shadow-md">
            <CardHeader className="space-y-1 pb-4">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => { setStep("forgot-email"); clearError(); setOtp(""); }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <CardTitle className="text-xl">Enter OTP</CardTitle>
              </div>
              <CardDescription>
                A 6-digit OTP was sent to <strong>{fpEmail}</strong>. It expires in 10 minutes.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp">One-Time Password (OTP)</Label>
                  <Input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "")); clearError(); }}
                    autoFocus
                    className="tracking-[0.4em] text-center font-mono text-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <div className="relative">
                    <Input
                      id="new-password"
                      type={showNewPassword ? "text" : "password"}
                      placeholder="Min. 6 characters"
                      value={newPassword}
                      onChange={(e) => { setNewPassword(e.target.value); clearError(); }}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); clearError(); }}
                  />
                </div>

                <ErrorBox />

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Resetting..." : "Reset Password"}
                </Button>

                <p className="text-center text-xs text-muted-foreground">
                  Didn't receive it?{" "}
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={loading}
                    className="text-primary hover:underline disabled:opacity-50"
                  >
                    Resend OTP
                  </button>
                </p>
              </form>
            </CardContent>
          </Card>
        )}

        {/* ── Step 4: Success ── */}
        {step === "forgot-success" && (
          <Card className="shadow-md">
            <CardContent className="pt-8 pb-6 flex flex-col items-center gap-4 text-center">
              <CheckCircle2 className="h-14 w-14 text-green-500" />
              <div>
                <h2 className="text-xl font-bold">Password Reset!</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Your password has been updated successfully.
                </p>
              </div>
              <Button
                className="w-full mt-2"
                onClick={() => {
                  setStep("login");
                  setFpEmail(""); setOtp(""); setNewPassword(""); setConfirmPassword("");
                  clearError();
                }}
              >
                Back to Sign In
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
