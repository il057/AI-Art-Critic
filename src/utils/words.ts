export const ANIMALS_WORDS = [
  "猫", "狗", "大象", "恐龙", "龙", "美人鱼", "章鱼", "独角兽", "企鹅", "长颈鹿",
  "熊猫", "考拉", "袋鼠", "狮子", "老虎", "猴子", "兔子", "青蛙", "乌龟", "蜗牛",
  "蝴蝶", "蜜蜂", "螃蟹", "金鱼", "羊驼", "狐狸", "鸭子", "松鼠", "小猪", "小鸡"
];

export const FOOD_WORDS = [
  "汉堡包", "菠萝", "香蕉", "西瓜", "苹果", "草莓", "胡萝卜", "冰淇淋", "甜甜圈",
  "热狗", "披萨", "寿司", "蛋糕", "爆米花", "面包", "柠檬", "葡萄", "樱桃", "煎蛋",
  "糖葫芦", "牛排", "饺子", "冰棒", "巧克力", "芝士"
];

export const VEHICLES_WORDS = [
  "宇宙飞船", "自行车", "潜水艇", "火箭", "救护车", "消防车", "警车", "帆船", "直升机",
  "滑板", "热气球", "跑车", "摩托车", "飞碟", "卡车", "公交车", "火车", "挖掘机", "飞机", "热气球"
];

export const DAILY_WORDS = [
  "吉他", "笔记本电脑", "耳机", "咖啡杯", "手表", "雨伞", "气球", "钥匙", "眼镜",
  "蜡烛", "钢琴", "皇冠", "帽子", "鞋子", "风筝", "马桶", "垃圾桶", "闹钟", "梳子",
  "牙刷", "镜子", "剪刀", "肥皂", "吹风机", "手提包"
];

export const FANTASY_WORDS = [
  "巫师", "机器人", "树屋", "火山", "城堡", "外星人", "海盗船", "幽灵", "吸血鬼",
  "南瓜灯", "小丑", "天使", "木乃伊", "宝箱", "魔法棒", "水晶球", "飞毯", "恶魔",
  "巨龙", "矮人", "骷髅", "盾牌", "圣杯", "飞天扫帚", "魔法书"
];

export const DRAWING_WORDS = [
  ...ANIMALS_WORDS,
  ...FOOD_WORDS,
  ...VEHICLES_WORDS,
  ...DAILY_WORDS,
  ...FANTASY_WORDS
];

export function getRandomWord(
  bank: "all" | "animals" | "food" | "vehicles" | "daily" | "fantasy" | "custom" = "all",
  customWords?: string[]
): string {
  let list = DRAWING_WORDS;
  if (bank === "animals") {
    list = ANIMALS_WORDS;
  } else if (bank === "food") {
    list = FOOD_WORDS;
  } else if (bank === "vehicles") {
    list = VEHICLES_WORDS;
  } else if (bank === "daily") {
    list = DAILY_WORDS;
  } else if (bank === "fantasy") {
    list = FANTASY_WORDS;
  } else if (bank === "custom" && customWords && customWords.length > 0) {
    list = customWords;
  }

  const index = Math.floor(Math.random() * list.length);
  return list[index] || "猫"; // Fallback to a safe word
}
