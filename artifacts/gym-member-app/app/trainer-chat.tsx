import { router } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useColors } from "@/hooks/useColors";
import { Avatar } from "@/components/ui/Avatar";
import { DUMMY_TRAINER } from "@/utils/dummyData";

interface Message {
  id: string;
  from: string;
  text: string;
  time: string;
  date: string;
}

export default function TrainerChatScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const botPad = Platform.OS === "web" ? 34 : insets.bottom;
  const [messages, setMessages] = useState<Message[]>(DUMMY_TRAINER.messages);
  const [input, setInput] = useState("");

  const sendMessage = () => {
    if (!input.trim()) return;
    const msg: Message = {
      id: "m" + Date.now(),
      from: "user",
      text: input.trim(),
      time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      date: new Date().toISOString().split("T")[0],
    };
    setMessages((prev) => [...prev, msg]);
    setInput("");

    // Simulate trainer reply
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: "m_reply_" + Date.now(),
          from: "trainer",
          text: "Got it! I'll check your progress and get back to you shortly. Keep pushing!",
          time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
          date: new Date().toISOString().split("T")[0],
        },
      ]);
    }, 1500);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior="padding"
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Avatar name={DUMMY_TRAINER.name} size={40} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.trainerName, { color: colors.foreground }]}>{DUMMY_TRAINER.name}</Text>
          <Text style={[styles.trainerSpecialty, { color: colors.mutedForeground }]}>{DUMMY_TRAINER.specialty}</Text>
        </View>
        <View style={[styles.onlineIndicator, { backgroundColor: colors.success }]} />
      </View>

      {/* Messages */}
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.messageList, { paddingBottom: 8 }]}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const isUser = item.from === "user";
          return (
            <View style={[styles.messageRow, isUser && styles.messageRowUser]}>
              {!isUser && <Avatar name={DUMMY_TRAINER.name} size={32} />}
              <View
                style={[
                  styles.bubble,
                  {
                    backgroundColor: isUser ? colors.primary : colors.card,
                    borderRadius: isUser ? 18 : 18,
                    maxWidth: "75%",
                  },
                ]}
              >
                <Text style={[styles.bubbleText, { color: isUser ? "#FFF" : colors.foreground }]}>
                  {item.text}
                </Text>
                <Text style={[styles.bubbleTime, { color: isUser ? "rgba(255,255,255,0.7)" : colors.mutedForeground }]}>
                  {item.time}
                </Text>
              </View>
            </View>
          );
        }}
      />

      {/* Input */}
      <View style={[styles.inputBar, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: botPad + 8 }]}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Message your trainer..."
          placeholderTextColor={colors.mutedForeground}
          style={[styles.textInput, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border, borderRadius: 24 }]}
          multiline
        />
        <TouchableOpacity
          onPress={sendMessage}
          style={[styles.sendBtn, { backgroundColor: input.trim() ? colors.primary : colors.muted }]}
        >
          <Feather name="send" size={18} color={input.trim() ? "#FFF" : colors.mutedForeground} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingBottom: 14, borderBottomWidth: 1 },
  backBtn: { marginRight: 4 },
  trainerName: { fontFamily: "Inter_700Bold", fontSize: 16 },
  trainerSpecialty: { fontFamily: "Inter_400Regular", fontSize: 12 },
  onlineIndicator: { width: 10, height: 10, borderRadius: 5 },
  messageList: { paddingHorizontal: 16, paddingTop: 16, gap: 12 },
  messageRow: { flexDirection: "row", alignItems: "flex-end", gap: 8 },
  messageRowUser: { justifyContent: "flex-end" },
  bubble: { padding: 12, gap: 4 },
  bubbleText: { fontFamily: "Inter_400Regular", fontSize: 15, lineHeight: 21 },
  bubbleTime: { fontFamily: "Inter_400Regular", fontSize: 11, alignSelf: "flex-end" },
  inputBar: { flexDirection: "row", alignItems: "flex-end", gap: 10, paddingHorizontal: 16, paddingTop: 10, borderTopWidth: 1 },
  textInput: { flex: 1, borderWidth: 1.5, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, fontFamily: "Inter_400Regular", maxHeight: 100 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
});
