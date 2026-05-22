import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

const LAST_PLAYED_KEY = "realm_last_played_at";
const LAST_NOTIF_KEY  = "realm_last_notification_scheduled";

export interface ReturnStatus {
  hoursAway: number;
  shouldShowBonus: boolean;
  bonusGold: number;
  bonusFaith: number;
  message: string;
}

export async function checkReturnBonus(): Promise<ReturnStatus | null> {
  try {
    const raw = await AsyncStorage.getItem(LAST_PLAYED_KEY);
    const now = Date.now();

    if (!raw) {
      await AsyncStorage.setItem(LAST_PLAYED_KEY, String(now));
      return null;
    }

    const last = parseInt(raw, 10);
    const hoursAway = (now - last) / (1000 * 60 * 60);

    if (hoursAway < 3) return null;

    const hoursInt = Math.min(48, Math.floor(hoursAway));
    const bonusGold  = Math.min(200, 40 + hoursInt * 3);
    const bonusFaith = Math.min(60,  10 + hoursInt);

    let message = "Welcome back, my liege! Your realm has been waiting.";
    if (hoursAway >= 24) message = "A day has passed! Your kingdom grew restless without you.";
    else if (hoursAway >= 8) message = "Good to see you return. Your advisors have news.";

    return { hoursAway, shouldShowBonus: true, bonusGold, bonusFaith, message };
  } catch {
    return null;
  }
}

export async function markPlayed(): Promise<void> {
  try {
    await AsyncStorage.setItem(LAST_PLAYED_KEY, String(Date.now()));
  } catch {}
}

export async function scheduleNativeReminder(): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    const Notifications = await import("expo-notifications").catch(() => null);
    if (!Notifications) return;

    const lastScheduled = await AsyncStorage.getItem(LAST_NOTIF_KEY);
    const now = Date.now();

    if (lastScheduled && now - parseInt(lastScheduled, 10) < 12 * 60 * 60 * 1000) return;

    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== "granted") return;

    await Notifications.cancelAllScheduledNotificationsAsync();

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "⚔️ Realm of Crowns",
        body: "Your realm awaits, my liege. New events and opportunities have emerged.",
        sound: true,
      },
      trigger: { seconds: 24 * 60 * 60, repeats: false },
    });

    await AsyncStorage.setItem(LAST_NOTIF_KEY, String(now));
  } catch {}
}
