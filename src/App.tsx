import { useState, useEffect } from "react";
import { DrawingBoard } from "./components/DrawingBoard";
import { ResultScreen } from "./components/ResultScreen";
import { GalleryScreen } from "./components/GalleryScreen";
import { SettingsWindow } from "./components/SettingsWindow";
import { Window } from "./components/Window";
import { getRandomWord } from "./utils/words";
import { getSettings, saveSettings } from "./utils/storage";
import { Icon } from "@iconify/react";
import { AlertDialog, PromptDialog, ChoiceDialog, EditWordBankDialog } from "./components/Modal";
import { Dropdown } from "./components/Dropdown";
import { ToastContainer, ToastItem } from "./components/Toast";

// Refactored Imports
import type { GameState, JudgeResult, WindowState } from "./types/app";
import { INITIAL_WINDOWS, DESKTOP_ICONS, START_MENU_ITEMS } from "./constants/windows";
import {
  wordBankOptionsMap,
  wordBankReverseMap,
  critiqueStyleOptionsMap,
  critiqueStyleReverseMap,
  durationReverseMap,
  JUDGING_FUNNY_TEXTS,
} from "./constants/mappings";
import { HELP_CONTENT_TEXT, CHANGELOG_CONTENT_TEXT } from "./constants/content";
import { callJudgeAPI } from "./services/judgeService";
import { generateCustomWords } from "./services/wordBankService";
import { NotepadWindow } from "./components/NotepadWindow";

export default function App() {
  // Desktop Windows State with retro Win95 names
  const [windows, setWindows] = useState<WindowState[]>(INITIAL_WINDOWS);
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
  const [drawingKey, setDrawingKey] = useState<number>(0);

  const [isCurrentSaved, setIsCurrentSaved] = useState<boolean>(false);
  const [wordBank, setWordBank] = useState<"all" | "animals" | "food" | "vehicles" | "daily" | "fantasy" | "custom">("all");
  const [critiqueStyle, setCritiqueStyle] = useState<"arrogant" | "supportive" | "poetic" | "philosophical" | "nonsense" | "random">("arrogant");
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [galleryRefreshKey, setGalleryRefreshKey] = useState<number>(0);
  const [customTheme, setCustomTheme] = useState<string>("");
  const [customWords, setCustomWords] = useState<string[]>([]);
  const [promptDialogOpen, setPromptDialogOpen] = useState<boolean>(false);
  const [promptDialogLoading, setPromptDialogLoading] = useState<boolean>(false);
  const [editWordBankOpen, setEditWordBankOpen] = useState<boolean>(false);
  const [deleteCustomWordBankOpen, setDeleteCustomWordBankOpen] = useState<boolean>(false);
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
    setDrawingKey((prev) => prev + 1);
  };

  const restartCurrentWord = () => {
    setTimeLeft(durationLimit === 0 ? 999999 : durationLimit);
    setResult(null);
    setFinalImage("");
    setIsCurrentSaved(false);
    setGameState("PLAYING");
    setDrawingKey((prev) => prev + 1);
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

  const handleDeleteCustomWordBank = async () => {
    setWordBank("all");
    setCustomTheme("");
    setCustomWords([]);
    
    const saved = await getSettings();
    await saveSettings({
      ...(saved || { provider: "custom", apiUrl: "", apiKey: "", selectedModel: "google/gemini-2.5-flash", models: [] }),
      wordBank: "all",
      customTheme: "",
      customWords: [],
      customStats: {},
    });
    
    showToast("自定义词库已成功删除！", "success");
  };

  const handleSaveCustomWordBank = async (updatedWords: string[]) => {
    setCustomWords(updatedWords);
    
    const saved = await getSettings();
    const newStats = { ...(saved?.customStats || {}) };
    
    // clean stats for words that were deleted
    for (const w of Object.keys(newStats)) {
      if (!updatedWords.includes(w)) {
        delete newStats[w];
      }
    }
    
    await saveSettings({
      ...(saved || { provider: "custom", apiUrl: "", apiKey: "", selectedModel: "google/gemini-2.5-flash", models: [] }),
      customWords: updatedWords,
      customStats: newStats,
    });
    
    showToast("自定义词库编辑已保存！", "success");
    setEditWordBankOpen(false);
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
    try {
      const { words } = await generateCustomWords(theme);
      setWordBank("custom");
      setCustomTheme(theme);
      setCustomWords(words);
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
      const result = await callJudgeAPI({
        base64Image,
        targetWord,
        critiqueStyle,
        wordBank,
        customTheme,
        durationLimit,
        isTimeout,
      });

      setResult(result);
      setGameState("RESULT");
    } catch (err: any) {
      console.error("API Call Error:", err);
      setResult({
        guess: "分析失败",
        score: 0,
        critique: `AI 艺术评论家掉线了。原因: ${err.message || "请求失败"}。请确保您选择的模型确实支持视觉识别，且您的 API 密钥和网络连接正常。`,
      });
      setGameState("RESULT");
    } finally {
      clearInterval(textInterval);
    }
  };

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
                <div className="flex justify-between items-center">
                  <label className="font-bold text-black text-[10px]">画作词库选择:</label>
                  {customTheme && (
                    <div className="flex gap-2 text-[9px] font-bold">
                      <button
                        onClick={() => setEditWordBankOpen(true)}
                        className="text-blue-800 underline hover:text-blue-900 cursor-pointer"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => setDeleteCustomWordBankOpen(true)}
                        className="text-red-800 underline hover:text-red-900 cursor-pointer"
                      >
                        删除
                      </button>
                    </div>
                  )}
                </div>
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
                : `您需要在 ${durationLimit} 秒内画出提示 of 词语，然后面对 AI 评论家的“艺术”指点。`}
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
            key={drawingKey}
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
            onOpenGallery={() => openWindow("gallery")}
          />
        )}
      </div>
    );
  };

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
          {DESKTOP_ICONS.map((icon) => (
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
            {win.id === "help" && <NotepadWindow content={HELP_CONTENT_TEXT} />}
            {win.id === "changelog" && <NotepadWindow content={CHANGELOG_CONTENT_TEXT} />}
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
            {START_MENU_ITEMS.map((item) => (
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
                  `Meowdows 95 \n\n【警告】此程序搭载了极具杀伤力的 AI 毒舌引擎。如果您的画作引起了 AI 胃部不适，本系统概不负责！\n\n【核心玩法】\n- 灵魂画作：使用复古的铅笔、喷壶和油漆桶强行创作。\n- 毒舌审判：AI 评论家将以极其傲慢且荒谬的角度解读您的作品，并在最后打出极其不理智的分数。\n- 传世画廊：将您惨遭蹂躏的画作导出为 Win95 复古明信片进行公开处刑。\n\n珍爱生命，远离毒舌评委。感谢体验！`,
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
            restartCurrentWord();
          }}
        />
      )}
      <EditWordBankDialog
        isOpen={editWordBankOpen}
        theme={customTheme}
        words={customWords}
        onClose={() => setEditWordBankOpen(false)}
        onSave={handleSaveCustomWordBank}
      />
      <ChoiceDialog
        isOpen={deleteCustomWordBankOpen}
        title="确认删除词库"
        message={`您确定要永久删除自定义词库「${customTheme}」吗？`}
        confirmText="确定"
        cancelText="取消"
        onConfirm={async () => {
          setDeleteCustomWordBankOpen(false);
          await handleDeleteCustomWordBank();
        }}
        onCancel={() => setDeleteCustomWordBankOpen(false)}
      />
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
