import { GameEvent } from '@/types/game';

type EventTemplate = Omit<GameEvent, 'turn' | 'seen'>;

// ============================================================
// POLITICAL EVENTS
// ============================================================

const POLITICAL_EVENTS: EventTemplate[] = [
  {
    id: 'narr_noble_conspiracy',
    title: 'Noble Conspiracy',
    description: 'Your spymaster has uncovered whispers of a conspiracy among the noble houses. A powerful lord is rallying discontented barons against your rule.',
    type: 'political',
    chainId: 'chain_noble_conspiracy',
    chainStep: 1,
    isChainEvent: true,
    choices: [
      { id: 'nc_arrest', text: 'Arrest the noble immediately', effects: 'Risk unrest, remove threat', cost: { gold: 100 }, followUpEventId: 'narr_the_trial', followUpDelay: 2 },
      { id: 'nc_observe', text: 'Secretly observe the conspiracy', effects: 'Gather more intel, risk grows', followUpEventId: 'narr_assassination_attempt', followUpDelay: 3 },
    ],
  },
  {
    id: 'narr_the_trial',
    title: 'The Trial',
    description: 'The arrested noble stands before your court. The evidence is damning, but he has powerful friends. How will you judge him?',
    type: 'political',
    chainId: 'chain_noble_conspiracy',
    chainStep: 2,
    isChainEvent: true,
    choices: [
      { id: 'trial_execute', text: 'Execute the traitor publicly', effects: '-15 loyalty in all provinces, +20 fear deterrent', cost: { gold: 50 } },
      { id: 'trial_exile', text: 'Exile him and seize his lands', effects: '+200 gold, -5 loyalty', reward: { gold: 200 } },
      { id: 'trial_pardon', text: 'Pardon him for a heavy fine', effects: '+300 gold, conspiracy may resurface', reward: { gold: 300 } },
    ],
  },
  {
    id: 'narr_assassination_attempt',
    title: 'Assassination Attempt!',
    description: 'The conspiracy has escalated! An assassin was caught in your chambers. Your guards barely stopped the blade in time.',
    type: 'political',
    chainId: 'chain_noble_conspiracy',
    chainStep: 2,
    isChainEvent: true,
    choices: [
      { id: 'assn_purge', text: 'Purge all suspected conspirators', effects: '-20 loyalty, conspiracy destroyed', cost: { military: 80 } },
      { id: 'assn_double', text: 'Turn the assassin into a double agent', effects: '+3 Intrigue, gain intel on enemies', cost: { gold: 150 } },
    ],
  },
  {
    id: 'narr_succession_crisis',
    title: 'Succession Crisis',
    description: 'A distant cousin has emerged claiming a stronger bloodline to the throne. Several lords have rallied to his banner, threatening civil war.',
    type: 'political',
    choices: [
      { id: 'sc_war', text: 'Crush the pretender by force', effects: '-200 military, remove threat permanently', cost: { military: 200 } },
      { id: 'sc_negotiate', text: 'Offer the pretender a position at court', effects: '-10 loyalty, gain a skilled councilor', cost: { gold: 200 } },
      { id: 'sc_assassinate', text: 'Send your spymaster to deal with it quietly', effects: '-30 faith, problem solved', cost: { gold: 300 } },
    ],
  },
  {
    id: 'narr_vassal_demands',
    title: 'Vassal Demands',
    description: 'Your most powerful vassal lord demands greater autonomy and lower tax contributions, threatening to rebel if ignored.',
    type: 'political',
    choices: [
      { id: 'vd_accept', text: 'Grant their demands', effects: '-10 gold/turn for 5 turns, +loyalty', cost: { gold: 50 } },
      { id: 'vd_refuse', text: 'Refuse and remind them of their oaths', effects: '-20 loyalty in border provinces' },
      { id: 'vd_compromise', text: 'Offer a compromise with new privileges', effects: '-5 gold/turn, moderate loyalty boost', cost: { gold: 100 } },
    ],
  },
  {
    id: 'narr_border_treaty',
    title: 'Border Treaty Dispute',
    description: 'A neighboring kingdom contests the boundary of a key province. Ancient documents support both claims. War could follow.',
    type: 'political',
    choices: [
      { id: 'bt_concede', text: 'Concede the disputed territory', effects: '+25 relations with neighbor, lose influence' },
      { id: 'bt_negotiate', text: 'Call for neutral arbitration', effects: 'Costs gold, fair outcome', cost: { gold: 150 } },
      { id: 'bt_fortify', text: 'Fortify the border and dare them', effects: '-15 relations, +garrison', cost: { military: 60 } },
    ],
  },
  {
    id: 'narr_court_scandal',
    title: 'Court Scandal',
    description: 'A scandalous affair between your chancellor and a foreign ambassador has been exposed. The court is ablaze with gossip.',
    type: 'political',
    choices: [
      { id: 'cs_dismiss', text: 'Dismiss the chancellor', effects: 'Lose chancellor skill, restore honor' },
      { id: 'cs_cover', text: 'Cover it up quietly', effects: '-20 faith, keep the chancellor', cost: { gold: 200 } },
      { id: 'cs_exploit', text: 'Use the scandal for leverage', effects: '+15 relations with foreign kingdom, -10 faith' },
    ],
  },
];

// ============================================================
// MILITARY EVENTS
// ============================================================

const MILITARY_EVENTS: EventTemplate[] = [
  {
    id: 'narr_deserters',
    title: 'Deserters',
    description: 'Reports come in that a group of soldiers has deserted from your largest army. They have fled into the forests and may become bandits.',
    type: 'military',
    choices: [
      { id: 'des_hunt', text: 'Send cavalry to hunt them down', effects: 'Restore discipline, -50 troops', cost: { gold: 80 } },
      { id: 'des_amnesty', text: 'Offer amnesty if they return', effects: '70% return, morale stays low', reward: { military: 20 } },
      { id: 'des_ignore', text: 'Let them go — focus on the war', effects: '-80 troops, bandits may appear later' },
    ],
  },
  {
    id: 'narr_mercenary_offer',
    title: 'Mercenary Company Arrives',
    description: 'The famed "Iron Wolves" mercenary company offers their services. 500 battle-hardened warriors, but their price is steep.',
    type: 'military',
    choices: [
      { id: 'merc_hire', text: 'Hire them immediately', effects: '+500 experienced troops', cost: { gold: 400 } },
      { id: 'merc_negotiate', text: 'Negotiate a lower price', effects: '+300 troops at discount', cost: { gold: 250 } },
      { id: 'merc_reject', text: 'Send them away — we fight with honor', effects: 'No cost, mercenaries may join your enemy' },
    ],
  },
  {
    id: 'narr_legendary_weapon',
    title: 'Legendary Weapon Discovered',
    description: 'Miners have unearthed an ancient blade buried deep beneath the mountains. Legend says it belonged to a great conqueror of old.',
    type: 'military',
    choices: [
      { id: 'lw_claim', text: 'Claim the blade for yourself', effects: '+3 Martial, +10 army morale' },
      { id: 'lw_display', text: 'Display it in the throne room', effects: '+20 Faith, inspires the realm', reward: { faith: 20 } },
      { id: 'lw_sell', text: 'Sell it to a foreign collector', effects: '+500 gold', reward: { gold: 500 } },
    ],
  },
  {
    id: 'narr_military_parade',
    title: 'Military Parade',
    description: 'Your marshal suggests holding a grand military parade through the capital to boost morale and intimidate rivals.',
    type: 'military',
    choices: [
      { id: 'mp_grand', text: 'Hold a grand parade with feast', effects: '+25 morale, +10 loyalty', cost: { gold: 200 }, reward: { faith: 10 } },
      { id: 'mp_modest', text: 'A modest march through the streets', effects: '+10 morale', cost: { gold: 50 } },
      { id: 'mp_cancel', text: 'Cancel — we cannot afford distractions', effects: 'No cost, slight morale dip' },
    ],
  },
  {
    id: 'narr_border_skirmish',
    title: 'Border Skirmish',
    description: 'A patrol of your soldiers clashed with enemy raiders near the border. Several were killed on both sides. Tensions are rising.',
    type: 'military',
    chainId: 'chain_border_skirmish',
    chainStep: 1,
    isChainEvent: true,
    choices: [
      { id: 'bs_retaliate', text: 'Launch a retaliatory raid', effects: '+100 military prestige, -20 relations', cost: { military: 60 }, followUpEventId: 'narr_escalation', followUpDelay: 2 },
      { id: 'bs_demand', text: 'Demand compensation diplomatically', effects: 'Possible gold or war', cost: { gold: 30 }, followUpEventId: 'narr_tense_peace', followUpDelay: 3 },
      { id: 'bs_fortify', text: 'Reinforce the border garrison', effects: '+100 garrison', cost: { gold: 100, military: 50 } },
    ],
  },
  {
    id: 'narr_escalation',
    title: 'Escalation at the Border',
    description: 'Your retaliatory raid was successful, but the enemy kingdom is furious. They are massing troops at the border.',
    type: 'military',
    chainId: 'chain_border_skirmish',
    chainStep: 2,
    isChainEvent: true,
    choices: [
      { id: 'esc_prepare', text: 'Prepare for war — rally all armies', effects: '+30 morale, war is likely', reward: { military: 50 } },
      { id: 'esc_sue', text: 'Sue for peace before it escalates', effects: '-100 gold, avoid full war', cost: { gold: 100 } },
    ],
  },
  {
    id: 'narr_tense_peace',
    title: 'Tense Peace',
    description: 'The enemy sent a token payment but the insult remains. Your lords grumble about weakness, but peace holds for now.',
    type: 'military',
    chainId: 'chain_border_skirmish',
    chainStep: 2,
    isChainEvent: true,
    choices: [
      { id: 'tp_accept', text: 'Accept the payment and move on', effects: '+50 gold, -5 loyalty', reward: { gold: 50 } },
      { id: 'tp_demand', text: 'Demand a proper apology', effects: '-10 relations, +5 loyalty' },
    ],
  },
];

// ============================================================
// RELIGIOUS EVENTS
// ============================================================

const RELIGIOUS_EVENTS: EventTemplate[] = [
  {
    id: 'narr_heresy_spreads',
    title: 'Heresy Spreads',
    description: 'A charismatic preacher is spreading a heretical doctrine in your provinces. The clergy demand action, but the common folk are drawn to the message.',
    type: 'religious',
    chainId: 'chain_heresy',
    chainStep: 1,
    isChainEvent: true,
    choices: [
      { id: 'her_suppress', text: 'Arrest the heretic and burn the texts', effects: '-10 loyalty, +30 faith', cost: { gold: 80 }, reward: { faith: 30 }, followUpEventId: 'narr_heresy_martyrdom', followUpDelay: 3 },
      { id: 'her_debate', text: 'Hold a public theological debate', effects: 'Outcome depends on Learning', cost: { gold: 50 }, followUpEventId: 'narr_heresy_debate_result', followUpDelay: 2 },
      { id: 'her_ignore', text: 'Ignore it — faith is a personal matter', effects: '-20 faith, +10 loyalty' },
    ],
  },
  {
    id: 'narr_heresy_martyrdom',
    title: 'The Martyr\'s Fire',
    description: 'The executed heretic has become a martyr. His followers have doubled. Riots break out in two provinces.',
    type: 'religious',
    chainId: 'chain_heresy',
    chainStep: 2,
    isChainEvent: true,
    choices: [
      { id: 'hm_crush', text: 'Crush the riots with force', effects: '-200 population, restore order', cost: { military: 80 } },
      { id: 'hm_appease', text: 'Make concessions to the heretics', effects: '-30 faith, +15 loyalty', cost: { gold: 100 } },
    ],
  },
  {
    id: 'narr_heresy_debate_result',
    title: 'The Great Debate',
    description: 'The theological debate was a spectacle. Your scholars presented compelling arguments, but the heretic was eloquent. The crowd is divided.',
    type: 'religious',
    chainId: 'chain_heresy',
    chainStep: 2,
    isChainEvent: true,
    choices: [
      { id: 'hdr_accept', text: 'Accept elements of the new doctrine', effects: '-15 faith, +20 loyalty, +2 Learning' },
      { id: 'hdr_reject', text: 'Declare orthodoxy supreme', effects: '+20 faith, -5 loyalty', reward: { faith: 20 } },
    ],
  },
  {
    id: 'narr_saint_proclaimed',
    title: 'Saint Proclaimed',
    description: 'A revered monk who healed the sick and fed the poor has died. The clergy wish to proclaim him a saint. This could unite the realm in faith.',
    type: 'religious',
    choices: [
      { id: 'sp_proclaim', text: 'Proclaim sainthood with a grand ceremony', effects: '+50 faith, +15 loyalty', cost: { gold: 150 }, reward: { faith: 50 } },
      { id: 'sp_modest', text: 'A modest recognition', effects: '+20 faith', reward: { faith: 20 } },
      { id: 'sp_deny', text: 'Deny sainthood — the church must remain strict', effects: '-10 loyalty, some respect from orthodox clergy' },
    ],
  },
  {
    id: 'narr_pilgrimage_invitation',
    title: 'Pilgrimage Invitation',
    description: 'A sacred site in a distant land invites your ruler to join a holy pilgrimage. The journey would be long but could bring great blessings.',
    type: 'religious',
    choices: [
      { id: 'pi_go', text: 'Embark on the pilgrimage', effects: '+3 Learning, +40 faith, ruler absent 3 turns', cost: { gold: 200 }, reward: { faith: 40 } },
      { id: 'pi_send', text: 'Send a representative instead', effects: '+15 faith', cost: { gold: 80 }, reward: { faith: 15 } },
      { id: 'pi_decline', text: 'Decline — the realm needs its king', effects: 'No effect' },
    ],
  },
  {
    id: 'narr_temple_corruption',
    title: 'Temple Corruption',
    description: 'Your chaplain has discovered that temple priests have been embezzling tithes. Gold meant for the poor has lined priestly pockets.',
    type: 'religious',
    choices: [
      { id: 'tc_purge', text: 'Purge the corrupt priests', effects: '+100 gold recovered, -15 faith temporarily', reward: { gold: 100 } },
      { id: 'tc_reform', text: 'Institute reforms and oversight', effects: '-50 gold for reforms, +faith/turn', cost: { gold: 50 } },
      { id: 'tc_secret', text: 'Keep it secret and take a cut', effects: '+200 gold, risk of scandal', reward: { gold: 200 } },
    ],
  },
  {
    id: 'narr_divine_omen',
    title: 'Divine Omen',
    description: 'A comet blazes across the night sky. The people see it as a sign — but of what? Priests argue whether it portends doom or glory.',
    type: 'religious',
    choices: [
      { id: 'do_glory', text: 'Declare it a sign of divine favor', effects: '+30 faith, +15 morale', reward: { faith: 30 } },
      { id: 'do_doom', text: 'Warn of coming trials — prepare the realm', effects: '+50 military readiness', reward: { military: 50 } },
      { id: 'do_science', text: 'Commission scholars to study it', effects: '+2 Learning', cost: { gold: 100 } },
    ],
  },
];

// ============================================================
// ECONOMIC EVENTS
// ============================================================

const ECONOMIC_EVENTS: EventTemplate[] = [
  {
    id: 'narr_trade_boom',
    title: 'Trade Boom',
    description: 'A new trade route has opened through your lands! Merchants from distant kingdoms flock to your markets, bringing exotic goods and heavy coin purses.',
    type: 'economic',
    choices: [
      { id: 'tb_invest', text: 'Invest in infrastructure for the route', effects: '+15 gold/turn for 5 turns', cost: { gold: 200 } },
      { id: 'tb_tax', text: 'Tax the merchants heavily', effects: '+300 gold now, route may close', reward: { gold: 300 } },
      { id: 'tb_welcome', text: 'Welcome them with open arms', effects: '+5 gold/turn permanently, +10 relations', reward: { gold: 50 } },
    ],
  },
  {
    id: 'narr_mine_collapse',
    title: 'Mine Collapse',
    description: 'A devastating collapse in your richest mine has trapped dozens of miners. The rubble is deep and rescue will be costly.',
    type: 'economic',
    chainId: 'chain_mine_collapse',
    chainStep: 1,
    isChainEvent: true,
    choices: [
      { id: 'mc_rescue', text: 'Launch a full rescue operation', effects: 'Save miners, mine closed temporarily', cost: { gold: 250 }, followUpEventId: 'narr_mine_heroes', followUpDelay: 2 },
      { id: 'mc_seal', text: 'Seal the mine — it is too dangerous', effects: 'Lose mine income, -10 loyalty', followUpEventId: 'narr_mine_anger', followUpDelay: 3 },
      { id: 'mc_partial', text: 'Attempt a limited rescue', effects: 'Some saved, some lost', cost: { gold: 100 } },
    ],
  },
  {
    id: 'narr_mine_heroes',
    title: 'Heroes of the Mine',
    description: 'The rescue was a success! All miners were pulled from the rubble alive. The people hail your compassion. The mine can be reopened with new safety measures.',
    type: 'economic',
    chainId: 'chain_mine_collapse',
    chainStep: 2,
    isChainEvent: true,
    choices: [
      { id: 'mh_reopen', text: 'Reopen with safety improvements', effects: '+8 gold/turn, +20 loyalty', cost: { gold: 150 } },
      { id: 'mh_monument', text: 'Build a monument to the survivors', effects: '+25 faith, +15 loyalty', cost: { gold: 100 }, reward: { faith: 25 } },
    ],
  },
  {
    id: 'narr_mine_anger',
    title: 'Miners\' Anger',
    description: 'The families of the entombed miners are furious. Protests erupt in the province. They demand justice and compensation.',
    type: 'economic',
    chainId: 'chain_mine_collapse',
    chainStep: 2,
    isChainEvent: true,
    choices: [
      { id: 'ma_compensate', text: 'Pay generous compensation', effects: 'Restore peace', cost: { gold: 300 } },
      { id: 'ma_suppress', text: 'Suppress the protests', effects: '-30 loyalty, order restored', cost: { military: 40 } },
    ],
  },
  {
    id: 'narr_merchant_guild',
    title: 'Merchant Guild Demands',
    description: 'The powerful Merchant Guild demands a royal charter granting them monopoly rights. They promise increased tax revenue in return.',
    type: 'economic',
    choices: [
      { id: 'mg_grant', text: 'Grant the charter', effects: '+10 gold/turn, merchants gain power' },
      { id: 'mg_refuse', text: 'Refuse — no one monopolizes trade', effects: '-5 gold/turn temporarily, maintain control' },
      { id: 'mg_counter', text: 'Counter-offer with limited privileges', effects: '+5 gold/turn, balanced', cost: { gold: 50 } },
    ],
  },
  {
    id: 'narr_counterfeit_coins',
    title: 'Counterfeit Coins',
    description: 'Counterfeit gold coins have flooded your markets! Trust in currency is plummeting. Merchants are demanding payment in goods instead.',
    type: 'economic',
    choices: [
      { id: 'cc_investigate', text: 'Launch a full investigation', effects: 'Find the source, costs gold', cost: { gold: 200 }, reward: { gold: 100 } },
      { id: 'cc_remint', text: 'Issue new coins with anti-fraud marks', effects: '-150 gold, restore trust', cost: { gold: 150 } },
      { id: 'cc_blame', text: 'Blame a foreign kingdom', effects: '-20 relations, deflect blame' },
    ],
  },
  {
    id: 'narr_drought_flood',
    title: 'Great Flood',
    description: 'Torrential rains have caused rivers to burst their banks. Farmlands are submerged and granaries waterlogged. Famine looms.',
    type: 'economic',
    choices: [
      { id: 'df_emergency', text: 'Declare emergency and distribute reserves', effects: '-100 food, prevent famine', cost: { food: 100 } },
      { id: 'df_import', text: 'Buy grain from abroad', effects: 'Prevent famine, costly', cost: { gold: 300 }, reward: { food: 80 } },
      { id: 'df_pray', text: 'Organize mass prayers for the waters to recede', effects: '-30 faith, chance of miracle', cost: { faith: 30 } },
    ],
  },
];

// ============================================================
// DYNASTY EVENTS
// ============================================================

const DYNASTY_EVENTS: EventTemplate[] = [
  {
    id: 'narr_heir_first_battle',
    title: 'Heir\'s First Battle',
    description: 'Your heir has reached fighting age and begs to lead a charge in the next battle. The risk is great but the glory could cement their claim.',
    type: 'dynasty',
    chainId: 'chain_heir_battle',
    chainStep: 1,
    isChainEvent: true,
    choices: [
      { id: 'hfb_allow', text: 'Let them fight — glory awaits', effects: 'Heir gains +3 Martial, risk of injury', followUpEventId: 'narr_heir_battle_result', followUpDelay: 1 },
      { id: 'hfb_refuse', text: 'Too dangerous — keep them safe', effects: 'Heir gains -5 claim strength, safe' },
      { id: 'hfb_compromise', text: 'Let them observe from a safe distance', effects: 'Heir gains +1 Martial, +1 Learning' },
    ],
  },
  {
    id: 'narr_heir_battle_result',
    title: 'The Young Warrior Returns',
    description: 'Your heir fought bravely on the field! Though wounded, they earned the respect of the soldiers. A scar runs along their cheek — a mark of honor.',
    type: 'dynasty',
    chainId: 'chain_heir_battle',
    chainStep: 2,
    isChainEvent: true,
    choices: [
      { id: 'hbr_celebrate', text: 'Host a feast in their honor', effects: '+20 morale, +10 claim strength', cost: { gold: 100 } },
      { id: 'hbr_heal', text: 'Focus on healing their wounds', effects: 'Heir fully recovers, +1 Learning', cost: { gold: 50 } },
    ],
  },
  {
    id: 'narr_marriage_scandal',
    title: 'Marriage Scandal',
    description: 'Your spouse has been seen in private meetings with a foreign envoy. The court whispers of infidelity. True or not, the scandal damages your dynasty.',
    type: 'dynasty',
    choices: [
      { id: 'ms_confront', text: 'Confront your spouse publicly', effects: '-10 diplomacy relations, clear the air' },
      { id: 'ms_silence', text: 'Silence the rumors with gold', effects: '-200 gold, scandal fades', cost: { gold: 200 } },
      { id: 'ms_investigate', text: 'Have your spymaster investigate', effects: 'Learn the truth', cost: { gold: 80 } },
    ],
  },
  {
    id: 'narr_bastard_claim',
    title: 'Bastard\'s Claim',
    description: 'A young warrior has appeared claiming to be your father\'s illegitimate child. They demand recognition and a share of the inheritance.',
    type: 'dynasty',
    choices: [
      { id: 'bc_accept', text: 'Acknowledge them — family is family', effects: 'Gain a capable commander, -10 heir claim', reward: { military: 30 } },
      { id: 'bc_deny', text: 'Deny the claim outright', effects: 'They may become an enemy' },
      { id: 'bc_test', text: 'Put them to a trial of worth', effects: 'If they prove worthy, gain a vassal', cost: { gold: 50 } },
    ],
  },
  {
    id: 'narr_ruler_illness',
    title: 'Ruler\'s Illness',
    description: 'You have fallen gravely ill with a mysterious fever. The court physicians are baffled. Your heir looks on with worry — or is it ambition?',
    type: 'dynasty',
    chainId: 'chain_ruler_illness',
    chainStep: 1,
    isChainEvent: true,
    choices: [
      { id: 'ri_physicians', text: 'Summon the finest physicians', effects: '-15 health now, may recover', cost: { gold: 300 }, followUpEventId: 'narr_illness_recovery', followUpDelay: 2 },
      { id: 'ri_faith', text: 'Seek divine healing at the temple', effects: 'Rely on faith for recovery', cost: { faith: 50 }, followUpEventId: 'narr_illness_miracle', followUpDelay: 2 },
      { id: 'ri_endure', text: 'Endure it — rulers do not show weakness', effects: '-20 health, maintain authority' },
    ],
  },
  {
    id: 'narr_illness_recovery',
    title: 'The Fever Breaks',
    description: 'After days of delirium, the fever finally breaks. You emerge weakened but alive. The realm breathes a sigh of relief.',
    type: 'dynasty',
    chainId: 'chain_ruler_illness',
    chainStep: 2,
    isChainEvent: true,
    choices: [
      { id: 'ir_rest', text: 'Rest and recover fully', effects: '+20 health, lose 1 turn of productivity' },
      { id: 'ir_return', text: 'Return to duty immediately', effects: '+5 health, +loyalty from dedication' },
    ],
  },
  {
    id: 'narr_illness_miracle',
    title: 'Miraculous Recovery',
    description: 'The temple priests performed ancient rites through the night. By dawn, your fever vanished. The people call it a miracle.',
    type: 'dynasty',
    chainId: 'chain_ruler_illness',
    chainStep: 2,
    isChainEvent: true,
    choices: [
      { id: 'im_proclaim', text: 'Proclaim it a divine miracle', effects: '+40 faith, +20 loyalty', reward: { faith: 40 } },
      { id: 'im_humble', text: 'Thank the priests quietly', effects: '+15 faith, stay humble', reward: { faith: 15 } },
    ],
  },
  {
    id: 'narr_twin_birth',
    title: 'Twin Birth',
    description: 'Your dynasty is blessed — twins have been born! Two healthy children, but the question of succession may become complicated in the future.',
    type: 'dynasty',
    choices: [
      { id: 'tb_celebrate', text: 'Celebrate with a realm-wide feast', effects: '+30 faith, +20 loyalty', cost: { gold: 150 }, reward: { faith: 30 } },
      { id: 'tb_declare', text: 'Declare the firstborn as primary heir', effects: 'Clear succession, second child may resent' },
      { id: 'tb_equal', text: 'Raise them as equal heirs', effects: 'Risk future civil war, both trained', reward: { faith: 10 } },
    ],
  },
];

// ============================================================
// PLAGUE CHAIN (cross-category)
// ============================================================

const PLAGUE_CHAIN: EventTemplate[] = [
  {
    id: 'narr_plague_outbreak',
    title: 'Plague Outbreak',
    description: 'A terrible plague has appeared in your realm. Blackened boils and fevered delirium spread from village to village. The death toll mounts daily.',
    type: 'personal',
    chainId: 'chain_plague',
    chainStep: 1,
    isChainEvent: true,
    choices: [
      { id: 'po_quarantine', text: 'Quarantine all affected provinces', effects: 'Slow spread, economic damage', cost: { gold: 200 }, followUpEventId: 'narr_plague_contained', followUpDelay: 3 },
      { id: 'po_ignore', text: 'Ignore it — plagues pass in time', effects: 'Risk massive spread', followUpEventId: 'narr_plague_spreads', followUpDelay: 2 },
      { id: 'po_pray', text: 'Organize mass prayers and processions', effects: 'Morale boost, may not help', cost: { faith: 40 }, followUpEventId: 'narr_plague_faith', followUpDelay: 3 },
    ],
  },
  {
    id: 'narr_plague_contained',
    title: 'Plague Contained',
    description: 'Your quarantine measures worked. The plague has been contained to a single province. Losses were significant but manageable.',
    type: 'personal',
    chainId: 'chain_plague',
    chainStep: 2,
    isChainEvent: true,
    choices: [
      { id: 'pc_rebuild', text: 'Begin rebuilding immediately', effects: '+10 loyalty, restart economy', cost: { gold: 150 } },
      { id: 'pc_memorial', text: 'Hold a memorial for the dead', effects: '+25 faith, healing begins', reward: { faith: 25 } },
    ],
  },
  {
    id: 'narr_plague_spreads',
    title: 'Plague Spreads to the Capital',
    description: 'The plague has reached your capital! Thousands flee the city. Your own court is at risk. The death toll is catastrophic.',
    type: 'personal',
    chainId: 'chain_plague',
    chainStep: 2,
    isChainEvent: true,
    choices: [
      { id: 'ps_flee', text: 'Evacuate the court to the countryside', effects: '-30 loyalty, ruler safe', cost: { gold: 100 } },
      { id: 'ps_stay', text: 'Stay and lead the fight against the plague', effects: '-15 ruler health, +40 loyalty, heroic' },
      { id: 'ps_desperate', text: 'Burn the infected districts', effects: '-2000 population, plague stops', cost: { gold: 50 } },
    ],
  },
  {
    id: 'narr_plague_faith',
    title: 'The Plague and Faith',
    description: 'The religious processions brought some comfort, but the plague persists. Some say it is divine punishment. Others have lost all faith.',
    type: 'religious',
    chainId: 'chain_plague',
    chainStep: 2,
    isChainEvent: true,
    choices: [
      { id: 'pf_double', text: 'Double down on prayer and penance', effects: '+30 faith, plague may ease', reward: { faith: 30 } },
      { id: 'pf_science', text: 'Hire physicians instead', effects: '-30 faith, better chance of cure', cost: { gold: 200 } },
    ],
  },
];

// ============================================================
// ADDITIONAL FILLER / STANDALONE EVENTS
// ============================================================

const EXTRA_EVENTS: EventTemplate[] = [
  {
    id: 'narr_wandering_mystic',
    title: 'Wandering Mystic',
    description: 'A mysterious figure in dark robes appears at your court, offering cryptic prophecies about your dynasty\'s future. The court is unnerved.',
    type: 'religious',
    choices: [
      { id: 'wm_listen', text: 'Hear the prophecy', effects: '+2 Learning, unsettling visions', reward: { faith: 15 } },
      { id: 'wm_expel', text: 'Cast the mystic out', effects: 'Court calms, opportunity lost' },
      { id: 'wm_employ', text: 'Offer the mystic a position at court', effects: '+3 Intrigue, +10 faith', cost: { gold: 100 }, reward: { faith: 10 } },
    ],
  },
  {
    id: 'narr_runaway_princess',
    title: 'The Runaway Princess',
    description: 'A princess from a neighboring kingdom has fled to your court seeking asylum. Her father demands her return. Harboring her could mean war — or alliance.',
    type: 'political',
    choices: [
      { id: 'rp_shelter', text: 'Grant her sanctuary', effects: '-20 relations with her kingdom, possible alliance with rivals', cost: { gold: 50 } },
      { id: 'rp_return', text: 'Return her to her father', effects: '+25 relations, lose potential ally' },
      { id: 'rp_marry', text: 'Propose marriage to your heir', effects: 'Possible alliance, risk of war', cost: { gold: 200 } },
    ],
  },
  {
    id: 'narr_ancient_ruins',
    title: 'Ancient Ruins Discovered',
    description: 'Explorers have found ancient ruins beneath one of your provinces. Strange artifacts and forgotten knowledge lie within.',
    type: 'economic',
    choices: [
      { id: 'ar_excavate', text: 'Fund a full excavation', effects: '+3 Learning, rare artifacts', cost: { gold: 250 }, reward: { faith: 20 } },
      { id: 'ar_seal', text: 'Seal the ruins — some things are best left buried', effects: 'No cost, no risk' },
      { id: 'ar_loot', text: 'Strip the ruins for gold and materials', effects: '+400 gold, cursed?', reward: { gold: 400 } },
    ],
  },
  {
    id: 'narr_festival_of_swords',
    title: 'Festival of Swords',
    description: 'An annual warrior festival attracts champions from across the realm. Your marshal wants to enter your army\'s best fighters.',
    type: 'military',
    choices: [
      { id: 'fos_enter', text: 'Enter your champions', effects: '+20 morale, +50 military prestige', cost: { gold: 100 }, reward: { military: 30 } },
      { id: 'fos_host', text: 'Host and sponsor the festival', effects: '+10 relations with all, costly', cost: { gold: 300 }, reward: { faith: 15 } },
      { id: 'fos_skip', text: 'Skip this year — focus on real wars', effects: 'No effect' },
    ],
  },
  {
    id: 'narr_dragon_rumor',
    title: 'Dragon Rumors',
    description: 'Peasants report seeing a great winged beast in the mountains. Most dismiss it as superstition, but the stories persist. Fear grows.',
    type: 'personal',
    choices: [
      { id: 'dr_investigate', text: 'Send scouts to investigate', effects: 'Discover the truth', cost: { gold: 100, military: 30 } },
      { id: 'dr_dismiss', text: 'Dismiss the rumors publicly', effects: 'Calm the people, but what if...?' },
      { id: 'dr_exploit', text: 'Spread the legend to intimidate enemies', effects: '+10 fear factor, -10 relations', reward: { military: 20 } },
    ],
  },
];

export const ALL_NARRATIVE_EVENTS: EventTemplate[] = [
  ...POLITICAL_EVENTS,
  ...MILITARY_EVENTS,
  ...RELIGIOUS_EVENTS,
  ...ECONOMIC_EVENTS,
  ...DYNASTY_EVENTS,
  ...PLAGUE_CHAIN,
  ...EXTRA_EVENTS,
];

export const CHAIN_FOLLOW_UPS: Record<string, EventTemplate> = {};
ALL_NARRATIVE_EVENTS.forEach(evt => {
  CHAIN_FOLLOW_UPS[evt.id] = evt;
});

export function getStandaloneNarrativeEvents(): EventTemplate[] {
  return ALL_NARRATIVE_EVENTS.filter(e => !e.isChainEvent || e.chainStep === 1);
}

export function getFollowUpEvent(eventId: string): EventTemplate | undefined {
  return CHAIN_FOLLOW_UPS[eventId];
}
