import AsyncStorage from "@react-native-async-storage/async-storage";

export const storage = {
  get: async <T>(key: string): Promise<T | null> => {
    const val = await AsyncStorage.getItem(key);
    return val ? JSON.parse(val) : null;
  },
  set: async (key: string, value: unknown) => {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  },
  remove: async (key: string) => {
    await AsyncStorage.removeItem(key);
  },
};
