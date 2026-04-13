import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { apiService } from "@/services/api";

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
  signup: (name: string, email: string, password: string, phone: string) => Promise<void>;
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
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        apiService.setToken(storedToken);
      }
    } catch (e) {
      // ignore
    } finally {
      setIsLoading(false);
    }
  };

  const login = useCallback(async (email: string, password: string) => {
    const response = await apiService.login(email, password);
    const { token: newToken, user: newUser } = response;
    await AsyncStorage.setItem("auth_token", newToken);
    await AsyncStorage.setItem("auth_user", JSON.stringify(newUser));
    apiService.setToken(newToken);
    setToken(newToken);
    setUser(newUser);
  }, []);

  const signup = useCallback(async (name: string, email: string, password: string, phone: string) => {
    const response = await apiService.signup(name, email, password, phone);
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
