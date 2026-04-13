import { Redirect } from "expo-router";
import React from "react";
import { useAuth } from "@/context/AuthContext";

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (isAuthenticated) return <Redirect href="/(tabs)/home" />;
  return <Redirect href="/onboarding" />;
}
