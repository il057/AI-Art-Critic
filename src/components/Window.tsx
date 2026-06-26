import React, { useRef, useState, useEffect } from "react";
import { Icon } from "@iconify/react";

interface WindowProps {
  key?: string;
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
  isActive: boolean;
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  onFocus: () => void;
  onDrag: (x: number, y: number) => void;
  children: React.ReactNode;
}

export function Window({
  id,
  title,
  icon,
  isOpen,
  isMinimized,
  isMaximized,
  zIndex,
  x,
  y,
  width,
  height,
  isActive,
  onClose,
  onMinimize,
  onMaximize,
  onFocus,
  onDrag,
  children,
}: WindowProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click drag
    onFocus();
    if (isMaximized) return;

    setIsDragging(true);
    setDragOffset({
      x: e.clientX - x,
      y: e.clientY - y,
    });
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    onFocus();
    if (isMaximized) return;

    const touch = e.touches[0];
    setIsDragging(true);
    setDragOffset({
      x: touch.clientX - x,
      y: touch.clientY - y,
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      onDrag(newX, newY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      const touch = e.touches[0];
      const newX = touch.clientX - dragOffset.x;
      const newY = touch.clientY - dragOffset.y;
      onDrag(newX, newY);
    };

    const handleDragEnd = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleDragEnd);
      window.addEventListener("touchmove", handleTouchMove, { passive: true });
      window.addEventListener("touchend", handleDragEnd);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleDragEnd);
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleDragEnd);
    };
  }, [isDragging, dragOffset, onDrag]);

  // Hook-friendly early return (must be placed after all hooks: useState and useEffect)
  if (!isOpen || isMinimized) return null;

  const winWidth = typeof width === "number" ? Math.min(width, window.innerWidth - 8) : 320;
  const winHeight = typeof height === "number" ? Math.min(height, window.innerHeight - 40) : 320;

  const style: React.CSSProperties = isMaximized
    ? {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0, // sit flush against the taskbar at the bottom of desktop
        zIndex,
      }
    : {
        position: "absolute",
        left: `${Math.max(4, Math.min(window.innerWidth - winWidth - 4, x))}px`,
        top: `${Math.max(4, Math.min(window.innerHeight - winHeight - 36, y))}px`,
        width: `${winWidth}px`,
        height: `${winHeight}px`,
        zIndex,
      };

  return (
    <div
      style={style}
      className="bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 shadow-md flex flex-col select-none overflow-hidden"
      onMouseDown={onFocus}
      onTouchStart={onFocus}
    >
      {/* Title Bar */}
      <div
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onDoubleClick={onMaximize}
        className={`px-2 py-1 flex items-center justify-between cursor-default ${
          isActive ? "bg-gradient-to-r from-[#000080] to-[#1084d0] text-white" : "bg-gradient-to-r from-[#808080] to-[#b0b0b0] text-[#c0c0c0]"
        }`}
      >
        <div className="flex items-center gap-2 font-bold text-sm truncate pr-4">
          <Icon icon={icon} className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">{title}</span>
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMinimize();
            }}
            className="w-4 h-4 bg-[#c0c0c0] border border-t-white border-l-white border-b-gray-800 border-r-gray-800 flex items-center justify-center text-black font-bold text-[10px] active:border-t-gray-800 active:border-l-gray-800 active:border-b-white active:border-r-white cursor-pointer"
          >
            _
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMaximize();
            }}
            className="w-4 h-4 bg-[#c0c0c0] border border-t-white border-l-white border-b-gray-800 border-r-gray-800 flex items-center justify-center text-black font-bold text-[10px] active:border-t-gray-800 active:border-l-gray-800 active:border-b-white active:border-r-white cursor-pointer"
          >
            □
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="w-4 h-4 bg-[#c0c0c0] border border-t-white border-l-white border-b-gray-800 border-r-gray-800 flex items-center justify-center text-black font-bold text-[10px] active:border-t-gray-800 active:border-l-gray-800 active:border-b-white active:border-r-white cursor-pointer"
          >
            ×
          </button>
        </div>
      </div>
      {/* Window Content */}
      <div className="flex-1 flex flex-col min-h-0 bg-[#c0c0c0] relative p-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}
