import { router } from "expo-router";
import React, { useState } from "react";
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { DUMMY_MEMBERSHIP } from "@/utils/dummyData";
import { formatDate } from "@/utils/helpers";

const MENU_ITEMS = [
  { icon: "user" as const, label: "Edit Profile", path: "/edit-profile" },
  { icon: "star" as const, label: "My Membership", path: "/membership" },
  { icon: "calendar" as const, label: "Attendance History", path: "/attendance" },
  { icon: "activity" as const, label: "Workout Plans", path: "/workout-plan" },
  { icon: "coffee" as const, label: "Diet Plan", path: "/diet-plan" },
  { icon: "trending-up" as const, label: "Progress Tracking", path: "/progress" },
  { icon: "credit-card" as const, label: "Payment History", path: "/payments" },
  { icon: "message-circle" as const, label: "Trainer Chat", path: "/trainer-chat" },
  { icon: "settings" as const, label: "Settings", path: "/settings" },
];

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const confirmLogout = async () => {
    setLoggingOut(true);
    await logout();
    setShowLogoutModal(false);
    router.replace("/login");
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: topPad + 16, paddingBottom: botPad + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.screenTitle, { color: colors.foreground }]}>My Profile</Text>

        {/* Profile Card */}
        <Card style={styles.profileCard}>
          <View style={styles.profileRow}>
            <TouchableOpacity onPress={() => router.push("/edit-profile")} activeOpacity={0.8}>
              <Avatar name={user?.name || "Member"} uri={user?.avatar} size={72} />
              <View style={[styles.avatarEditBadge, { backgroundColor: colors.primary }]}>
                <Feather name="camera" size={11} color="#FFF" />
              </View>
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
              <Text style={[styles.profileName, { color: colors.foreground }]}>
                {user?.name || "Alex Johnson"}
              </Text>
              <Text style={[styles.profileEmail, { color: colors.mutedForeground }]}>
                {user?.email}
              </Text>
              <View style={styles.membershipRow}>
                <Badge label={user?.membershipType || "Premium"} variant="primary" />
                <Text style={[styles.joinDate, { color: colors.mutedForeground }]}>
                  Since {formatDate(user?.joinDate || "2024-01-15")}
                </Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Membership Banner */}
        <TouchableOpacity onPress={() => router.push("/membership")}>
          <Card style={[styles.membershipBanner, { borderColor: colors.primary + "40" }]}>
            <View style={styles.membershipBannerRow}>
              <View style={[styles.membershipIconWrap, { backgroundColor: colors.primary + "15" }]}>
                <Feather name="star" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.membershipBannerTitle, { color: colors.foreground }]}>
                  {DUMMY_MEMBERSHIP.type} Membership
                </Text>
                <Text style={[styles.membershipBannerSub, { color: colors.mutedForeground }]}>
                  Expires {formatDate(DUMMY_MEMBERSHIP.endDate)}
                </Text>
              </View>
              <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
            </View>
          </Card>
        </TouchableOpacity>

        {/* Menu */}
        <Card noPadding style={styles.menuCard}>
          {MENU_ITEMS.map((item, i) => (
            <TouchableOpacity
              key={item.label}
              onPress={() => router.push(item.path as any)}
              style={[
                styles.menuItem,
                i < MENU_ITEMS.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
              ]}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIcon, { backgroundColor: colors.muted }]}>
                <Feather name={item.icon} size={18} color={colors.foreground} />
              </View>
              <Text style={[styles.menuLabel, { color: colors.foreground }]}>{item.label}</Text>
              <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          ))}
        </Card>

        {/* Sign Out Button */}
        <TouchableOpacity
          onPress={() => setShowLogoutModal(true)}
          style={[styles.logoutBtn, { backgroundColor: colors.destructive + "15", borderRadius: 12 }]}
          activeOpacity={0.8}
        >
          <Feather name="log-out" size={18} color={colors.destructive} />
          <Text style={[styles.logoutText, { color: colors.destructive }]}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Sign Out Confirmation Modal */}
      <Modal visible={showLogoutModal} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => !loggingOut && setShowLogoutModal(false)}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>
        <View style={styles.dialogWrap} pointerEvents="box-none">
          <View style={[styles.dialog, { backgroundColor: colors.card }]}>
            {/* Icon */}
            <View style={[styles.dialogIconWrap, { backgroundColor: colors.destructive + "15" }]}>
              <Feather name="log-out" size={28} color={colors.destructive} />
            </View>

            <Text style={[styles.dialogTitle, { color: colors.foreground }]}>Sign Out</Text>
            <Text style={[styles.dialogMsg, { color: colors.mutedForeground }]}>
              Are you sure you want to sign out of your account?
            </Text>

            <TouchableOpacity
              onPress={confirmLogout}
              disabled={loggingOut}
              style={[
                styles.dialogConfirmBtn,
                { backgroundColor: colors.destructive, opacity: loggingOut ? 0.7 : 1 },
              ]}
              activeOpacity={0.85}
            >
              <Feather name="log-out" size={16} color="#FFF" />
              <Text style={styles.dialogConfirmText}>
                {loggingOut ? "Signing out..." : "Yes, Sign Out"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setShowLogoutModal(false)}
              disabled={loggingOut}
              style={[styles.dialogCancelBtn, { borderColor: colors.border }]}
              activeOpacity={0.7}
            >
              <Text style={[styles.dialogCancelText, { color: colors.foreground }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16 },
  screenTitle: { fontFamily: "Inter_700Bold", fontSize: 24, marginBottom: 20 },

  profileCard: { marginBottom: 14 },
  profileRow: { flexDirection: "row", gap: 16, alignItems: "center" },
  profileName: { fontFamily: "Inter_700Bold", fontSize: 20 },
  profileEmail: { fontFamily: "Inter_400Regular", fontSize: 14, marginTop: 2 },
  membershipRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  joinDate: { fontFamily: "Inter_400Regular", fontSize: 12 },
  avatarEditBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFF",
  },

  membershipBanner: { marginBottom: 20, borderWidth: 1.5 },
  membershipBannerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  membershipIconWrap: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  membershipBannerTitle: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  membershipBannerSub: { fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 2 },

  menuCard: { marginBottom: 20 },
  menuItem: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 16, paddingVertical: 14 },
  menuIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  menuLabel: { fontFamily: "Inter_500Medium", fontSize: 15, flex: 1 },

  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 15 },
  logoutText: { fontFamily: "Inter_600SemiBold", fontSize: 16 },

  overlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  dialogWrap: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  dialog: {
    width: "100%",
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 12,
  },
  dialogIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  dialogTitle: { fontFamily: "Inter_700Bold", fontSize: 20, marginBottom: 8 },
  dialogMsg: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  dialogConfirmBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  dialogConfirmText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#FFF" },
  dialogCancelBtn: {
    width: "100%",
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
  },
  dialogCancelText: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
});
