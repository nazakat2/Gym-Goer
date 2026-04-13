import { router } from "expo-router";
import React, { useState, useEffect, useRef } from "react";
import {
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
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
  const [avatar, setAvatar] = useState<string | null>(user?.avatar || null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toastVisible, setToastVisible] = useState(false);

  const toastAnim = useRef(new Animated.Value(0)).current;
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = () => {
    setToastVisible(true);
    Animated.spring(toastAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();

    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => {
      Animated.timing(toastAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setToastVisible(false);
        router.back();
      });
    }, 2000);
  };

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Name is required";
    if (!email.trim()) e.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = "Invalid email";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const openLibrary = async () => {
    if (Platform.OS !== "web") {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission Required", "Please allow access to your photo library.");
        return;
      }
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
      setAvatar(result.assets[0].uri);
    }
  };

  const openCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Please allow camera access.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets.length > 0) {
      setAvatar(result.assets[0].uri);
    }
  };

  const handleChangePhoto = () => {
    if (Platform.OS === "web") {
      openLibrary();
      return;
    }
    Alert.alert("Change Profile Photo", "Choose an option", [
      { text: "Take Photo", onPress: openCamera },
      { text: "Choose from Library", onPress: openLibrary },
      { text: "Remove Photo", style: "destructive", onPress: () => setAvatar(null) },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    setTimeout(async () => {
      await updateUser({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        avatar: avatar || undefined,
      });
      setLoading(false);
      showToast();
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

        {/* Avatar with camera overlay */}
        <View style={styles.avatarSection}>
          <TouchableOpacity
            onPress={handleChangePhoto}
            activeOpacity={0.8}
            style={styles.avatarWrapper}
          >
            <Avatar name={name || "Member"} uri={avatar} size={100} />
            <View style={[styles.cameraOverlay, { backgroundColor: "rgba(0,0,0,0.45)" }]}>
              <Feather name="camera" size={22} color="#FFF" />
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleChangePhoto} activeOpacity={0.7}>
            <Text style={[styles.changePhotoText, { color: colors.primary }]}>Change Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Form */}
        <Input
          label="Full Name"
          placeholder="John Doe"
          value={name}
          onChangeText={setName}
          icon="user"
          error={errors.name}
        />
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
          label="Phone"
          placeholder="+1 (555) 000-0000"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          icon="phone"
        />

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Security</Text>
        <Button title="Change Password" onPress={() => {}} variant="outline" />

        <Button
          title="Save Changes"
          onPress={handleSave}
          loading={loading}
          size="lg"
          style={{ marginTop: 24, marginBottom: 40 }}
        />
      </ScrollView>

      {/* Success Toast */}
      {toastVisible && (
        <Animated.View
          style={[
            styles.toast,
            {
              opacity: toastAnim,
              transform: [
                {
                  translateY: toastAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [40, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.toastInner}>
            <View style={styles.toastIconWrap}>
              <Feather name="check-circle" size={22} color="#FFF" />
            </View>
            <View>
              <Text style={styles.toastTitle}>Profile Saved!</Text>
              <Text style={styles.toastSub}>Your changes have been saved successfully.</Text>
            </View>
          </View>
        </Animated.View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { paddingHorizontal: 16 },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  screenTitle: { fontFamily: "Inter_700Bold", fontSize: 18 },
  avatarSection: { alignItems: "center", marginBottom: 32, gap: 10 },
  avatarWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: "hidden",
  },
  cameraOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  changePhotoText: { fontFamily: "Inter_500Medium", fontSize: 14 },
  divider: { height: 1, marginVertical: 20 },
  sectionLabel: { fontFamily: "Inter_700Bold", fontSize: 16, marginBottom: 16 },
  toast: {
    position: "absolute",
    bottom: 40,
    left: 16,
    right: 16,
    zIndex: 999,
  },
  toastInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "#1A7A4A",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  toastIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  toastTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 15,
    color: "#FFF",
  },
  toastSub: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
    marginTop: 2,
  },
});
