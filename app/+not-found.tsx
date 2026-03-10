import { Link, Stack } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import Colors from "@/constants/colors";

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: "Lost Territory", headerShown: false }} />
      <View style={s.container}>
        <Text style={s.icon}>🗺️</Text>
        <Text style={s.title}>Territory Not Found</Text>
        <Text style={s.subtitle}>The cartographers have no record of such a place.</Text>
        <Link href="/" style={s.link}><Text style={s.linkText}>Return to the Kingdom</Text></Link>
      </View>
    </>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, backgroundColor: Colors.bg.primary },
  icon: { fontSize: 56, marginBottom: 20 },
  title: { fontSize: 20, fontWeight: "700" as const, color: Colors.text.primary, marginBottom: 8 },
  subtitle: { fontSize: 14, color: Colors.text.secondary, textAlign: "center" as const, marginBottom: 28, lineHeight: 20 },
  link: { paddingVertical: 14, paddingHorizontal: 28, backgroundColor: Colors.bg.card, borderRadius: 12, borderWidth: 1, borderColor: Colors.border.gold },
  linkText: { fontSize: 15, color: Colors.gold.primary, fontWeight: "700" as const },
});
