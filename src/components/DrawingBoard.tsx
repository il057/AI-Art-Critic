import React, { useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";

interface DrawingBoardProps {
  targetWord: string;
  timeLeft: number;
  onSubmit: (base64Image: string) => void;
  onTimeout?: (base64Image: string) => void;
}

export function DrawingBoard({ targetWord, timeLeft, onSubmit, onTimeout }: DrawingBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPos, setLastPos] = useState<{ x: number; y: number } | null>(null);
  const [color, setColor] = useState("#000000");
  const [activeTool, setActiveTool] = useState("pencil");
  const [statusText, setStatusText] = useState("");

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

  // Keyboard shortcut listener for Ctrl+Z / Ctrl+Y
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
    const radius = 10;
    const density = 15;
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

    setIsDrawing(true);
    setLastPos(coords);

    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    if (activeTool === "spray") {
      paintSpray(ctx, coords.x, coords.y);
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (e.cancelable) {
      e.preventDefault();
    }
    if (!isDrawing || !lastPos) return;
    const coords = getCoordinates(e);
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;

    if (activeTool === "pencil") {
      ctx.beginPath();
      ctx.moveTo(lastPos.x, lastPos.y);
      ctx.lineTo(coords.x, coords.y);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
      setLastPos(coords);
    } else if (activeTool === "brush") {
      ctx.beginPath();
      ctx.moveTo(lastPos.x, lastPos.y);
      ctx.lineTo(coords.x, coords.y);
      ctx.strokeStyle = color;
      ctx.lineWidth = 8;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
      setLastPos(coords);
    } else if (activeTool === "eraser") {
      ctx.beginPath();
      ctx.moveTo(lastPos.x, lastPos.y);
      ctx.lineTo(coords.x, coords.y);
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 20;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();
      setLastPos(coords);
    } else if (activeTool === "spray") {
      paintSpray(ctx, coords.x, coords.y);
      setLastPos(coords);
    }
  };

  const stopDrawing = () => {
    if (isDrawing) {
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
    { id: "pencil", name: "铅笔", icon: "streamline-pixel:interface-essential-pencil-edit-2", desc: "铅笔工具 - 绘制细线。" },
    { id: "brush", name: "刷子", icon: "streamline-pixel:design-color-brush-paint", desc: "刷子工具 - 绘制粗线。" },
    { id: "eraser", name: "橡皮", icon: "streamline-pixel:interface-essential-eraser", desc: "橡皮擦 - 擦除图画为白色。" },
    { id: "bucket", name: "油漆桶", icon: "streamline-pixel:design-color-bucket-brush", desc: "油漆桶 - 用当前选择的颜色填充连通区域。" },
    { id: "spray", name: "喷壶", icon: "streamline-pixel:design-color-spray", desc: "喷壶工具 - 喷洒散沙点。" }
  ];

  const colors = [
    // Row 1 (14 colors)
    "#000000", "#808080", "#800000", "#808000", "#008000", "#008080", "#000080", "#800080", "#808040", "#004040", "#0080ff", "#004080", "#4000ff", "#804000",
    // Row 2 (14 colors)
    "#ffffff", "#c0c0c0", "#ff0000", "#ffff00", "#00ff00", "#00ffff", "#0000ff", "#ff00ff", "#ffff80", "#00ff80", "#80ffff", "#8080ff", "#ff8000", "#ff80ff"
  ];

  return (
    <div className="flex-grow flex flex-col min-h-0 bg-[#c0c0c0] justify-between">
      {/* Mock Menu Bar */}
      <div className="flex gap-4 px-2 py-0.5 border-b border-gray-400 text-xs text-black font-bold cursor-default select-none">
        <span>文件(F)</span>
        <span>编辑(E)</span>
        <span>查看(V)</span>
        <span>图像(I)</span>
        <span>颜色(C)</span>
        <span>帮助(H)</span>
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
        {/* Vertical Toolbox on Left */}
        <div className="w-[56px] bg-[#c0c0c0] border-r border-gray-400 flex flex-col items-center p-1.5 select-none flex-shrink-0">
          <div className="grid grid-cols-2 gap-1.5 w-full">
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
        </div>

        {/* Gray Workspace with Center Inset Canvas */}
        <div className="flex-grow bg-[#808080] p-2 sm:p-4 flex items-center justify-center min-h-0 relative select-none ml-1 mr-2 my-1.5 border-2 border-t-gray-800 border-l-gray-800 border-b-white border-r-white shadow-[inset_1px_1px_1px_rgba(0,0,0,0.15)] overflow-hidden">
          <div className="border-2 border-t-gray-800 border-l-gray-800 border-b-white border-r-white bg-white p-[1px] flex-shrink-0 shadow-[inset_1px_1px_1px_rgba(0,0,0,0.3)] w-full max-w-[484px]">
            <canvas
              ref={canvasRef}
              width={480}
              height={320}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="block cursor-crosshair bg-white"
              style={{ width: "100%", maxWidth: "480px", height: "auto", aspectRatio: "480/320", touchAction: "none" }}
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
              {colors.slice(0, 14).map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className="w-3.5 h-3.5 border border-gray-500 cursor-pointer active:border-black"
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
            </div>
            {/* Bottom row */}
            <div className="flex gap-[2px]">
              {colors.slice(14, 28).map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className="w-3.5 h-3.5 border border-gray-500 cursor-pointer active:border-black"
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
    </div>
  );
}
