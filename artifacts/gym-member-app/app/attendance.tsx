import { router } from "expo-router";
import React from "react";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { DUMMY_ATTENDANCE } from "@/utils/dummyData";
import { formatDate, getDayName } from "@/utils/helpers";

export default function AttendanceScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const totalMinutes = DUMMY_ATTENDANCE.reduce((s, a) => s + a.duration, 0);
  const avgDuration = Math.round(totalMinutes / DUMMY_ATTENDANCE.length);

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
        <Text style={[styles.screenTitle, { color: colors.foreground }]}>Attendance History</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.statsRow}>
        <StatCard label="This Month" value={`${DUMMY_ATTENDANCE.length}`} icon="calendar" color={colors.primary} />
        <StatCard label="Total Hours" value={`${Math.round(totalMinutes / 60)}h`} icon="clock" color="#FF6B35" />
        <StatCard label="Avg Session" value={`${avgDuration}m`} icon="activity" color="#22C55E" />
      </View>

      {/* Calendar strip */}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>April 2026</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.calendarStrip}>
        {Array.from({ length: 13 }, (_, i) => {
          const day = i + 1;
          const dateStr = `2026-04-${String(day).padStart(2, "0")}`;
          const attended = DUMMY_ATTENDANCE.some((a) => a.date === dateStr);
          const isToday = day === 13;
          return (
            <View key={day} style={[styles.calDay, { backgroundColor: attended ? colors.primary : colors.card, borderColor: isToday ? colors.primary : colors.border, borderRadius: colors.radius }]}>
              <Text style={[styles.calDayName, { color: attended ? "rgba(255,255,255,0.7)" : colors.mutedForeground }]}>{["Su","Mo","Tu","We","Th","Fr","Sa"][new Date(dateStr).getDay()]}</Text>
              <Text style={[styles.calDayNum, { color: attended ? "#FFF" : colors.foreground }]}>{day}</Text>
              {attended && <View style={[styles.calDot, { backgroundColor: "#FFF" }]} />}
            </View>
          );
        })}
      </ScrollView>

      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent Sessions</Text>
      {DUMMY_ATTENDANCE.map((a) => (
        <Card key={a.id} style={styles.sessionCard}>
          <View style={styles.sessionRow}>
            <View style={[styles.dayBox, { backgroundColor: colors.primary + "15", borderRadius: 10 }]}>
              <Text style={[styles.dayBoxName, { color: colors.primary }]}>{getDayName(a.date)}</Text>
              <Text style={[styles.dayBoxNum, { color: colors.primary }]}>{new Date(a.date).getDate()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.sessionDate, { color: colors.foreground }]}>{formatDate(a.date)}</Text>
              <View style={styles.sessionTimes}>
                <Feather name="log-in" size={12} color={colors.success} />
                <Text style={[styles.sessionTime, { color: colors.mutedForeground }]}>{a.checkIn}</Text>
                <Feather name="log-out" size={12} color={colors.mutedForeground} />
                <Text style={[styles.sessionTime, { color: colors.mutedForeground }]}>{a.checkOut}</Text>
              </View>
            </View>
            <View style={styles.durationBadge}>
              <Text style={[styles.durationText, { color: colors.primary }]}>{a.duration}</Text>
              <Text style={[styles.durationUnit, { color: colors.mutedForeground }]}>min</Text>
            </View>
          </View>
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingBottom: 40 },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  screenTitle: { fontFamily: "Inter_700Bold", fontSize: 18 },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 18, marginBottom: 14 },
  calendarStrip: { marginBottom: 24 },
  calDay: { alignItems: "center", padding: 10, marginRight: 8, minWidth: 52, borderWidth: 1.5 },
  calDayName: { fontFamily: "Inter_400Regular", fontSize: 11 },
  calDayNum: { fontFamily: "Inter_700Bold", fontSize: 18, marginVertical: 2 },
  calDot: { width: 5, height: 5, borderRadius: 3 },
  sessionCard: { marginBottom: 10 },
  sessionRow: { flexDirection: "row", gap: 14, alignItems: "center" },
  dayBox: { width: 52, alignItems: "center", padding: 10 },
  dayBoxName: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  dayBoxNum: { fontFamily: "Inter_700Bold", fontSize: 20 },
  sessionDate: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  sessionTimes: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4 },
  sessionTime: { fontFamily: "Inter_400Regular", fontSize: 13 },
  durationBadge: { alignItems: "center" },
  durationText: { fontFamily: "Inter_700Bold", fontSize: 20 },
  durationUnit: { fontFamily: "Inter_400Regular", fontSize: 12 },
});
