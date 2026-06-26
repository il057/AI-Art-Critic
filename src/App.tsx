import { useState, useEffect } from "react";
import { DrawingBoard } from "./components/DrawingBoard";
import { ResultScreen } from "./components/ResultScreen";
import { GalleryScreen } from "./components/GalleryScreen";
import { SettingsWindow } from "./components/SettingsWindow";
import { Window } from "./components/Window";
import { getRandomWord } from "./utils/words";
import { getSettings, saveSettings } from "./utils/storage";
import { Icon } from "@iconify/react";
import { AlertDialog, PromptDialog, ChoiceDialog } from "./components/Modal";
import { Dropdown } from "./components/Dropdown";
import { ToastContainer, ToastItem } from "./components/Toast";

type GameState = "MENU" | "PLAYING" | "JUDGING" | "RESULT";

interface JudgeResult {
  guess: string;
  score: number;
  critique: string;
}

interface WindowState {
  id: string;
  title: string;
  icon: string;
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  zIndex: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

const JUDGING_FUNNY_TEXTS = [
  "正在通过 56K 调制解调器拨号连接 AI 艺术脑...",
  "评论家正戴上他的金丝单片眼镜，挑剔地审视着您的线条...",
  "正在冲泡一杯昂贵的蓝山咖啡以搭配您的艺术杰作...",
  "正在查阅《世界艺术名画全集》试图找出适合本画作的褒义词...",
  "由于画作过于震撼，56K 调制解调器正在发出刺耳的啸叫...",
  "正在用卢浮宫馆藏级放大镜端详您画作的每一个像素...",
  "评论家正在痛苦地揉着太阳穴，怀疑自己看到了毕加索转世...",
  "正在调动全网显卡算力，试图理解这一抹超越常理的超现实主义线条...",
  "正在撰写一篇长达五千字的先锋派艺术批判论文..."
];

const wordBankOptionsMap: Record<string, "all" | "animals" | "food" | "vehicles" | "daily" | "fantasy"> = {
  "全部": "all",
  "动物": "animals",
  "食物": "food",
  "交通工具": "vehicles",
  "日常用品": "daily",
  "奇幻与幻想": "fantasy"
};

const wordBankReverseMap: Record<"all" | "animals" | "food" | "vehicles" | "daily" | "fantasy" | "custom", string> = {
  all: "全部",
  animals: "动物",
  food: "食物",
  vehicles: "交通工具",
  daily: "日常用品",
  fantasy: "奇幻与幻想",
  custom: "自定义词库"
};

const critiqueStyleOptionsMap: Record<string, "arrogant" | "supportive" | "poetic" | "philosophical" | "nonsense" | "random"> = {
  "傲慢尖酸": "arrogant",
  "温柔鼓励": "supportive",
  "诗意浪漫": "poetic",
  "深奥哲学": "philosophical",
  "无厘头搞笑": "nonsense",
  "随机": "random",
  "随机发挥": "random"
};

const critiqueStyleReverseMap: Record<"arrogant" | "supportive" | "poetic" | "philosophical" | "nonsense" | "random", string> = {
  arrogant: "傲慢尖酸",
  supportive: "温柔鼓励",
  poetic: "诗意浪漫",
  philosophical: "深奥哲学",
  nonsense: "无厘头搞笑",
  random: "随机"
};

export default function App() {
  // Desktop Windows State with retro Win95 names
  const [windows, setWindows] = useState<WindowState[]>([
    {
      id: "drawing",
      title: "傲慢的评论家.exe",
      icon: "dinkie-icons:artist-palette",
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      zIndex: 10,
      x: 40,
      y: 40,
      width: 720,
      height: 600,
    },
    {
      id: "gallery",
      title: "画廊陈列室.exe",
      icon: "dinkie-icons:floppy-disk-filled",
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      zIndex: 10,
      x: 100,
      y: 70,
      width: 720,
      height: 540,
    },
    {
      id: "settings",
      title: "控制面板.lnk",
      icon: "dinkie-icons:gear",
      isOpen: false,
      isMinimized: false,
      isMaximized: false,
      zIndex: 10,
      x: 180,
      y: 100,
      width: 440,
      height: 480,
    },
  ]);

  const [activeWindowId, setActiveWindowId] = useState<string | null>(null);
  const [selectedIconId, setSelectedIconId] = useState<string | null>(null);
  const [startMenuOpen, setStartMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState("");

  // Alert Dialog State
  const [alertDialog, setAlertDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "info" | "warning" | "error";
  } | null>(null);

  const showAlert = (message: string, title = "系统提示", type: "info" | "warning" | "error" = "info") => {
    setAlertDialog({ isOpen: true, title, message, type });
  };

  const showToast = (message: string, type: "success" | "info" | "error" = "info") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const [judgingText, setJudgingText] = useState("");

  // Game Logic States (housed within drawing application)
  const [gameState, setGameState] = useState<GameState>("MENU");
  const [targetWord, setTargetWord] = useState<string>("");
  const [timeLeft, setTimeLeft] = useState<number>(30);
  const [result, setResult] = useState<JudgeResult | null>(null);
  const [finalImage, setFinalImage] = useState<string>("");

  const [isCurrentSaved, setIsCurrentSaved] = useState<boolean>(false);
  const [wordBank, setWordBank] = useState<"all" | "animals" | "food" | "vehicles" | "daily" | "fantasy" | "custom">("all");
  const [critiqueStyle, setCritiqueStyle] = useState<"arrogant" | "supportive" | "poetic" | "philosophical" | "nonsense" | "random">("arrogant");
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [galleryRefreshKey, setGalleryRefreshKey] = useState<number>(0);
  const [customTheme, setCustomTheme] = useState<string>("");
  const [customWords, setCustomWords] = useState<string[]>([]);
  const [promptDialogOpen, setPromptDialogOpen] = useState<boolean>(false);
  const [promptDialogLoading, setPromptDialogLoading] = useState<boolean>(false);
  const [durationLimit, setDurationLimit] = useState<number>(30);
  const [showTimeoutChoice, setShowTimeoutChoice] = useState<boolean>(false);
  const [timeoutImage, setTimeoutImage] = useState<string>("");
  const [isLastTimeout, setIsLastTimeout] = useState<boolean>(false);

  // Load settings on mount
  useEffect(() => {
    getSettings().then((saved) => {
      if (saved) {
        if (saved.wordBank) setWordBank(saved.wordBank);
        if (saved.critiqueStyle) setCritiqueStyle(saved.critiqueStyle);
        if (saved.customTheme) setCustomTheme(saved.customTheme);
        if (saved.customWords) setCustomWords(saved.customWords);
        if (saved.durationLimit !== undefined) setDurationLimit(saved.durationLimit);
      }
    });
  }, []);

  // Update Clock Tray
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, "0");
      const ampm = hours >= 12 ? "PM" : "AM";
      hours = hours % 12;
      hours = hours ? hours : 12;
      setCurrentTime(`${hours}:${minutes} ${ampm}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  // Timer logic for game
  useEffect(() => {
    let timer: number;
    if (gameState === "PLAYING" && timeLeft > 0 && timeLeft !== 999999) {
      timer = window.setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameState, timeLeft]);

  // Window Management Actions
  const bringToFront = (id: string) => {
    setActiveWindowId(id);
    setWindows((prev) => {
      const maxZ = Math.max(...prev.map((w) => w.zIndex), 0);
      return prev.map((w) =>
        w.id === id ? { ...w, zIndex: maxZ + 1, isMinimized: false } : w
      );
    });
  };

  const openWindow = (id: string) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, isOpen: true, isMinimized: false } : w))
    );
    bringToFront(id);
    setStartMenuOpen(false);
  };

  const minimizeWindow = (id: string) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, isMinimized: true } : w)));
    setActiveWindowId((prevActive) => {
      if (prevActive !== id) return prevActive;
      const visible = windows.filter((w) => w.id !== id && w.isOpen && !w.isMinimized);
      if (visible.length === 0) return null;
      const sorted = [...visible].sort((a, b) => b.zIndex - a.zIndex);
      return sorted[0].id;
    });
  };

  const maximizeWindow = (id: string) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, isMaximized: !w.isMaximized } : w))
    );
    bringToFront(id);
  };

  const closeWindow = (id: string) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, isOpen: false } : w)));
    if (activeWindowId === id) {
      setActiveWindowId(null);
    }
  };

  const moveWindow = (id: string, x: number, y: number) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, x, y } : w)));
  };

  const handleTaskbarClick = (id: string) => {
    const win = windows.find((w) => w.id === id);
    if (!win) return;

    if (win.isMinimized) {
      openWindow(id);
    } else if (activeWindowId === id) {
      minimizeWindow(id);
    } else {
      bringToFront(id);
    }
  };

  // Game specific triggers
  const startGame = async () => {
    const settings = await getSettings();
    if (!settings || !settings.apiKey) {
      showAlert(
        "未检测到 API 配置！\n\n为了能够正常使用 AI 评论功能，请先双击打开桌面上的「控制面板.lnk」配置您的 API 参数，并拉取选择一个支持多模态（视觉）的模型。",
        "配置缺失",
        "warning"
      );
      openWindow("settings");
      return;
    }
    setTargetWord(getRandomWord(wordBank, customWords));
    setTimeLeft(durationLimit === 0 ? 999999 : durationLimit);
    setResult(null);
    setFinalImage("");
    setIsCurrentSaved(false);
    setGameState("PLAYING");
  };

  const handleSettingsSaved = async () => {
    const saved = await getSettings();
    if (saved) {
      if (saved.wordBank) setWordBank(saved.wordBank);
      if (saved.critiqueStyle) setCritiqueStyle(saved.critiqueStyle);
      if (saved.customTheme) setCustomTheme(saved.customTheme);
      if (saved.customWords) setCustomWords(saved.customWords);
      if (saved.durationLimit !== undefined) setDurationLimit(saved.durationLimit);
    }
  };

  const handleDurationLimitChange = async (label: string) => {
    let nextLimit = 30;
    if (label === "无限制") nextLimit = 0;
    else if (label === "30秒") nextLimit = 30;
    else if (label === "60秒") nextLimit = 60;
    else if (label === "90秒") nextLimit = 90;

    setDurationLimit(nextLimit);

    // Save settings
    const saved = await getSettings();
    await saveSettings({
      ...(saved || { provider: "openrouter", apiUrl: "https://openrouter.ai/api/v1", apiKey: "", selectedModel: "google/gemini-2.5-flash", models: [] }),
      durationLimit: nextLimit,
    });
  };

  const durationReverseMap: Record<number, string> = {
    0: "无限制",
    30: "30秒",
    60: "60秒",
    90: "90秒"
  };

  const wordBankDropdownOptions = ["全部", "动物", "食物", "交通工具", "日常用品", "奇幻与幻想"];
  if (customTheme) {
    wordBankDropdownOptions.push(`✨ ${customTheme}`);
  }
  wordBankDropdownOptions.push("[新建自定义词库...]");

  const currentWordBankLabel = wordBank === "custom" && customTheme
    ? `✨ ${customTheme}`
    : wordBankReverseMap[wordBank] || "全部";

  const handleWordBankChange = async (label: string) => {
    if (label === "[新建自定义词库...]") {
      setPromptDialogOpen(true);
      return;
    }

    let nextBank: typeof wordBank;
    if (label.startsWith("✨ ")) {
      nextBank = "custom";
    } else {
      nextBank = wordBankOptionsMap[label] || "all";
    }

    setWordBank(nextBank);
    
    // Save settings
    const saved = await getSettings();
    await saveSettings({
      ...(saved || { provider: "openrouter", apiUrl: "https://openrouter.ai/api/v1", apiKey: "", selectedModel: "google/gemini-2.5-flash", models: [] }),
      wordBank: nextBank,
    });
  };

  const handleCritiqueStyleChange = async (label: string) => {
    const nextStyle = critiqueStyleOptionsMap[label] || "arrogant";
    setCritiqueStyle(nextStyle);
    
    // Save settings
    const saved = await getSettings();
    await saveSettings({
      ...(saved || { provider: "openrouter", apiUrl: "https://openrouter.ai/api/v1", apiKey: "", selectedModel: "google/gemini-2.5-flash", models: [] }),
      critiqueStyle: nextStyle,
    });
  };

  const handleGenerateCustomWords = async (theme: string) => {
    if (!theme.trim()) return;
    
    const settings = await getSettings();
    if (!settings || !settings.apiKey) {
      showAlert(
        "未检测到 API 配置！\n\n请先双击打开桌面上的「控制面板.lnk」配置您的 API 参数，才能生成自定义词库。",
        "配置缺失",
        "warning"
      );
      setPromptDialogOpen(false);
      openWindow("settings");
      return;
    }

    setPromptDialogLoading(true);
    const { provider, apiUrl, apiKey, selectedModel } = settings;

    try {
      const systemPrompt = `你是一个词库生成助手。你的任务是根据用户输入的主题，生成12个与该主题密切相关的、具体、简单、非常适合做简笔画创作的中文名词词语（例如对于“太空”主题，生成“火箭”、“宇航员”、“外星人”、“飞碟”、“流星”，绝对不要有“探索”、“浩瀚”等抽象词汇）。
同时，参考宝可梦卡牌的设定，请为每个生成的词语估算一个有趣或合理的身高（以米m或厘米cm为单位）和体重（以千克kg或克g为单位，例如：“火箭”身高“15m”体重“45000kg”；“流星”身高“0.5m”体重“15kg”）。
要求：
1. 词语必须是具体的事物、动物、食物、植物或交通工具等，禁止出现抽象概念。
2. 每个词语必须是纯中文，长度控制在2-4个字之间。
3. 必须返回一个标准的 JSON 对象，格式如下：
{
  "words": [
    {"word": "词语1", "height": "身高规格", "weight": "体重规格"},
    {"word": "词语2", "height": "身高规格", "weight": "体重规格"},
    ...
  ]
}`;

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
            {
              role: "user",
              content: `主题是：“${theme}”\n请生成符合上述要求的12个词语。`,
            },
            {
              role: "system",
              content: systemPrompt
            }
          ],
          response_format: { type: "json_object" },
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`API 返回状态码 ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "";
      const parsed = cleanAndParseJson(content);
      if (!parsed.words || !Array.isArray(parsed.words)) {
        throw new Error("模型返回的格式不正确，缺少 words 数组。");
      }

      const wordsList: string[] = [];
      const statsMap: Record<string, { height: string; weight: string }> = {};

      for (const item of parsed.words) {
        if (typeof item === "string") {
          wordsList.push(item);
        } else if (item && typeof item === "object") {
          const w = String(item.word || "");
          if (w) {
            wordsList.push(w);
            if (item.height && item.weight) {
              statsMap[w] = {
                height: String(item.height),
                weight: String(item.weight)
              };
            }
          }
        }
      }

      if (wordsList.length === 0) {
        throw new Error("未能成功解析出任何词语。");
      }

      const saved = await getSettings();
      await saveSettings({
        ...(saved || { provider: "openrouter", apiUrl: "https://openrouter.ai/api/v1", apiKey: "", selectedModel: "google/gemini-2.5-flash", models: [] }),
        wordBank: "custom",
        customTheme: theme,
        customWords: wordsList,
        customStats: statsMap,
      });

      setWordBank("custom");
      setCustomTheme(theme);
      setCustomWords(wordsList);
      showToast(`自定义词库「${theme}」生成成功！`, "success");
      setPromptDialogOpen(false);
    } catch (err: any) {
      console.error("Generate Custom Words Error:", err);
      showAlert(`生成自定义词库失败。原因: ${err.message || "请求失败"}`, "生成失败", "error");
    } finally {
      setPromptDialogLoading(false);
    }
  };

  const handleJudging = async (base64Image: string, isTimeout = false) => {
    setGameState("JUDGING");
    setFinalImage(base64Image);
    setIsLastTimeout(isTimeout);

    // Random loading texts
    let textIndex = 0;
    setJudgingText(JUDGING_FUNNY_TEXTS[0]);
    const textInterval = setInterval(() => {
      textIndex = (textIndex + 1) % JUDGING_FUNNY_TEXTS.length;
      setJudgingText(JUDGING_FUNNY_TEXTS[textIndex]);
    }, 3000);

    try {
      const settings = await getSettings();
      if (!settings || !settings.apiKey) {
        throw new Error("请先配置 API 密钥");
      }

      const { provider, apiUrl, apiKey, selectedModel } = settings;

      const styleList = ["arrogant", "supportive", "poetic", "philosophical", "nonsense"] as const;
      const activeStyle = critiqueStyle === "random"
        ? styleList[Math.floor(Math.random() * styleList.length)]
        : critiqueStyle;

      let stylePrompt = "";
      let scoreRange = "";
      if (activeStyle === "supportive") {
        stylePrompt = `你是一个极度溺爱、毫无审美底线的狂热信徒。
        要求：无论画作多离谱，都要用一种歇斯底里、热泪盈眶的传销式语言进行吹捧。使用极端的造神词汇（如“人类文明的灯塔”、“达芬奇看了都要自叹不如”、“震撼灵魂的重击”）。通过对破烂画作的降维式夸奖制造荒诞感。评分必须给95分以上。`;
      } else if (activeStyle === "poetic") {
        stylePrompt = `你是一位多愁善感、随时会崩溃的先锋派现代诗人。
        要求：评论必须像是一首无病呻吟的现代诗。大量使用宏大但破碎的意象（如：流血的晚霞、腐烂的星云、塞纳河的叹息）。把简笔画的每一根歪曲线条都解读为对生命流逝的哀歌。行文要有极强的跳跃性和矫情味，制造极致的高雅与简陋画作的对立反差。`;
      } else if (activeStyle === "philosophical") {
        stylePrompt = `你是一位深陷虚无主义危机的硬核哲学家。
        要求：强行用尼采、黑格尔或加缪的哲学理论来解构这幅画。大量使用哲学专有名词（如：绝对精神、西西弗斯的荒诞、存在先于本质、本体论）。将歪斜的线条解读为人类反抗荒谬世界的隐喻。态度必须绝对严肃、沉重，在宏大的哲学命题下探讨一幅涂鸦。`;
      } else if (activeStyle === "nonsense") {
        stylePrompt = `你是一个精神状态极度不稳定、前言不搭后语的网络乐子人。
        要求：逻辑必须是断裂的，比喻必须是跨物种且毫无因果关系的（例如“这根线条狂野得像我奶奶在太平洋跳钢管舞”）。融入极具画面感的奇怪场景和微小的日常荒谬事件。绝对不要进行任何正经的艺术分析。`;
      } else {
        stylePrompt = `你是一位古板、刻薄且自视甚高的皇家艺术学院院长。
        要求：通篇使用晦涩的专业艺术黑话（如解构主义、透视坍塌、视觉锚点）。用居高临下的态度对画面进行显微镜级别的过度审视。核心笑点在于“用写SCI论文的严谨态度去分析一坨涂鸦”。禁止使用任何网络流行语。`;
      }

      let timeLimitText = "";
      if (isTimeout) {
        timeLimitText = `\n[系统提示：用户没有在规定的 ${durationLimit} 秒内画完，时间到了强制提交。这是他们还没画完的烂尾半成品。请在你的猜测和点评中融入这一点，一本正经地调侃评论他们手速太慢，留下了一个未完成的烂摊子，或将“未完成的留白”一本正经地拔高为一种“刻意为之的残缺美学”或“创作者对时间流逝的无声妥协”，但千万不要让他们感到伤心。]`;
      }

      const prompt = `你是一个AI艺术评论家。
${stylePrompt}${timeLimitText}

注意：
1. 请仔细理解“好笑”与“冒犯”的区别：
   - 冒犯：直接对用户本人进行言语羞辱，贬低用户的智商或绘画能力（例如“你画得很垃圾”、“你是手残吧”、“这画得丑死了”）。这是绝不被允许的，会让用户感到不适！
   - 好笑：你需要通过荒谬的过度解读、角色扮演或夸张的比喻来制造幽默，让评论极具网络传播的节目效果。
2. 用户的目标是画一个“${targetWord}”。你的回答要充满荒诞的幽默感和张力，使其非常适合分享到社交媒体。
   【重要】关于“猜测”(guess字段)：请不要直接、死板地重复目标词语“${targetWord}”或简单描述。哪怕你能认出画的是什么，也请基于画面的实际视觉特征，给出一个极度离谱但又具备某种荒诞视觉逻辑的误读。让猜测本身成为笑点。例如，如果目标词是“香蕉”，你可以猜它是“一只弯曲的金色飞镖”或“一艘搁浅的太空香蕉船”；如果目标词是“猫”，你可以猜它是“一位穿着毛皮大衣的四足虚无主义哲学家”。让猜测本身成为笑点！猜测长度控制在 5 到 25 个字之间。
3. 评分 (score)：根据你的当前人格设定给出评分。除非完全交白卷，否则请在你的风格逻辑内合理给分（50-100）。
4. 返回完全符合以下Schema的JSON对象，不要添加任何 markdown 包裹，只需返回原始 JSON 字符串：
{
  "guess": "猜测结果",
  "score": 分数数字,
  "critique": "艺术评论"
}`;

      const cleanUrl = apiUrl.replace(/\/$/, "");
      const requestUrl = `${cleanUrl}/chat/completions`;

      // Extract raw base64 data to reconstruct properly
      const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
      const dataUri = `data:image/png;base64,${base64Data}`;

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
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: prompt,
                },
                {
                  type: "image_url",
                  image_url: {
                    url: dataUri,
                  },
                },
              ],
            },
          ],
          response_format: { type: "json_object" },
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        let errMessage = `API 错误（状态码 ${response.status}）`;
        try {
          const errJson = JSON.parse(errText);
          if (errJson.error?.message) {
            errMessage = errJson.error.message;
          }
        } catch (e) {
          // ignore
        }
        throw new Error(errMessage);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "";
      
      // Parse the JSON strictly
      const parsed = cleanAndParseJson(content);
      
      if (typeof parsed.score !== "number" || !parsed.critique) {
        throw new Error("模型返回的 JSON 格式不完整");
      }

      setResult({
        guess: parsed.guess || "看不懂的东西",
        score: parsed.score,
        critique: parsed.critique,
      });
      setGameState("RESULT");
    } catch (err: any) {
      console.error("API Call Error:", err);
      setResult({
        guess: "分析失败",
        score: 0,
        critique: `AI 艺术评论家掉线了。原因: ${err.message || "请求失败"}。请确保您选择的模型确实支持视觉识别，且您的 API 密钥和网络连接正常。`,
      });
      setGameState("RESULT");
    }
  };

  function cleanAndParseJson(text: string) {
    let cleaned = text.trim();
    
    // Extract JSON object if wrapped in markdown formatting
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleaned = jsonMatch[0];
    }

    try {
      return JSON.parse(cleaned);
    } catch (e) {
      console.error("Failed to parse JSON content:", text);
      throw new Error("无法解析模型返回 of JSON。");
    }
  }

  // Render content of drawing game app
  const renderDrawingApp = () => {
    return (
      <div className="flex-1 flex flex-col p-2 overflow-y-auto select-none min-h-0 bg-[#c0c0c0]">
        {gameState === "MENU" && (
          <div className="flex flex-col items-center text-center space-y-4 py-4 flex-grow justify-center min-h-0 overflow-y-auto">
            <div className="w-12 h-12 flex items-center justify-center text-[#000080] flex-shrink-0">
              <Icon icon="streamline-pixel:design-color-brush-paint" className="w-12 h-12" />
            </div>
            <h2 className="text-sm font-bold text-black flex-shrink-0">
              准备好接受 AI 艺术评论家的评判了吗？
            </h2>
            
            {/* Retro Win95 Settings Panel inside Menu */}
            <div className="w-full max-w-xs p-3 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 flex flex-col gap-2 text-left text-xs flex-shrink-0">
              <div className="font-bold text-black border-b border-gray-400 pb-1 mb-1 flex items-center gap-1">
                <Icon icon="dinkie-icons:gear" className="w-4 h-4 text-[#000080]" />
                <span>画作参数设置</span>
              </div>
              
              <div className="flex flex-col gap-0.5">
                <label className="font-bold text-black text-[10px]">画作词库选择:</label>
                <Dropdown
                  options={wordBankDropdownOptions}
                  value={currentWordBankLabel}
                  onChange={handleWordBankChange}
                  className="w-full"
                />
              </div>

              <div className="flex flex-col gap-0.5">
                <label className="font-bold text-black text-[10px]">AI 评论风格:</label>
                <Dropdown
                  options={["傲慢尖酸", "温柔鼓励", "诗意浪漫", "深奥哲学", "无厘头搞笑", "随机"]}
                  value={critiqueStyleReverseMap[critiqueStyle]}
                  onChange={handleCritiqueStyleChange}
                  className="w-full"
                />
              </div>

              <div className="flex flex-col gap-0.5">
                <label className="font-bold text-black text-[10px]">作画时间限制:</label>
                <Dropdown
                  options={["无限制", "30秒", "60秒", "90秒"]}
                  value={durationReverseMap[durationLimit] || "30秒"}
                  onChange={handleDurationLimitChange}
                  className="w-full"
                />
              </div>
            </div>

            <p className="text-[10px] text-gray-700 max-w-xs flex-shrink-0">
              {durationLimit === 0
                ? "您作画没有时间限制，点击提交即可面对 AI 评论家的“艺术”指点。"
                : `您需要在 ${durationLimit} 秒内画出提示的词语，然后面对 AI 评论家的“艺术”指点。`}
            </p>
            <button
              onClick={startGame}
              className="px-8 py-2 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 active:border-t-gray-800 active:border-l-gray-800 active:border-b-white active:border-r-white font-bold text-black text-xs cursor-pointer flex-shrink-0"
            >
              开始作画 (.exe)
            </button>
          </div>
        )}

        {gameState === "PLAYING" && (
          <DrawingBoard
            targetWord={targetWord}
            timeLeft={timeLeft}
            onSubmit={handleJudging}
            onTimeout={(base64) => {
              setTimeoutImage(base64);
              setShowTimeoutChoice(true);
            }}
          />
        )}

        {gameState === "JUDGING" && (
          <div className="flex flex-col items-center justify-center space-y-4 py-16 flex-grow">
            <div className="flex space-x-2">
              <div className="w-4 h-4 bg-[#000080] animate-bounce" style={{ animationDelay: "0ms" }}></div>
              <div className="w-4 h-4 bg-[#000080] animate-bounce" style={{ animationDelay: "150ms" }}></div>
              <div className="w-4 h-4 bg-[#000080] animate-bounce" style={{ animationDelay: "300ms" }}></div>
            </div>
            <div className="text-center">
              <h2 className="text-sm font-bold text-black mb-1">评论家正在仔细品味您的画作...</h2>
              <p className="text-[10px] text-gray-700">{judgingText}</p>
            </div>
          </div>
        )}

        {gameState === "RESULT" && result && (
          <ResultScreen
            result={result}
            targetWord={targetWord}
            image={finalImage}
            onPlayAgain={() => setGameState("MENU")}
            onRetry={() => handleJudging(finalImage, isLastTimeout)}
            showAlert={showAlert}
            showToast={showToast}
            isSaved={isCurrentSaved}
            onSaveSuccess={() => {
              setIsCurrentSaved(true);
              setGalleryRefreshKey((prev) => prev + 1);
            }}
          />
        )}
      </div>
    );
  };

  const desktopIcons = [
    {
      id: "drawing",
      title: "傲慢的评论家.exe",
      icon: "streamline-pixel:design-color-brush-paint",
    },
    {
      id: "gallery",
      title: "画廊陈列室.exe",
      icon: "streamline-pixel:design-drawing-board",
    },
    {
      id: "settings",
      title: "控制面板.lnk",
      icon: "streamline-pixel:interface-essential-setting-cog",
    },
  ];

  return (
    <div
      className="w-screen h-screen flex flex-col relative select-none overflow-hidden bg-[#008080]"
      onMouseDown={() => {
        setSelectedIconId(null);
        setStartMenuOpen(false);
      }}
      onTouchStart={() => {
        setStartMenuOpen(false);
      }}
    >
      {/* Desktop Area */}
      <div className="flex-grow w-full relative p-4 min-h-0">
        {/* Desktop Icons column */}
        <div className="flex flex-col gap-6 items-start w-24">
          {desktopIcons.map((icon) => (
            <div
              key={icon.id}
              onMouseDown={(e) => {
                e.stopPropagation();
                setSelectedIconId(icon.id);
              }}
              onTouchStart={(e) => {
                e.stopPropagation();
                setSelectedIconId(icon.id);
              }}
              onDoubleClick={(e) => {
                e.stopPropagation();
                openWindow(icon.id);
              }}
              // Add a click helper for mobile which doesn't support double click
              onClick={(e) => {
                e.stopPropagation();
                if (window.innerWidth < 768) {
                  openWindow(icon.id);
                }
              }}
              className="flex flex-col items-center w-20 cursor-pointer text-center group"
            >
              <div
                className={`p-1 flex items-center justify-center rounded border-2 border-transparent ${
                  selectedIconId === icon.id
                    ? "border-dotted border-gray-300 bg-blue-900/30"
                    : ""
                }`}
              >
                <Icon
                  icon={icon.icon}
                  className="w-10 h-10 text-white"
                />
              </div>
              <span
                className={`mt-1 px-1 py-0.5 text-[11px] text-white break-words max-w-full leading-tight select-none ${
                  selectedIconId === icon.id
                    ? "bg-[#000080] text-white"
                    : "drop-shadow-[1px_1px_1px_rgba(0,0,0,0.8)]"
                }`}
              >
                {icon.title}
              </span>
            </div>
          ))}
        </div>

        {/* Windows Rendering */}
        {windows.map((win) => (
          <Window
            key={win.id}
            id={win.id}
            title={win.title}
            icon={win.icon}
            isOpen={win.isOpen}
            isMinimized={win.isMinimized}
            isMaximized={win.isMaximized}
            zIndex={win.zIndex}
            x={win.x}
            y={win.y}
            width={win.width}
            height={win.height}
            isActive={activeWindowId === win.id}
            onClose={() => closeWindow(win.id)}
            onMinimize={() => minimizeWindow(win.id)}
            onMaximize={() => maximizeWindow(win.id)}
            onFocus={() => bringToFront(win.id)}
            onDrag={(x, y) => moveWindow(win.id, x, y)}
          >
            {win.id === "drawing" && renderDrawingApp()}
            {win.id === "gallery" && (
              <GalleryScreen 
                showAlert={showAlert} 
                showToast={showToast} 
                refreshKey={galleryRefreshKey} 
              />
            )}
            {win.id === "settings" && (
              <SettingsWindow
                onSave={handleSettingsSaved}
                onClose={() => closeWindow("settings")}
                showAlert={showAlert}
                showToast={showToast}
              />
            )}
          </Window>
        ))}
      </div>

      {/* Start Menu Popup */}
      {startMenuOpen && (
        <div
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          className="absolute bottom-8 left-0 w-52 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 z-[10000] flex shadow-lg"
        >
          {/* Windows 95 Sidebar */}
          <div className="w-7 bg-gradient-to-t from-[#000080] to-[#1084d0] flex items-end justify-center pb-8 pt-2 text-white font-bold tracking-widest select-none flex-shrink-0">
            <span className="transform -rotate-90 origin-center text-[10px] whitespace-nowrap -translate-y-8">
              Meowdows 95
            </span>
          </div>

          {/* Menu Items */}
          <div className="flex-1 flex flex-col p-1 text-[11px]">
            {[
              { id: "drawing", title: "傲慢的评论家.exe", icon: "dinkie-icons:artist-palette" },
              { id: "gallery", title: "画廊陈列室.exe", icon: "dinkie-icons:floppy-disk-filled" },
              { id: "settings", title: "控制面板.lnk", icon: "dinkie-icons:gear" }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => openWindow(item.id)}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-black hover:bg-[#000080] hover:text-white cursor-pointer group"
              >
                <Icon
                  icon={item.icon}
                  className="w-5 h-5 text-gray-700 group-hover:text-white"
                />
                <span>{item.title}</span>
              </button>
            ))}
            <div className="h-[2px] border-b border-white border-t border-gray-600 my-1 mx-2" />
            <button
              onClick={() => {
                setStartMenuOpen(false);
                showAlert(
                  `Meowdows 95 艺术评论家系统 v1.2\n\n这是一个向经典 Windows 95/98 操作系统以及像素艺术致敬的互动系统。\n\n【核心特色】\n- 复古像素画板：支持铅笔、画笔、喷枪和极速 Flood Fill 油漆桶。\n- 傲慢的 AI 评论家：结合视觉 AI 技术，对您的画作进行犀利傲慢、幽默风趣的艺术点评与评分！\n- 画廊陈列室：保存您的得意之作，并支持导出精美的 Win95 明信片卡片。\n- 系统自定义：可自由配置大语言模型接口，选择您喜爱的词库类别与 AI 点评风格。\n\n感谢体验，愿您创作出真正的艺术杰作！`,
                  "关于系统",
                  "info"
                );
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-black hover:bg-[#000080] hover:text-white cursor-pointer group"
            >
              <Icon
                icon="dinkie-icons:cat-face-small"
                className="w-5 h-5 text-gray-700 group-hover:text-white"
              />
              <span>关于系统</span>
            </button>
          </div>
        </div>
      )}

      {/* Taskbar */}
      <div className="h-8 bg-[#c0c0c0] border-t-2 border-t-white border-b border-b-gray-800 flex items-center justify-between px-1 z-[9999] relative flex-shrink-0">
        <div className="flex items-center gap-1 min-w-0 flex-1">
          {/* Start Button */}
          <button
            onMouseDown={(e) => {
              e.stopPropagation();
              setStartMenuOpen(!startMenuOpen);
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
              setStartMenuOpen(!startMenuOpen);
            }}
            className={`h-6 px-2 flex items-center gap-1 border-2 font-bold text-xs text-black cursor-pointer whitespace-nowrap flex-shrink-0 ${
              startMenuOpen
                ? "border-t-gray-800 border-l-gray-800 border-b-white border-r-white bg-gray-300"
                : "border-t-white border-l-white border-b-gray-800 border-r-gray-800 active:border-t-gray-800 active:border-l-gray-800 active:border-b-white active:border-r-white"
            }`}
          >
            <Icon icon="dinkie-icons:windows-alt3" className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="whitespace-nowrap">开始</span>
          </button>

          <div className="w-[2px] h-6 border-l border-l-gray-500 border-r border-r-white mx-1 flex-shrink-0"></div>

          {/* Running/Minimized Applications on Taskbar */}
          <div className="flex gap-1 overflow-x-auto min-w-0 max-w-full no-scrollbar">
            {windows
              .filter((win) => win.isOpen)
              .map((win) => {
                const isActive = activeWindowId === win.id && !win.isMinimized;
                return (
                  <button
                    key={win.id}
                    onClick={() => handleTaskbarClick(win.id)}
                    className={`h-6 px-2 flex items-center gap-1.5 border-2 text-xs font-bold text-black max-w-[70px] sm:max-w-[140px] truncate cursor-pointer whitespace-nowrap flex-shrink-0 ${
                      isActive
                        ? "border-t-gray-800 border-l-gray-800 border-b-white border-r-white bg-gray-300 shadow-[inset_1px_1px_1px_rgba(0,0,0,0.2)]"
                        : "border-t-white border-l-white border-b-gray-800 border-r-gray-800 bg-[#c0c0c0]"
                    }`}
                  >
                    <Icon icon={win.icon} className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{win.title}</span>
                  </button>
                );
              })}
          </div>
        </div>

        {/* System Tray (Clock & Icons) */}
        <div className="flex items-center gap-2 px-2 py-0.5 border-2 border-t-gray-800 border-l-gray-800 border-b-white border-r-white bg-[#c0c0c0] h-6 flex-shrink-0 ml-2">
          <Icon icon="dinkie-icons:speaker-with-three-sound-waves" />
          <Icon icon="dinkie-icons:desktop-computer" />
          <div className="w-[1px] h-4 bg-gray-500 mx-0.5"></div>
          <span className="text-[11px] font-bold text-black whitespace-nowrap">
            {currentTime}
          </span>
        </div>
      </div>
      {alertDialog && (
        <AlertDialog
          isOpen={alertDialog.isOpen}
          title={alertDialog.title}
          message={alertDialog.message}
          type={alertDialog.type}
          onClose={() => setAlertDialog(null)}
        />
      )}
      <PromptDialog
        isOpen={promptDialogOpen}
        title="新建自定义主题词库"
        message="请输入您的词库主题（例如：“太空旅程”、“猫咪日常”）。AI将根据主题自动为您生成12个简单易画的简笔画名词。"
        placeholder="输入词库主题..."
        loading={promptDialogLoading}
        onConfirm={handleGenerateCustomWords}
        onClose={() => setPromptDialogOpen(false)}
      />
      {showTimeoutChoice && (
        <ChoiceDialog
          isOpen={showTimeoutChoice}
          title="作画时间到！"
          message={`规定的 ${durationLimit} 秒倒计时已结束！\n\n您没能在规定时间内完成画作。您是要直接提交这份未完成的半成品，还是重新开始画一幅？`}
          confirmText="提交半成品"
          cancelText="重新开始"
          onConfirm={() => {
            setShowTimeoutChoice(false);
            handleJudging(timeoutImage, true);
          }}
          onCancel={() => {
            setShowTimeoutChoice(false);
            startGame();
          }}
        />
      )}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      {/* Custom dialog components rendered elsewhere */}
    </div>
  );
}
