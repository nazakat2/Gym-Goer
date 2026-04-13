import { router } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  RefreshControl,
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
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { ProgressBar } from "@/components/ui/ProgressBar";
import {
  DUMMY_ATTENDANCE,
  DUMMY_CLASSES,
  DUMMY_NOTIFICATIONS,
  DUMMY_MEMBERSHIP,
} from "@/utils/dummyData";
import { formatDate, getDaysUntil } from "@/utils/helpers";

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const unreadCount = DUMMY_NOTIFICATIONS.filter((n) => !n.read).length;
  const daysLeft = getDaysUntil(DUMMY_MEMBERSHIP.endDate);
  const membershipProgress = Math.max(0, 1 - daysLeft / 365);
  const upcomingClass = DUMMY_CLASSES.find((c) => c.isBooked);
  const thisMonthAttendance = DUMMY_ATTENDANCE.length;

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 16 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
            Good Morning,
          </Text>
          <Text style={[styles.name, { color: colors.foreground }]}>
            {user?.name?.split(" ")[0] || "Member"} 
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[styles.notifBtn, { backgroundColor: colors.card }]}
            onPress={() => router.push("/(tabs)/notifications")}
          >
            <Feather name="bell" size={22} color={colors.foreground} />
            {unreadCount > 0 && (
              <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push("/(tabs)/profile")}>
            <Avatar name={user?.name || "Member"} uri={user?.avatar} size={44} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Membership Banner */}
      <TouchableOpacity onPress={() => router.push("/membership")}>
        <Card
          style={[styles.membershipCard, { backgroundColor: colors.primary }]}
          noPadding
        >
          <View style={styles.membershipInner}>
            <View>
              <Text style={styles.membershipLabel}>Active Membership</Text>
              <Text style={styles.membershipType}>{DUMMY_MEMBERSHIP.type}</Text>
              <Text style={styles.membershipExpiry}>
                {daysLeft > 0 ? `${daysLeft} days remaining` : "Expired"}
              </Text>
            </View>
            <View style={styles.membershipRight}>
              <View style={[styles.memberBadge, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
                <Feather name="star" size={16} color="#FFD700" />
                <Text style={styles.memberBadgeText}>Premium</Text>
              </View>
            </View>
          </View>
          <ProgressBar
            progress={membershipProgress}
            color="rgba(255,255,255,0.5)"
            style={{ marginHorizontal: 16, marginBottom: 16 }}
          />
        </Card>
      </TouchableOpacity>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <StatCard label="Workouts" value={`${thisMonthAttendance}`} icon="activity" color={colors.primary} />
        <StatCard label="Streak" value="7 days" icon="zap" color="#FF6B35" />
        <StatCard label="Classes" value="3 left" icon="calendar" color="#22C55E" />
      </View>

      {/* Quick Actions */}
      <SectionHeader title="Quick Actions" />
      <View style={styles.quickActions}>
        {[
          { label: "Workout", icon: "activity" as const, path: "/workout-plan" },
          { label: "Diet Plan", icon: "coffee" as const, path: "/diet-plan" },
          { label: "Book Class", icon: "calendar" as const, path: "/classes" },
          { label: "Progress", icon: "trending-up" as const, path: "/progress" },
        ].map((item) => (
          <TouchableOpacity
            key={item.label}
            style={[styles.quickBtn, { backgroundColor: colors.card, borderColor: colors.border, borderRadius: colors.radius }]}
            onPress={() => router.push(item.path as any)}
          >
            <View style={[styles.quickIcon, { backgroundColor: colors.primary + "15" }]}>
              <Feather name={item.icon} size={22} color={colors.primary} />
            </View>
            <Text style={[styles.quickLabel, { color: colors.foreground }]}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Upcoming Class */}
      {upcomingClass && (
        <>
          <SectionHeader title="Upcoming Class" action="All Classes" onAction={() => router.push("/classes")} />
          <Card style={styles.upcomingCard}>
            <View style={styles.classRow}>
              <View style={[styles.classTime, { backgroundColor: colors.primary + "15", borderRadius: colors.radius }]}>
                <Text style={[styles.classTimeText, { color: colors.primary }]}>{upcomingClass.time}</Text>
                <Text style={[styles.classTimeSub, { color: colors.mutedForeground }]}>{formatDate(upcomingClass.date)}</Text>
              </View>
              <View style={styles.classInfo}>
                <Text style={[styles.className, { color: colors.foreground }]}>{upcomingClass.name}</Text>
                <Text style={[styles.classInstructor, { color: colors.mutedForeground }]}>
                  with {upcomingClass.instructor}
                </Text>
                <View style={styles.classMeta}>
                  <Feather name="map-pin" size={12} color={colors.mutedForeground} />
                  <Text style={[styles.classMetaText, { color: colors.mutedForeground }]}>{upcomingClass.location}</Text>
                  <Feather name="clock" size={12} color={colors.mutedForeground} />
                  <Text style={[styles.classMetaText, { color: colors.mutedForeground }]}>{upcomingClass.duration}min</Text>
                </View>
              </View>
              <Badge label="Booked" variant="success" />
            </View>
          </Card>
        </>
      )}

      {/* Recent Attendance */}
      <SectionHeader title="Recent Activity" action="View All" onAction={() => router.push("/attendance")} />
      {DUMMY_ATTENDANCE.slice(0, 3).map((a) => (
        <Card key={a.id} style={styles.attendanceCard}>
          <View style={styles.attendanceRow}>
            <View style={[styles.attendanceDot, { backgroundColor: colors.success + "20" }]}>
              <Feather name="check" size={14} color={colors.success} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.attendanceDate, { color: colors.foreground }]}>{formatDate(a.date)}</Text>
              <Text style={[styles.attendanceSub, { color: colors.mutedForeground }]}>
                {a.checkIn} → {a.checkOut}
              </Text>
            </View>
            <Text style={[styles.attendanceDuration, { color: colors.primary }]}>{a.duration}min</Text>
          </View>
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingBottom: 100 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  greeting: { fontFamily: "Inter_400Regular", fontSize: 14 },
  name: { fontFamily: "Inter_700Bold", fontSize: 24 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 10 },
  notifBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  badge: { position: "absolute", top: 6, right: 6, width: 16, height: 16, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  badgeText: { color: "#FFF", fontSize: 10, fontFamily: "Inter_700Bold" },
  membershipCard: { marginBottom: 20, borderWidth: 0 },
  membershipInner: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", padding: 16, paddingBottom: 12 },
  membershipLabel: { color: "rgba(255,255,255,0.8)", fontFamily: "Inter_400Regular", fontSize: 13 },
  membershipType: { color: "#FFF", fontFamily: "Inter_700Bold", fontSize: 22 },
  membershipExpiry: { color: "rgba(255,255,255,0.8)", fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 2 },
  membershipRight: {},
  memberBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20 },
  memberBadgeText: { color: "#FFF", fontFamily: "Inter_600SemiBold", fontSize: 13 },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
  quickActions: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 24 },
  quickBtn: { width: "47%", alignItems: "center", padding: 16, gap: 8, borderWidth: 1 },
  quickIcon: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  quickLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  upcomingCard: { marginBottom: 24 },
  classRow: { flexDirection: "row", gap: 12, alignItems: "center" },
  classTime: { padding: 12, alignItems: "center", minWidth: 72 },
  classTimeText: { fontFamily: "Inter_700Bold", fontSize: 16 },
  classTimeSub: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 2 },
  classInfo: { flex: 1 },
  className: { fontFamily: "Inter_600SemiBold", fontSize: 16 },
  classInstructor: { fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 2 },
  classMeta: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6 },
  classMetaText: { fontFamily: "Inter_400Regular", fontSize: 12 },
  attendanceCard: { marginBottom: 8 },
  attendanceRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  attendanceDot: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  attendanceDate: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  attendanceSub: { fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 2 },
  attendanceDuration: { fontFamily: "Inter_700Bold", fontSize: 15 },
});
