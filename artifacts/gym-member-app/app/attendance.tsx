import { router } from "expo-router";
import React, { useState, useMemo } from "react";
import {
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
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { DUMMY_ATTENDANCE } from "@/utils/dummyData";
import { formatDate, getDayName } from "@/utils/helpers";

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAY_HEADERS = ["Su","Mo","Tu","We","Th","Fr","Sa"];

const EXTRA_ATTENDANCE = [
  { id: "b1", date: "2026-03-28", checkIn: "07:00", checkOut: "08:30", duration: 90 },
  { id: "b2", date: "2026-03-25", checkIn: "18:00", checkOut: "19:30", duration: 90 },
  { id: "b3", date: "2026-03-22", checkIn: "07:30", checkOut: "09:00", duration: 90 },
  { id: "b4", date: "2026-03-20", checkIn: "06:45", checkOut: "08:15", duration: 90 },
  { id: "b5", date: "2026-03-18", checkIn: "17:30", checkOut: "19:00", duration: 90 },
  { id: "b6", date: "2026-03-15", checkIn: "09:00", checkOut: "10:30", duration: 90 },
  { id: "b7", date: "2026-03-12", checkIn: "07:00", checkOut: "08:30", duration: 90 },
  { id: "b8", date: "2026-03-10", checkIn: "06:00", checkOut: "07:30", duration: 90 },
  { id: "b9", date: "2026-02-25", checkIn: "07:00", checkOut: "08:30", duration: 90 },
  { id: "b10", date: "2026-02-22", checkIn: "18:00", checkOut: "19:30", duration: 90 },
  { id: "b11", date: "2026-02-20", checkIn: "07:30", checkOut: "09:00", duration: 90 },
  { id: "b12", date: "2026-02-18", checkIn: "06:45", checkOut: "08:15", duration: 90 },
];

const ALL_ATTENDANCE = [...DUMMY_ATTENDANCE, ...EXTRA_ATTENDANCE];

export default function AttendanceScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const today = new Date("2026-04-13");
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const attendedDates = useMemo(() => {
    return new Set(ALL_ATTENDANCE.map((a) => a.date));
  }, []);

  const calendarData = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells: (number | null)[] = [
      ...Array(firstDay).fill(null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [viewYear, viewMonth]);

  const visibleAttendance = useMemo(() => {
    const prefix = `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}`;
    return ALL_ATTENDANCE.filter((a) => a.date.startsWith(prefix));
  }, [viewYear, viewMonth]);

  const totalMinutes = visibleAttendance.reduce((s, a) => s + a.duration, 0);
  const avgDuration =
    visibleAttendance.length > 0
      ? Math.round(totalMinutes / visibleAttendance.length)
      : 0;

  const goToPrevMonth = () => {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  };
  const goToNextMonth = () => {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  };

  const toDateStr = (day: number) =>
    `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 16 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()}>
          <Feather name="arrow-left" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.screenTitle, { color: colors.foreground }]}>
          Attendance History
        </Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <StatCard
          label="This Month"
          value={`${visibleAttendance.length}`}
          icon="calendar"
          color={colors.primary}
        />
        <StatCard
          label="Total Hours"
          value={`${Math.round(totalMinutes / 60)}h`}
          icon="clock"
          color="#FF6B35"
        />
        <StatCard
          label="Avg Session"
          value={`${avgDuration}m`}
          icon="activity"
          color="#22C55E"
        />
      </View>

      {/* Calendar Card */}
      <Card style={styles.calCard}>
        {/* Month Navigation */}
        <View style={styles.monthNav}>
          <TouchableOpacity
            onPress={goToPrevMonth}
            style={[styles.navBtn, { backgroundColor: colors.muted }]}
          >
            <Feather name="chevron-left" size={20} color={colors.foreground} />
          </TouchableOpacity>
          <Text style={[styles.monthTitle, { color: colors.foreground }]}>
            {MONTH_NAMES[viewMonth]} {viewYear}
          </Text>
          <TouchableOpacity
            onPress={goToNextMonth}
            style={[styles.navBtn, { backgroundColor: colors.muted }]}
          >
            <Feather name="chevron-right" size={20} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        {/* Day Headers */}
        <View style={styles.dayHeaderRow}>
          {DAY_HEADERS.map((d) => (
            <Text
              key={d}
              style={[styles.dayHeader, { color: colors.mutedForeground }]}
            >
              {d}
            </Text>
          ))}
        </View>

        {/* Calendar Grid */}
        <View style={styles.grid}>
          {calendarData.map((day, idx) => {
            if (day === null) {
              return <View key={`empty-${idx}`} style={styles.cell} />;
            }
            const dateStr = toDateStr(day);
            const attended = attendedDates.has(dateStr);
            const isToday = dateStr === todayStr;
            return (
              <View key={dateStr} style={styles.cell}>
                <View
                  style={[
                    styles.dayCircle,
                    attended && { backgroundColor: colors.primary },
                    isToday && !attended && {
                      borderWidth: 2,
                      borderColor: colors.primary,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.dayNum,
                      { color: attended ? "#FFF" : isToday ? colors.primary : colors.foreground },
                    ]}
                  >
                    {day}
                  </Text>
                </View>
                {attended && (
                  <View style={[styles.dot, { backgroundColor: colors.primary }]} />
                )}
              </View>
            );
          })}
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
            <Text style={[styles.legendText, { color: colors.mutedForeground }]}>
              Attended ({visibleAttendance.length} days)
            </Text>
          </View>
          <View style={styles.legendItem}>
            <View
              style={[
                styles.legendDot,
                {
                  backgroundColor: "transparent",
                  borderWidth: 2,
                  borderColor: colors.primary,
                },
              ]}
            />
            <Text style={[styles.legendText, { color: colors.mutedForeground }]}>
              Today
            </Text>
          </View>
        </View>
      </Card>

      {/* Recent Sessions */}
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
        {MONTH_NAMES[viewMonth]} Sessions
      </Text>

      {visibleAttendance.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Feather name="calendar" size={36} color={colors.mutedForeground} style={{ alignSelf: "center", marginBottom: 10 }} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            No attendance records for this month.
          </Text>
        </Card>
      ) : (
        visibleAttendance.map((a) => (
          <Card key={a.id} style={styles.sessionCard}>
            <View style={styles.sessionRow}>
              <View
                style={[
                  styles.dayBox,
                  { backgroundColor: colors.primary + "15", borderRadius: 10 },
                ]}
              >
                <Text style={[styles.dayBoxName, { color: colors.primary }]}>
                  {getDayName(a.date)}
                </Text>
                <Text style={[styles.dayBoxNum, { color: colors.primary }]}>
                  {new Date(a.date).getDate()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.sessionDate, { color: colors.foreground }]}>
                  {formatDate(a.date)}
                </Text>
                <View style={styles.sessionTimes}>
                  <Feather name="log-in" size={12} color={colors.success} />
                  <Text style={[styles.sessionTime, { color: colors.mutedForeground }]}>
                    {a.checkIn}
                  </Text>
                  <Feather name="log-out" size={12} color={colors.mutedForeground} />
                  <Text style={[styles.sessionTime, { color: colors.mutedForeground }]}>
                    {a.checkOut}
                  </Text>
                </View>
              </View>
              <View style={styles.durationBadge}>
                <Text style={[styles.durationText, { color: colors.primary }]}>
                  {a.duration}
                </Text>
                <Text style={[styles.durationUnit, { color: colors.mutedForeground }]}>
                  min
                </Text>
              </View>
            </View>
          </Card>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingBottom: 48 },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  screenTitle: { fontFamily: "Inter_700Bold", fontSize: 18 },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 20 },

  calCard: { marginBottom: 28, padding: 16 },
  monthNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  monthTitle: { fontFamily: "Inter_700Bold", fontSize: 17 },

  dayHeaderRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  dayHeader: {
    flex: 1,
    textAlign: "center",
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  cell: {
    width: `${100 / 7}%`,
    alignItems: "center",
    paddingVertical: 4,
  },
  dayCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  dayNum: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },

  legend: {
    flexDirection: "row",
    gap: 20,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.06)",
    justifyContent: "center",
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendText: { fontFamily: "Inter_400Regular", fontSize: 12 },

  sectionTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
    marginBottom: 14,
  },
  emptyCard: { alignItems: "center", paddingVertical: 32 },
  emptyText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textAlign: "center",
  },
  sessionCard: { marginBottom: 10 },
  sessionRow: { flexDirection: "row", gap: 14, alignItems: "center" },
  dayBox: { width: 52, alignItems: "center", padding: 10 },
  dayBoxName: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  dayBoxNum: { fontFamily: "Inter_700Bold", fontSize: 20 },
  sessionDate: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  sessionTimes: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 4,
  },
  sessionTime: { fontFamily: "Inter_400Regular", fontSize: 13 },
  durationBadge: { alignItems: "center" },
  durationText: { fontFamily: "Inter_700Bold", fontSize: 20 },
  durationUnit: { fontFamily: "Inter_400Regular", fontSize: 12 },
});
