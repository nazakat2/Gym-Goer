import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { apiService } from "@/services/api";

const TERMS = `Terms of Service\n\nLast updated: January 1, 2026\n\n1. ACCEPTANCE OF TERMS\nBy using GymFit, you agree to these Terms of Service. If you don't agree, please don't use the app.\n\n2. MEMBERSHIP\nMembership plans are billed monthly or annually as selected. Cancellations take effect at the end of the billing period.\n\n3. USE OF FACILITIES\nMembers must follow gym rules and respect other members. Misuse may result in membership termination.\n\n4. HEALTH & SAFETY\nConsult a doctor before starting a new fitness program. GymFit is not liable for injuries resulting from exercise.\n\n5. PERSONAL DATA\nWe collect and process your data as described in our Privacy Policy.\n\n6. INTELLECTUAL PROPERTY\nAll content in the app is owned by GymFit and protected by copyright.\n\n7. LIMITATION OF LIABILITY\nGymFit's liability is limited to the amount paid for your membership in the last 3 months.\n\n8. CHANGES TO TERMS\nWe may update these terms. You will be notified of significant changes.\n\n9. CONTACT\nFor questions, contact support@gymfit.com`;

const PRIVACY = `Privacy Policy\n\nLast updated: January 1, 2026\n\n1. DATA WE COLLECT\n• Name, email, phone number\n• Fitness goals and health data\n• Attendance and workout history\n• Payment information (processed securely)\n• Device and usage data\n\n2. HOW WE USE YOUR DATA\n• To manage your membership and bookings\n• To personalize workout and diet recommendations\n• To send notifications you've opted in to\n• To improve our services\n\n3. DATA SHARING\nWe do not sell your personal data. We may share data with:\n• Payment processors\n• Assigned trainers\n• Legal authorities if required\n\n4. DATA SECURITY\nAll data is encrypted in transit and at rest. We follow industry best practices.\n\n5. YOUR RIGHTS\n• Access your data at any time\n• Request data deletion\n• Export your data\n• Opt-out of marketing\n\n6. COOKIES\nThe app uses minimal local storage for session management only.\n\n7. CONTACT\nPrivacy questions: privacy@gymfit.com`;

type ModalType = "terms" | "privacy" | null;
type Step = "form" | "otp";

const OTP_LENGTH = 6;

export default function SignupScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { signup } = useAuth();

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  // OTP state
  const [step, setStep] = useState<Step>("form");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef<(TextInput | null)[]>([]);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Shared
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  // ── Validation ────────────────────────────────────────────────────────────
  const validateForm = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Name is required";
    if (!email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Invalid email";
    if (!phone.trim()) e.phone = "Phone is required";
    if (!password) e.password = "Password is required";
    else if (password.length < 8) e.password = "Min 8 characters";
    if (password !== confirm) e.confirm = "Passwords don't match";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Send OTP ──────────────────────────────────────────────────────────────
  const handleSendOtp = async () => {
    if (!validateForm()) return;
    setLoading(true);
    setErrors({});
    try {
      await apiService.sendSignupOtp(name.trim(), email.trim().toLowerCase(), password, phone.trim());
      setStep("otp");
      startCooldown();
    } catch (err: any) {
      setErrors({ email: err.message || "Failed to send OTP. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  // ── Resend cooldown timer ─────────────────────────────────────────────────
  const startCooldown = () => {
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setLoading(true);
    setErrors({});
    try {
      await apiService.sendSignupOtp(name.trim(), email.trim().toLowerCase(), password, phone.trim());
      setOtpDigits(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
      startCooldown();
    } catch (err: any) {
      setErrors({ otp: err.message || "Failed to resend OTP." });
    } finally {
      setLoading(false);
    }
  };

  // ── OTP input handling ────────────────────────────────────────────────────
  const handleOtpChange = (text: string, idx: number) => {
    const digit = text.replace(/\D/g, "").slice(-1);
    const next = [...otpDigits];
    next[idx] = digit;
    setOtpDigits(next);
    if (digit && idx < OTP_LENGTH - 1) {
      otpRefs.current[idx + 1]?.focus();
    }
  };

  const handleOtpKeyPress = (e: any, idx: number) => {
    if (e.nativeEvent.key === "Backspace" && !otpDigits[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  };

  const getOtpString = () => otpDigits.join("");

  // ── Create account ────────────────────────────────────────────────────────
  const handleVerifyAndCreate = async () => {
    const otp = getOtpString();
    if (otp.length < OTP_LENGTH) {
      setErrors({ otp: "Please enter all 6 digits" });
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      await signup(name.trim(), email.trim().toLowerCase(), password, phone.trim(), otp);
      router.replace("/(tabs)/home");
    } catch (err: any) {
      setErrors({ otp: err.message || "Verification failed. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const modalContent = activeModal === "terms" ? TERMS : PRIVACY;
  const modalTitle = activeModal === "terms" ? "Terms of Service" : "Privacy Policy";
  const modalIcon = activeModal === "terms" ? "file-text" : "shield";

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: topPad + 24, paddingBottom: botPad + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          onPress={() => {
            if (step === "otp") { setStep("form"); setErrors({}); }
            else router.back();
          }}
          style={styles.backBtn}
        >
          <Text style={[styles.back, { color: colors.primary }]}>← Back</Text>
        </TouchableOpacity>

        {/* ── Step 1: Registration form ── */}
        {step === "form" && (
          <>
            <Text style={[styles.title, { color: colors.foreground }]}>Create Account</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Join thousands of members transforming their lives
            </Text>

            <View style={styles.form}>
              <Input label="Full Name" placeholder="John Doe" value={name} onChangeText={(t) => { setName(t); setErrors({}); }} icon="user" error={errors.name} />
              <Input label="Email" placeholder="you@example.com" value={email} onChangeText={(t) => { setEmail(t); setErrors({}); }} keyboardType="email-address" autoCapitalize="none" icon="mail" error={errors.email} />
              <Input label="Phone" placeholder="+92 3XX-XXXXXXX" value={phone} onChangeText={(t) => { setPhone(t); setErrors({}); }} keyboardType="phone-pad" icon="phone" error={errors.phone} />
              <Input label="Password" placeholder="Min 8 characters" value={password} onChangeText={(t) => { setPassword(t); setErrors({}); }} secureTextEntry icon="lock" error={errors.password} />
              <Input label="Confirm Password" placeholder="Re-enter password" value={confirm} onChangeText={(t) => { setConfirm(t); setErrors({}); }} secureTextEntry icon="lock" error={errors.confirm} />

              <Button title="Send Verification Code" onPress={handleSendOtp} loading={loading} size="lg" style={{ marginTop: 8 }} />

              <Text style={[styles.terms, { color: colors.mutedForeground }]}>
                By signing up, you agree to our{" "}
                <Text style={{ color: colors.primary, fontFamily: "Inter_600SemiBold" }} onPress={() => setActiveModal("terms")}>
                  Terms of Service
                </Text>
                {" "}and{" "}
                <Text style={{ color: colors.primary, fontFamily: "Inter_600SemiBold" }} onPress={() => setActiveModal("privacy")}>
                  Privacy Policy
                </Text>
              </Text>
            </View>
          </>
        )}

        {/* ── Step 2: OTP verification ── */}
        {step === "otp" && (
          <>
            <View style={[styles.otpIconWrap, { backgroundColor: colors.primary + "18" }]}>
              <Feather name="mail" size={28} color={colors.primary} />
            </View>

            <Text style={[styles.title, { color: colors.foreground }]}>Verify Your Email</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              We sent a 6-digit code to{"\n"}
              <Text style={{ color: colors.foreground, fontFamily: "Inter_600SemiBold" }}>{email.toLowerCase()}</Text>
              {"\n"}Enter it below to complete your signup.
            </Text>

            {/* OTP boxes */}
            <View style={styles.otpRow}>
              {otpDigits.map((digit, idx) => (
                <TextInput
                  key={idx}
                  ref={(r) => { otpRefs.current[idx] = r; }}
                  style={[
                    styles.otpBox,
                    {
                      backgroundColor: colors.card,
                      borderColor: digit ? colors.primary : colors.border,
                      color: colors.foreground,
                    },
                  ]}
                  value={digit}
                  onChangeText={(t) => handleOtpChange(t, idx)}
                  onKeyPress={(e) => handleOtpKeyPress(e, idx)}
                  keyboardType="number-pad"
                  maxLength={1}
                  textAlign="center"
                  selectTextOnFocus
                  autoFocus={idx === 0}
                />
              ))}
            </View>

            {errors.otp ? (
              <Text style={[styles.errorText, { color: colors.primary }]}>{errors.otp}</Text>
            ) : null}

            <Button
              title="Verify & Create Account"
              onPress={handleVerifyAndCreate}
              loading={loading}
              size="lg"
              style={{ marginTop: 24 }}
            />

            {/* Resend */}
            <View style={styles.resendRow}>
              <Text style={[styles.resendLabel, { color: colors.mutedForeground }]}>
                Didn't receive it?{" "}
              </Text>
              <TouchableOpacity onPress={handleResend} disabled={resendCooldown > 0 || loading}>
                <Text style={[
                  styles.resendLink,
                  { color: resendCooldown > 0 ? colors.mutedForeground : colors.primary }
                ]}>
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.expiry, { color: colors.mutedForeground }]}>
              Code expires in 10 minutes
            </Text>
          </>
        )}
      </ScrollView>

      {/* Terms / Privacy Modal */}
      <Modal visible={!!activeModal} transparent animationType="slide">
        <TouchableWithoutFeedback onPress={() => setActiveModal(null)}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>
        <View style={[styles.sheet, { backgroundColor: colors.card }]}>
          <View style={[styles.sheetHeader, { borderBottomColor: colors.border }]}>
            <View style={[styles.sheetIconWrap, { backgroundColor: colors.primary + "18" }]}>
              <Feather name={modalIcon as any} size={20} color={colors.primary} />
            </View>
            <Text style={[styles.sheetTitle, { color: colors.foreground }]}>{modalTitle}</Text>
            <TouchableOpacity onPress={() => setActiveModal(null)} style={styles.closeBtn}>
              <Feather name="x" size={22} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.sheetBody} contentContainerStyle={{ paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
            {modalContent.split("\n\n").map((para, i) => {
              const isHeading = para.startsWith(modalTitle) || /^\d+\./.test(para);
              return (
                <Text key={i} style={[isHeading ? styles.paraHeading : styles.paraBody, { color: isHeading ? colors.foreground : colors.mutedForeground }, i > 0 && { marginTop: 14 }]}>
                  {para}
                </Text>
              );
            })}
          </ScrollView>
          <View style={[styles.sheetFooter, { borderTopColor: colors.border }]}>
            <TouchableOpacity onPress={() => setActiveModal(null)} style={[styles.closeFullBtn, { backgroundColor: colors.primary }]}>
              <Text style={styles.closeFullBtnText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 24 },
  backBtn: { marginBottom: 24 },
  back: { fontFamily: "Inter_500Medium", fontSize: 16 },
  title: { fontFamily: "Inter_700Bold", fontSize: 28, marginBottom: 8 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 15, marginBottom: 28, lineHeight: 22 },
  form: {},
  terms: { fontFamily: "Inter_400Regular", fontSize: 13, textAlign: "center", marginTop: 16, lineHeight: 22 },

  otpIconWrap: { width: 64, height: 64, borderRadius: 18, alignItems: "center", justifyContent: "center", marginBottom: 20 },
  otpRow: { flexDirection: "row", gap: 10, justifyContent: "center", marginBottom: 4 },
  otpBox: {
    width: 46,
    height: 58,
    borderRadius: 12,
    borderWidth: 2,
    fontSize: 24,
    fontFamily: "Inter_700Bold",
  },
  errorText: { fontFamily: "Inter_500Medium", fontSize: 14, textAlign: "center", marginTop: 8 },
  resendRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 20 },
  resendLabel: { fontFamily: "Inter_400Regular", fontSize: 14 },
  resendLink: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  expiry: { fontFamily: "Inter_400Regular", fontSize: 13, textAlign: "center", marginTop: 12 },

  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)" },
  sheet: { position: "absolute", bottom: 0, left: 0, right: 0, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: "82%", shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 24 },
  sheetHeader: { flexDirection: "row", alignItems: "center", gap: 12, padding: 20, borderBottomWidth: 1 },
  sheetIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  sheetTitle: { fontFamily: "Inter_700Bold", fontSize: 17, flex: 1 },
  closeBtn: { padding: 4 },
  sheetBody: { paddingHorizontal: 20, paddingTop: 16 },
  paraHeading: { fontFamily: "Inter_700Bold", fontSize: 14 },
  paraBody: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 22 },
  sheetFooter: { padding: 16, borderTopWidth: 1 },
  closeFullBtn: { borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  closeFullBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#FFF" },
});
