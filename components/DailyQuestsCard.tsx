import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from "react-native";
import { CheckCircle, Gift, Star } from "lucide-react-native";
import Colors from "@/constants/colors";
import { DailyQuest } from "@/types/game";

function QuestRow({
  quest,
  onClaim,
}: {
  quest: DailyQuest;
  onClaim: (id: string) => void;
}) {
  const pct = Math.min(1, quest.progress / quest.target);
  const isDone = quest.completed;
  const isClaimed = quest.claimed;

  const rewardStr = Object.entries(quest.reward)
    .filter(([, v]) => v && v > 0)
    .map(([k, v]) => `+${v} ${k}`)
    .join(" · ");

  return (
    <View style={[qst.row, isClaimed && qst.rowClaimed]}>
      <View style={[qst.iconWrap, isDone && qst.iconDone]}>
        <Text style={qst.icon}>{quest.icon}</Text>
      </View>

      <View style={qst.info}>
        <View style={qst.titleRow}>
          <Text style={[qst.questTitle, isClaimed && qst.dimText]} numberOfLines={1}>
            {quest.title}
          </Text>
          {isDone && !isClaimed && (
            <View style={qst.completeBadge}>
              <Text style={qst.completeBadgeText}>DONE!</Text>
            </View>
          )}
          {isClaimed && (
            <CheckCircle size={14} color={Colors.status.success} />
          )}
        </View>

        <Text style={[qst.desc, isClaimed && qst.dimText]} numberOfLines={1}>
          {quest.description}
        </Text>

        <View style={qst.progressRow}>
          <View style={qst.progressBg}>
            <View
              style={[
                qst.progressFill,
                {
                  width: `${pct * 100}%` as any,
                  backgroundColor: isClaimed
                    ? Colors.status.success
                    : isDone
                    ? Colors.gold.bright
                    : Colors.status.info,
                },
              ]}
            />
          </View>
          <Text style={qst.progressLabel}>
            {Math.min(quest.progress, quest.target)}/{quest.target}
          </Text>
        </View>

        <Text style={qst.reward}>{rewardStr}</Text>
      </View>

      {isDone && !isClaimed ? (
        <TouchableOpacity
          style={qst.claimBtn}
          onPress={() => onClaim(quest.id)}
          activeOpacity={0.75}
        >
          <Gift size={14} color={Colors.bg.primary} />
          <Text style={qst.claimText}>Claim</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export default function DailyQuestsCard({
  quests,
  onClaim,
}: {
  quests: DailyQuest[];
  onClaim: (id: string) => void;
}) {
  if (!quests || quests.length === 0) return null;

  const allClaimed = quests.every((q) => q.claimed);
  const doneCount = quests.filter((q) => q.claimed).length;

  return (
    <View style={dq.card}>
      <View style={dq.header}>
        <Star size={16} color={Colors.gold.bright} />
        <Text style={dq.headerTitle}>Daily Quests</Text>
        <Text style={dq.headerSub}>
          {allClaimed ? "All complete!" : `${doneCount}/${quests.length} claimed`}
        </Text>
      </View>

      {allClaimed ? (
        <View style={dq.allDone}>
          <Text style={dq.allDoneIcon}>🏆</Text>
          <Text style={dq.allDoneText}>Quests complete! New quests tomorrow.</Text>
        </View>
      ) : (
        <View style={dq.list}>
          {quests.map((q) => (
            <QuestRow key={q.id} quest={q} onClaim={onClaim} />
          ))}
        </View>
      )}
    </View>
  );
}

const dq = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: Colors.bg.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.gold.dim + "50",
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: Colors.gold.dim + "14",
    borderBottomWidth: 1,
    borderBottomColor: Colors.gold.dim + "30",
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: "800" as const,
    color: Colors.gold.bright,
    flex: 1,
    letterSpacing: 0.3,
  },
  headerSub: {
    fontSize: 11,
    color: Colors.text.secondary,
    fontWeight: "600" as const,
  },
  list: {
    paddingVertical: 4,
  },
  allDone: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  allDoneIcon: { fontSize: 22 },
  allDoneText: {
    fontSize: 13,
    color: Colors.status.success,
    fontWeight: "600" as const,
  },
});

const qst = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.primary + "60",
  },
  rowClaimed: {
    opacity: 0.55,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: Colors.bg.tertiary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.border.primary,
  },
  iconDone: {
    borderColor: Colors.gold.dim,
    backgroundColor: Colors.gold.dim + "20",
  },
  icon: { fontSize: 18 },
  info: { flex: 1, gap: 3 },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  questTitle: {
    fontSize: 12,
    fontWeight: "700" as const,
    color: Colors.text.primary,
    flex: 1,
  },
  desc: {
    fontSize: 11,
    color: Colors.text.secondary,
    lineHeight: 15,
  },
  dimText: { opacity: 0.6 },
  completeBadge: {
    backgroundColor: Colors.gold.bright + "25",
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: Colors.gold.bright + "50",
  },
  completeBadgeText: {
    fontSize: 9,
    fontWeight: "800" as const,
    color: Colors.gold.bright,
    letterSpacing: 0.5,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  progressBg: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.bg.primary,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  progressLabel: {
    fontSize: 10,
    color: Colors.text.dim,
    fontWeight: "600" as const,
    minWidth: 28,
    textAlign: "right",
  },
  reward: {
    fontSize: 10,
    color: Colors.gold.dim,
    fontWeight: "600" as const,
  },
  claimBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: Colors.gold.primary,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
  },
  claimText: {
    fontSize: 11,
    fontWeight: "800" as const,
    color: Colors.bg.primary,
  },
});
