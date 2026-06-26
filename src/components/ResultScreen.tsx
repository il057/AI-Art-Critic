import { useState } from "react";
import { Icon } from "@iconify/react";
import { saveToGallery } from "../utils/storage";
import { Lightbox } from "./Modal";

interface ResultScreenProps {
  result: {
    guess: string;
    score: number;
    critique: string;
  };
  targetWord: string;
  image: string;
  onPlayAgain: () => void;
  onRetry?: () => void;
  showAlert: (message: string, title?: string, type?: "info" | "warning" | "error") => void;
  showToast?: (message: string, type?: "success" | "info" | "error") => void;
  isSaved: boolean;
  onSaveSuccess: () => void;
}

export function ResultScreen({ result, targetWord, image, onPlayAgain, onRetry, showAlert, showToast, isSaved, onSaveSuccess }: ResultScreenProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const handleSave = async () => {
    if (isSaved) return;
    try {
      await saveToGallery({
        image,
        targetWord,
        guess: result.guess,
        score: result.score,
        critique: result.critique,
      });
      onSaveSuccess();
      showToast
        ? showToast("画作已保存至画廊！", "success")
        : showAlert("画作已成功保存至画廊！您可以双击桌面上的「画廊陈列室.exe」查看。", "保存成功", "info");
    } catch (err) {
      console.error(err);
      showAlert("保存至画室失败！", "错误", "error");
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-500";
    if (score >= 50) return "text-amber-500";
    return "text-red-500";
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) {
      return <Icon icon="streamline-pixel:interface-essential-trophy" className="w-12 h-12 text-emerald-500" />;
    }
    if (score >= 50) {
      return <Icon icon="streamline-pixel:social-rewards-rating-star-2" className="w-12 h-12 text-amber-500" />;
    }
    return <Icon icon="streamline-pixel:interface-essential-alert-circle-2" className="w-12 h-12 text-red-500" />;
  };

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="p-4 text-center bg-[#c0c0c0] border-2 border-t-gray-800 border-l-gray-800 border-b-white border-r-white">
        <h2 className="text-sm font-bold text-black mb-2">评分结果</h2>
        <div className="flex justify-center mb-2">
          {getScoreIcon(result.score)}
        </div>
        <div className="flex items-end justify-center gap-1 mb-2">
          <span className={`text-4xl font-bold ${getScoreColor(result.score)}`}>
            {result.score}
          </span>
          <span className="text-xl font-bold text-gray-600 mb-1">/100</span>
        </div>
        <p className="text-sm font-bold text-black">
          目标: {targetWord}
        </p>
      </div>

      <div className="flex flex-row gap-4">
        <div className="flex-1 space-y-4">
          <div className="bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 p-2">
            <h3 className="text-xs font-bold text-black mb-1 bg-[#000080] text-white px-1">AI 猜测</h3>
            <p className="text-sm text-black bg-white border-2 border-t-gray-800 border-l-gray-800 border-b-white border-r-white p-2 min-h-[60px]">
              "{result.guess}"
            </p>
          </div>
          <div className="bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 p-2">
            <h3 className="text-xs font-bold text-black mb-1 bg-[#000080] text-white px-1">专家点评</h3>
            <p className="text-sm text-black bg-white border-2 border-t-gray-800 border-l-gray-800 border-b-white border-r-white p-2 min-h-[60px]">
              "{result.critique}"
            </p>
          </div>
        </div>
        
        <div 
          onClick={() => setLightboxOpen(true)}
          className="w-48 h-48 border-2 border-t-gray-800 border-l-gray-800 border-b-white border-r-white bg-white flex-shrink-0 cursor-pointer overflow-hidden group relative flex items-center justify-center p-1"
          title="点击查看大图"
        >
          <img 
            src={image} 
            alt="你的画作" 
            className="max-w-full max-h-full object-contain transition-transform group-hover:scale-105" 
          />
        </div>
      </div>

      <div className="flex justify-end mt-4 gap-2">
        {result.guess === "分析失败" || result.guess === "配置缺失" || result.score === 0 ? (
          <button
            onClick={onRetry}
            className="w-full sm:w-auto px-6 py-2 bg-[#000080] text-white border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 active:border-t-gray-800 active:border-l-gray-800 active:border-b-white active:border-r-white font-bold text-sm flex items-center justify-center gap-2 cursor-pointer"
          >
            <Icon icon="dinkie-icons:repeat-arrow" className="w-4 h-4" />
            重新获取评论
          </button>
        ) : (
          <button
            onClick={handleSave}
            disabled={isSaved}
            className={`w-full sm:w-auto px-6 py-2 border-2 font-bold text-sm flex items-center justify-center gap-2 ${
              isSaved 
                ? 'bg-gray-300 text-gray-500 border-t-gray-800 border-l-gray-800 border-b-white border-r-white cursor-not-allowed' 
                : 'bg-[#c0c0c0] text-black border-t-white border-l-white border-b-gray-800 border-r-gray-800 active:border-t-gray-800 active:border-l-gray-800 active:border-b-white active:border-r-white cursor-pointer'
            }`}
          >
            <Icon icon="dinkie-icons:floppy-disk" className="w-4 h-4" />
            {isSaved ? "已保存到画廊" : "保存到画廊"}
          </button>
        )}
        <button
          onClick={onPlayAgain}
          className="w-full sm:w-auto px-6 py-2 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 active:border-t-gray-800 active:border-l-gray-800 active:border-b-white active:border-r-white font-bold text-black text-sm flex items-center justify-center gap-2 cursor-pointer"
        >
          <Icon icon="dinkie-icons:repeat-arrow" className="w-4 h-4" />
          再画一幅
        </button>
      </div>

      <Lightbox 
        isOpen={lightboxOpen} 
        image={image} 
        title={targetWord} 
        onClose={() => setLightboxOpen(false)} 
      />
    </div>
  );
}
