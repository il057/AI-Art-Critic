export const JUDGING_FUNNY_TEXTS = [
  "正在通过 56K 调制解调器拨号连接 AI 艺术脑...",
  "评论家正戴上他的金丝单片眼镜，挑剔地审视着您的线条...",
  "正在冲泡一杯昂贵的蓝山咖啡以搭配您的艺术杰作...",
  "正在查阅《世界艺术名画全集》试图找出适合本画作的褒义词...",
  "由于画作过于震撼，56K 调制解调器正在发出刺耳的啸叫...",
  "正在用卢浮宫馆藏级放大镜端详您画作的每一个像素...",
  "评论家正在痛苦地揉着太阳穴，怀疑自己看到了毕加索转世...",
  "正在调动全网显卡算力，试图理解这一抹超越常理的超现实主义线条...",
  "正在撰写一篇长达五千字的先锋派艺术批判论文...",
];

// ── Word Bank ──────────────────────────────────────────────────────────────
export const wordBankOptionsMap: Record<
  string,
  "all" | "animals" | "food" | "vehicles" | "daily" | "fantasy"
> = {
  全部: "all",
  动物: "animals",
  食物: "food",
  交通工具: "vehicles",
  日常用品: "daily",
  奇幻与幻想: "fantasy",
};

export const wordBankReverseMap: Record<
  "all" | "animals" | "food" | "vehicles" | "daily" | "fantasy" | "custom",
  string
> = {
  all: "全部",
  animals: "动物",
  food: "食物",
  vehicles: "交通工具",
  daily: "日常用品",
  fantasy: "奇幻与幻想",
  custom: "自定义词库",
};

// ── Critique Style ────────────────────────────────────────────────────────
export const critiqueStyleOptionsMap: Record<
  string,
  "arrogant" | "supportive" | "poetic" | "philosophical" | "nonsense" | "random"
> = {
  傲慢尖酸: "arrogant",
  温柔鼓励: "supportive",
  诗意浪漫: "poetic",
  深奥哲学: "philosophical",
  无厘头搞笑: "nonsense",
  随机: "random",
  随机发挥: "random",
};

export const critiqueStyleReverseMap: Record<
  "arrogant" | "supportive" | "poetic" | "philosophical" | "nonsense" | "random",
  string
> = {
  arrogant: "傲慢尖酸",
  supportive: "温柔鼓励",
  poetic: "诗意浪漫",
  philosophical: "深奥哲学",
  nonsense: "无厘头搞笑",
  random: "随机",
};

// ── Duration ──────────────────────────────────────────────────────────────
export const durationReverseMap: Record<number, string> = {
  0: "无限制",
  30: "30秒",
  60: "60秒",
  90: "90秒",
};
