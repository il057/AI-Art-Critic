import React, { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { getSettings, saveSettings, getAssetUrl } from "../utils/storage";

export interface DisplaySettings {
  wallpaper: string;
  wallpaperFit: "center" | "stretch" | "tile";
  crtFilter: "none" | "light" | "medium" | "heavy";
}

interface DisplayPropertiesWindowProps {
  onSettingsChange: (settings: DisplaySettings) => void;
  showToast: (message: string, type?: "success" | "info" | "error") => void;
}

const WALLPAPERS = [
  { id: "teal_solid.jpg", label: "纯色", preview: getAssetUrl("/wallpapers/teal_solid.jpg") },
  { id: "clouds_win95.png", label: "云彩", preview: getAssetUrl("/wallpapers/clouds_win95.png") },
  { id: "windows95_logo.jpg", label: "徽标", preview: getAssetUrl("/wallpapers/windows95_logo.jpg") },
  { id: "bliss_meadow.jpg", label: "草地", preview: getAssetUrl("/wallpapers/bliss_meadow.jpg") },
];

type TabId = "background" | "monitor";

// Win95-style custom radio button
function Win95Radio({
  checked,
  onChange,
  id,
}: {
  checked: boolean;
  onChange: () => void;
  id: string;
}) {
  return (
    <div
      id={id}
      role="radio"
      aria-checked={checked}
      onClick={onChange}
      className="flex-shrink-0 w-3.5 h-3.5 rounded-full border-2 cursor-pointer flex items-center justify-center"
      style={{
        borderTopColor: "#808080",
        borderLeftColor: "#808080",
        borderBottomColor: "#ffffff",
        borderRightColor: "#ffffff",
        backgroundColor: "#c0c0c0",
        boxShadow: "inset 1px 1px 2px rgba(0,0,0,0.25)",
      }}
    >
      {checked && (
        <div
          className="w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: "#000000" }}
        />
      )}
    </div>
  );
}

export function DisplayPropertiesWindow({ onSettingsChange, showToast }: DisplayPropertiesWindowProps) {
  const [activeTab, setActiveTab] = useState<TabId>("background");
  const [wallpaper, setWallpaper] = useState<string>("teal_solid.jpg");
  const [wallpaperFit, setWallpaperFit] = useState<"center" | "stretch" | "tile">("stretch");
  const [crtFilter, setCrtFilter] = useState<"none" | "light" | "medium" | "heavy">("none");

  useEffect(() => {
    getSettings().then((s) => {
      if (s) {
        if (s.wallpaper !== undefined) setWallpaper(s.wallpaper || "teal_solid.jpg");
        if (s.wallpaperFit) setWallpaperFit(s.wallpaperFit);
        if (s.crtFilter) setCrtFilter(s.crtFilter);
      }
    });
  }, []);

  const handleApply = async () => {
    const existing = await getSettings();
    if (!existing) return;
    await saveSettings({
      ...existing,
      wallpaper,
      wallpaperFit,
      crtFilter,
    });
    onSettingsChange({ wallpaper, wallpaperFit, crtFilter });
    showToast("显示设置已应用！", "success");
  };

  const handleOk = async () => {
    await handleApply();
  };

  const tabClass = (tab: TabId) =>
    `px-3 py-1 text-[11px] font-bold cursor-pointer border-2 select-none ${
      activeTab === tab
        ? "border-t-white border-l-white border-b-[#c0c0c0] border-r-[#c0c0c0] bg-[#c0c0c0] relative z-10 -mb-[2px]"
        : "border-t-[#808080] border-l-[#808080] border-b-transparent border-r-transparent bg-[#a8a8a8] text-gray-700"
    }`;

  // Mini monitor preview for the background tab
  const selectedWp = WALLPAPERS.find((w) => w.id === wallpaper);

  const getFitStyle = (): React.CSSProperties => {
    if (!selectedWp) return { backgroundColor: "#008080" };
    switch (wallpaperFit) {
      case "stretch":
        return { backgroundImage: `url(${selectedWp.preview})`, backgroundSize: "100% 100%", backgroundRepeat: "no-repeat" };
      case "tile":
        return { backgroundImage: `url(${selectedWp.preview})`, backgroundSize: "auto", backgroundRepeat: "repeat" };
      case "center":
      default:
        return {
          backgroundImage: `url(${selectedWp.preview})`,
          backgroundSize: "contain",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          backgroundColor: "#008080",
        };
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#c0c0c0] text-black text-[11px] select-none">
      {/* Tab Header Row */}
      <div className="flex items-end px-2 pt-2 border-b-2 border-b-[#808080] gap-0.5">
        <button id="tab-background" className={tabClass("background")} onClick={() => setActiveTab("background")}>背景</button>
        <button id="tab-monitor" className={tabClass("monitor")} onClick={() => setActiveTab("monitor")}>显示器</button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto border-2 border-t-[#808080] border-l-[#808080] border-b-white border-r-white mx-2 mt-0 mb-1 p-3">

        {/* ── BACKGROUND TAB ── */}
        {activeTab === "background" && (
          <div className="flex flex-col gap-3 h-full">
            {/* Mini Monitor Preview */}
            <div className="flex justify-center">
              <div className="relative w-44 h-32">
                {/* Monitor body */}
                <div className="absolute inset-0 bg-[#808080] border-2 border-t-white border-l-white border-b-[#404040] border-r-[#404040] rounded-sm" />
                {/* Screen bezel */}
                <div className="absolute top-2 left-3 right-3 bottom-4 bg-black border-2 border-t-[#404040] border-l-[#404040] border-b-white border-r-white overflow-hidden">
                  {/* Desktop preview */}
                  <div className="w-full h-full" style={getFitStyle()} />
                  {/* Tiny taskbar */}
                  <div className="absolute bottom-0 left-0 right-0 h-2 bg-[#c0c0c0] border-t border-white flex items-center px-0.5 gap-0.5">
                    <div className="w-3 h-1.5 bg-[#c0c0c0] border border-t-white border-l-white border-b-gray-600 border-r-gray-600 flex items-center justify-center">
                      <div className="w-1.5 h-1 bg-[#000080]" />
                    </div>
                  </div>
                </div>
                {/* Monitor stand */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-[#808080] border border-t-[#404040]" />
              </div>
            </div>

            {/* Wallpaper list */}
            <div className="flex gap-2 flex-1 min-h-0">
              <div className="flex flex-col gap-0.5 flex-1 min-h-0">
                <label className="font-bold text-[10px]">桌面壁纸:</label>
                <div className="border-2 border-t-[#808080] border-l-[#808080] border-b-white border-r-white bg-white flex-1 overflow-y-auto min-h-[80px] max-h-[120px]">
                  {WALLPAPERS.map((wp) => (
                    <div
                      key={wp.id}
                      id={`wallpaper-option-${wp.id}`}
                      onClick={() => setWallpaper(wp.id)}
                      className={`px-2 py-0.5 cursor-pointer text-[11px] flex items-center gap-1.5 ${
                        wallpaper === wp.id ? "bg-[#000080] text-white" : "text-black hover:bg-blue-100"
                      }`}
                    >
                      <img src={wp.preview} className="w-5 h-4 object-cover border border-gray-400 flex-shrink-0" />
                      {wp.label}
                    </div>
                  ))}
                </div>
              </div>

              {/* Fit options — custom Win95 radio */}
              <div className="flex flex-col gap-1.5 flex-shrink-0">
                <label className="font-bold text-[10px]">显示方式:</label>
                {(["center", "stretch", "tile"] as const).map((fit) => {
                  const label = { center: "居中", stretch: "拉伸", tile: "平铺" }[fit];
                  return (
                    <div
                      key={fit}
                      className="flex items-center gap-1.5 cursor-pointer px-1 py-0.5"
                      onClick={() => setWallpaperFit(fit)}
                    >
                      <Win95Radio
                        id={`fit-${fit}`}
                        checked={wallpaperFit === fit}
                        onChange={() => setWallpaperFit(fit)}
                      />
                      <span className="text-[11px] cursor-pointer">{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── MONITOR TAB ── */}
        {activeTab === "monitor" && (
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-2 p-2 border-2 border-t-[#808080] border-l-[#808080] border-b-white border-r-white bg-[#d4d0c8]">
              <Icon
                icon="dinkie-icons:personal-computer"
                className="text-[22px] flex-shrink-0 mt-0.5 text-black"
              />
              <div>
                <div className="font-bold text-[10px] mb-0.5">CRT 显示器滤镜</div>
                <p className="text-[9px] text-gray-700 leading-relaxed">
                  通过叠加扫描线与暗角效果，模拟经典阴极射线管显示器的显示质感。
                  开启后整个界面将呈现复古老显示器风格。
                </p>
              </div>
            </div>

            <label className="font-bold text-[10px]">滤镜强度:</label>
            <div className="flex flex-col gap-1.5">
              {([
                { value: "none", label: "无效果", desc: "标准现代显示效果" },
                { value: "light", label: "轻微", desc: "轻微扫描线 + 淡暗角" },
                { value: "medium", label: "中等", desc: "明显扫描线 + 暗角 + 色调偏绿" },
                { value: "heavy", label: "强烈", desc: "强扫描线 + 深暗角 + 闪烁效果" },
              ] as const).map((opt) => (
                <div
                  key={opt.value}
                  onClick={() => setCrtFilter(opt.value)}
                  className={`flex items-start gap-2 cursor-pointer px-2 py-1.5 border ${
                    crtFilter === opt.value
                      ? "border-[#000080] bg-blue-50"
                      : "border-transparent hover:border-gray-400"
                  }`}
                >
                  <Win95Radio
                    id={`crt-${opt.value}`}
                    checked={crtFilter === opt.value}
                    onChange={() => setCrtFilter(opt.value)}
                  />
                  <div>
                    <div className="font-bold text-[11px]">{opt.label}</div>
                    <div className="text-[9px] text-gray-600">{opt.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* CRT preview hint */}
            {crtFilter !== "none" && (
              <div className="border-2 border-t-white border-l-white border-b-[#808080] border-r-[#808080] p-1.5 bg-[#ffffe0] text-[9px] text-gray-700 flex items-start gap-1.5">
                <Icon icon="dinkie-icons:electric-light-bulb" className="flex-shrink-0 text-[14px] text-yellow-600" />
                <span>点击「应用」后效果将覆盖整个桌面。如感到不适请将强度调回「无效果」。</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Buttons */}
      <div className="flex justify-end gap-2 px-2 pb-2">
        <button
          id="display-props-ok"
          onClick={handleOk}
          className="px-6 py-1 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-[#808080] border-r-[#808080] active:border-t-[#808080] active:border-l-[#808080] active:border-b-white active:border-r-white font-bold text-[11px] cursor-pointer"
        >
          确定
        </button>
        <button
          id="display-props-apply"
          onClick={handleApply}
          className="px-6 py-1 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-[#808080] border-r-[#808080] active:border-t-[#808080] active:border-l-[#808080] active:border-b-white active:border-r-white font-bold text-[11px] cursor-pointer"
        >
          应用
        </button>
      </div>
    </div>
  );
}
