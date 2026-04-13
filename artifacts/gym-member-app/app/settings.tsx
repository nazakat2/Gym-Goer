import { router } from "expo-router";
import React, { useState } from "react";
import { Platform, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { Card } from "@/components/ui/Card";

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [notifs, setNotifs] = useState(true);
  const [classReminders, setClassReminders] = useState(true);
  const [paymentAlerts, setPaymentAlerts] = useState(true);
  const [newsletter, setNewsletter] = useState(false);
  const [biometric, setBiometric] = useState(false);

  const section = (title: string) => (
    <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>{title}</Text>
  );

  const settingItem = (
    icon: keyof typeof Feather.glyphMap,
    label: string,
    value: boolean,
    onToggle: (v: boolean) => void,
    color?: string
  ) => (
    <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
      <View style={[styles.settingIcon, { backgroundColor: (color || colors.primary) + "15" }]}>
        <Feather name={icon} size={18} color={color || colors.primary} />
      </View>
      <Text style={[styles.settingLabel, { color: colors.foreground }]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.border, true: colors.primary + "80" }}
        thumbColor={value ? colors.primary : "#f4f3f4"}
      />
    </View>
  );

  const navItem = (icon: keyof typeof Feather.glyphMap, label: string, onPress: () => void, color?: string) => (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.settingRow, { borderBottomColor: colors.border }]}
    >
      <View style={[styles.settingIcon, { backgroundColor: (color || colors.foreground) + "15" }]}>
        <Feather name={icon} size={18} color={color || colors.foreground} />
      </View>
      <Text style={[styles.settingLabel, { color: color || colors.foreground }]}>{label}</Text>
      <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 16 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.screenTitle, { color: colors.foreground }]}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      {section("NOTIFICATIONS")}
      <Card noPadding style={styles.card}>
        {settingItem("bell", "Push Notifications", notifs, setNotifs)}
        {settingItem("calendar", "Class Reminders", classReminders, setClassReminders)}
        {settingItem("credit-card", "Payment Alerts", paymentAlerts, setPaymentAlerts)}
        {settingItem("mail", "Newsletter", newsletter, setNewsletter)}
      </Card>

      {section("SECURITY")}
      <Card noPadding style={styles.card}>
        {settingItem("shield", "Biometric Login", biometric, setBiometric)}
        {navItem("lock", "Change Password", () => {})}
        {navItem("smartphone", "Two-Factor Auth", () => {})}
      </Card>

      {section("SUPPORT")}
      <Card noPadding style={styles.card}>
        {navItem("help-circle", "Help Center", () => {})}
        {navItem("message-circle", "Contact Support", () => {})}
        {navItem("file-text", "Terms of Service", () => {})}
        {navItem("shield", "Privacy Policy", () => {})}
      </Card>

      {section("ACCOUNT")}
      <Card noPadding style={styles.card}>
        {navItem("trash-2", "Delete Account", () => {}, colors.destructive)}
      </Card>

      <Text style={[styles.version, { color: colors.mutedForeground }]}>GymFit v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingBottom: 40 },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  screenTitle: { fontFamily: "Inter_700Bold", fontSize: 18 },
  sectionTitle: { fontFamily: "Inter_600SemiBold", fontSize: 12, letterSpacing: 1, marginBottom: 8, marginTop: 16 },
  card: { marginBottom: 8 },
  settingRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  settingIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  settingLabel: { fontFamily: "Inter_500Medium", fontSize: 15, flex: 1 },
  version: { fontFamily: "Inter_400Regular", fontSize: 13, textAlign: "center", marginTop: 24 },
});
