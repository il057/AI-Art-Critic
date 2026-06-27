import { useState, useEffect } from "react";
import packageJson from "../../package.json";
import { getGalleryItems, GalleryItem, deleteGalleryItem, getSettings } from "../utils/storage";
import { Icon } from "@iconify/react";
import { Lightbox, ChoiceDialog } from "./Modal";

const PRESET_STATS: Record<string, { height: string; weight: string }> = {
  // Animals
  "猫": { height: "0.4m", weight: "4.2kg" },
  "狗": { height: "0.5m", weight: "12.0kg" },
  "大象": { height: "3.2m", weight: "4500kg" },
  "恐龙": { height: "6.0m", weight: "8000kg" },
  "龙": { height: "12.0m", weight: "15000kg" },
  "美人鱼": { height: "1.7m", weight: "60.0kg" },
  "章鱼": { height: "0.8m", weight: "15.0kg" },
  "独角兽": { height: "1.8m", weight: "400kg" },
  "企鹅": { height: "1.1m", weight: "30.0kg" },
  "长颈鹿": { height: "5.5m", weight: "1200kg" },
  "熊猫": { height: "1.5m", weight: "100kg" },
  "考拉": { height: "0.7m", weight: "10.0kg" },
  "袋鼠": { height: "1.6m", weight: "65.0kg" },
  "狮子": { height: "1.2m", weight: "190kg" },
  "老虎": { height: "1.1m", weight: "220kg" },
  "猴子": { height: "0.6m", weight: "15.0kg" },
  "兔子": { height: "0.3m", weight: "2.0kg" },
  "青蛙": { height: "0.1m", weight: "0.15kg" },
  "乌龟": { height: "0.2m", weight: "5.0kg" },
  "蜗牛": { height: "0.03m", weight: "0.01kg" },
  "蝴蝶": { height: "0.05m", weight: "0.001kg" },
  "蜜蜂": { height: "0.01m", weight: "0.0001kg" },
  "螃蟹": { height: "0.15m", weight: "0.5kg" },
  "金鱼": { height: "0.1m", weight: "0.1kg" },
  "羊驼": { height: "1.5m", weight: "70.0kg" },
  "狐狸": { height: "0.4m", weight: "6.0kg" },
  "鸭子": { height: "0.5m", weight: "2.5kg" },
  "松鼠": { height: "0.2m", weight: "0.3kg" },
  "小猪": { height: "0.6m", weight: "35.0kg" },
  "小鸡": { height: "0.15m", weight: "0.2kg" },

  // Food
  "西瓜": { height: "0.3m", weight: "4.5kg" },
  "香蕉": { height: "0.2m", weight: "0.15kg" },
  "苹果": { height: "0.1m", weight: "0.2kg" },
  "汉堡包": { height: "0.1m", weight: "0.25kg" },
  "汉堡": { height: "0.1m", weight: "0.25kg" },
  "菠萝": { height: "0.25m", weight: "1.5kg" },
  "草莓": { height: "0.03m", weight: "0.015kg" },
  "胡萝卜": { height: "0.2m", weight: "0.1kg" },
  "冰淇淋": { height: "0.15m", weight: "0.1kg" },
  "甜甜圈": { height: "0.08m", weight: "0.06kg" },
  "热狗": { height: "0.15m", weight: "0.12kg" },
  "披萨": { height: "0.3m", weight: "0.8kg" },
  "寿司": { height: "0.04m", weight: "0.03kg" },
  "蛋糕": { height: "0.2m", weight: "1.2kg" },
  "爆米花": { height: "0.02m", weight: "0.001kg" },
  "面包": { height: "0.1m", weight: "0.3kg" },
  "柠檬": { height: "0.08m", weight: "0.07kg" },
  "葡萄": { height: "0.02m", weight: "0.005kg" },
  "樱桃": { height: "0.02m", weight: "0.006kg" },
  "煎蛋": { height: "0.1m", weight: "0.05kg" },
  "牛排": { height: "0.2m", weight: "0.25kg" },
  "饺子": { height: "0.05m", weight: "0.025kg" },
  "巧克力": { height: "0.1m", weight: "0.1kg" },

  // Vehicles
  "飞机": { height: "15.0m", weight: "45000kg" },
  "宇宙飞船": { height: "35.0m", weight: "85000kg" },
  "潜水艇": { height: "12.0m", weight: "60000kg" },
  "火箭": { height: "50.0m", weight: "120000kg" },
  "自行车": { height: "1.0m", weight: "14.0kg" },
  "救护车": { height: "2.2m", weight: "3000kg" },
  "消防车": { height: "3.2m", weight: "15000kg" },
  "警车": { height: "1.5m", weight: "1600kg" },
  "帆船": { height: "8.0m", weight: "2500kg" },
  "直升机": { height: "3.5m", weight: "2200kg" },
  "滑板": { height: "0.1m", weight: "2.5kg" },
  "热气球": { height: "25.0m", weight: "400kg" },
  "跑车": { height: "1.2m", weight: "1400kg" },
  "摩托车": { height: "1.0m", weight: "180kg" },
  "飞碟": { height: "4.0m", weight: "5000kg" },
  "卡车": { height: "3.0m", weight: "8000kg" },
  "公交车": { height: "3.2m", weight: "12000kg" },
  "火车": { height: "3.8m", weight: "200000kg" },
  "挖掘机": { height: "3.0m", weight: "15000kg" },

  // Daily
  "电脑": { height: "0.5m", weight: "3.5kg" },
  "笔记本电脑": { height: "0.25m", weight: "1.5kg" },
  "吉他": { height: "1.0m", weight: "2.0kg" },
  "耳机": { height: "0.2m", weight: "0.25kg" },
  "咖啡杯": { height: "0.1m", weight: "0.3kg" },
  "手表": { height: "0.04m", weight: "0.08kg" },
  "雨伞": { height: "0.8m", weight: "0.4kg" },
  "气球": { height: "0.3m", weight: "0.005kg" },
  "钥匙": { height: "0.06m", weight: "0.02kg" },
  "眼镜": { height: "0.05m", weight: "0.03kg" },
  "蜡烛": { height: "0.15m", weight: "0.1kg" },
  "钢琴": { height: "1.3m", weight: "250kg" },
  "皇冠": { height: "0.12m", weight: "0.5kg" },
  "帽子": { height: "0.15m", weight: "0.15kg" },
  "鞋子": { height: "0.1m", weight: "0.4kg" },
  "风筝": { height: "0.6m", weight: "0.08kg" },
  "马桶": { height: "0.8m", weight: "30.0kg" },
  "垃圾桶": { height: "0.4m", weight: "1.2kg" },
  "闹钟": { height: "0.12m", weight: "0.25kg" },
  "剪刀": { height: "0.15m", weight: "0.1kg" },
  "手提包": { height: "0.25m", weight: "0.8kg" },

  // Fantasy
  "吸血鬼": { height: "1.8m", weight: "72.0kg" },
  "机器人": { height: "1.9m", weight: "150kg" },
  "火山": { height: "1500m", weight: "8.0e10 kg" },
  "城堡": { height: "45m", weight: "4.5e7 kg" },
  "外星人": { height: "1.2m", weight: "30.0kg" },
  "幽灵": { height: "1.6m", weight: "0kg" },
  "小丑": { height: "1.75m", weight: "68kg" },
  "天使": { height: "1.7m", weight: "55kg" },
  "木乃伊": { height: "1.75m", weight: "50kg" },
  "恶魔": { height: "2.1m", weight: "120kg" },
  "巨龙": { height: "15.0m", weight: "28000kg" },
  "奥特曼": { height: "40m", weight: "35000000kg" },
  "太阳": { height: "1.39M m", weight: "1.98e30 kg" },
  "月亮": { height: "3.47k km", weight: "7.34e22 kg" },
  "地球": { height: "12.7k km", weight: "5.97e24 kg" }
};

const getDeterministicStats = (word: string, customStats?: Record<string, { height: string; weight: string }>) => {
  const cleanWord = word.trim();
  if (customStats && customStats[cleanWord]) {
    return customStats[cleanWord];
  }
  if (PRESET_STATS[cleanWord]) {
    return PRESET_STATS[cleanWord];
  }
  
  // Fallback to deterministic hash
  let hash = 0;
  for (let i = 0; i < cleanWord.length; i++) {
    hash = cleanWord.charCodeAt(i) + ((hash << 5) - hash);
  }
  hash = Math.abs(hash);
  
  // Height: between 0.1m and 3.0m
  const heightVal = (0.1 + (hash % 30) * 0.1).toFixed(1);
  const height = `${heightVal}m`;
  
  // Weight: between 0.1kg and 85.0kg
  const weightVal = (0.1 + (hash % 170) * 0.5).toFixed(1);
  const weight = `${weightVal}kg`;
  
  return { height, weight };
};

// Seed-based pseudo-random number generator
const seedRandom = (seed: number) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

// Convert string to a numeric seed
const getNumericSeed = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
};

// Parse value and unit from height/weight string
const parseValAndUnit = (str: string) => {
  const match = str.match(/^([0-9e.+-]+)(.*)$/);
  if (!match) return { val: 1.0, unit: "m" };
  return {
    val: parseFloat(match[1]) || 1.0,
    unit: match[2]
  };
};

// Apply deterministic random percentage variation (e.g. ±15%) based on seed
const applyVariation = (baseStr: string, seed: number) => {
  const parsed = parseValAndUnit(baseStr);
  const rand = seedRandom(seed); // value between 0 and 1
  const percent = -0.15 + rand * 0.3; // range: -15% to +15%
  const newVal = parsed.val * (1 + percent);
  
  let formattedVal = "";
  if (newVal >= 1000) {
    formattedVal = Math.round(newVal).toString();
  } else if (newVal < 0.1) {
    formattedVal = newVal.toFixed(3);
  } else {
    formattedVal = newVal.toFixed(1);
  }
  return `${formattedVal}${parsed.unit}`;
};

interface GalleryScreenProps {
  showAlert: (message: string, title?: string, type?: "info" | "warning" | "error") => void;
  showToast?: (message: string, type?: "success" | "info" | "error") => void;
  refreshKey?: number;
}

export function GalleryScreen({ showAlert, showToast, refreshKey }: GalleryScreenProps) {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [lightboxTitle, setLightboxTitle] = useState("");
  const [deleteItemId, setDeleteItemId] = useState<string | null>(null);
  const [deleteItemWord, setDeleteItemWord] = useState<string>("");

  const confirmDelete = (item: GalleryItem) => {
    setDeleteItemId(item.id);
    setDeleteItemWord(item.targetWord);
  };

  useEffect(() => {
    getGalleryItems()
      .then((res) => {
        setItems(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [refreshKey]);

  useEffect(() => {
    return () => {
      if (lightboxImage && lightboxImage.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(lightboxImage);
        } catch (e) {
          console.warn("Failed to revoke object URL:", e);
        }
      }
    };
  }, [lightboxImage]);

  const handleDelete = async (id: string) => {
    try {
      await deleteGalleryItem(id);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      console.error("Delete gallery item error:", err);
      showAlert("删除画作失败！", "错误", "error");
    }
  };

  const formatCardNo = (timestamp: number) => {
    const d = new Date(timestamp);
    const yy = String(d.getFullYear()).slice(-2);
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `no.${yy}${mm}${dd}${hh}${min}`;
  };

  const handleExportCard = async (item: GalleryItem) => {
    try {
      try {
        await document.fonts.load("12px Unifont");
      } catch (e) {
        console.warn("Failed to load Unifont for card:", e);
      }

      const canvas = document.createElement("canvas");
      const scaleFactor = 3;
      canvas.width = 400 * scaleFactor;
      canvas.height = 530 * scaleFactor;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Apply scale for 3x sharp rendering
      ctx.scale(scaleFactor, scaleFactor);
      ctx.imageSmoothingEnabled = false;

      // Load drawing image
      const img = new Image();
      img.src = item.image;
      await new Promise<void>((resolve) => {
        img.onload = () => resolve();
        img.onerror = () => resolve();
      });

      // 1. Draw Background
      ctx.fillStyle = "#c0c0c0";
      ctx.fillRect(0, 0, 400, 530);

      // 2. Draw outer 3D bevel borders
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(1, 528);
      ctx.lineTo(1, 1);
      ctx.lineTo(398, 1);
      ctx.stroke();

      ctx.strokeStyle = "#808080";
      ctx.beginPath();
      ctx.moveTo(0, 529);
      ctx.lineTo(399, 529);
      ctx.lineTo(399, 0);
      ctx.stroke();

      ctx.strokeStyle = "#000000";
      ctx.beginPath();
      ctx.moveTo(1, 528);
      ctx.lineTo(398, 528);
      ctx.lineTo(398, 1);
      ctx.stroke();

      // Determine colors based on score rarity
      let headerGradientStart = "#000080";
      let headerGradientEnd = "#1084d0";
      let subheaderBg = "#e6e6e6";
      let frameColor = "#808080";
      let frameInner = "#ffffff";
      let frameName = "标准型";
      let rarityText = "普通 (C)";
      let cardTitlePrefix = "C·普通";
      let pokemonSubHeader = "";
      let editionLabel = "";
      let boxBg = "#fdfdfd";

      // Calculate dynamic stats based on target word deterministically
      const cleanWord = item.targetWord.trim();
      let hashVal = 0;
      for (let i = 0; i < cleanWord.length; i++) {
        hashVal = cleanWord.charCodeAt(i) + ((hashVal << 5) - hashVal);
      }
      hashVal = Math.abs(hashVal);
      const cardNo = (hashVal % 900) + 100;
      
      const settings = await getSettings();
      const stats = getDeterministicStats(cleanWord, settings?.customStats);
      
      // Calculate seed from item.id + cardNo to ensure consistent randomized stats for each unique card
      const itemSeed = getNumericSeed((item.id || "") + "_" + cardNo);
      const height = applyVariation(stats.height, itemSeed);
      const weight = applyVariation(stats.weight, itemSeed + 13);

      if (item.score >= 90) {
        headerGradientStart = "#b8860b"; // gold gradient
        headerGradientEnd = "#ffd700";
        subheaderBg = "#fffdd0"; // cream
        frameColor = "#d4af37"; // gold
        frameInner = "#fffdf0";
        frameName = "黄金特制版";
        rarityText = "神作 (SSR)";
        cardTitlePrefix = "SSR·神作";
        pokemonSubHeader = `全国图鉴 No.${cardNo} | 传世神级艺术品 | 身高: ${height} | 体重: ${weight}`;
        editionLabel = "✦ 传世纯金闪卡 ✦";
        boxBg = "#fffdf5";
      } else if (item.score >= 80) {
        headerGradientStart = "#c5a059";
        headerGradientEnd = "#e8c97f";
        subheaderBg = "#faf0d9";
        frameColor = "#d4af37";
        frameInner = "#fffdf0";
        frameName = "黄金特制版";
        rarityText = "传奇 (SR)";
        cardTitlePrefix = "SR·传奇";
        pokemonSubHeader = `全国图鉴 No.${cardNo} | 传奇殿堂艺术品 | 身高: ${height} | 体重: ${weight}`;
        editionLabel = "✦ 传奇全息闪卡 ✦";
        boxBg = "#faf6eb";
      } else if (item.score >= 50) {
        headerGradientStart = "#4682b4"; // silver-blue gradient
        headerGradientEnd = "#b0c4de";
        subheaderBg = "#f0f8ff"; // ice blue
        frameColor = "#708090"; // silver-blue frame
        frameInner = "#f4f8fa";
        frameName = "银色珍藏版";
        rarityText = "罕见 (R)";
        cardTitlePrefix = "R·罕见";
        pokemonSubHeader = `全国图鉴 No.${cardNo} | 罕见速写艺术品 | 身高: ${height} | 体重: ${weight}`;
        editionLabel = "✦ 银色珍藏版 ✦";
        boxBg = "#f5fafe";
      } else {
        pokemonSubHeader = `全国图鉴 No.${cardNo} | 经典摸鱼涂鸦 | 身高: ${height} | 体重: ${weight}`;
        editionLabel = "✦ 无限普卡 ✦";
        boxBg = "#fdfdfd";
      }

      // 3. Draw Pokémon-style Card Header
      const headGrad = ctx.createLinearGradient(4, 4, 392, 4);
      headGrad.addColorStop(0, headerGradientStart);
      headGrad.addColorStop(1, headerGradientEnd);
      ctx.fillStyle = headGrad;
      ctx.fillRect(4, 4, 392, 22);

      // HP Text & Title Color Contrast Fix (Use black text for SR/SSR gold cards)
      ctx.fillStyle = item.score >= 80 ? "#000000" : "#ffffff";
      ctx.font = "12px 'Unifont', monospace";
      ctx.fillText(`[${cardTitlePrefix}] ${item.targetWord}.exe`, 10, 19);

      ctx.fillStyle = item.score >= 80 ? "#000000" : "#ffffff";
      ctx.font = "12px 'Unifont', monospace";
      ctx.fillText(`HP ${item.score}`, 335, 19);

      // 4. Sub-header (Card classification)
      ctx.fillStyle = subheaderBg;
      ctx.fillRect(4, 28, 392, 14);
      ctx.strokeStyle = "#808080";
      ctx.lineWidth = 1;
      ctx.strokeRect(4, 28, 392, 14);

      ctx.fillStyle = "#444444";
      ctx.font = "9px 'Unifont', monospace";
      ctx.fillText(pokemonSubHeader, 10, 38);

      // Helper for proper pixel-art sparkle stars (✦ shape)
      const drawPixelSparkle = (c: CanvasRenderingContext2D, cx: number, cy: number, color: string) => {
        c.fillStyle = color;
        c.fillRect(cx, cy - 2, 1, 1);
        c.fillRect(cx - 1, cy - 1, 3, 1);
        c.fillRect(cx - 2, cy, 5, 1);
        c.fillRect(cx - 1, cy + 1, 3, 1);
        c.fillRect(cx, cy + 2, 1, 1);
      };

      // Holographic Sparkles for SSR cards
      if (item.score >= 90) {
        drawPixelSparkle(ctx, 7, 61, "#ffd700");
        drawPixelSparkle(ctx, 391, 81, "#ffd700");
        drawPixelSparkle(ctx, 7, 501, "#ffd700");
        drawPixelSparkle(ctx, 391, 291, "#ffd700");
      }

      // 5. Image Frame (x: 12, y: 48, w: 376, h: 250)
      const imgFrameX = 12;
      const imgFrameY = 48;
      const imgFrameW = 376;
      const imgFrameH = 250;

      ctx.fillStyle = frameColor;
      ctx.fillRect(imgFrameX - 2, imgFrameY - 2, imgFrameW + 4, imgFrameH + 4);
      ctx.fillStyle = frameInner;
      ctx.fillRect(imgFrameX, imgFrameY, imgFrameW, imgFrameH);

      ctx.strokeStyle = "#808080";
      ctx.lineWidth = 1;
      ctx.strokeRect(imgFrameX, imgFrameY, imgFrameW, imgFrameH);
      ctx.strokeStyle = "#000000";
      ctx.strokeRect(imgFrameX + 1, imgFrameY + 1, imgFrameW - 2, imgFrameH - 2);

      const iw = img.width;
      const ih = img.height;
      const scale = Math.min((imgFrameW - 8) / iw, (imgFrameH - 8) / ih);
      const dw = iw * scale;
      const dh = ih * scale;
      const dx = imgFrameX + (imgFrameW - dw) / 2;
      const dy = imgFrameY + (imgFrameH - dh) / 2;
      ctx.drawImage(img, dx, dy, dw, dh);

      // Distributed credit details below picture frame
      ctx.fillStyle = "#555555";
      ctx.font = "8px 'Unifont', monospace";
      ctx.textAlign = "left";
      const illustratorName = settings?.username ? settings.username : "您的画笔";
      ctx.fillText(`Illus. ${illustratorName}`, 12, 308);
      ctx.textAlign = "center";
      ctx.fillText(`${editionLabel}`, 200, 308);
      ctx.textAlign = "right";
      ctx.fillText(`v${packageJson.version}`, 388, 308);
      ctx.textAlign = "left"; // Reset alignment to left

      // Helper function to draw classic retro 3D bevel rect border (recessed style)
      const drawBevelRect = (
        c: CanvasRenderingContext2D,
        x: number,
        y: number,
        w: number,
        h: number,
        colorTopLeftOuter: string,
        colorTopLeftInner: string,
        colorBottomRightInner: string,
        colorBottomRightOuter: string
      ) => {
        c.lineWidth = 1;
        // Top & Left Outer
        c.strokeStyle = colorTopLeftOuter;
        c.beginPath();
        c.moveTo(x, y + h - 1);
        c.lineTo(x, y);
        c.lineTo(x + w - 1, y);
        c.stroke();
        
        // Top & Left Inner
        c.strokeStyle = colorTopLeftInner;
        c.beginPath();
        c.moveTo(x + 1, y + h - 2);
        c.lineTo(x + 1, y + 1);
        c.lineTo(x + w - 2, y + 1);
        c.stroke();
        
        // Bottom & Right Inner
        c.strokeStyle = colorBottomRightInner;
        c.beginPath();
        c.moveTo(x + 1, y + h - 2);
        c.lineTo(x + w - 2, y + h - 2);
        c.lineTo(x + w - 2, y + 1);
        c.stroke();
        
        // Bottom & Right Outer
        c.strokeStyle = colorBottomRightOuter;
        c.beginPath();
        c.moveTo(x, y + h - 1);
        c.lineTo(x + w - 1, y + h - 1);
        c.lineTo(x + w - 1, y);
        c.stroke();
      };

      // 6. Abilities Box
      const boxX = 12;
      const boxY = 316;
      const boxW = 376;
      const boxH = 178;

      let tlOuter = "#808080";
      let tlInner = "#000000";
      let brInner = "#dfdfdf";
      let brOuter = "#ffffff";

      if (item.score >= 90) {
        // SSR Gold gradient and custom bevel
        const grad = ctx.createLinearGradient(boxX, boxY, boxX + boxW, boxY + boxH);
        grad.addColorStop(0, "#ffe8a0");
        grad.addColorStop(0.5, "#fffdf5");
        grad.addColorStop(1, "#ffd700");
        ctx.fillStyle = grad;
        tlOuter = "#b8860b";
        tlInner = "#5c4008";
        brInner = "#ffe8a0";
        brOuter = "#ffd700";
      } else if (item.score >= 80) {
        // SR Gold/Bronze gradient and custom bevel
        const grad = ctx.createLinearGradient(boxX, boxY, boxX + boxW, boxY + boxH);
        grad.addColorStop(0, "#faf6eb");
        grad.addColorStop(0.5, "#fff6e0");
        grad.addColorStop(1, "#e8c97f");
        ctx.fillStyle = grad;
        tlOuter = "#a08040";
        tlInner = "#4a3a1a";
        brInner = "#f0e0b0";
        brOuter = "#c5a059";
      } else if (item.score >= 50) {
        // R Silver-Blue gradient and custom bevel
        const grad = ctx.createLinearGradient(boxX, boxY, boxX + boxW, boxY + boxH);
        grad.addColorStop(0, "#f5fafe");
        grad.addColorStop(0.5, "#e6f2ff");
        grad.addColorStop(1, "#b0c4de");
        ctx.fillStyle = grad;
        tlOuter = "#708090";
        tlInner = "#2f4f4f";
        brInner = "#e6f2ff";
        brOuter = "#b0c4de";
      } else {
        ctx.fillStyle = boxBg;
      }

      ctx.fillRect(boxX, boxY, boxW, boxH);
      drawBevelRect(ctx, boxX, boxY, boxW, boxH, tlOuter, tlInner, brInner, brOuter);

      // Helper to draw a pixel-art badge icon next to titles
      const drawBadgeIcon = (c: CanvasRenderingContext2D, cx: number, cy: number, type: "guess" | "critique") => {
        const size = 10;
        const x = cx - size / 2;
        const y = cy - size / 2;
        
        // 1px black outline
        c.fillStyle = "#000000";
        c.fillRect(x, y - 1, size, size + 2);
        c.fillRect(x - 1, y, size + 2, size);
        
        // Core fill
        c.fillStyle = type === "guess" ? "#c0392b" : "#2980b9"; // darker red/blue
        c.fillRect(x, y, size, size);
        
        // Inside highlight
        c.fillStyle = type === "guess" ? "#e74c3c" : "#3498db"; // brighter red/blue
        c.fillRect(x + 1, y + 1, size - 2, size - 2);
        
        // White sparkle
        c.fillStyle = "#ffffff";
        c.fillRect(x + 3, y + 3, 4, 4);
      };

      // Ability 1: AI Guess (Red pixel icon)
      const textIndent = 26;
      const title1Y = boxY + 20;
      drawBadgeIcon(ctx, boxX + 16, title1Y - 4, "guess");

      ctx.fillStyle = "#800000";
      ctx.font = "11px 'Unifont', monospace";
      ctx.fillText("【脑波感应】 AI 猜测", boxX + textIndent, title1Y);

      ctx.fillStyle = "#000000";
      ctx.font = "11px 'Unifont', monospace";
      
      const maxWidth = boxW - textIndent - 12;
      let currentY = boxY + 36;
      currentY = wrapTextAndReturnY(ctx, item.guess, boxX + textIndent, currentY, maxWidth, 14, boxY + 68);

      // Dynamic divider line position
      let dividerY = currentY + 10;
      if (dividerY < boxY + 52) {
        dividerY = boxY + 52;
      }
      ctx.strokeStyle = "#dfdfdf";
      ctx.beginPath();
      ctx.moveTo(boxX + 5, dividerY);
      ctx.lineTo(boxX + boxW - 5, dividerY);
      ctx.stroke();

      // Ability 2: Critique (Blue pixel icon)
      const critiqueTitleY = dividerY + 18;
      drawBadgeIcon(ctx, boxX + 16, critiqueTitleY - 4, "critique");

      ctx.fillStyle = "#000080";
      ctx.font = "11px 'Unifont', monospace";
      ctx.fillText("【艺术批判】 专家点评", boxX + textIndent, critiqueTitleY);

      const critiqueTextY = critiqueTitleY + 16;
      ctx.fillStyle = "#000000";
      let fontSize = 11;
      if (item.critique.length > 120) {
        fontSize = 9;
      } else if (item.critique.length > 80) {
        fontSize = 10;
      }
      ctx.font = `${fontSize}px 'Unifont', monospace`;
      
      const critiqueLineHeight = fontSize + 4;
      const maxDrawY = boxY + boxH - 12;
      wrapTextAndReturnY(ctx, item.critique, boxX + textIndent, critiqueTextY, maxWidth, critiqueLineHeight, maxDrawY);

      // Draw pixel sparkles inside the abilities box for SSR/SR
      if (item.score >= 90) {
        drawPixelSparkle(ctx, boxX + boxW - 20, boxY + 15, "#ffd700");
        drawPixelSparkle(ctx, boxX + 15, boxY + boxH - 15, "#ffd700");
        drawPixelSparkle(ctx, boxX + boxW - 15, dividerY + 5, "#ffd700");
        drawPixelSparkle(ctx, boxX + 120, boxY + 8, "#ffd700");
      } else if (item.score >= 80) {
        drawPixelSparkle(ctx, boxX + boxW - 20, boxY + 15, "#e8c97f");
        drawPixelSparkle(ctx, boxX + 15, boxY + boxH - 15, "#e8c97f");
      }

      // 7. Footer
      ctx.fillStyle = "#555555";
      ctx.font = "8px 'Unifont', monospace";
      ctx.fillText("傲慢的评论家 @ Meowdows 95", boxX + 10, 516);
      ctx.textAlign = "right";
      ctx.fillText(`${formatCardNo(item.date)}`, 388, 516);
      ctx.textAlign = "left"; // Reset alignment

      // 8. Generate URI & Trigger Download
      const cardUri = canvas.toDataURL("image/png");
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth < 768;

      let downloadUrl = cardUri;
      let tempBlobUrl = "";
      try {
        const blob = dataURLtoBlob(cardUri);
        tempBlobUrl = URL.createObjectURL(blob);
        downloadUrl = tempBlobUrl;
      } catch (e) {
        console.error("Blob conversion error:", e);
      }

      const cleanFileName = item.targetWord.replace(/[\\/:*?"<>|]/g, "_");
      if (isMobile) {
        // Use the blob URL directly for the preview image to reduce memory usage and avoid blank previews
        setLightboxImage(downloadUrl);
        setLightboxTitle(`珍藏卡 - ${item.targetWord}`);

        // DO NOT trigger programmatic link.click() download on mobile to prevent the browser's 
        // download prompt from interrupting the image rendering and showing a blank preview.

        if (showToast) {
          showToast("珍藏卡已生成！请长按图片保存到手机相册。", "success");
        } else {
          showAlert("已成功生成画作珍藏卡！已为您开启大图预览，请长按下方大图并选择「保存图片」保存至本地相册。", "保存卡片", "info");
        }
      } else {
        const link = document.createElement("a");
        link.download = `Card_${cleanFileName}_${item.score}.png`;
        link.href = downloadUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        if (tempBlobUrl) {
          setTimeout(() => URL.revokeObjectURL(tempBlobUrl), 1000);
        }

        if (showToast) {
          showToast("珍藏卡已成功下载！", "success");
        }
      }

      function wrapTextAndReturnY(
        c: CanvasRenderingContext2D,
        text: string,
        x: number,
        y: number,
        maxW: number,
        lineH: number,
        maxY: number
      ): number {
        let line = "";
        let currentY = y;
        for (let i = 0; i < text.length; i++) {
          const char = text[i];
          const testLine = line + char;
          const metrics = c.measureText(testLine);
          if (metrics.width > maxW) {
            if (currentY + lineH > maxY) {
              c.fillText(line.substring(0, Math.max(0, line.length - 2)) + "...", x, currentY);
              return currentY;
            }
            c.fillText(line, x, currentY);
            line = char;
            currentY += lineH;
          } else {
            line = testLine;
          }
        }
        if (line) {
          if (currentY <= maxY) {
            c.fillText(line, x, currentY);
          }
        }
        return currentY;
      }

      function dataURLtoBlob(dataurl: string) {
        const arr = dataurl.split(',');
        const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
          u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
      }
    } catch (err: any) {
      console.error("Export card error:", err);
      if (showToast) {
        showToast(`保存卡片失败: ${err.message || err}`, "error");
      } else {
        showAlert(`保存卡片失败: ${err.message || err}`, "错误", "error");
      }
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-black font-bold flex-1 bg-[#7f7f7f]">
        正在读取画作珍藏馆...
      </div>
    );
  }

  return (
    <div className="p-2 flex-1 overflow-y-auto bg-[#7f7f7f] min-h-0">
      {items.length === 0 ? (
        <div className="bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 p-8 text-center max-w-sm mx-auto mt-10">
          <p className="text-black font-bold">画廊是空的。</p>
          <p className="text-sm mt-2 text-gray-700">快去创作你的第一幅大师级作品吧！</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {items.map((item) => (
            <div key={item.id} className="bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 p-2 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center mb-2 bg-gradient-to-r from-[#000080] to-[#1084d0] text-white px-1">
                  <span className="font-bold text-xs truncate w-2/3" title={item.targetWord}>{item.targetWord}</span>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className="text-xs font-bold text-yellow-300">{item.score}/100</span>
                  </div>
                </div>
                {/* Image Container clickable */}
                <div 
                  onClick={() => {
                    setLightboxImage(item.image);
                    setLightboxTitle(item.targetWord);
                  }}
                  className="border-2 border-t-gray-800 border-l-gray-800 border-b-white border-r-white bg-white h-40 mb-2 flex items-center justify-center overflow-hidden cursor-pointer group relative"
                  title="点击查看大图"
                >
                  <img 
                    src={item.image} 
                    alt={item.targetWord} 
                    className="max-w-full max-h-full object-contain transition-transform group-hover:scale-105" 
                  />
                </div>
                <div className="bg-white border-2 border-t-gray-800 border-l-gray-800 border-b-white border-r-white p-1 text-xs text-black h-20 overflow-y-auto">
                  <p className="font-bold mb-1">猜测: {item.guess}</p>
                  <p>点评: {item.critique}</p>
                </div>
              </div>
              
              <div className="mt-2 flex items-center justify-between">
                <span className="text-[10px] text-gray-600">
                  {new Date(item.date).toLocaleString()}
                </span>
                
                <div className="flex gap-1.5 flex-shrink-0">
                  {/* Export Card Button */}
                  <button
                    onClick={() => handleExportCard(item)}
                    className="px-2 py-0.5 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 active:border-t-gray-800 active:border-l-gray-800 active:border-b-white active:border-r-white text-black font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                  >
                    <Icon icon="dinkie-icons:floppy-disk" className="w-3.5 h-3.5" />
                    <span>保存卡片</span>
                  </button>
                  {/* Retro Win95 Delete Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      confirmDelete(item);
                    }}
                    className="px-2 py-0.5 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 active:border-t-gray-800 active:border-l-gray-800 active:border-b-white active:border-r-white text-[#800000] font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                    title="删除画作"
                  >
                    <Icon icon="dinkie-icons:skull" className="w-3.5 h-3.5" />
                    <span>删除</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox for full size preview */}
      <Lightbox
        isOpen={!!lightboxImage}
        image={lightboxImage || ""}
        title={lightboxTitle}
        onClose={() => setLightboxImage(null)}
      />

      {/* ChoiceDialog for deleting gallery cards */}
      <ChoiceDialog
        isOpen={!!deleteItemId}
        title="确认删除"
        message={`您确定要永久删除画作《${deleteItemWord}》吗？`}
        confirmText="确定"
        cancelText="取消"
        onConfirm={async () => {
          if (deleteItemId) {
            await handleDelete(deleteItemId);
            setDeleteItemId(null);
          }
        }}
        onCancel={() => setDeleteItemId(null)}
      />
    </div>
  );
}
