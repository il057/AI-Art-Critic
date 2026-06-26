import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";

interface AlertDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  type?: "info" | "warning" | "error";
  onClose: () => void;
}

export function AlertDialog({ isOpen, title, message, type = "info", onClose }: AlertDialogProps) {
  if (!isOpen) return null;

  let iconName = "dinkie-icons:info-circle";
  let iconColor = "text-[#000080]"; // Navy
  if (type === "warning") {
    iconName = "dinkie-icons:warning-triangle";
    iconColor = "text-yellow-600";
  } else if (type === "error") {
    iconName = "dinkie-icons:cat-face-small";
    iconColor = "text-red-600";
  }

  return (
    <div className="fixed inset-0 bg-black/30 z-[1000001] flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-md bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 shadow-lg flex flex-col overflow-hidden">
        {/* Title Bar */}
        <div className="bg-gradient-to-r from-[#000080] to-[#1084d0] text-white px-2 py-1 flex items-center justify-between">
          <span className="font-bold text-xs truncate pr-4">{title}</span>
          <button
            onClick={onClose}
            className="w-4 h-4 bg-[#c0c0c0] border border-t-white border-l-white border-b-gray-800 border-r-gray-800 flex items-center justify-center text-black font-bold text-[10px] active:border-t-gray-800 active:border-l-gray-800 active:border-b-white active:border-r-white cursor-pointer"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex gap-4 items-start flex-1">
          <div className={`w-8 h-8 flex-shrink-0 flex items-center justify-center ${iconColor}`}>
            <Icon icon={iconName} className="w-8 h-8" />
          </div>
          <div className="flex-1 text-xs text-black font-bold whitespace-pre-wrap leading-relaxed pr-2">
            {message}
          </div>
        </div>

        {/* Action Button */}
        <div className="px-4 pb-4 flex justify-center">
          <button
            onClick={onClose}
            className="px-6 py-1 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 active:border-t-gray-800 active:border-l-gray-800 active:border-b-white active:border-r-white font-bold text-black text-xs cursor-pointer min-w-[75px]"
          >
            确定
          </button>
        </div>
      </div>
    </div>
  );
}

interface LightboxProps {
  isOpen: boolean;
  image: string;
  title: string;
  onClose: () => void;
}

export function Lightbox({ isOpen, image, title, onClose }: LightboxProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 z-[999999] flex items-center justify-center p-4 select-none"
      onClick={onClose}
    >
      <div
        className="bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 shadow-2xl flex flex-col max-w-[90vw] max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title Bar */}
        <div className="bg-gradient-to-r from-[#000080] to-[#1084d0] text-white px-2 py-1 flex items-center justify-between">
          <span className="font-bold text-xs truncate pr-4">{title} - 大图预览</span>
          <button
            onClick={onClose}
            className="w-4 h-4 bg-[#c0c0c0] border border-t-white border-l-white border-b-gray-800 border-r-gray-800 flex items-center justify-center text-black font-bold text-[10px] active:border-t-gray-800 active:border-l-gray-800 active:border-b-white active:border-r-white cursor-pointer"
          >
            ×
          </button>
        </div>

        {/* Image Content */}
        <div className="p-2 flex-1 overflow-auto flex items-center justify-center bg-gray-600">
          <div className="border-2 border-t-gray-800 border-l-gray-800 border-b-white border-r-white bg-white p-1">
            <img
              src={image}
              alt={title}
              className="max-w-[80vw] max-h-[70vh] object-contain select-text"
            />
          </div>
        </div>

        {/* Status Bar */}
        <div className="h-6 bg-[#c0c0c0] border-t border-white px-2 flex items-center justify-between text-[10px] text-black font-bold">
          <span>单击背景或右上角关闭</span>
          <span>100% 像素比例</span>
        </div>
      </div>
    </div>
  );
}

interface PromptDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  placeholder?: string;
  defaultValue?: string;
  onConfirm: (val: string) => void;
  onClose: () => void;
  loading?: boolean;
}

export function PromptDialog({
  isOpen,
  title,
  message,
  placeholder = "",
  defaultValue = "",
  onConfirm,
  onClose,
  loading = false
}: PromptDialogProps) {
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    if (isOpen) {
      setInputValue(defaultValue);
    }
  }, [isOpen, defaultValue]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 z-[999999] flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-sm bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 shadow-lg flex flex-col overflow-hidden">
        {/* Title Bar */}
        <div className="bg-gradient-to-r from-[#000080] to-[#1084d0] text-white px-2 py-1 flex items-center justify-between">
          <span className="font-bold text-xs truncate pr-4">{title}</span>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-4 h-4 bg-[#c0c0c0] border border-t-white border-l-white border-b-gray-800 border-r-gray-800 flex items-center justify-center text-black font-bold text-[10px] active:border-t-gray-800 active:border-l-gray-800 active:border-b-white active:border-r-white cursor-pointer disabled:cursor-not-allowed"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col gap-3">
          <div className="text-xs text-black font-bold whitespace-pre-wrap leading-relaxed">
            {message}
          </div>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={placeholder}
            disabled={loading}
            className="w-full px-2 py-1 bg-white border-2 border-t-gray-800 border-l-gray-800 border-b-white border-r-white text-black outline-none text-xs disabled:bg-gray-100"
          />
        </div>

        {/* Actions */}
        <div className="px-4 pb-4 flex justify-end gap-2">
          <button
            onClick={() => onConfirm(inputValue)}
            disabled={loading || !inputValue.trim()}
            className="px-4 py-1 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 active:border-t-gray-800 active:border-l-gray-800 active:border-b-white active:border-r-white font-bold text-black text-xs cursor-pointer min-w-[70px] disabled:cursor-not-allowed disabled:text-gray-500"
          >
            {loading ? "处理中..." : "确定"}
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-1 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 active:border-t-gray-800 active:border-l-gray-800 active:border-b-white active:border-r-white font-bold text-black text-xs cursor-pointer min-w-[70px] disabled:cursor-not-allowed"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
}

interface ChoiceDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ChoiceDialog({
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel
}: ChoiceDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/30 z-[999999] flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-sm bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 shadow-lg flex flex-col overflow-hidden">
        {/* Title Bar */}
        <div className="bg-gradient-to-r from-[#000080] to-[#1084d0] text-white px-2 py-1 flex items-center justify-between">
          <span className="font-bold text-xs truncate pr-4">{title}</span>
        </div>

        {/* Content */}
        <div className="p-4 flex gap-4 items-start">
          <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center text-yellow-600">
            <Icon icon="dinkie-icons:warning-triangle" className="w-8 h-8" />
          </div>
          <div className="flex-1 text-xs text-black font-bold whitespace-pre-wrap leading-relaxed pr-2">
            {message}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-4 pb-4 flex justify-end gap-2">
          <button
            onClick={onConfirm}
            className="px-4 py-1 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 active:border-t-gray-800 active:border-l-gray-800 active:border-b-white active:border-r-white font-bold text-black text-xs cursor-pointer min-w-[75px]"
          >
            {confirmText}
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-1 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 active:border-t-gray-800 active:border-l-gray-800 active:border-b-white active:border-r-white font-bold text-black text-xs cursor-pointer min-w-[75px]"
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
}

interface EditWordBankDialogProps {
  isOpen: boolean;
  theme: string;
  words: string[];
  onClose: () => void;
  onSave: (words: string[]) => void;
}

export function EditWordBankDialog({
  isOpen,
  theme,
  words,
  onClose,
  onSave
}: EditWordBankDialogProps) {
  const [localWords, setLocalWords] = useState<string[]>([]);
  const [newWord, setNewWord] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Populate local words when dialog opens
  useEffect(() => {
    if (isOpen) {
      setLocalWords([...words]);
      setNewWord("");
      setErrorMsg("");
    }
  }, [isOpen, words]);

  if (!isOpen) return null;

  const handleDeleteWord = (index: number) => {
    setLocalWords(prev => prev.filter((_, i) => i !== index));
    setErrorMsg("");
  };

  const handleAddWord = () => {
    const trimmed = newWord.trim();
    if (!trimmed) return;
    if (localWords.includes(trimmed)) {
      setErrorMsg("该词语已存在于词库中！");
      return;
    }
    setLocalWords(prev => [...prev, trimmed]);
    setNewWord("");
    setErrorMsg("");
  };

  return (
    <div className="fixed inset-0 bg-black/30 z-[999999] flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-sm bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 shadow-lg flex flex-col max-h-[80vh] overflow-hidden">
        {/* Title Bar */}
        <div className="bg-gradient-to-r from-[#000080] to-[#1084d0] text-white px-2 py-1 flex items-center justify-between flex-shrink-0">
          <span className="font-bold text-xs truncate pr-4">编辑词库 - {theme}</span>
          <button
            onClick={onClose}
            className="w-4 h-4 bg-[#c0c0c0] border border-t-white border-l-white border-b-gray-800 border-r-gray-800 flex items-center justify-center text-black font-bold text-[10px] active:border-t-gray-800 active:border-l-gray-800 active:border-b-white active:border-r-white cursor-pointer"
          >
            ×
          </button>
        </div>

        {/* Word input box */}
        <div className="p-3 border-b border-gray-400 bg-gray-100 flex flex-col gap-1.5 flex-shrink-0">
          <div className="flex gap-2 items-center">
            <input
              type="text"
              value={newWord}
              onChange={(e) => {
                setNewWord(e.target.value);
                setErrorMsg("");
              }}
              onKeyDown={(e) => { if (e.key === "Enter") handleAddWord(); }}
              placeholder="输入新词语..."
              className="flex-grow px-2 py-1 bg-white border-2 border-t-gray-800 border-l-gray-800 border-b-white border-r-white text-black outline-none text-xs"
            />
            <button
              onClick={handleAddWord}
              className="px-3 py-1 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 active:border-t-gray-800 active:border-l-gray-800 active:border-b-white active:border-r-white font-bold text-black text-xs cursor-pointer flex-shrink-0"
            >
              添加
            </button>
          </div>
          {errorMsg && (
            <span className="text-red-700 font-bold text-[10px]">{errorMsg}</span>
          )}
        </div>

        {/* Words list */}
        <div className="p-3 overflow-y-auto flex-grow bg-white border-2 border-t-gray-800 border-l-gray-800 border-b-white border-r-white m-3 max-h-[300px]">
          {localWords.length === 0 ? (
            <p className="text-gray-500 text-xs italic text-center py-4">词库为空，请添加词语</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {localWords.map((word, index) => (
                <div
                  key={index}
                  className="bg-[#c0c0c0] border border-t-white border-l-white border-b-gray-800 border-r-gray-800 px-2 py-1 text-xs text-black font-bold flex items-center gap-1.5"
                >
                  <span>{word}</span>
                  <button
                    onClick={() => handleDeleteWord(index)}
                    className="text-red-700 font-extrabold hover:text-red-900 cursor-pointer text-[10px]"
                    title="删除此词"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="px-4 pb-4 flex justify-end gap-2 flex-shrink-0">
          <button
            onClick={() => onSave(localWords)}
            className="px-4 py-1 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 active:border-t-gray-800 active:border-l-gray-800 active:border-b-white active:border-r-white font-bold text-black text-xs cursor-pointer min-w-[75px]"
          >
            保存
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 active:border-t-gray-800 active:border-l-gray-800 active:border-b-white active:border-r-white font-bold text-black text-xs cursor-pointer min-w-[75px]"
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
}
