import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function ForgotPasswordScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const handleReset = async () => {
    if (!email.trim()) { setError("Email is required"); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError("Invalid email address"); return; }
    setError("");
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSent(true);
    }, 1200);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.container, { paddingTop: topPad + 16 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={colors.foreground} />
        </TouchableOpacity>

        {sent ? (
          <View style={styles.center}>
            <View style={[styles.checkWrap, { backgroundColor: colors.success + "20" }]}>
              <Feather name="check-circle" size={48} color={colors.success} />
            </View>
            <Text style={[styles.title, { color: colors.foreground }]}>Check Your Email</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              We've sent a password reset link to{"\n"}
              <Text style={{ color: colors.primary, fontFamily: "Inter_600SemiBold" }}>
                {email}
              </Text>
            </Text>
            <Button title="Back to Login" onPress={() => router.replace("/login")} style={{ marginTop: 24 }} />
          </View>
        ) : (
          <View style={styles.content}>
            <View style={[styles.iconWrap, { backgroundColor: colors.primary + "15" }]}>
              <Feather name="lock" size={40} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.foreground }]}>Forgot Password?</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Enter your email address and we'll send you a link to reset your password.
            </Text>

            <Input
              label="Email Address"
              placeholder="you@example.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              icon="mail"
              error={error}
              containerStyle={{ marginTop: 32 }}
            />

            <Button title="Send Reset Link" onPress={handleReset} loading={loading} size="lg" style={{ marginTop: 8 }} />

            <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
              <Text style={[styles.backLinkText, { color: colors.mutedForeground }]}>
                Remember your password?{" "}
                <Text style={{ color: colors.primary, fontFamily: "Inter_600SemiBold" }}>
                  Sign In
                </Text>
              </Text>
            </TouchableOpacity>
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
  backLink: { marginTop: 24, alignItems: "center" },
  backLinkText: { fontFamily: "Inter_400Regular", fontSize: 15, textAlign: "center" },
});
