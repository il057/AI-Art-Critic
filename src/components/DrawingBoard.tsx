import React, { useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";

const PALETTES = {
  classic: [
    // Row 1 (14 colors)
    "#000000", "#808080", "#800000", "#808000", "#008000", "#008080", "#000080", "#800080", "#808040", "#004040", "#0080ff", "#004080", "#4000ff", "#804000",
    // Row 2 (14 colors)
    "#ffffff", "#c0c0c0", "#ff0000", "#ffff00", "#00ff00", "#00ffff", "#0000ff", "#ff00ff", "#ffff80", "#00ff80", "#80ffff", "#8080ff", "#ff8000", "#ff80ff"
  ],
  pastel: [
    "#f6a6b2", "#ffc3a0", "#ffdac1", "#ffb7b2", "#e2f0cb", "#b5ead7", "#c7ceea", "#ff9aa2", "#e8aeb7", "#b9fbc0", "#98f5e1", "#8eecf5", "#a0c4ff", "#bdb2ff",
    "#ffffff", "#fef6eb", "#fae1dd", "#ece4db", "#ffe5ec", "#ffc6ff", "#fbc4ab", "#f8ad9d", "#f4978e", "#f08080", "#f3c68f", "#eed7a1", "#d3ab9e", "#c5ded9"
  ],
  cyber: [
    "#0d0221", "#0f084b", "#26408b", "#3d60a5", "#0a1128", "#1c2541", "#3a506b", "#5bc0be", "#6fffe9", "#11151c", "#212d40", "#364156", "#7d4f50", "#000000",
    "#ffffff", "#39ff14", "#00ffff", "#ff007f", "#ff00ff", "#ffff00", "#ff5f1f", "#bc13fe", "#ff073a", "#e8fc00", "#00f5d4", "#00bbf9", "#9b5de5", "#f15bb5"
  ],
  grayscale: [
    "#000000", "#111111", "#222222", "#333333", "#444444", "#555555", "#666666", "#777777", "#888888", "#999999", "#aaaaaa", "#bbbbbb", "#cccccc", "#dddddd",
    "#ffffff", "#f9f9f9", "#f0f0f0", "#e8e8e8", "#dfdfdf", "#d6d6d6", "#cccccc", "#c0c0c0", "#b3b3b3", "#a6a6a6", "#999999", "#8c8c8c", "#7f7f7f", "#737373"
  ],
  forest: [
    "#1E3F20", "#2D5A27", "#3B7A57", "#4F9D69", "#70C1B3", "#8ECAE6", "#2A9D8F", "#E9C46A", "#F4A261", "#E76F51", "#8B5E3C", "#5C3D2E", "#3D261C", "#24150E",
    "#A3B18A", "#588157", "#3A5A40", "#344E41", "#DAD7CD", "#F5EBE0", "#E3D5CA", "#D5BDAF", "#9A7B56", "#C6AC8F", "#E0E1DD", "#778DA9", "#415A77", "#1B263B"
  ],
  ocean: [
    "#03045E", "#023E8A", "#0077B6", "#0096C7", "#00B4D8", "#48CAE4", "#90E0EF", "#ADE8F4", "#CAF0F8", "#E0F2F1", "#B2DFDB", "#80CBC4", "#4DB6AC", "#26A69A",
    "#012A4A", "#013A63", "#01497C", "#014F86", "#2A6F97", "#2C7DA0", "#468FAF", "#61A5C2", "#89C2D9", "#A9D6E5", "#006466", "#065A60", "#0B525B", "#144552"
  ],
  sunset: [
    "#370617", "#6A040F", "#9D0208", "#D00000", "#DC2F02", "#E85D04", "#F48C06", "#FAA307", "#FFBA08", "#FFD000", "#FFE800", "#FFB703", "#FB8500", "#8E24AA",
    "#F72585", "#7209B7", "#560BAD", "#480CA8", "#3F0712", "#FF4D6D", "#FF758F", "#FF8FA3", "#FFCCD5", "#FFF0F3", "#D90429", "#EF233C", "#8D99AE", "#2B2D42"
  ]
};

interface DrawingBoardProps {
  key?: React.Key;
  targetWord: string;
  timeLeft: number;
  onSubmit: (base64Image: string, isTimeout?: boolean) => void | Promise<void>;
  onTimeout?: (base64Image: string) => void;
}


export function DrawingBoard({ targetWord, timeLeft, onSubmit, onTimeout }: DrawingBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tempCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPos, setLastPos] = useState<{ x: number; y: number } | null>(null);
  const [color, setColor] = useState("#000000");
  const [activeTool, setActiveTool] = useState("pencil");
  const [statusText, setStatusText] = useState("");

  // States for presets & dropdown menus
  const [activePalette, setActivePalette] = useState<keyof typeof PALETTES>("classic");
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [showAbout, setShowAbout] = useState(false);

  // Brush size and opacity state
  const [sizes, setSizes] = useState<Record<string, number>>({
    pencil: 2,
    eraser: 20,
    spray: 10,
  });
  const [opacities, setOpacities] = useState<Record<string, number>>({
    pencil: 100,
    eraser: 100,
    spray: 100,
  });

  const setSizeForActiveTool = (newSize: number) => {
    setSizes((prev) => ({ ...prev, [activeTool]: newSize }));
  };

  const setOpacityForActiveTool = (newOpacity: number) => {
    setOpacities((prev) => ({ ...prev, [activeTool]: newOpacity }));
  };

  const handleEyedropper = (startX: number, startY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const x = Math.floor(startX);
    const y = Math.floor(startY);
    const width = canvas.width;
    const height = canvas.height;

    if (x < 0 || x >= width || y < 0 || y >= height) return;

    const imgData = ctx.getImageData(x, y, 1, 1);
    const r = imgData.data[0];
    const g = imgData.data[1];
    const b = imgData.data[2];
    const a = imgData.data[3];

    // Convert RGBA to hex
    const hex = "#" + [r, g, b].map(val => {
      const hexStr = val.toString(16);
      return hexStr.length === 1 ? "0" + hexStr : hexStr;
    }).join("");

    setColor(hex);
    setStatusText(`吸管吸取颜色: ${hex}`);
  };

  const downloadImage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const base64 = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = base64;
    link.download = `画作_${targetWord || "未命名"}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // History system for undo/redo
  const historyRef = useRef<ImageData[]>([]);
  const historyIndexRef = useRef(-1);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const saveToHistory = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const nextHistory = historyRef.current.slice(0, historyIndexRef.current + 1);
    nextHistory.push(imageData);
    if (nextHistory.length > 50) {
      nextHistory.shift();
    }
    historyRef.current = nextHistory;
    historyIndexRef.current = nextHistory.length - 1;
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(false);
  };

  const handleUndo = () => {
    if (historyIndexRef.current <= 0) return;
    historyIndexRef.current--;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.putImageData(historyRef.current[historyIndexRef.current], 0, 0);
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(true);
  };

  const handleRedo = () => {
    if (historyIndexRef.current >= historyRef.current.length - 1) return;
    historyIndexRef.current++;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.putImageData(historyRef.current[historyIndexRef.current], 0, 0);
    setCanUndo(true);
    setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
  };

  const menuRef = useRef<HTMLDivElement>(null);

  // Click outside menu listener
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard shortcut listener for Ctrl+Z / Ctrl+Y / Ctrl+N / Ctrl+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      if (isCtrlOrCmd) {
        if (e.key.toLowerCase() === "z") {
          e.preventDefault();
          if (e.shiftKey) {
            handleRedo();
          } else {
            handleUndo();
          }
        } else if (e.key.toLowerCase() === "y") {
          e.preventDefault();
          handleRedo();
        } else if (e.key.toLowerCase() === "n") {
          e.preventDefault();
          handleClear();
        } else if (e.key.toLowerCase() === "s") {
          e.preventDefault();
          downloadImage();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Capture canvas data and trigger callback on timeout
  useEffect(() => {
    if (timeLeft === 0 && onTimeout) {
      const canvas = canvasRef.current;
      if (canvas) {
        const base64 = canvas.toDataURL("image/png");
        onTimeout(base64);
      }
    }
  }, [timeLeft, onTimeout]);

  // Update status message when targetWord changes
  useEffect(() => {
    setStatusText(`在画布上绘制目标: ${targetWord}。双击或拖拽作画！`);
  }, [targetWord]);

  // Initialize canvas white background and save initial history
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Save initial blank white state to history
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    historyRef.current = [imageData];
    historyIndexRef.current = 0;
    setCanUndo(false);
    setCanRedo(false);
  }, []);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent): { x: number; y: number } => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ("touches" in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY
      };
    }
    
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const handleFloodFill = (startX: number, startY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const x = Math.floor(startX);
    const y = Math.floor(startY);
    const width = canvas.width;
    const height = canvas.height;

    if (x < 0 || x >= width || y < 0 || y >= height) return;

    const imgData = ctx.getImageData(0, 0, width, height);
    const data = imgData.data;

    const getPixelIdx = (px: number, py: number) => (py * width + px) * 4;

    const startIdx = getPixelIdx(x, y);
    const startR = data[startIdx];
    const startG = data[startIdx + 1];
    const startB = data[startIdx + 2];
    const startA = data[startIdx + 3];

    const hexToRgb = (hexStr: string) => {
      const r = parseInt(hexStr.slice(1, 3), 16);
      const g = parseInt(hexStr.slice(3, 5), 16);
      const b = parseInt(hexStr.slice(5, 7), 16);
      return { r, g, b };
    };

    const fillRGB = hexToRgb(color);

    // Color match guard
    if (
      startR === fillRGB.r &&
      startG === fillRGB.g &&
      startB === fillRGB.b &&
      startA === 255
    ) {
      return;
    }

    const tolerance = 450; // Tolerance to bridge antialiasing gaps between fill and lines
    
    // Stack based flood fill for high performance
    const stack: [number, number][] = [[x, y]];
    const visited = new Uint8Array(width * height);
    visited[y * width + x] = 1;

    while (stack.length > 0) {
      const [cx, cy] = stack.pop()!;
      const idx = getPixelIdx(cx, cy);

      data[idx] = fillRGB.r;
      data[idx + 1] = fillRGB.g;
      data[idx + 2] = fillRGB.b;
      data[idx + 3] = 255;

      // Push 4-way neighbors
      const neighbors: [number, number][] = [
        [cx - 1, cy],
        [cx + 1, cy],
        [cx, cy - 1],
        [cx, cy + 1]
      ];

      for (const [nx, ny] of neighbors) {
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          const vIdx = ny * width + nx;
          if (visited[vIdx] === 0) {
            const pIdx = (ny * width + nx) * 4;
            const r = data[pIdx];
            const g = data[pIdx + 1];
            const b = data[pIdx + 2];
            const a = data[pIdx + 3];
            
            const diff = Math.abs(r - startR) + Math.abs(g - startG) + Math.abs(b - startB) + Math.abs(a - startA);
            if (diff <= tolerance) {
              visited[vIdx] = 1;
              stack.push([nx, ny]);
            }
          }
        }
      }
    }

    ctx.putImageData(imgData, 0, 0);
    saveToHistory();
  };

  const paintSpray = (ctx: CanvasRenderingContext2D, cx: number, cy: number) => {
    ctx.fillStyle = color;
    const radius = sizes["spray"] ?? 10;
    // Scale density dynamically based on the radius
    const density = Math.max(5, Math.floor(radius * 1.5));
    for (let i = 0; i < density; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * radius;
      const sx = Math.floor(cx + Math.cos(angle) * dist);
      const sy = Math.floor(cy + Math.sin(angle) * dist);
      if (sx >= 0 && sx < canvasRef.current!.width && sy >= 0 && sy < canvasRef.current!.height) {
        ctx.fillRect(sx, sy, 1, 1);
      }
    }
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (e.cancelable) {
      e.preventDefault();
    }
    const coords = getCoordinates(e);

    if (activeTool === "bucket") {
      handleFloodFill(coords.x, coords.y);
      return;
    }
    if (activeTool === "dropper") {
      handleEyedropper(coords.x, coords.y);
      return;
    }

    setIsDrawing(true);
    setLastPos(coords);

    const tempCtx = tempCanvasRef.current?.getContext("2d");
    if (!tempCtx) return;

    // Set styles for temp drawing
    tempCtx.strokeStyle = activeTool === "eraser" ? "#ffffff" : color;
    tempCtx.fillStyle = activeTool === "eraser" ? "#ffffff" : color;
    tempCtx.lineWidth = sizes[activeTool] ?? 8;
    tempCtx.lineCap = "round";
    tempCtx.lineJoin = "round";
    tempCtx.globalAlpha = 1.0;

    if (activeTool === "spray") {
      paintSpray(tempCtx, coords.x, coords.y);
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (e.cancelable) {
      e.preventDefault();
    }
    const coords = getCoordinates(e);
    
    if (isDrawing && activeTool === "dropper") {
      handleEyedropper(coords.x, coords.y);
      return;
    }

    if (!isDrawing || !lastPos) return;
    const tempCtx = tempCanvasRef.current?.getContext("2d");
    if (!tempCtx) return;

    if (activeTool === "pencil" || activeTool === "eraser") {
      tempCtx.beginPath();
      tempCtx.moveTo(lastPos.x, lastPos.y);
      tempCtx.lineTo(coords.x, coords.y);
      tempCtx.stroke();
      setLastPos(coords);
    } else if (activeTool === "spray") {
      paintSpray(tempCtx, coords.x, coords.y);
      setLastPos(coords);
    }
  };

  const stopDrawing = () => {
    if (isDrawing) {
      const mainCanvas = canvasRef.current;
      const tempCanvas = tempCanvasRef.current;
      if (mainCanvas && tempCanvas) {
        const mainCtx = mainCanvas.getContext("2d");
        const tempCtx = tempCanvas.getContext("2d");
        if (mainCtx && tempCtx) {
          const currentOpacity = opacities[activeTool] ?? 100;
          mainCtx.globalAlpha = currentOpacity / 100;
          mainCtx.drawImage(tempCanvas, 0, 0);
          mainCtx.globalAlpha = 1.0; // reset
          
          // Clear temp canvas
          tempCtx.clearRect(0, 0, tempCanvas.width, tempCanvas.height);
        }
      }
      saveToHistory();
    }
    setIsDrawing(false);
    setLastPos(null);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveToHistory();
  };

  const handleSubmit = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const base64 = canvas.toDataURL("image/png");
      onSubmit(base64);
    }
  };

  const tools = [
    { id: "pencil", name: "铅笔", icon: "streamline-pixel:interface-essential-pencil-edit-2", desc: "铅笔工具 - 自由画笔线。" },
    { id: "dropper", name: "吸管", icon: "streamline-pixel:design-dropper-2", desc: "吸管工具 - 从画布上吸取颜色。" },
    { id: "eraser", name: "橡皮", icon: "streamline-pixel:interface-essential-eraser", desc: "橡皮擦 - 擦除图画为白色。" },
    { id: "bucket", name: "油漆桶", icon: "streamline-pixel:design-color-bucket-brush", desc: "油漆桶 - 用当前选择的颜色填充连通区域。" },
    { id: "spray", name: "喷壶", icon: "streamline-pixel:design-color-spray", desc: "喷壶工具 - 喷洒散沙点。" }
  ];

  const toolConfig: Record<string, { minSize: number; maxSize: number; label: string }> = {
    pencil: { minSize: 1, maxSize: 30, label: "铅笔大小" },
    eraser: { minSize: 5, maxSize: 150, label: "橡皮大小" },
    spray: { minSize: 5, maxSize: 100, label: "喷壶半径" },
  };

  const activeColors = PALETTES[activePalette];

  return (
    <div className="flex-grow flex flex-col min-h-0 bg-[#c0c0c0] justify-between relative">
      <style>{`
        .win95-slider {
          -webkit-appearance: none;
          width: 100%;
          background: transparent;
        }
        .win95-slider:focus {
          outline: none;
        }
        .win95-slider::-webkit-slider-runnable-track {
          width: 100%;
          height: 4px;
          cursor: pointer;
          background: #808080;
          border-bottom: 1px solid #fff;
          border-right: 1px solid #fff;
          border-top: 1px solid #404040;
          border-left: 1px solid #404040;
        }
        .win95-slider::-webkit-slider-thumb {
          height: 18px;
          width: 10px;
          background: #c0c0c0;
          border-top: 1px solid #fff;
          border-left: 1px solid #fff;
          border-right: 2px solid #404040;
          border-bottom: 2px solid #404040;
          cursor: pointer;
          -webkit-appearance: none;
          margin-top: -7px;
        }
        .win95-slider::-moz-range-track {
          width: 100%;
          height: 4px;
          cursor: pointer;
          background: #808080;
          border-bottom: 1px solid #fff;
          border-right: 1px solid #fff;
          border-top: 1px solid #404040;
          border-left: 1px solid #404040;
        }
        .win95-slider::-moz-range-thumb {
          height: 18px;
          width: 10px;
          background: #c0c0c0;
          border-top: 1px solid #fff;
          border-left: 1px solid #fff;
          border-right: 2px solid #404040;
          border-bottom: 2px solid #404040;
          cursor: pointer;
        }
      `}</style>

      {/* Mock Menu Bar */}
      <div ref={menuRef} className="flex gap-1 px-2 py-0.5 border-b border-gray-400 text-xs text-black font-bold cursor-default select-none relative z-50 bg-[#c0c0c0]">
        {/* File Menu */}
        <div className="relative">
          <button
            onClick={() => setOpenMenu(openMenu === "file" ? null : "file")}
            onMouseEnter={() => openMenu && setOpenMenu("file")}
            className={`px-2 py-0.5 hover:bg-[#000080] hover:text-white cursor-pointer ${openMenu === "file" ? "bg-[#000080] text-white" : "text-black"}`}
          >
            文件(F)
          </button>
          {openMenu === "file" && (
            <div className="absolute top-full left-0 mt-0.5 w-32 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 shadow-md flex flex-col py-0.5 text-black font-normal text-xs z-50">
              <button
                onClick={() => { handleClear(); setOpenMenu(null); }}
                className="px-4 py-1 text-left hover:bg-[#000080] hover:text-white w-full cursor-pointer flex justify-between items-center"
              >
                <span>新建(N)</span>
                <span className="text-gray-500 text-[10px]">Ctrl+N</span>
              </button>
              <button
                onClick={() => { downloadImage(); setOpenMenu(null); }}
                className="px-4 py-1 text-left hover:bg-[#000080] hover:text-white w-full cursor-pointer flex justify-between items-center"
              >
                <span>保存(S)</span>
                <span className="text-gray-500 text-[10px]">Ctrl+S</span>
              </button>
            </div>
          )}
        </div>

        {/* Edit Menu */}
        <div className="relative">
          <button
            onClick={() => setOpenMenu(openMenu === "edit" ? null : "edit")}
            onMouseEnter={() => openMenu && setOpenMenu("edit")}
            className={`px-2 py-0.5 hover:bg-[#000080] hover:text-white cursor-pointer ${openMenu === "edit" ? "bg-[#000080] text-white" : "text-black"}`}
          >
            编辑(E)
          </button>
          {openMenu === "edit" && (
            <div className="absolute top-full left-0 mt-0.5 w-40 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 shadow-md flex flex-col py-0.5 text-black font-normal text-xs z-50">
              <button
                onClick={() => { handleUndo(); setOpenMenu(null); }}
                disabled={!canUndo}
                className="px-4 py-1 text-left hover:bg-[#000080] hover:text-white disabled:hover:bg-transparent disabled:hover:text-gray-500 disabled:opacity-50 w-full cursor-pointer flex justify-between items-center"
              >
                <span>撤销(U)</span>
                <span className="text-gray-500 text-[10px]">Ctrl+Z</span>
              </button>
              <button
                onClick={() => { handleRedo(); setOpenMenu(null); }}
                disabled={!canRedo}
                className="px-4 py-1 text-left hover:bg-[#000080] hover:text-white disabled:hover:bg-transparent disabled:hover:text-gray-500 disabled:opacity-50 w-full cursor-pointer flex justify-between items-center"
              >
                <span>恢复(R)</span>
                <span className="text-gray-500 text-[10px]">Ctrl+Y</span>
              </button>
            </div>
          )}
        </div>

        {/* Color Menu */}
        <div className="relative">
          <button
            onClick={() => setOpenMenu(openMenu === "color" ? null : "color")}
            onMouseEnter={() => openMenu && setOpenMenu("color")}
            className={`px-2 py-0.5 hover:bg-[#000080] hover:text-white cursor-pointer ${openMenu === "color" ? "bg-[#000080] text-white" : "text-black"}`}
          >
            颜色(C)
          </button>
          {openMenu === "color" && (
            <div className="absolute top-full left-0 mt-0.5 w-44 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 shadow-md flex flex-col py-0.5 text-black font-normal text-xs z-50">
              <div className="px-2 py-0.5 font-bold text-[9px] text-gray-500 border-b border-gray-300">切换色盘</div>
              <button
                onClick={() => { setActivePalette("classic"); setOpenMenu(null); }}
                className={`px-4 py-1 text-left hover:bg-[#000080] hover:text-white w-full cursor-pointer flex items-center justify-between ${activePalette === "classic" ? "font-bold text-[#000080] hover:text-white" : ""}`}
              >
                <span>经典复古</span>
                {activePalette === "classic" && <span>✓</span>}
              </button>
              <button
                onClick={() => { setActivePalette("pastel"); setOpenMenu(null); }}
                className={`px-4 py-1 text-left hover:bg-[#000080] hover:text-white w-full cursor-pointer flex items-center justify-between ${activePalette === "pastel" ? "font-bold text-[#000080] hover:text-white" : ""}`}
              >
                <span>现代柔和</span>
                {activePalette === "pastel" && <span>✓</span>}
              </button>
              <button
                onClick={() => { setActivePalette("cyber"); setOpenMenu(null); }}
                className={`px-4 py-1 text-left hover:bg-[#000080] hover:text-white w-full cursor-pointer flex items-center justify-between ${activePalette === "cyber" ? "font-bold text-[#000080] hover:text-white" : ""}`}
              >
                <span>暗黑赛博</span>
                {activePalette === "cyber" && <span>✓</span>}
              </button>
              <button
                onClick={() => { setActivePalette("grayscale"); setOpenMenu(null); }}
                className={`px-4 py-1 text-left hover:bg-[#000080] hover:text-white w-full cursor-pointer flex items-center justify-between ${activePalette === "grayscale" ? "font-bold text-[#000080] hover:text-white" : ""}`}
              >
                <span>黑白灰度</span>
                {activePalette === "grayscale" && <span>✓</span>}
              </button>
              <button
                onClick={() => { setActivePalette("forest"); setOpenMenu(null); }}
                className={`px-4 py-1 text-left hover:bg-[#000080] hover:text-white w-full cursor-pointer flex items-center justify-between ${activePalette === "forest" ? "font-bold text-[#000080] hover:text-white" : ""}`}
              >
                <span>秋日森林</span>
                {activePalette === "forest" && <span>✓</span>}
              </button>
              <button
                onClick={() => { setActivePalette("ocean"); setOpenMenu(null); }}
                className={`px-4 py-1 text-left hover:bg-[#000080] hover:text-white w-full cursor-pointer flex items-center justify-between ${activePalette === "ocean" ? "font-bold text-[#000080] hover:text-white" : ""}`}
              >
                <span>深海秘境</span>
                {activePalette === "ocean" && <span>✓</span>}
              </button>
              <button
                onClick={() => { setActivePalette("sunset"); setOpenMenu(null); }}
                className={`px-4 py-1 text-left hover:bg-[#000080] hover:text-white w-full cursor-pointer flex items-center justify-between ${activePalette === "sunset" ? "font-bold text-[#000080] hover:text-white" : ""}`}
              >
                <span>温暖日落</span>
                {activePalette === "sunset" && <span>✓</span>}
              </button>
            </div>
          )}
        </div>

        {/* Help Menu */}
        <div className="relative">
          <button
            onClick={() => setOpenMenu(openMenu === "help" ? null : "help")}
            onMouseEnter={() => openMenu && setOpenMenu("help")}
            className={`px-2 py-0.5 hover:bg-[#000080] hover:text-white cursor-pointer ${openMenu === "help" ? "bg-[#000080] text-white" : "text-black"}`}
          >
            帮助(H)
          </button>
          {openMenu === "help" && (
            <div className="absolute top-full left-0 mt-0.5 w-32 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 shadow-md flex flex-col py-0.5 text-black font-normal text-xs z-50">
              <button
                onClick={() => { setShowAbout(true); setOpenMenu(null); }}
                className="px-4 py-1 text-left hover:bg-[#000080] hover:text-white w-full cursor-pointer"
              >
                关于画图(A)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Target Word & Time Indicator */}
      <div className="flex items-center justify-between p-1.5 bg-[#c0c0c0] border-b border-gray-400 select-none">
        <div className="flex items-center gap-1.5 bg-[#c0c0c0] border-2 border-t-gray-800 border-l-gray-800 border-b-white border-r-white px-2 py-0.5 font-bold text-xs text-black shadow-[inset_1px_1px_1px_rgba(0,0,0,0.1)]">
          <span>目标画作:</span>
          <span className="text-blue-800 underline uppercase pr-1 font-extrabold">{targetWord}</span>
        </div>
        <div className="flex items-center gap-1.5 bg-[#c0c0c0] border-2 border-t-gray-800 border-l-gray-800 border-b-white border-r-white px-2 py-0.5 font-bold text-xs shadow-[inset_1px_1px_1px_rgba(0,0,0,0.1)]">
          <span className="text-black">倒计时:</span>
          <span className={timeLeft <= 10 && timeLeft !== 999999 ? "text-red-600 animate-pulse font-extrabold" : "text-black font-extrabold"}>
            {timeLeft === 999999 ? "无限制" : `${timeLeft} 秒`}
          </span>
        </div>
      </div>

      {/* Middle Workspace */}
      <div className="flex-1 flex min-h-0 relative select-none">
        {/* Expanded Vertical Sidebar on Left */}
        <div className="w-[120px] bg-[#c0c0c0] border-r border-gray-400 flex flex-col items-center p-2 select-none flex-shrink-0 gap-2">
          {/* Tools Grid */}
          <div className="grid grid-cols-2 gap-1.5 w-[56px] justify-center flex-shrink-0">
            {tools.map((t) => {
              const isSel = activeTool === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setActiveTool(t.id);
                    setStatusText(t.desc);
                  }}
                  className={`w-6 h-6 border-2 flex items-center justify-center cursor-pointer ${
                    isSel
                      ? "border-t-gray-800 border-l-gray-800 border-b-white border-r-white bg-gray-300 shadow-[inset_1px_1px_1px_rgba(0,0,0,0.15)]"
                      : "border-t-white border-l-white border-b-gray-800 border-r-gray-800 bg-[#c0c0c0] active:border-t-gray-800 active:border-l-gray-800 active:border-b-white active:border-r-white"
                  }`}
                  title={t.name}
                >
                  <Icon icon={t.icon} className="w-4 h-4 text-black" />
                </button>
              );
            })}
            {/* Clear Tool as Trash Can */}
            <button
              onClick={handleClear}
              className="w-6 h-6 border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 bg-[#c0c0c0] active:border-t-gray-800 active:border-l-gray-800 active:border-b-white active:border-r-white flex items-center justify-center cursor-pointer"
              title="清空画布"
            >
              <Icon icon="streamline-pixel:interface-essential-bin" className="w-4 h-4 text-black" />
            </button>
            {/* Undo Tool */}
            <button
              onClick={handleUndo}
              disabled={!canUndo}
              className={`w-6 h-6 border-2 flex items-center justify-center ${
                !canUndo
                  ? "border-t-white border-l-white border-b-gray-800 border-r-gray-800 bg-[#c0c0c0] opacity-40 cursor-not-allowed text-gray-500"
                  : "border-t-white border-l-white border-b-gray-800 border-r-gray-800 bg-[#c0c0c0] active:border-t-gray-800 active:border-l-gray-800 active:border-b-white active:border-r-white cursor-pointer text-black"
              }`}
              title="撤销 (Ctrl+Z)"
            >
              <Icon icon="material-symbols:undo" className="w-4 h-4" />
            </button>
            {/* Redo Tool */}
            <button
              onClick={handleRedo}
              disabled={!canRedo}
              className={`w-6 h-6 border-2 flex items-center justify-center ${
                !canRedo
                  ? "border-t-white border-l-white border-b-gray-800 border-r-gray-800 bg-[#c0c0c0] opacity-40 cursor-not-allowed text-gray-500"
                  : "border-t-white border-l-white border-b-gray-800 border-r-gray-800 bg-[#c0c0c0] active:border-t-gray-800 active:border-l-gray-800 active:border-b-white active:border-r-white cursor-pointer text-black"
              }`}
              title="恢复 (Ctrl+Y)"
            >
              <Icon icon="material-symbols:redo" className="w-4 h-4" />
            </button>
          </div>

          <div className="w-full border-b border-t border-t-gray-800 border-b-white my-1 flex-shrink-0" />

          {/* Properties Area */}
          <div className="w-full flex-grow flex flex-col text-[10px] text-black select-none">
            {toolConfig[activeTool] ? (
              <div className="flex flex-col gap-3">
                {/* Size Controls */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center font-bold">
                    <span>{toolConfig[activeTool].label}:</span>
                    <span className="font-mono bg-white border border-t-gray-800 border-l-gray-800 border-b-white border-r-white px-1 shadow-[inset_1px_1px_1px_rgba(0,0,0,0.1)] text-[9px]">
                      {sizes[activeTool]}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min={toolConfig[activeTool].minSize}
                    max={toolConfig[activeTool].maxSize}
                    value={sizes[activeTool]}
                    onChange={(e) => setSizeForActiveTool(Number(e.target.value))}
                    className="win95-slider"
                  />
                </div>

                {/* Opacity Controls */}
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center font-bold">
                    <span>透明度:</span>
                    <span className="font-mono bg-white border border-t-gray-800 border-l-gray-800 border-b-white border-r-white px-1 shadow-[inset_1px_1px_1px_rgba(0,0,0,0.1)] text-[9px]">
                      {opacities[activeTool]}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={opacities[activeTool]}
                    onChange={(e) => setOpacityForActiveTool(Number(e.target.value))}
                    className="win95-slider"
                  />
                </div>

                {/* Dynamic Preview */}
                <div className="flex flex-col items-center gap-1 mt-1">
                  <span className="font-bold self-start">笔触预览:</span>
                  <div className="w-12 h-12 bg-white border border-t-gray-800 border-l-gray-800 border-b-white border-r-white flex items-center justify-center shadow-[inset_1px_1px_1px_rgba(0,0,0,0.15)] relative overflow-hidden">
                    {activeTool === "spray" ? (
                      <div
                        className="relative rounded-full border border-dashed border-gray-300 flex items-center justify-center"
                        style={{
                          width: `${Math.min(42, sizes[activeTool] * 2)}px`,
                          height: `${Math.min(42, sizes[activeTool] * 2)}px`,
                        }}
                      >
                        {[...Array(8)].map((_, i) => {
                          const angle = (i * Math.PI * 2) / 8;
                          const dist = 0.3;
                          const x = 50 + Math.cos(angle) * dist * 100;
                          const y = 50 + Math.sin(angle) * dist * 100;
                          return (
                            <div
                              key={i}
                              className="absolute w-1 h-1 rounded-full"
                              style={{
                                left: `${x}%`,
                                top: `${y}%`,
                                transform: "translate(-50%, -50%)",
                                backgroundColor: color,
                                opacity: opacities[activeTool] / 100,
                              }}
                            />
                          );
                        })}
                      </div>
                    ) : (
                      <div
                        className="rounded-full flex-shrink-0"
                        style={{
                          width: `${Math.min(42, sizes[activeTool])}px`,
                          height: `${Math.min(42, sizes[activeTool])}px`,
                          backgroundColor: activeTool === "eraser" ? "#000000" : color,
                          border: activeTool === "eraser" ? "1px dashed #cccccc" : "none",
                          opacity: opacities[activeTool] / 100,
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-gray-600 italic text-center py-4 px-1 border border-t-gray-800 border-l-gray-800 border-b-white border-r-white bg-gray-100 shadow-[inset_1px_1px_rgba(0,0,0,0.1)] w-full flex-1 flex flex-col justify-center gap-1">
                {activeTool === "bucket" ? (
                  <>
                    <Icon icon="streamline-pixel:design-color-bucket-brush" className="w-6 h-6 mx-auto text-black" />
                    <span className="font-bold text-[10px] text-black">油漆桶</span>
                    <p className="text-[8px] text-gray-500 font-normal">填充连通区域</p>
                  </>
                ) : (
                  <>
                    <Icon icon="streamline-pixel:design-dropper-2" className="w-6 h-6 mx-auto text-black" />
                    <span className="font-bold text-[10px] text-black">吸管工具</span>
                    <p className="text-[8px] text-gray-500 font-normal">点击或拖动以吸色</p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Gray Workspace with Center Inset Canvas (Double Canvas Stack) */}
        <div className="flex-grow bg-[#808080] p-2 flex items-center justify-center min-h-0 relative select-none ml-1 mr-2 my-1.5 border border-t-gray-800 border-l-gray-800 border-b-white border-r-white shadow-[inset_1px_1px_1px_rgba(0,0,0,0.15)] overflow-hidden">
          <div className="border border-t-gray-800 border-l-gray-800 border-b-white border-r-white bg-white p-[1px] flex-shrink-0 shadow-[inset_1px_1px_1px_rgba(0,0,0,0.3)] w-full max-w-[482px] relative" style={{ aspectRatio: "480/320" }}>
            <canvas
              ref={canvasRef}
              width={480}
              height={320}
              className="absolute top-0 left-0 w-full h-full block bg-white"
            />
            <canvas
              ref={tempCanvasRef}
              width={480}
              height={320}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="absolute top-0 left-0 w-full h-full block bg-transparent cursor-crosshair"
              style={{
                width: "100%",
                height: "100%",
                touchAction: "none",
                opacity: (opacities[activeTool] ?? 100) / 100
              }}
            />
          </div>
        </div>
      </div>

      {/* Palette and Submit Bar */}
      <div className="bg-[#c0c0c0] border-t border-gray-400 p-2 flex items-center justify-between gap-4 select-none flex-shrink-0">
        <div className="flex items-center gap-3">
          {/* Overlapping Current Color Indicator */}
          <div className="w-[30px] h-[30px] bg-white border-2 border-t-gray-800 border-l-gray-800 border-b-white border-r-white relative flex-shrink-0 shadow-[inset_1px_1px_1px_rgba(0,0,0,0.2)]">
            <div
              className="absolute top-1 left-1 w-3.5 h-3.5 border border-black z-10"
              style={{ backgroundColor: color }}
            />
            <div className="absolute bottom-1 right-1 w-3.5 h-3.5 border border-black bg-white" />
          </div>

          {/* Color Blocks grid */}
          <div className="flex flex-col gap-[2px]">
            {/* Top row */}
            <div className="flex gap-[2px]">
              {activeColors.slice(0, 14).map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className="w-3.5 h-3.5 border border-gray-500 cursor-pointer active:border-black animate-none"
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
            {/* Bottom row */}
            <div className="flex gap-[2px]">
              {activeColors.slice(14, 28).map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className="w-3.5 h-3.5 border border-gray-500 cursor-pointer active:border-black animate-none"
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Beveled Submit Button */}
        <button
          onClick={handleSubmit}
          className="px-5 py-1.5 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 active:border-t-gray-800 active:border-l-gray-800 active:border-b-white active:border-r-white font-bold text-black text-xs cursor-pointer flex items-center gap-1.5 shadow-sm"
        >
          <Icon icon="dinkie-icons:checkmark-circled" className="w-3.5 h-3.5 text-black" />
          <span>提交画作</span>
        </button>
      </div>

      {/* Footer Status Bar */}
      <div className="bg-[#c0c0c0] border-t border-white px-2 py-0.5 text-[10px] text-black font-bold flex items-center justify-between select-none flex-shrink-0 h-5">
        <span className="truncate">{statusText}</span>
        <span>480 x 320 像素</span>
      </div>

      {/* About Paint dialog modal */}
      {showAbout && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999] p-4 select-none">
          <div className="w-[300px] bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 p-1 font-bold text-xs text-black shadow-lg animate-none">
            {/* Title Bar */}
            <div className="bg-[#000080] text-white px-2 py-0.5 flex justify-between items-center">
              <span>关于 傲慢的评论家.exe</span>
              <button
                onClick={() => setShowAbout(false)}
                className="w-4 h-4 bg-[#c0c0c0] border border-t-white border-l-white border-b-gray-800 border-r-gray-800 active:border-t-gray-800 active:border-l-gray-800 active:border-b-white active:border-r-white flex items-center justify-center cursor-pointer text-black font-extrabold text-[8px]"
              >
                ✕
              </button>
            </div>
            {/* Content */}
            <div className="p-4 flex flex-col items-center gap-3">
              <Icon icon="pixelarticons:paint-bucket" className="w-12 h-12 text-blue-800" />
              <div className="text-center font-bold">
                <p className="text-sm text-blue-900">傲慢的评论家 v95.0.0</p>
                <p className="text-[10px] text-gray-700 mt-2 leading-relaxed">
                  本系统专门用于强行鉴赏你漏洞百出的艺术大作。
                </p>
                <p className="text-[10px] text-red-700 mt-1 font-extrabold animate-pulse">
                  【警告：AI辣评极为毒舌，玻璃心艺术家请速速撤离！】
                </p>
                <p className="text-[9px] text-gray-500 mt-3 font-normal">
                  版权所有 (C) 1995-2026 傲慢艺术审判局
                </p>
              </div>
              <button
                onClick={() => setShowAbout(false)}
                className="px-6 py-1 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 active:border-t-gray-800 active:border-l-gray-800 active:border-b-white active:border-r-white font-bold cursor-pointer mt-2"
              >
                好的，本大画家知道了
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
