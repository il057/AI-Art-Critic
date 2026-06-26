import { useState, useEffect, useRef } from "react";

interface DropdownProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export function Dropdown({ options, value, onChange, className = "" }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div ref={dropdownRef} className={`relative flex flex-col select-none ${className}`}>
      {/* Current Selection Box */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center bg-white border-2 border-t-gray-800 border-l-gray-800 border-b-white border-r-white text-black h-6 cursor-pointer"
      >
        <span className={`flex-grow px-2 py-0.5 truncate text-[11px] font-bold ${
          value.startsWith("✨") ? "text-indigo-800" : "text-black"
        }`}>
          {value}
        </span>
        {/* Dropdown Button */}
        <button
          type="button"
          className="w-5 h-5 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 active:border-t-gray-800 active:border-l-gray-800 active:border-b-white active:border-r-white flex items-center justify-center flex-shrink-0 cursor-pointer"
        >
          <span className="text-[8px] text-black font-bold transform scale-y-[0.7]">▼</span>
        </button>
      </div>

      {/* Options List */}
      {isOpen && (
        <div className="absolute top-[22px] left-0 right-0 max-h-40 overflow-y-auto bg-white border-2 border-gray-800 z-[99999] shadow-md">
          {options.map((option) => {
            const isAction = option.includes("...") || option.startsWith("[");
            const isCustom = option.startsWith("✨");
            
            let styleClass = "";
            if (value === option) {
              styleClass = "bg-[#000080] text-white";
            } else if (isAction) {
              styleClass = "text-gray-500 hover:bg-[#000080] hover:text-white italic font-medium";
            } else if (isCustom) {
              styleClass = "text-indigo-800 hover:bg-[#000080] hover:text-white font-bold";
            } else {
              styleClass = "text-black hover:bg-[#000080] hover:text-white";
            }

            return (
              <div
                key={option}
                onClick={() => {
                  onChange(option);
                  setIsOpen(false);
                }}
                className={`px-2 py-1 text-[11px] font-bold cursor-pointer truncate ${styleClass}`}
              >
                {option}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
