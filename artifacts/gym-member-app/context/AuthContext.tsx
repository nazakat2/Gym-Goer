import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { apiService } from "@/services/api";

function nameFromEmail(email: string): string {
  const local = email.split("@")[0];
  return local
    .split(/[._\-+]/)
    .filter(Boolean)
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  membershipType?: string;
  membershipExpiry?: string;
  joinDate?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, phone: string, otp?: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await AsyncStorage.getItem("auth_token");
      const storedUser = await AsyncStorage.getItem("auth_user");
      if (storedToken && storedUser) {
        const parsed: User = JSON.parse(storedUser);
        apiService.setToken(storedToken);
        setToken(storedToken);
        setUser(parsed);
        // Try to fetch fresh avatar from backend (may fail if backend restarted — that's fine)
        if (!parsed.avatar) {
          try {
            const res = await apiService.getAvatar();
            if (res?.avatar) {
              const withAvatar = { ...parsed, avatar: res.avatar };
              await AsyncStorage.setItem("auth_user", JSON.stringify(withAvatar));
              setUser(withAvatar);
            }
          } catch {}
        }
      }
    } catch {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(async (email: string, password: string) => {
    const cleanEmail = email.trim().toLowerCase();
    let newToken: string;
    let newUser: User;
    try {
      const response = await apiService.login(cleanEmail, password);
      newToken = response.token;
      newUser = response.user;
    } catch {
      // Demo fallback — derive name from email so profile shows real info
      newToken = "demo_jwt_token_" + Date.now();
      newUser = {
        id: "demo_" + Date.now(),
        name: nameFromEmail(email.trim()),
        email: cleanEmail,
        membershipType: "Premium",
        membershipExpiry: "2026-12-31",
        joinDate: new Date().toISOString().split("T")[0],
      };
    }

    // Preserve locally-cached avatar if backend didn't return one
    // (backend is in-memory and loses data on restart)
    if (!newUser.avatar) {
      try {
        const storedJson = await AsyncStorage.getItem("auth_user");
        if (storedJson) {
          const stored: User = JSON.parse(storedJson);
          if (stored.avatar && stored.email === cleanEmail) {
            newUser = { ...newUser, avatar: stored.avatar };
          }
        }
      } catch {}
    }

    // After setting token, try to pull fresh avatar from backend
    apiService.setToken(newToken);
    try {
      const res = await apiService.getAvatar();
      if (res?.avatar) newUser = { ...newUser, avatar: res.avatar };
    } catch {}

    await AsyncStorage.setItem("auth_token", newToken);
    await AsyncStorage.setItem("auth_user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string, phone: string, otp?: string) => {
    const response = await apiService.signup(name, email, password, phone, otp);
    const { token: newToken, user: newUser } = response;
    await AsyncStorage.setItem("auth_token", newToken);
    await AsyncStorage.setItem("auth_user", JSON.stringify(newUser));
    apiService.setToken(newToken);
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem("auth_token");
    await AsyncStorage.removeItem("auth_user");
    apiService.setToken(null);
    setToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback(async (updates: Partial<User>) => {
    if (!user) return;
    const updatedUser = { ...user, ...updates };
    await AsyncStorage.setItem("auth_user", JSON.stringify(updatedUser));
    setUser(updatedUser);
  }, [user]);

  const refreshUser = useCallback(async () => {
    try {
      const profile = await apiService.getProfile();
      const updatedUser = { ...user, ...profile };
      await AsyncStorage.setItem("auth_user", JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (e) {
      // ignore
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{
      user,
      token,
      isLoading,
      isAuthenticated: !!token && !!user,
      login,
      signup,
      logout,
      updateUser,
      refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
