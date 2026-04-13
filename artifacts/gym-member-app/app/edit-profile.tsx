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
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Avatar } from "@/components/ui/Avatar";

export default function EditProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, updateUser } = useAuth();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Name is required";
    if (!email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Invalid email";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    setTimeout(async () => {
      await updateUser({ name: name.trim(), email: email.trim(), phone: phone.trim() });
      setLoading(false);
      Alert.alert("Success", "Profile updated successfully!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    }, 800);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: topPad + 16 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()}>
            <Feather name="arrow-left" size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.screenTitle, { color: colors.foreground }]}>Edit Profile</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Avatar */}
        <View style={styles.avatarSection}>
          <Avatar name={name || "Member"} size={90} />
          <TouchableOpacity
            style={[styles.changePhotoBtn, { backgroundColor: colors.primary, borderRadius: 99 }]}
          >
            <Feather name="camera" size={14} color="#FFF" />
          </TouchableOpacity>
          <Text style={[styles.changePhotoText, { color: colors.primary }]}>Change Photo</Text>
        </View>

        {/* Form */}
        <Input label="Full Name" placeholder="John Doe" value={name} onChangeText={setName} icon="user" error={errors.name} />
        <Input label="Email" placeholder="you@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" icon="mail" error={errors.email} />
        <Input label="Phone" placeholder="+1 (555) 000-0000" value={phone} onChangeText={setPhone} keyboardType="phone-pad" icon="phone" />

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Security</Text>
        <Button title="Change Password" onPress={() => {}} variant="outline" />

        <Button title="Save Changes" onPress={handleSave} loading={loading} size="lg" style={{ marginTop: 24, marginBottom: 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16 },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  screenTitle: { fontFamily: "Inter_700Bold", fontSize: 18 },
  avatarSection: { alignItems: "center", marginBottom: 32, gap: 8 },
  changePhotoBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center", marginTop: -20, marginLeft: 60 },
  changePhotoText: { fontFamily: "Inter_500Medium", fontSize: 14 },
  divider: { height: 1, marginVertical: 20 },
  sectionLabel: { fontFamily: "Inter_700Bold", fontSize: 16, marginBottom: 16 },
});
