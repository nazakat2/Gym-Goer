import { router } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const LOGO = require("../assets/images/logo.png");

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Invalid email";
    if (!password) e.password = "Password is required";
    else if (password.length < 6) e.password = "Min 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await login(email.trim(), password);
      router.replace("/(tabs)/home");
    } catch (err: any) {
      setErrors({ email: err.message || "Login failed. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: topPad + 32, paddingBottom: botPad + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoArea}>
          <Image source={LOGO} style={styles.logoImage} resizeMode="contain" />
          <Text style={[styles.appName, { color: colors.foreground }]}>Core X</Text>
          <Text style={[styles.tagline, { color: colors.mutedForeground }]}>
            Your fitness journey starts here
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={[styles.title, { color: colors.foreground }]}>Welcome Back</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Sign in to your account
          </Text>

          <Input
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            icon="mail"
            error={errors.email}
          />
          <Input
            label="Password"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            icon="lock"
            error={errors.password}
          />

          <TouchableOpacity
            onPress={() => router.push("/forgot-password")}
            style={styles.forgotBtn}
          >
            <Text style={[styles.forgot, { color: colors.primary }]}>Forgot Password?</Text>
          </TouchableOpacity>

          <Button title="Sign In" onPress={handleLogin} loading={loading} size="lg" />

          <View style={styles.dividerRow}>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.mutedForeground }]}>or</Text>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
          </View>

          <TouchableOpacity
            onPress={() => router.push("/signup")}
            style={[styles.signupBtn, { borderColor: colors.border, borderRadius: colors.radius }]}
          >
            <Text style={[styles.signupText, { color: colors.foreground }]}>
              Don't have an account?{" "}
              <Text style={{ color: colors.primary, fontFamily: "Inter_600SemiBold" }}>
                Sign Up
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 24 },
  logoArea: { alignItems: "center", marginBottom: 40 },
  logoImage: { width: 100, height: 100, marginBottom: 8 },
  appName: { fontFamily: "Inter_700Bold", fontSize: 28 },
  tagline: { fontFamily: "Inter_400Regular", fontSize: 15, marginTop: 4 },
  form: { gap: 0 },
  title: { fontFamily: "Inter_700Bold", fontSize: 28, marginBottom: 6 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 16, marginBottom: 28 },
  forgotBtn: { alignSelf: "flex-end", marginTop: -8, marginBottom: 20 },
  forgot: { fontFamily: "Inter_500Medium", fontSize: 14 },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 20 },
  divider: { flex: 1, height: 1 },
  dividerText: { fontFamily: "Inter_400Regular", fontSize: 13 },
  signupBtn: { alignItems: "center", padding: 14, borderWidth: 1 },
  signupText: { fontFamily: "Inter_400Regular", fontSize: 15 },
});
