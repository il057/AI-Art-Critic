import React, { useState, useEffect, useRef } from "react";
import { getSettings, saveSettings, getGalleryItems, GalleryItem, updateGalleryItem, getAssetUrl } from "../utils/storage";
import { getDeterministicStats, applyVariation, getNumericSeed } from "../utils/cardStats";
import { Icon } from "@iconify/react";
import { DrawingBoard } from "./DrawingBoard";
import { WinBadges } from "./WinBadges";

interface BattleArenaProps {
  showAlert: (message: string, title?: string, type?: "info" | "warning" | "error") => void;
  showToast?: (message: string, type?: "success" | "info" | "error") => void;
  onClose: () => void;
}

interface Round {
  attacker: "player" | "enemy";
  skill_name: string;
  damage: number;
  visual_effect: "shake" | "flash_red" | "critical_hit";
  combat_log: string;
}

interface BattleScript {
  winner: "player" | "enemy";
  total_rounds: number;
  rounds: Round[];
}

type Stage = "select-bg-mode" | "draw-bg" | "select-card" | "loading-script" | "fighting" | "finished";

const ARENA_FUNNY_TEXTS = [
  "正在用 3.5 英寸软盘缓慢加载决斗场的背景贴图...",
  "正在称量双方体重，并计算物理引擎发生穿模崩溃的概率...",
  "测试工程师正在紧急修复技能的空气墙与判定框...",
  "大模型正在疯狂掷骰子，试图为即将发生的离谱攻击寻找一个合理的力学解释...",
  "战斗演算完毕，正在掩盖由于伤害溢出导致 56K 调制解调器冒烟的假象...",
  "正在向英特尔 Pentium 处理器申请浮点数精确度特批许可...",
  "正在清理内存，将多余的画笔墨水吸回芯片里...",
  "正在为裁判小人抹防晒霜，以防被卡牌金卡闪到眼睛...",
  "正在向画廊服务器拉取画作的高清无码渲染包...",
  "正在加载背景的 Windows 95 复古特写粒子效果...",
  "正在加载观众席的 8-bit 热烈鼓掌声音文件..."
];

// Helper to parse weight string into a clean number of kilograms (kg)
const parseWeightToKg = (weightStr: string): number => {
  const clean = weightStr.trim().toLowerCase();
  const match = clean.match(/^([0-9e.+-]+)\s*([a-z]*)$/i);
  if (!match) return 10;
  const val = parseFloat(match[1]);
  const unit = match[2];
  if (unit === "g" || unit === "克") return val / 1000;
  if (unit === "t" || unit === "吨") return val * 1000;
  return isNaN(val) ? 10 : val; // default kg
};

// Helper to parse height string into a clean number of meters (m)
const parseHeightToM = (heightStr: string): number => {
  const clean = heightStr.trim();
  const numMatch = clean.match(/^([0-9e.+-]+)/i);
  if (!numMatch) return 1.7;
  const val = parseFloat(numMatch[1]);
  if (isNaN(val)) return 1.7;

  const suffix = clean.substring(numMatch[1].length).trim();
  let multiplier = 1;
  
  if (/k\s*km/i.test(suffix) || /kkm/i.test(suffix)) {
    multiplier = 1000000; // Kilo-kilometer = 1,000,000 meters
  } else if (/km/i.test(suffix)) {
    multiplier = 1000;
  } else if (/M\s*m/i.test(suffix) || /Mm/i.test(suffix)) {
    multiplier = 1000000; // Mega-meter = 1,000,000 meters
  } else if (/m/i.test(suffix)) {
    multiplier = 1;
  }
  
  return val * multiplier;
};

// Programmatically draw a beautiful, pixelated retro-stadium/Win95-themed battle arena background
function generateDefaultArenaBackground(): string {
  const canvas = document.createElement("canvas");
  canvas.width = 800;
  canvas.height = 500;
  const ctx = canvas.getContext("2d");
  if (!ctx) return "";

  // 1. Draw a classic Win95 green checkerboard dither pattern
  const dither = document.createElement("canvas");
  dither.width = 4;
  dither.height = 4;
  const dCtx = dither.getContext("2d");
  if (dCtx) {
    dCtx.fillStyle = "#008080"; // Teal (Win95 classic)
    dCtx.fillRect(0, 0, 4, 4);
    dCtx.fillStyle = "#006666"; // Dark Teal
    dCtx.fillRect(0, 0, 2, 2);
    dCtx.fillRect(2, 2, 2, 2);
  }
  const pattern = ctx.createPattern(dither, "repeat");
  ctx.fillStyle = pattern || "#008080";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 2. Draw a 3D perspective battle grid (Vaporwave / Retro-stadium floor)
  ctx.strokeStyle = "rgba(0, 255, 255, 0.25)"; // Retro cyan grid
  ctx.lineWidth = 1.5;
  const horizonY = 240;
  
  // Horizontal lines with perspective spacing
  for (let y = horizonY; y <= canvas.height; y += (y - horizonY + 10) * 0.25 + 5) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }
  
  // Vertical perspective lines converging to a vanishing point
  const vanishX = canvas.width / 2;
  const numGridLines = 18;
  for (let i = 0; i <= numGridLines; i++) {
    const angleRatio = i / numGridLines;
    const bottomX = canvas.width * angleRatio;
    ctx.beginPath();
    ctx.moveTo(vanishX + (bottomX - vanishX) * 0.1, horizonY);
    ctx.lineTo(bottomX, canvas.height);
    ctx.stroke();
  }

  // 3. Draw a glowing battle circle in the center with 3D projection
  ctx.save();
  ctx.translate(canvas.width / 2, 360);
  ctx.scale(1, 0.35); // flatten to circle in 3D perspective
  
  // Outer circle ring
  ctx.strokeStyle = "rgba(255, 255, 0, 0.4)";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(0, 0, 180, 0, Math.PI * 2);
  ctx.stroke();
  
  // Inner ring
  ctx.strokeStyle = "rgba(255, 255, 0, 0.7)";
  ctx.lineWidth = 2;
  ctx.setLineDash([12, 8]);
  ctx.beginPath();
  ctx.arc(0, 0, 160, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // 4. Draw outer Win95 beveled frame borders
  ctx.strokeStyle = "#FFFFFF";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(2, canvas.height - 2);
  ctx.lineTo(2, 2);
  ctx.lineTo(canvas.width - 2, 2);
  ctx.stroke();
  
  ctx.strokeStyle = "#808080";
  ctx.beginPath();
  ctx.moveTo(2, canvas.height - 2);
  ctx.lineTo(canvas.width - 2, canvas.height - 2);
  ctx.lineTo(canvas.width - 2, 2);
  ctx.stroke();

  // Inner border bevel
  ctx.strokeStyle = "#DFDFDF";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(4, canvas.height - 4);
  ctx.lineTo(4, 4);
  ctx.lineTo(canvas.width - 4, 4);
  ctx.stroke();
  
  ctx.strokeStyle = "#404040";
  ctx.beginPath();
  ctx.moveTo(4, canvas.height - 4);
  ctx.lineTo(canvas.width - 4, canvas.height - 4);
  ctx.lineTo(canvas.width - 4, 4);
  ctx.stroke();

  // 5. Draw Card Slots with classic Win95 beveled recess and matrix pattern
  const drawCardSlot = (x: number, y: number, label: string) => {
    const w = 240;
    const h = 330;
    
    // Draw recessed background inside slot
    ctx.fillStyle = "#000000";
    ctx.fillRect(x, y, w, h);
    
    // Draw matrix dither pattern
    const slotDither = document.createElement("canvas");
    slotDither.width = 4;
    slotDither.height = 4;
    const sdCtx = slotDither.getContext("2d");
    if (sdCtx) {
      sdCtx.fillStyle = "#0a192f";
      sdCtx.fillRect(0, 0, 4, 4);
      sdCtx.fillStyle = "#0f2b5c";
      sdCtx.fillRect(0, 0, 2, 2);
      sdCtx.fillRect(2, 2, 2, 2);
    }
    const slotPattern = ctx.createPattern(slotDither, "repeat");
    ctx.fillStyle = slotPattern || "#0a192f";
    ctx.fillRect(x + 4, y + 4, w - 8, h - 8);

    // Card slot border (Recessed Bevel)
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#404040";
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.lineTo(x, y);
    ctx.lineTo(x + w, y);
    ctx.stroke();

    ctx.strokeStyle = "#808080";
    ctx.beginPath();
    ctx.moveTo(x + 1, y + h - 1);
    ctx.lineTo(x + 1, y + 1);
    ctx.lineTo(x + w - 1, y + 1);
    ctx.stroke();

    ctx.strokeStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x + w, y);
    ctx.stroke();

    ctx.strokeStyle = "#DFDFDF";
    ctx.beginPath();
    ctx.moveTo(x + 1, y + h - 1);
    ctx.lineTo(x + w - 1, y + h - 1);
    ctx.lineTo(x + w - 1, y + 1);
    ctx.stroke();

    // Crosshairs in slot corners
    ctx.strokeStyle = "rgba(0, 255, 255, 0.4)";
    ctx.lineWidth = 1;
    const len = 10;
    // Top-Left
    ctx.beginPath(); ctx.moveTo(x + 15, y + 15); ctx.lineTo(x + 15 + len, y + 15); ctx.moveTo(x + 15, y + 15); ctx.lineTo(x + 15, y + 15 + len); ctx.stroke();
    // Top-Right
    ctx.beginPath(); ctx.moveTo(x + w - 15, y + 15); ctx.lineTo(x + w - 15 - len, y + 15); ctx.moveTo(x + w - 15, y + 15); ctx.lineTo(x + w - 15, y + 15 + len); ctx.stroke();
    // Bottom-Left
    ctx.beginPath(); ctx.moveTo(x + 15, y + h - 15); ctx.lineTo(x + 15 + len, y + h - 15); ctx.moveTo(x + 15, y + h - 15); ctx.lineTo(x + 15, y + h - 15 - len); ctx.stroke();
    // Bottom-Right
    ctx.beginPath(); ctx.moveTo(x + w - 15, y + h - 15); ctx.lineTo(x + w - 15 - len, y + h - 15); ctx.moveTo(x + w - 15, y + h - 15); ctx.lineTo(x + w - 15, y + h - 15 - len); ctx.stroke();

    // Slot Label
    ctx.fillStyle = "rgba(0, 255, 255, 0.7)";
    ctx.font = "11px 'Courier New', monospace";
    ctx.textAlign = "center";
    ctx.fillText(label, x + w / 2, y + h / 2 - 5);
    ctx.font = "9px 'Courier New', monospace";
    ctx.fillStyle = "rgba(0, 255, 255, 0.4)";
    ctx.fillText("READY TO DEPLOY", x + w / 2, y + h / 2 + 15);
  };

  drawCardSlot(60, 60, "[ CARD_A_SLOT ]");
  drawCardSlot(500, 60, "[ CARD_B_SLOT ]");

  // 6. Center energy separator line
  ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(canvas.width / 2, 20);
  ctx.lineTo(canvas.width / 2, canvas.height - 20);
  ctx.stroke();

  // 7. System UI HUD text
  ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
  ctx.font = "10px 'Courier New', monospace";
  ctx.textAlign = "left";
  ctx.fillText("SYS.LOC: AREA_95", 20, 30);
  ctx.textAlign = "right";
  ctx.fillText("STATUS: ACTIVE_SIMULATION_V1.0", canvas.width - 20, 30);
  
  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
  ctx.fillText("<< CPU-PROCESSOR DUAL ENGINE COLLISION MATRIX >>", canvas.width / 2, canvas.height - 18);

  return canvas.toDataURL();
}

function cleanAndParseJson(text: string) {
  let cleaned = text.trim();
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleaned = jsonMatch[0];
  }
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("Failed to parse JSON content:", text);
    throw new Error("无法解析模型返回的 JSON。");
  }
}

export function BattleArena({ showAlert, showToast, onClose }: BattleArenaProps) {
  const [stage, setStage] = useState<Stage>("select-bg-mode");
  
  // Background image (loaded dynamically from Storage or created anew)
  const [bgImage, setBgImage] = useState<string>("");

  // Gallery and selections
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [playerCard, setPlayerCard] = useState<GalleryItem | null>(null);
  const [enemyCard, setEnemyCard] = useState<GalleryItem | null>(null);
  const [cardStats, setCardStats] = useState<{
    player: { height: string; weight: string; scale: number; cardNo: number };
    enemy: { height: string; weight: string; scale: number; cardNo: number };
  } | null>(null);

  // API Call and simulation states
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingText, setLoadingText] = useState("正在加载...");
  const [script, setScript] = useState<BattleScript | null>(null);
  
  // Simulation states
  const [combatActive, setCombatActive] = useState(false);
  const [currentRoundIndex, setCurrentRoundIndex] = useState(-1);
  const [playerHP, setPlayerHP] = useState(100);
  const [playerMaxHP, setPlayerMaxHP] = useState(100);
  const [enemyHP, setEnemyHP] = useState(100);
  const [enemyMaxHP, setEnemyMaxHP] = useState(100);
  
  // Array to store full terminal scrolling log history
  const [combatLogs, setCombatLogs] = useState<string[]>(["战斗准备就绪..."]);
  
  const [attackerState, setAttackerState] = useState<"player" | "enemy" | null>(null);
  const [receiverState, setReceiverState] = useState<{
    target: "player" | "enemy" | null;
    effect: "shake" | "flash_red" | "critical_hit" | null;
  }>({ target: null, effect: null });
  const [damagePopup, setDamagePopup] = useState<{
    damage: number;
    skillName: string;
    target: "player" | "enemy";
  } | null>(null);
  const [winner, setWinner] = useState<"player" | "enemy" | null>(null);

  // Responsive scale calculations
  const [windowWidth, setWindowWidth] = useState(typeof window !== "undefined" ? window.innerWidth : 800);
  
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const logContainerRef = useRef<HTMLDivElement | null>(null);

  // Load background image on startup if present in IndexedDB settings
  useEffect(() => {
    getSettings().then((settings) => {
      if (settings?.arenaBackground) {
        setBgImage(settings.arenaBackground);
        setStage("select-card"); // Skip selector if background is saved
      } else {
        setStage("select-bg-mode"); // Otherwise prompt selector
      }
    });
  }, []);

  // Scroll to bottom helper for logs
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [combatLogs]);

  // Loading progress bar timer: progress block incrementer that loops smoothly
  useEffect(() => {
    let interval: number;
    if (stage === "loading-script") {
      setLoadingProgress(0);
      interval = window.setInterval(() => {
        setLoadingProgress((prev) => {
          return prev >= 95 ? 0 : prev + 5;
        });
      }, 250);
    }
    return () => clearInterval(interval);
  }, [stage]);

  // Loading text randomizer timer (every 2 seconds)
  useEffect(() => {
    let textInterval: number;
    if (stage === "loading-script") {
      setLoadingText(ARENA_FUNNY_TEXTS[0]);
      textInterval = window.setInterval(() => {
        const randomIndex = Math.floor(Math.random() * ARENA_FUNNY_TEXTS.length);
        setLoadingText(ARENA_FUNNY_TEXTS[randomIndex]);
      }, 2000);
    }
    return () => clearInterval(textInterval);
  }, [stage]);

  // Load Gallery
  useEffect(() => {
    if (stage === "select-card") {
      getGalleryItems().then((items) => {
        setGalleryItems(items);
      });
    }
  }, [stage]);

  // Option select background triggers
  const handleUseDefaultBg = async () => {
    const defaultBg = generateDefaultArenaBackground();
    setBgImage(defaultBg);
    setStage("select-card");

    // Persist default background to DB
    try {
      const settings = await getSettings();
      await saveSettings({
        ...(settings || { provider: "openrouter", apiUrl: "", apiKey: "", selectedModel: "", models: [] }),
        arenaBackground: defaultBg
      });
      if (showToast) showToast("默认对决背景应用成功！", "success");
    } catch (err) {
      console.error("Failed to save background image:", err);
    }
  };

  const handleCustomBgSubmit = async (base64Image: string) => {
    setBgImage(base64Image);
    setStage("select-card");

    // Persist custom background to DB
    try {
      const settings = await getSettings();
      await saveSettings({
        ...(settings || { provider: "openrouter", apiUrl: "", apiKey: "", selectedModel: "", models: [] }),
        arenaBackground: base64Image
      });
      if (showToast) showToast("自定义背景保存成功！", "success");
    } catch (err) {
      console.error("Failed to save background image:", err);
    }
  };

  const handleSelectPresetBg = async (fileName: string) => {
    const bgUrl = `/wallpapers/${fileName}`;
    setBgImage(bgUrl);
    setStage("select-card");

    try {
      const settings = await getSettings();
      await saveSettings({
        ...(settings || { provider: "openrouter", apiUrl: "", apiKey: "", selectedModel: "", models: [] }),
        arenaBackground: bgUrl
      });
      if (showToast) showToast("经典壁纸应用成功！", "success");
    } catch (err) {
      console.error("Failed to save background image:", err);
    }
  };

  // Card Selection handlers
  const handleSelectPlayer = async (player: GalleryItem) => {
    setPlayerCard(player);
    
    // Select a random enemy card (can be the same card clone if gallery only has 1 item)
    const candidates = galleryItems.filter((item) => item.id !== player.id);
    let enemy: GalleryItem;
    if (candidates.length > 0) {
      enemy = candidates[Math.floor(Math.random() * candidates.length)];
    } else {
      // Mirror match fallback
      enemy = {
        ...player,
        id: player.id + "_clone",
        targetWord: player.targetWord + "(克隆体)",
      };
    }
    setEnemyCard(enemy);

    // Calculate deterministic stats & scale
    const settings = await getSettings();
    
    const pStatsRaw = getDeterministicStats(player.targetWord, settings?.customStats);
    const pSeed = getNumericSeed((player.id || "") + "_arena");
    const pHeight = applyVariation(pStatsRaw.height, pSeed);
    const pWeight = applyVariation(pStatsRaw.weight, pSeed + 13);
    const pCardNo = (pSeed % 900) + 100;

    const eStatsRaw = getDeterministicStats(enemy.targetWord, settings?.customStats);
    const eSeed = getNumericSeed((enemy.id || "") + "_arena");
    const eHeight = applyVariation(eStatsRaw.height, eSeed);
    const eWeight = applyVariation(eStatsRaw.weight, eSeed + 13);
    const eCardNo = (eSeed % 900) + 100;

    // Height difference scaling (logarithmic scale with dramatic visual variance)
    const hp = parseHeightToM(pHeight);
    const he = parseHeightToM(eHeight);
    const logDiff = Math.log10(hp) - Math.log10(he);
    const clampedDiff = Math.max(-4, Math.min(4, isNaN(logDiff) ? 0 : logDiff));
    const scaleDelta = clampedDiff * 0.18;
    const pScale = Math.max(0.35, Math.min(1.45, 1 + scaleDelta));
    const eScale = Math.max(0.35, Math.min(1.45, 1 - scaleDelta));

    setCardStats({
      player: { height: pHeight, weight: pWeight, scale: pScale, cardNo: pCardNo },
      enemy: { height: eHeight, weight: eWeight, scale: eScale, cardNo: eCardNo }
    });

    // Set HP state
    setPlayerHP(player.score);
    setPlayerMaxHP(player.score);
    setEnemyHP(enemy.score);
    setEnemyMaxHP(enemy.score);
    setWinner(null);
    setCurrentRoundIndex(-1);

    // Fetch Script
    setStage("loading-script");
    fetchBattleScript(player, enemy, pHeight, pWeight, eHeight, eWeight);
  };

  // API Call
  const fetchBattleScript = async (
    player: GalleryItem,
    enemy: GalleryItem,
    pHeight: string,
    pWeight: string,
    eHeight: string,
    eWeight: string
  ) => {
    try {
      const settings = await getSettings();
      if (!settings || !settings.apiKey) {
        throw new Error("请先在「控制面板.lnk」配置大模型的 API 密钥再开启角斗场！");
      }
      
      const { provider, apiUrl, apiKey, selectedModel } = settings;

      const systemPrompt = `你是一个无厘头搞笑的卡牌对战裁判。
你的任务是根据两张卡牌的数据，策划一场极其荒诞、极具节目效果的自动对战脚本。

我们有两张卡牌：card_a 和 card_b。数据包含：名字、HP（即分数）、身高、体重、之前的艺术点评。

规则与要求：
1. 战斗是自动进行的回合制对决。你不需要偏袒任何一方，请纯粹根据两张卡牌的特征（例如：猫 vs 键盘，吉他 vs 水龙头）和艺术点评中蕴含的幽默元素，来设计谁赢谁输。以节目效果最大化、最幽默好笑为唯一标准！
2. 必须包含 3 到 6 回合的对局数据。
3. 在每一回合中，一方作为攻击者 (attacker)，使用极其荒诞搞怪的技能攻击另一方，造成伤害。
4. 技能名称 (skill_name) 必须极其无厘头和搞笑（限8个字，例如："猫毛漫天飞"、"降维光线"、"量子摸鱼"、"差评轰炸"、"反弹攻击"），必须高度结合攻击者本身的特征或之前的AI点评。
5. 伤害值 (damage) 必须为正整数。
6. 你必须进行精确的计算，让输掉的一方在最后一回合的 HP 正好被扣减到 0 或以下。而胜利的一方的 HP 必须保持在 1 或以上。
7. 在撰写战斗描述 (combat_log) 时，请直接使用 "card_a" 和 "card_b" 指代双方（例如：card_a使出量子摸鱼，card_b被卡住软盘狂咳嗽，受到15点伤害）。我们会进行自动替换。
8. 请严格返回以下标准的 JSON 格式，绝对不要包含任何 Markdown 包裹（如 \`\`\`json），只返回原始 JSON 字符串：
{
  "winner": "card_a" | "card_b",
  "total_rounds": 数字,
  "rounds": [
    {
      "attacker": "player" | "enemy",
      "skill_name": "荒诞技能名（限8个字）",
      "damage": 伤害数字,
      "visual_effect": "shake" | "flash_red" | "critical_hit",
      "combat_log": "一句简短的荒诞战斗描述（如：己方使出猫毛漫天飞，敌方被猫毛卡住引擎狂咳嗽，受到15点伤害）"
    }
  ]
}`;

      const userPrompt = `
请为以下两张卡牌生成对战回合：

【Player (玩家)】
名字：${player.targetWord}
初始 HP：${player.score}
身高：${pHeight}
体重：${pWeight}
艺术点评：${player.critique}

【Enemy (对手)】
名字：${enemy.targetWord}
初始 HP：${enemy.score}
身高：${eHeight}
体重：${eWeight}
艺术点评：${enemy.critique}

请按要求生成对决剧本，计算好各回合扣血，使败者生命值降至0，赢家胜出。直接输出 JSON 格式。`;

      const requestUrl = `${apiUrl.replace(/\/$/, "")}/chat/completions`;
      const headers: HeadersInit = {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      };
      if (provider === "openrouter") {
        headers["HTTP-Referer"] = window.location.origin;
        headers["X-Title"] = "AI Art Critic Win95";
      }

      const response = await fetch(requestUrl, {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
          response_format: { type: "json_object" },
          temperature: 0.7,
        }),
      });

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "";
      const parsedScript = cleanAndParseJson(content);

      if (!parsedScript.winner || !parsedScript.rounds || !Array.isArray(parsedScript.rounds)) {
        throw new Error("大模型返回的数据格式不正确，缺少 rounds 或 winner。");
      }

      // Map card_a/player/targetWord -> player, card_b/enemy/targetWord -> enemy
      const isCardA = (str: string) => {
        const clean = (str || "").toLowerCase().trim();
        return (
          clean === "card_a" ||
          clean === "card a" ||
          clean === "carda" ||
          clean === "player" ||
          clean.includes("player") ||
          clean.includes(player.targetWord.toLowerCase().trim())
        );
      };

      const winnerVal = isCardA(parsedScript.winner) ? "player" : "enemy";
      const mappedRounds = parsedScript.rounds.map((r: any) => ({
        attacker: isCardA(r.attacker) ? "player" : "enemy",
        skill_name: r.skill_name || "",
        damage: typeof r.damage === "number" ? r.damage : parseInt(r.damage) || 10,
        visual_effect: r.visual_effect || "shake",
        combat_log: (r.combat_log || "")
          .replace(/card_a/gi, player.targetWord)
          .replace(/card_b/gi, enemy.targetWord)
          .replace(/玩家/g, player.targetWord)
          .replace(/对手/g, enemy.targetWord)
          .replace(/己方/g, player.targetWord)
          .replace(/敌方/g, enemy.targetWord)
      }));

      const mappedScript: BattleScript = {
        winner: winnerVal,
        total_rounds: parsedScript.total_rounds || mappedRounds.length,
        rounds: mappedRounds
      };

      setLoadingProgress(100);
      setScript(mappedScript);
      setStage("fighting");
      
      // Pass actual selected players to bypass react closure stale state
      startBattleSimulation(mappedScript, player, enemy);

    } catch (err: any) {
      console.error(err);
      showAlert(err.message || "请求失败，请检查网络或控制面板设置。", "卡牌决斗出错", "error");
      setStage("select-card");
    }
  };

  // State Machine simulation
  const startBattleSimulation = async (battleScript: BattleScript, pCard: GalleryItem, eCard: GalleryItem) => {
    setCombatActive(true);
    setCombatLogs(["战斗正式打响！全自动战术演播开始..."]);
    
    let currentP_HP = pCard.score;
    let currentE_HP = eCard.score;

    // Sleep helper
    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    await sleep(1500);

    for (let i = 0; i < battleScript.rounds.length; i++) {
      const round = battleScript.rounds[i];
      setCurrentRoundIndex(i);
      
      // Append combat log line to the console array
      setCombatLogs((prev) => [...prev, round.combat_log]);

      // 1. Attacker dash animation
      setAttackerState(round.attacker);
      
      // 2. Play hit effect half way through (350ms)
      await sleep(350); 
      
      const target = round.attacker === "player" ? "enemy" : "player";
      setReceiverState({
        target,
        effect: round.visual_effect
      });

      // Show damage popup
      setDamagePopup({
        damage: round.damage,
        skillName: round.skill_name,
        target
      });

      // 3. Deduct HP (defense check/clamping to ensure it never goes negative and mathematically ends correctly)
      if (target === "player") {
        currentP_HP = Math.max(0, currentP_HP - round.damage);
        setPlayerHP(currentP_HP);
      } else {
        currentE_HP = Math.max(0, currentE_HP - round.damage);
        setEnemyHP(currentE_HP);
      }

      // Check if someone died early (fallback logic if LLM damage matches fail)
      if (currentP_HP <= 0 || currentE_HP <= 0) {
        // Slowed down to 2.65 seconds to let user view animations and log line comfortably
        await sleep(2650); 
        setAttackerState(null);
        setReceiverState({ target: null, effect: null });
        setDamagePopup(null);
        break;
      }

      // Slowed down to 2.65 seconds to let user read the text
      await sleep(2650); 
      
      // Reset animations for next round
      setAttackerState(null);
      setReceiverState({ target: null, effect: null });
      setDamagePopup(null);

      // Brief gap between rounds (500ms)
      await sleep(500);
    }

    // Set final winner based on script winner, but verify HP
    const finalWinner = currentP_HP <= 0 ? "enemy" : (currentE_HP <= 0 ? "player" : battleScript.winner);
    
    // Force target HP to 0 if they lost but had remaining HP due to LLM math error
    if (finalWinner === "player") {
      setEnemyHP(0);
      
      // Increment player card wins in IndexedDB
      try {
        const updatedPlayer = {
          ...pCard,
          wins: (pCard.wins || 0) + 1
        };
        await updateGalleryItem(updatedPlayer);
        setPlayerCard(updatedPlayer); // Update local state for reactive display
      } catch (err) {
        console.error("Failed to update player wins:", err);
      }
    } else {
      setPlayerHP(0);
      
      // Increment enemy card wins in IndexedDB
      try {
        const updatedEnemy = {
          ...eCard,
          wins: (eCard.wins || 0) + 1
        };
        await updateGalleryItem(updatedEnemy);
        setEnemyCard(updatedEnemy); // Update local state for reactive display
      } catch (err) {
        console.error("Failed to update enemy wins:", err);
      }
    }

    // Update global match statistics in settings
    try {
      const settings = await getSettings();
      await saveSettings({
        ...(settings || { provider: "openrouter", apiUrl: "", apiKey: "", selectedModel: "", models: [] }),
        arenaMatches: (settings?.arenaMatches || 0) + 1,
        arenaWins: (settings?.arenaWins || 0) + (finalWinner === "player" ? 1 : 0)
      });
      if (showToast) {
        showToast(
          finalWinner === "player"
            ? `战斗胜利！${pCard.targetWord} 获得 1 胜！`
            : `战斗失败！${eCard.targetWord} 获得 1 胜！`,
          "success"
        );
      }
    } catch (err) {
      console.error("Failed to save global arena stats:", err);
    }

    setWinner(finalWinner);
    setCombatActive(false);
    setStage("finished");
    
    const winText = `决斗结束！获胜者是：${finalWinner === "player" ? pCard.targetWord : eCard.targetWord}！`;
    setCombatLogs((prev) => [...prev, winText]);
  };

  // Redraw / restart triggers
  const handleRestart = () => {
    if (playerCard) {
      handleSelectPlayer(playerCard);
    }
  };

  const mobileScaleMultiplier = windowWidth < 768 ? 0.76 : 1;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#c0c0c0] text-black relative">
      
      {/* Dynamic Keyframes and Mobile Responsiveness styles */}
      <style>{`
        /* Desktop animations (horizontal move with steps for retro low-framerate feel) */
        @keyframes dash-player-desktop {
          0% { transform: translateX(0); }
          25% { transform: translateX(30px) scale(1.02); }
          50% { transform: translateX(80px) scale(1.08); }
          75% { transform: translateX(80px) scale(1.08); }
          100% { transform: translateX(0); }
        }
        @keyframes dash-enemy-desktop {
          0% { transform: translateX(0); }
          25% { transform: translateX(-30px) scale(1.02); }
          50% { transform: translateX(-80px) scale(1.08); }
          75% { transform: translateX(-80px) scale(1.08); }
          100% { transform: translateX(0); }
        }

        /* Mobile animations (vertical move, player at bottom slides up, enemy at top slides down) */
        @keyframes dash-player-mobile {
          0% { transform: translateY(0); }
          25% { transform: translateY(-20px) scale(1.02); }
          50% { transform: translateY(-50px) scale(1.06); }
          75% { transform: translateY(-50px) scale(1.06); }
          100% { transform: translateY(0); }
        }
        @keyframes dash-enemy-mobile {
          0% { transform: translateY(0); }
          25% { transform: translateY(20px) scale(1.02); }
          50% { transform: translateY(50px) scale(1.06); }
          75% { transform: translateY(50px) scale(1.06); }
          100% { transform: translateY(0); }
        }

        /* Stepped CRT screen/CPU stress shake look */
        @keyframes shake {
          0%, 100% { transform: translate(0, 0); }
          10% { transform: translate(-6px, -2px); }
          30% { transform: translate(6px, 2px); }
          50% { transform: translate(-6px, 3px); }
          70% { transform: translate(6px, -1px); }
          90% { transform: translate(-3px, 1px); }
        }

        /* Rapid flickering color overlay for damage flash (retro sprite damage style) */
        @keyframes flash-red {
          0%, 100% { filter: none; }
          20%, 60% { filter: invert(0.9) sepia(1) saturate(8) hue-rotate(-50deg) contrast(1.5); }
          40%, 80% { filter: none; opacity: 0.5; }
        }

        /* Retro invert and flash for critical hits */
        @keyframes critical-hit {
          0% { transform: scale(1); filter: none; }
          15% { transform: scale(1.15) rotate(5deg); filter: invert(1); }
          30% { transform: scale(0.9) rotate(-5deg); filter: sepia(1) saturate(10) hue-rotate(-50deg); }
          45% { transform: scale(1.1) rotate(3deg); filter: invert(1); }
          60% { transform: scale(0.95) rotate(-3deg); filter: none; }
          75% { transform: scale(1.05) rotate(1deg); filter: invert(0.5); }
          100% { transform: scale(1) rotate(0); filter: none; }
        }

        /* Damped, pixelated bounce for Win95 damage popups */
        @keyframes damage-popup {
          0% { opacity: 0; transform: translateY(30px) scale(0.6); }
          15% { opacity: 1; transform: translateY(-10px) scale(1.05); }
          30% { opacity: 1; transform: translateY(-5px) scale(1); }
          80% { opacity: 1; transform: translateY(-15px) scale(1); }
          100% { opacity: 0; transform: translateY(-35px) scale(0.9); }
        }

        @keyframes winner-pulse {
          0%, 100% { transform: scale(1.0); box-shadow: 0 0 5px rgba(212, 175, 55, 0.4); }
          50% { transform: scale(1.04); box-shadow: 0 0 15px rgba(212, 175, 55, 0.9); }
        }

        /* Instant retro stamp in */
        @keyframes stamp-in {
          0% { opacity: 0; transform: scale(2.0) rotate(-20deg); }
          50% { opacity: 1; transform: scale(1.0) rotate(-12deg); }
          100% { opacity: 1; transform: scale(1.0) rotate(-12deg); }
        }

        /* Blinking cursor for DOS prompt */
        @keyframes blink {
          0%, 100% { opacity: 0; }
          50% { opacity: 1; }
        }
        
        .animate-dash-player {
          animation: dash-player-mobile 0.5s steps(8);
        }
        .animate-dash-enemy {
          animation: dash-enemy-mobile 0.5s steps(8);
        }
        .animate-shake {
          animation: shake 0.6s steps(6);
        }
        .animate-flash-red {
          animation: flash-red 0.6s steps(6);
        }
        .animate-critical-hit {
          animation: critical-hit 0.7s steps(8);
        }
        .animate-damage-popup {
          animation: damage-popup 1.5s forwards steps(12);
        }
        .animate-winner-pulse {
          animation: winner-pulse 2s infinite ease-in-out;
        }
        .animate-stamp-in {
          animation: stamp-in 0.3s forwards steps(4);
        }

        /* Responsive Card styling */
        .arena-card {
          width: 85vw;
          max-width: 195px;
        }

        @media (max-width: 767px) {
          .arena-card {
            max-width: 175px !important;
            font-size: 8px !important;
          }
          .arena-card .h-28, .arena-card .h-32 {
            height: 72px !important;
          }
          .arena-card .h-16, .arena-card .h-20 {
            height: 48px !important;
          }
          .arena-card .text-xs {
            font-size: 10px !important;
          }
        }

        @media (min-width: 480px) {
          .arena-card {
            max-width: 215px;
          }
        }

        @media (min-width: 768px) {
          .animate-dash-player {
            animation: dash-player-desktop 0.5s steps(8);
          }
          .animate-dash-enemy {
            animation: dash-enemy-desktop 0.5s steps(8);
          }
          .arena-card {
            width: 230px;
            max-width: none;
          }
        }

        /* Custom Win95 scrollbar for the MS-DOS output */
        .scrollbar-win95::-webkit-scrollbar {
          width: 16px;
        }
        .scrollbar-win95::-webkit-scrollbar-track {
          background: #dfdfdf;
          box-shadow: inset 1px 1px 0 #808080, inset -1px -1px 0 #ffffff;
        }
        .scrollbar-win95::-webkit-scrollbar-thumb {
          background: #c0c0c0;
          border: 2px solid;
          border-color: #ffffff #808080 #808080 #ffffff;
        }
        .scrollbar-win95::-webkit-scrollbar-thumb:active {
          background: #a0a0a0;
        }
        .scrollbar-win95::-webkit-scrollbar-button {
          display: block;
          height: 16px;
          background: #c0c0c0;
          border: 2px solid;
          border-color: #ffffff #808080 #808080 #ffffff;
        }
      `}</style>

      {/* Menu / Top Bar Info */}
      <div className="bg-[#c0c0c0] border-b-2 border-white px-2 py-1 flex items-center justify-between text-xs flex-shrink-0">
        <div className="flex gap-2">
          <span className="font-bold font-mono">竞技场模式: 全自动AI卡牌对决</span>
        </div>
        <div className="flex gap-2">
          {stage !== "select-bg-mode" && stage !== "draw-bg" && (
            <button
              onClick={() => {
                setStage("select-bg-mode");
                setPlayerCard(null);
                setEnemyCard(null);
              }}
              className="px-2 py-0.5 bg-[#c0c0c0] border border-t-white border-l-white border-b-gray-800 border-r-gray-800 active:border-t-gray-800 active:border-l-gray-800 active:border-b-white active:border-r-white cursor-pointer hover:bg-[#d0d0d0]"
            >
              重新选背景
            </button>
          )}
          {stage !== "select-bg-mode" && stage !== "draw-bg" && stage !== "select-card" && (
            <button
              onClick={() => setStage("select-card")}
              className="px-2 py-0.5 bg-[#c0c0c0] border border-t-white border-l-white border-b-gray-800 border-r-gray-800 active:border-t-gray-800 active:border-l-gray-800 active:border-b-white active:border-r-white cursor-pointer hover:bg-[#d0d0d0]"
            >
              重新选卡
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-0 p-2 relative bg-[#7f7f7f]">
        
        {/* Stage 0: Choice of background mode */}
        {stage === "select-bg-mode" && (
          <div className="flex-1 flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 p-4 max-w-md w-full text-black shadow-lg">
              <div className="bg-[#000080] text-white px-2 py-1 font-bold text-xs flex justify-between items-center mb-3 select-none">
                <span>[步骤 1] 竞技场背景选择</span>
                <Icon icon="dinkie-icons:dagger-knife-filled" className="w-4 h-4" />
              </div>
              <p className="text-xs mb-4 text-gray-800 leading-normal">
                请选择角斗场对决的背景模式。您可以绘制自己心仪的对局舞台，使用系统内置的默认卡牌大擂台，或选择经典 Windows 95 桌面壁纸。
              </p>
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleUseDefaultBg}
                    className="py-2 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 active:border-t-gray-800 active:border-l-gray-800 active:border-b-white active:border-r-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer hover:bg-[#d0d0d0]"
                  >
                    <Icon icon="dinkie-icons:compass" className="w-4 h-4 text-amber-600" />
                    <span>默认擂台.dat</span>
                  </button>
                  <button
                    onClick={() => setStage("draw-bg")}
                    className="py-2 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 active:border-t-gray-800 active:border-l-gray-800 active:border-b-white active:border-r-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer hover:bg-[#d0d0d0]"
                  >
                    <Icon icon="dinkie-icons:artist-palette" className="w-4 h-4 text-blue-800" />
                    <span>手绘舞台.exe</span>
                  </button>
                </div>

                <div className="border-t border-gray-400 my-2 pt-3">
                  <span className="text-[10px] font-bold text-gray-700 block mb-2 font-mono">
                    [ 经典 Windows 95 桌面壁纸 ]
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleSelectPresetBg("clouds_win95.png")}
                      className="p-1 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 active:border-t-gray-800 active:border-l-gray-800 active:border-b-white active:border-r-white text-[10px] flex flex-col items-center gap-1 cursor-pointer hover:bg-[#d0d0d0]"
                    >
                      <div className="w-full h-11 bg-sky-200 overflow-hidden border border-gray-700">
                        <img src={getAssetUrl("/wallpapers/clouds_win95.png")} alt="蓝天白云" className="w-full h-full object-cover" />
                      </div>
                      <span className="font-mono">蓝天白云.bmp</span>
                    </button>
                    <button
                      onClick={() => handleSelectPresetBg("teal_solid.jpg")}
                      className="p-1 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 active:border-t-gray-800 active:border-l-gray-800 active:border-b-white active:border-r-white text-[10px] flex flex-col items-center gap-1 cursor-pointer hover:bg-[#d0d0d0]"
                    >
                      <div className="w-full h-11 bg-[#008080] overflow-hidden border border-gray-700">
                        <img src={getAssetUrl("/wallpapers/teal_solid.jpg")} alt="经典墨绿" className="w-full h-full object-cover" />
                      </div>
                      <span className="font-mono">经典墨绿.bmp</span>
                    </button>
                    <button
                      onClick={() => handleSelectPresetBg("bliss_meadow.jpg")}
                      className="p-1 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 active:border-t-gray-800 active:border-l-gray-800 active:border-b-white active:border-r-white text-[10px] flex flex-col items-center gap-1 cursor-pointer hover:bg-[#d0d0d0]"
                    >
                      <div className="w-full h-11 bg-green-800 overflow-hidden border border-gray-700">
                        <img src={getAssetUrl("/wallpapers/bliss_meadow.jpg")} alt="经典麦田" className="w-full h-full object-cover" />
                      </div>
                      <span className="font-mono">经典麦田.bmp</span>
                    </button>
                    <button
                      onClick={() => handleSelectPresetBg("windows95_logo.jpg")}
                      className="p-1 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 active:border-t-gray-800 active:border-l-gray-800 active:border-b-white active:border-r-white text-[10px] flex flex-col items-center gap-1 cursor-pointer hover:bg-[#d0d0d0]"
                    >
                      <div className="w-full h-11 bg-blue-900 overflow-hidden border border-gray-700">
                        <img src={getAssetUrl("/wallpapers/windows95_logo.jpg")} alt="Win95 徽标" className="w-full h-full object-cover" />
                      </div>
                      <span className="font-mono">系统徽标.bmp</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Stage 1: Draw Arena Background - Reusing DrawingBoard.tsx */}
        {stage === "draw-bg" && (
          <div className="flex-1 flex flex-col min-h-0 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 p-1">
            <div className="bg-[#000080] text-white px-2 py-1 font-bold text-xs flex justify-between items-center mb-1 flex-shrink-0">
              <span>自主手绘卡牌对决的竞技场背景</span>
              <Icon icon="dinkie-icons:artist-palette" className="w-4 h-4" />
            </div>
            <div className="flex-1 flex flex-col min-h-0">
              <DrawingBoard
                targetWord="对决竞技场背景"
                timeLeft={999999}
                onSubmit={handleCustomBgSubmit}
              />
            </div>
          </div>
        )}

        {/* Stage 2: Card Selection */}
        {stage === "select-card" && (
          <div className="flex-1 flex flex-col min-h-0 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 p-2">
            <div className="bg-[#000080] text-white px-2 py-1 font-bold text-xs flex justify-between items-center mb-2 flex-shrink-0">
              <span>[步骤 2] 选择你的参战卡牌</span>
              <Icon icon="dinkie-icons:floppy-disk-filled" className="w-4 h-4" />
            </div>

            {galleryItems.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-[#808080] text-white">
                <Icon icon="streamline-pixel:design-drawing-board" className="w-16 h-16 text-gray-300 mb-4" />
                <p className="font-bold text-base">您的画廊是空的！</p>
                <p className="text-xs mt-2 text-gray-200 max-w-sm leading-relaxed">
                  卡牌角斗场需要使用画廊中的画作卡牌数据作为实体进行战斗。请关闭此窗口，前往“傲慢的评论家.exe”绘制并保存至少一张画作！
                </p>
                <button
                  onClick={onClose}
                  className="mt-4 px-4 py-1.5 bg-[#c0c0c0] text-black border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 font-bold text-xs"
                >
                  确定关闭
                </button>
              </div>
            ) : (
              <div className="flex-1 flex flex-col min-h-0">
                <p className="text-xs text-gray-700 mb-2">
                  点击画廊中的一张卡牌作为您的出战角色，系统将随机抽取另外一张卡牌作为您的决斗对手。
                </p>
                <div className="flex-1 overflow-y-auto bg-[#808080] p-2 border-2 border-t-gray-800 border-l-gray-800 border-b-white border-r-white">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {galleryItems.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleSelectPlayer(item)}
                        className="bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 p-1 flex flex-col cursor-pointer hover:bg-[#e0e0e0] active:border-t-gray-800 active:border-l-gray-800 active:border-b-white active:border-r-white transition-colors"
                      >
                        <div className="flex justify-between items-center bg-gradient-to-r from-[#000080] to-[#1084d0] text-white px-1 py-0.5 text-[10px] font-bold">
                          <div className="flex items-center gap-1 flex-1 min-w-0">
                            <span className="truncate flex-shrink">{item.targetWord}</span>
                            <WinBadges wins={item.wins} />
                          </div>
                          <span className="text-yellow-300 flex-shrink-0 ml-1">{item.score}HP</span>
                        </div>
                        <div className="h-24 bg-white border border-gray-700 mt-1 flex items-center justify-center overflow-hidden">
                          <img src={item.image} alt={item.targetWord} className="max-h-full max-w-full object-contain" />
                        </div>
                        <div className="mt-1 text-[9px] text-gray-800 leading-tight line-clamp-2 h-6">
                          猜: {item.guess}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Stage 3: Loading Combat Script (LLM Query) */}
        {stage === "loading-script" && (
          <div className="flex-1 flex items-center justify-center">
            <div className="bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 p-4 w-80 text-black shadow-lg">
              <div className="bg-[#000080] text-white px-2 py-0.5 font-bold text-xs flex justify-between items-center mb-4">
                <span>战术分析中...</span>
                <Icon icon="dinkie-icons:gear" className="w-3.5 h-3.5 animate-spin" />
              </div>
              <p className="text-xs mb-3 font-bold leading-normal h-10 flex items-center">{loadingText}</p>
              
              {/* Win95 classic progress bar - loops continuously */}
              <div className="h-6 border-2 border-t-gray-800 border-l-gray-800 border-b-white border-r-white bg-white p-0.5 flex gap-0.5 overflow-hidden">
                {Array.from({ length: Math.floor(loadingProgress / 5) }).map((_, i) => (
                  <div key={i} className="w-3.5 h-full bg-[#000080] flex-shrink-0" />
                ))}
              </div>
              
              <div className="text-right text-[10px] text-gray-600 mt-1">
                运做中...
              </div>
            </div>
          </div>
        )}

        {/* Stage 4 & 5: Fighting Arena Screen */}
        {(stage === "fighting" || stage === "finished") && playerCard && enemyCard && cardStats && (
          <div
            className="flex-1 flex flex-col min-h-0 relative border-2 border-t-gray-800 border-l-gray-800 border-b-white border-r-white overflow-hidden bg-cover bg-center"
            style={{ backgroundImage: `url(${getAssetUrl(bgImage)})` }}
          >
            {/* Dark glassmorphic layer for readability */}
            <div className="absolute inset-0 bg-black/30 pointer-events-none" />

            {/* Combat Arena Card placement layout: Flex Col-Reverse on Mobile, Flex Row on Desktop */}
            <div className="flex-1 flex flex-col-reverse md:flex-row items-center justify-center md:justify-around p-2 md:p-4 gap-1.5 md:gap-0 relative min-h-0 z-10 overflow-y-auto md:overflow-hidden">
              
              {/* Player Side (Underneath/Bottom on Mobile, Left on Desktop) */}
              <div
                style={{
                  transform: `scale(${cardStats.player.scale * mobileScaleMultiplier})`,
                  transformOrigin: "center bottom",
                  transition: "transform 0.3s ease-out"
                }}
                className={`arena-card flex-shrink-0 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 p-1.5 shadow-xl relative
                  ${attackerState === "player" ? "animate-dash-player z-30" : ""}
                  ${receiverState.target === "player" ? `z-20 animate-${receiverState.effect}` : ""}
                  ${winner === "player" ? "animate-winner-pulse border-yellow-500 border-4" : ""}
                  ${winner === "enemy" ? "opacity-60" : ""}
                `}
              >
                <div className={`flex justify-between items-center px-1 py-0.5 text-white font-bold text-xs
                  ${playerCard.score >= 90 ? "bg-gradient-to-r from-[#b8860b] to-[#ffd700] !text-black" : 
                    playerCard.score >= 80 ? "bg-gradient-to-r from-[#c5a059] to-[#e8c97f] !text-black" : 
                    playerCard.score >= 50 ? "bg-gradient-to-r from-[#4682b4] to-[#b0c4de]" : 
                    "bg-gradient-to-r from-[#808080] to-[#b0b0b0]"}`}
                >
                  <div className="flex items-center gap-1 flex-1 min-w-0">
                    <span className="truncate flex-shrink">
                      {playerCard.score >= 90 ? "SSR·" : playerCard.score >= 80 ? "SR·" : playerCard.score >= 50 ? "R·" : ""}
                      {playerCard.targetWord}
                    </span>
                    <WinBadges wins={playerCard.wins} />
                  </div>
                  <span className="flex-shrink-0 font-extrabold ml-1">HP {playerHP}</span>
                </div>

                {/* SubHeader Details */}
                <div className="bg-[#f0f0f0] border border-gray-600 text-[8px] text-gray-700 px-1 py-0.5 mt-0.5 truncate select-none">
                  No.{cardStats.player.cardNo} | 身高:{cardStats.player.height} | 体重:{cardStats.player.weight}
                </div>

                {/* Image Frame */}
                <div className="h-28 md:h-32 bg-white border-2 border-t-gray-800 border-l-gray-800 border-b-white border-r-white mt-1 relative flex items-center justify-center overflow-hidden">
                  <img src={playerCard.image} alt={playerCard.targetWord} className="max-h-full max-w-full object-contain" />
                  
                  {/* Dynamic health bar */}
                  <div className="absolute bottom-1 left-1 right-1 h-3 bg-gray-300 border border-gray-600 p-[1px]">
                    <div 
                      className={`h-full transition-all duration-300 ${playerHP / playerMaxHP > 0.5 ? "bg-green-600" : playerHP / playerMaxHP > 0.2 ? "bg-yellow-500" : "bg-red-600"}`}
                      style={{ width: `${(playerHP / playerMaxHP) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Critique and details */}
                <div className="bg-[#fcfcfc] border border-gray-600 mt-1 p-1 text-[9px] h-16 md:h-20 overflow-y-auto leading-normal select-none">
                  <div className="font-bold border-b border-gray-300 pb-0.5 mb-0.5 truncate">猜: {playerCard.guess}</div>
                  <p className="text-gray-700">{playerCard.critique}</p>
                </div>

                {/* Rarity and sparkles */}
                <div className="text-right text-[8px] font-bold text-gray-500 mt-0.5 italic">
                  {playerCard.score >= 90 ? "✦ 传世纯金闪卡 ✦" : playerCard.score >= 80 ? "✦ 传奇全息闪卡 ✦" : playerCard.score >= 50 ? "✦ 银色珍藏卡 ✦" : "✦ 普通卡片 ✦"}
                </div>



                {/* Winner Stamp */}
                {winner === "player" && (
                  <div className="absolute inset-0 flex items-center justify-center z-40 bg-transparent pointer-events-none overflow-hidden">
                    <div className="bg-red-600/90 text-white font-extrabold text-xl md:text-2xl border-4 border-double border-white py-1 px-4 tracking-wider shadow-2xl animate-stamp-in uppercase select-none shadow-black/80">
                      WINNER
                    </div>
                  </div>
                )}
              </div>

              {/* VERSUS text in center */}
              {stage === "fighting" && (
                <div className="bg-red-700 text-yellow-300 border-4 border-double border-yellow-300 text-sm md:text-xl font-bold px-3 py-1 md:py-1.5 shadow-2xl select-none rotate-6 md:scale-110 flex flex-row md:flex-col items-center justify-center z-10 flex-shrink-0">
                  <span>VS</span>
                  <span className="text-[8px] md:text-[9px] text-white tracking-wider md:tracking-widest ml-2 md:ml-0 md:mt-0.5">ROUND {currentRoundIndex + 1}</span>
                </div>
              )}

              {/* Enemy Side (Top on Mobile, Right on Desktop) */}
              <div
                style={{
                  transform: `scale(${cardStats.enemy.scale * mobileScaleMultiplier})`,
                  transformOrigin: "center bottom",
                  transition: "transform 0.3s ease-out"
                }}
                className={`arena-card flex-shrink-0 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 p-1.5 shadow-xl relative
                  ${attackerState === "enemy" ? "animate-dash-enemy z-30" : ""}
                  ${receiverState.target === "enemy" ? `z-20 animate-${receiverState.effect}` : ""}
                  ${winner === "enemy" ? "animate-winner-pulse border-yellow-500 border-4" : ""}
                  ${winner === "player" ? "opacity-60" : ""}
                `}
              >
                <div className={`flex justify-between items-center px-1 py-0.5 text-white font-bold text-xs
                  ${enemyCard.score >= 90 ? "bg-gradient-to-r from-[#b8860b] to-[#ffd700] !text-black" : 
                    enemyCard.score >= 80 ? "bg-gradient-to-r from-[#c5a059] to-[#e8c97f] !text-black" : 
                    enemyCard.score >= 50 ? "bg-gradient-to-r from-[#4682b4] to-[#b0c4de]" : 
                    "bg-gradient-to-r from-[#808080] to-[#b0b0b0]"}`}
                >
                  <div className="flex items-center gap-1 flex-1 min-w-0">
                    <span className="truncate flex-shrink">
                      {enemyCard.score >= 90 ? "SSR·" : enemyCard.score >= 80 ? "SR·" : enemyCard.score >= 50 ? "R·" : ""}
                      {enemyCard.targetWord}
                    </span>
                    <WinBadges wins={enemyCard.wins} />
                  </div>
                  <span className="flex-shrink-0 font-extrabold ml-1">HP {enemyHP}</span>
                </div>

                {/* SubHeader Details */}
                <div className="bg-[#f0f0f0] border border-gray-600 text-[8px] text-gray-700 px-1 py-0.5 mt-0.5 truncate select-none">
                  No.{cardStats.enemy.cardNo} | 身高:{cardStats.enemy.height} | 体重:{cardStats.enemy.weight}
                </div>

                {/* Image Frame */}
                <div className="h-28 md:h-32 bg-white border-2 border-t-gray-800 border-l-gray-800 border-b-white border-r-white mt-1 relative flex items-center justify-center overflow-hidden">
                  <img src={enemyCard.image} alt={enemyCard.targetWord} className="max-h-full max-w-full object-contain" />
                  
                  {/* Dynamic health bar */}
                  <div className="absolute bottom-1 left-1 right-1 h-3 bg-gray-300 border border-gray-600 p-[1px]">
                    <div 
                      className={`h-full transition-all duration-300 ${enemyHP / enemyMaxHP > 0.5 ? "bg-green-600" : enemyHP / enemyMaxHP > 0.2 ? "bg-yellow-500" : "bg-red-600"}`}
                      style={{ width: `${(enemyHP / enemyMaxHP) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Critique and details */}
                <div className="bg-[#fcfcfc] border border-gray-600 mt-1 p-1 text-[9px] h-16 md:h-20 overflow-y-auto leading-normal select-none">
                  <div className="font-bold border-b border-gray-300 pb-0.5 mb-0.5 truncate">猜: {enemyCard.guess}</div>
                  <p className="text-gray-700">{enemyCard.critique}</p>
                </div>

                {/* Rarity and sparkles */}
                <div className="text-right text-[8px] font-bold text-gray-500 mt-0.5 italic">
                  {enemyCard.score >= 90 ? "✦ 传世纯金闪卡 ✦" : enemyCard.score >= 80 ? "✦ 传奇全息闪卡 ✦" : enemyCard.score >= 50 ? "✦ 银色珍藏卡 ✦" : "✦ 普通卡片 ✦"}
                </div>



                {/* Winner Stamp */}
                {winner === "enemy" && (
                  <div className="absolute inset-0 flex items-center justify-center z-40 bg-transparent pointer-events-none overflow-hidden">
                    <div className="bg-red-600/90 text-white font-extrabold text-xl md:text-2xl border-4 border-double border-white py-1 px-4 tracking-wider shadow-2xl animate-stamp-in uppercase select-none shadow-black/80">
                      WINNER
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Bottom Console Panel - Styled as classic Windows 95 MS-DOS Prompt */}
            <div className="bg-[#c0c0c0] border-t-2 border-white p-2 relative flex-shrink-0 z-10 flex flex-col">
              {/* MS-DOS Window Chrome */}
              <div className="bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 p-0.5 flex flex-col select-none mb-1 shadow-md">
                {/* Title Bar */}
                <div className="bg-[#000080] text-white px-2 py-0.5 text-[11px] font-bold flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-mono">
                    <Icon icon="lucide:terminal" className="w-3.5 h-3.5 text-white" />
                    <span>MS-DOS Prompt - BATTLE.EXE</span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <button className="w-3.5 h-3 bg-[#c0c0c0] border border-t-white border-l-white border-b-gray-800 border-r-gray-800 text-black font-extrabold text-[8px] flex items-center justify-center active:border-t-gray-800 active:border-l-gray-800 active:border-b-white active:border-r-white">_</button>
                    <button className="w-3.5 h-3 bg-[#c0c0c0] border border-t-white border-l-white border-b-gray-800 border-r-gray-800 text-black font-extrabold text-[8px] flex items-center justify-center active:border-t-gray-800 active:border-l-gray-800 active:border-b-white active:border-r-white">□</button>
                    <button className="w-3.5 h-3 bg-[#c0c0c0] border border-t-white border-l-white border-b-gray-800 border-r-gray-800 text-black font-extrabold text-[8px] flex items-center justify-center active:border-t-gray-800 active:border-l-gray-800 active:border-b-white active:border-r-white">✕</button>
                  </div>
                </div>

                {/* Classic DOS Window Toolbar */}
                <div className="bg-[#c0c0c0] border-b border-gray-600 px-1 py-0.5 flex items-center gap-2 text-[10px] text-black">
                  <div className="bg-white border border-t-gray-800 border-l-gray-800 border-b-white border-r-white px-1 py-0.5 flex items-center gap-1">
                    <span>Auto</span>
                    <span className="text-[7px]">▼</span>
                  </div>
                  <div className="w-[1px] h-3 bg-gray-500 mx-1" />
                  <button className="p-0.5 hover:bg-gray-300 border border-transparent active:border-t-gray-800 active:border-l-gray-800 active:border-b-white active:border-r-white" title="字体大小">
                    <span className="font-bold font-mono px-0.5">A</span>
                  </button>
                  <button className="p-0.5 hover:bg-gray-300 border border-transparent active:border-t-gray-800 active:border-l-gray-800 active:border-b-white active:border-r-white" title="后台运行">
                    <Icon icon="lucide:play" className="w-3 h-3 text-green-700" />
                  </button>
                  <button className="p-0.5 hover:bg-gray-300 border border-transparent active:border-t-gray-800 active:border-l-gray-800 active:border-b-white active:border-r-white" title="属性">
                    <Icon icon="lucide:settings" className="w-3 h-3" />
                  </button>
                  <button className="p-0.5 hover:bg-gray-300 border border-transparent active:border-t-gray-800 active:border-l-gray-800 active:border-b-white active:border-r-white" title="独占模式">
                    <Icon icon="lucide:maximize-2" className="w-3 h-3" />
                  </button>
                </div>

                {/* Terminal Content Screen */}
                <div className="relative">
                  {/* CRT Scanline effect overlay */}
                  <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.18)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] bg-[size:100%_4px,3px_100%] z-10" />
                  
                  <div 
                    ref={logContainerRef}
                    className="bg-black text-[#00ff00] p-2 border-2 border-t-gray-800 border-l-gray-800 border-b-white border-r-white font-mono text-[11px] leading-relaxed h-[110px] overflow-y-auto select-text scrollbar-win95 relative z-0"
                  >
                    {combatLogs.map((log, index) => (
                      <div key={index} className="mb-1 flex items-start gap-1">
                        <span className="text-[#a0a0a0] select-none flex-shrink-0 mr-1">&gt;</span>
                        <span className="break-all text-left">{log}</span>
                      </div>
                    ))}
                    {/* Blinking cursor */}
                    {combatActive && (
                      <span className="inline-block w-2.5 h-3.5 bg-[#00ff00] align-middle animate-[blink_1s_infinite_steps(1)]" />
                    )}
                  </div>
                </div>
              </div>

              {/* Settlement Panel Buttons */}
              {stage === "finished" && (
                <div className="mt-2 flex gap-3 justify-end">
                  <button
                    onClick={handleRestart}
                    className="px-4 py-1 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 active:border-t-gray-800 active:border-l-gray-800 active:border-b-white active:border-r-white text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:bg-[#d0d0d0]"
                  >
                    <Icon icon="dinkie-icons:repeat-arrow" className="w-3.5 h-3.5" />
                    <span>再来一局</span>
                  </button>
                  <button
                    onClick={() => setStage("select-card")}
                    className="px-4 py-1 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 active:border-t-gray-800 active:border-l-gray-800 active:border-b-white active:border-r-white text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:bg-[#d0d0d0]"
                  >
                  <Icon icon="dinkie-icons:alien-monster-small" className="w-3.5 h-3.5" />
                    <span>更换卡牌</span>
                  </button>
                  <button
                    onClick={() => setStage("select-bg-mode")}
                    className="px-4 py-1 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 active:border-t-gray-800 active:border-l-gray-800 active:border-b-white active:border-r-white text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:bg-[#d0d0d0]"
                  >
                    <Icon icon="dinkie-icons:artist-palette" className="w-3.5 h-3.5" />
                    <span>重选背景</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Viewport-level Floating System Dialog for Damage popups (Meta element breaking out of fighting box) */}
      {damagePopup && (
        <div 
          className={`absolute z-[9999] pointer-events-none w-48
            ${damagePopup.target === "player" 
              ? "left-1/2 -translate-x-1/2 bottom-[35%] md:bottom-auto md:top-[16%] md:left-[18%] md:translate-x-0" 
              : "left-1/2 -translate-x-1/2 top-[16%] md:top-[16%] md:left-auto md:right-[18%] md:translate-x-0"}`}
        >
          <div className="animate-damage-popup bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 p-0.5 text-black shadow-2xl">
            {/* Dialog Title Bar */}
            <div className="bg-[#000080] text-white px-1.5 py-0.5 text-[9px] font-bold flex items-center justify-between font-mono select-none">
              <span className="truncate flex items-center gap-1">
                <Icon icon="lucide:alert-triangle" className="w-3 h-3 text-yellow-400" />
                {damagePopup.skillName || "系统异常"}
              </span>
              <div className="w-3.5 h-3 bg-[#c0c0c0] border border-t-white border-l-white border-b-gray-800 border-r-gray-800 flex items-center justify-center text-[8px] text-black font-extrabold select-none">✕</div>
            </div>
            {/* Dialog Content */}
            <div className="p-2.5 flex items-center gap-3 bg-[#c0c0c0] text-[10px] select-none">
              {/* Retro Circular Warning/Error Icon */}
              <div className="w-6 h-6 rounded-full bg-red-600 border border-black flex items-center justify-center text-white font-extrabold text-[12px] flex-shrink-0 shadow-[inset_1px_1px_0px_#ffffff]">
                ✕
              </div>
              <div className="flex-1 min-w-0 font-mono text-left">
                <div className="text-gray-800 text-[8px] leading-tight font-bold">KERNEL_ERR: HP_LOST</div>
                <div className="font-extrabold text-red-600 text-sm leading-tight mt-0.5">
                  -{damagePopup.damage} HP
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
