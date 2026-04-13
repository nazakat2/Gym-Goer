import React, { useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { DUMMY_NOTIFICATIONS } from "@/utils/dummyData";

const ICONS: Record<string, keyof typeof Feather.glyphMap> = {
  class: "calendar",
  payment: "credit-card",
  achievement: "award",
  trainer: "user",
  promotion: "tag",
};

const COLORS: Record<string, string> = {
  class: "#E31C25",
  payment: "#F59E0B",
  achievement: "#22C55E",
  trainer: "#3B82F6",
  promotion: "#A855F7",
};

export default function NotificationsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const [notifs, setNotifs] = useState(DUMMY_NOTIFICATIONS);

  const markAllRead = () => setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  const markRead = (id: string) => setNotifs((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));

  const unread = notifs.filter((n) => !n.read).length;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[styles.content, { paddingTop: topPad + 16 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topBar}>
        <Text style={[styles.screenTitle, { color: colors.foreground }]}>Notifications</Text>
        {unread > 0 && (
          <TouchableOpacity onPress={markAllRead}>
            <Text style={[styles.markAll, { color: colors.primary }]}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {unread > 0 && (
        <View style={[styles.unreadBanner, { backgroundColor: colors.primary + "15", borderRadius: colors.radius }]}>
          <Feather name="bell" size={16} color={colors.primary} />
          <Text style={[styles.unreadText, { color: colors.primary }]}>
            {unread} unread notification{unread > 1 ? "s" : ""}
          </Text>
        </View>
      )}

      {notifs.length === 0 ? (
        <EmptyState icon="bell-off" title="No Notifications" description="You're all caught up!" />
      ) : (
        notifs.map((n) => (
          <TouchableOpacity key={n.id} onPress={() => markRead(n.id)}>
            <Card
              style={[
                styles.notifCard,
                !n.read && { borderColor: colors.primary + "40" },
              ]}
            >
              <View style={styles.notifRow}>
                <View style={[styles.notifIcon, { backgroundColor: COLORS[n.type] + "20" }]}>
                  <Feather name={ICONS[n.type] || "bell"} size={20} color={COLORS[n.type]} />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.notifHeaderRow}>
                    <Text style={[styles.notifTitle, { color: colors.foreground }]}>{n.title}</Text>
                    {!n.read && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
                  </View>
                  <Text style={[styles.notifMessage, { color: colors.mutedForeground }]} numberOfLines={2}>
                    {n.message}
                  </Text>
                  <Text style={[styles.notifTime, { color: colors.mutedForeground }]}>
                    {n.time} · {n.date}
                  </Text>
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16, paddingBottom: 100 },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  screenTitle: { fontFamily: "Inter_700Bold", fontSize: 24 },
  markAll: { fontFamily: "Inter_500Medium", fontSize: 14 },
  unreadBanner: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, marginBottom: 16 },
  unreadText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  notifCard: { marginBottom: 10 },
  notifRow: { flexDirection: "row", gap: 12 },
  notifIcon: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  notifHeaderRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  notifTitle: { fontFamily: "Inter_600SemiBold", fontSize: 15, flex: 1 },
  unreadDot: { width: 8, height: 8, borderRadius: 4 },
  notifMessage: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19, marginTop: 3 },
  notifTime: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 6 },
});
