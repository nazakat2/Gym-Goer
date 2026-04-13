import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { apiService } from "@/services/api";

type Step = "email" | "otp" | "newpass" | "done";

export default function ForgotPasswordScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const otpRefs = useRef<(TextInput | null)[]>([]);

  const handleSendCode = async () => {
    if (!email.trim()) { setError("Email is required"); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError("Enter a valid email address"); return; }
    setError("");
    setLoading(true);
    try {
      await apiService.forgotPassword(email.trim().toLowerCase());
      setStep("otp");
    } catch (err: any) {
      setError(err.message || "Could not send reset code. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (value: string, index: number) => {
    const updated = [...otp];
    updated[index] = value.replace(/\D/g, "").slice(-1);
    setOtp(updated);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
    if (!value && index > 0) otpRefs.current[index - 1]?.focus();
  };

  const handleVerifyCode = async () => {
    const code = otp.join("");
    if (code.length < 6) { setError("Enter the full 6-digit code"); return; }
    setError("");
    setLoading(true);
    try {
      await apiService.verifyResetCode(email.trim().toLowerCase(), code);
      setStep("newpass");
    } catch (err: any) {
      setError(err.message || "Invalid or expired code");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (newPassword !== confirmPassword) { setError("Passwords do not match"); return; }
    setError("");
    setLoading(true);
    try {
      await apiService.resetPassword(email.trim().toLowerCase(), otp.join(""), newPassword);
      setStep("done");
    } catch (err: any) {
      setError(err.message || "Reset failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.container, { paddingTop: topPad + 16 }]}>
        <TouchableOpacity onPress={() => step === "email" ? router.back() : setStep("email")} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={colors.foreground} />
        </TouchableOpacity>

        {/* Step 1 — Enter Email */}
        {step === "email" && (
          <View style={styles.content}>
            <View style={[styles.iconWrap, { backgroundColor: colors.primary + "15" }]}>
              <Feather name="lock" size={40} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.foreground }]}>Forgot Password?</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Enter your email address and we'll send you a 6-digit reset code.
            </Text>
            <Input
              label="Email Address"
              placeholder="you@gmail.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              icon="mail"
              error={error}
              containerStyle={{ marginTop: 32 }}
            />
            <Button title="Send Reset Code" onPress={handleSendCode} loading={loading} size="lg" style={{ marginTop: 8 }} />
            <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
              <Text style={[styles.backLinkText, { color: colors.mutedForeground }]}>
                Remember your password?{" "}
                <Text style={{ color: colors.primary, fontFamily: "Inter_600SemiBold" }}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step 2 — Enter OTP Code */}
        {step === "otp" && (
          <View style={styles.content}>
            <View style={[styles.iconWrap, { backgroundColor: "#FF6B3515" }]}>
              <Feather name="mail" size={40} color="#FF6B35" />
            </View>
            <Text style={[styles.title, { color: colors.foreground }]}>Check Your Email</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              We sent a 6-digit code to{"\n"}
              <Text style={{ color: colors.primary, fontFamily: "Inter_600SemiBold" }}>{email}</Text>
            </Text>

            <View style={styles.otpRow}>
              {otp.map((digit, i) => (
                <TextInput
                  key={i}
                  ref={(r) => { otpRefs.current[i] = r; }}
                  style={[
                    styles.otpBox,
                    {
                      backgroundColor: colors.card,
                      borderColor: digit ? colors.primary : colors.border,
                      color: colors.foreground,
                    },
                  ]}
                  value={digit}
                  onChangeText={(v) => handleOtpChange(v, i)}
                  keyboardType="number-pad"
                  maxLength={1}
                  textAlign="center"
                  selectTextOnFocus
                />
              ))}
            </View>

            {error ? <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text> : null}

            <Button title="Verify Code" onPress={handleVerifyCode} loading={loading} size="lg" style={{ marginTop: 24 }} />
            <TouchableOpacity onPress={handleSendCode} style={styles.backLink}>
              <Text style={[styles.backLinkText, { color: colors.mutedForeground }]}>
                Didn't get the code?{" "}
                <Text style={{ color: colors.primary, fontFamily: "Inter_600SemiBold" }}>Resend</Text>
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Step 3 — New Password */}
        {step === "newpass" && (
          <View style={styles.content}>
            <View style={[styles.iconWrap, { backgroundColor: "#22C55E15" }]}>
              <Feather name="key" size={40} color="#22C55E" />
            </View>
            <Text style={[styles.title, { color: colors.foreground }]}>Set New Password</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Create a strong new password for your account.
            </Text>
            <Input
              label="New Password"
              placeholder="••••••••"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              icon="lock"
              error={error}
              containerStyle={{ marginTop: 32 }}
            />
            <Input
              label="Confirm Password"
              placeholder="••••••••"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              icon="lock"
            />
            <Button title="Reset Password" onPress={handleResetPassword} loading={loading} size="lg" style={{ marginTop: 8 }} />
          </View>
        )}

        {/* Step 4 — Done */}
        {step === "done" && (
          <View style={styles.center}>
            <View style={[styles.checkWrap, { backgroundColor: "#22C55E20" }]}>
              <Feather name="check-circle" size={52} color="#22C55E" />
            </View>
            <Text style={[styles.title, { color: colors.foreground }]}>Password Reset!</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Your password has been updated successfully. You can now sign in with your new password.
            </Text>
            <Button title="Sign In" onPress={() => router.replace("/login")} style={{ marginTop: 24, width: "100%" }} size="lg" />
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24 },
  backBtn: { marginBottom: 32 },
  content: {},
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  checkWrap: { width: 100, height: 100, borderRadius: 50, alignItems: "center", justifyContent: "center" },
  iconWrap: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  title: { fontFamily: "Inter_700Bold", fontSize: 28, marginBottom: 8 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 16, lineHeight: 24 },
  otpRow: { flexDirection: "row", gap: 10, marginTop: 32, justifyContent: "center" },
  otpBox: {
    width: 48,
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    fontSize: 24,
    fontFamily: "Inter_700Bold",
  },
  errorText: { fontFamily: "Inter_400Regular", fontSize: 14, marginTop: 8, textAlign: "center" },
  backLink: { marginTop: 24, alignItems: "center" },
  backLinkText: { fontFamily: "Inter_400Regular", fontSize: 15, textAlign: "center" },
});
