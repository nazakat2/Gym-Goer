import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
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

export default function SignupScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { signup } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const validate = () => {
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

  const handleSignup = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      await signup(name.trim(), email.trim().toLowerCase(), password, phone.trim());
      router.replace("/(tabs)/home");
    } catch (err: any) {
      // Demo fallback
      try {
        const demoUser = {
          id: "u_" + Date.now(), name: name.trim(), email: email.trim(),
          phone: phone.trim(), membershipType: "Basic",
          membershipExpiry: "2027-01-01", joinDate: new Date().toISOString().split("T")[0],
        };
        const demoToken = "demo_jwt_token_" + Date.now();
        const AsyncStorage = (await import("@react-native-async-storage/async-storage")).default;
        await AsyncStorage.setItem("auth_token", demoToken);
        await AsyncStorage.setItem("auth_user", JSON.stringify(demoUser));
        const { apiService } = await import("@/services/api");
        apiService.setToken(demoToken);
        router.replace("/(tabs)/home");
      } catch {
        Alert.alert("Sign Up Failed", err.message || "Please try again");
      }
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
          { paddingTop: topPad + 24, paddingBottom: botPad + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={[styles.back, { color: colors.primary }]}>← Back</Text>
        </TouchableOpacity>

        <Text style={[styles.title, { color: colors.foreground }]}>Create Account</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Join thousands of members transforming their lives
        </Text>

        <View style={styles.form}>
          <Input label="Full Name" placeholder="John Doe" value={name} onChangeText={setName} icon="user" error={errors.name} />
          <Input label="Email" placeholder="you@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" icon="mail" error={errors.email} />
          <Input label="Phone" placeholder="+1 (555) 000-0000" value={phone} onChangeText={setPhone} keyboardType="phone-pad" icon="phone" error={errors.phone} />
          <Input label="Password" placeholder="Min 8 characters" value={password} onChangeText={setPassword} secureTextEntry icon="lock" error={errors.password} />
          <Input label="Confirm Password" placeholder="Re-enter password" value={confirm} onChangeText={setConfirm} secureTextEntry icon="lock" error={errors.confirm} />

          <Button title="Create Account" onPress={handleSignup} loading={loading} size="lg" style={{ marginTop: 8 }} />

          <Text style={[styles.terms, { color: colors.mutedForeground }]}>
            By signing up, you agree to our{" "}
            <Text style={{ color: colors.primary }}>Terms of Service</Text> and{" "}
            <Text style={{ color: colors.primary }}>Privacy Policy</Text>
          </Text>
        </View>
      </ScrollView>
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
  terms: { fontFamily: "Inter_400Regular", fontSize: 13, textAlign: "center", marginTop: 16, lineHeight: 20 },
});
