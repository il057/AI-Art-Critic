import { useState, useEffect } from "react";
import { getSettings, saveSettings, LLMSettings, LLMApiPreset } from "../utils/storage";
import { Icon } from "@iconify/react";
import { Dropdown } from "./Dropdown";
import { PromptDialog, ChoiceDialog } from "./Modal";

interface SettingsWindowProps {
  onSave: () => void;
  onClose: () => void;
  showAlert: (message: string, title?: string, type?: "info" | "warning" | "error") => void;
  showToast?: (message: string, type?: "success" | "info" | "error") => void;
}

const DEFAULT_MODELS = [
  "google/gemini-2.5-flash",
  "google/gemini-2.5-pro",
  "openai/gpt-4o-mini",
  "meta-llama/llama-3.2-11b-vision-instruct",
  "anthropic/claude-3.5-sonnet"
];


export function SettingsWindow({ onSave, onClose, showAlert, showToast }: SettingsWindowProps) {
  const [provider, setProvider] = useState<"openrouter" | "custom">("custom");
  const [apiUrl, setApiUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [selectedModel, setSelectedModel] = useState("google/gemini-2.5-flash");
  const [models, setModels] = useState<string[]>(DEFAULT_MODELS);
  const [isFetching, setIsFetching] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [manualModel, setManualModel] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);

  // New States: Username & Presets
  const [username, setUsername] = useState("");
  const [presets, setPresets] = useState<LLMApiPreset[]>([]);
  const [activePresetId, setActivePresetId] = useState("");

  // Custom Modal Dialog states
  const [isAddPresetDialogOpen, setIsAddPresetDialogOpen] = useState(false);
  const [isDeletePresetDialogOpen, setIsDeletePresetDialogOpen] = useState(false);
  const [presetDefaultName, setPresetDefaultName] = useState("");

  // Load settings on mount
  useEffect(() => {
    getSettings().then((saved) => {
      let initPresets: LLMApiPreset[] = [];
      let initActiveId = "";
      let savedUsername = "";

      if (saved) {
        savedUsername = saved.username || "";
        initPresets = saved.apiPresets || [];
        initActiveId = saved.activePresetId || "";

        // If no presets existed but user had existing config, migrate it to custom preset
        if (initPresets.length === 0) {
          const customPreset: LLMApiPreset = {
            id: "preset-custom-default",
            name: "自定义接口 (默认)",
            provider: saved.provider || "custom",
            apiUrl: saved.apiUrl || "",
            apiKey: saved.apiKey || "",
            selectedModel: saved.selectedModel || "google/gemini-2.5-flash",
            models: (saved.models && saved.models.length > 0) ? saved.models : DEFAULT_MODELS,
          };
          const openrouterPreset: LLMApiPreset = {
            id: "preset-openrouter-default",
            name: "OpenRouter 方案",
            provider: "openrouter",
            apiUrl: "https://openrouter.ai/api/v1",
            apiKey: "",
            selectedModel: "google/gemini-2.5-flash",
            models: DEFAULT_MODELS,
          };
          initPresets = [customPreset, openrouterPreset];
          initActiveId = "preset-custom-default";
        }
      } else {
        // Fresh start
        const customPreset: LLMApiPreset = {
          id: "preset-custom-default",
          name: "自定义接口 (默认)",
          provider: "custom",
          apiUrl: "",
          apiKey: "",
          selectedModel: "google/gemini-2.5-flash",
          models: DEFAULT_MODELS,
        };
        const openrouterPreset: LLMApiPreset = {
          id: "preset-openrouter-default",
          name: "OpenRouter 方案",
          provider: "openrouter",
          apiUrl: "https://openrouter.ai/api/v1",
          apiKey: "",
          selectedModel: "google/gemini-2.5-flash",
          models: DEFAULT_MODELS,
        };
        initPresets = [customPreset, openrouterPreset];
        initActiveId = "preset-custom-default";
      }

      setPresets(initPresets);
      setActivePresetId(initActiveId);
      setUsername(savedUsername);

      const active = initPresets.find(p => p.id === initActiveId) || initPresets[0];
      if (active) {
        setProvider(active.provider);
        setApiUrl(active.apiUrl);
        setApiKey(active.apiKey);
        setSelectedModel(active.selectedModel);
        if (active.models && active.models.length > 0) {
          setModels(active.models);
        }
      }
    });
  }, []);

  // Update URL if provider changes and it hasn't been modified or is openrouter
  useEffect(() => {
    if (provider === "openrouter") {
      setApiUrl("https://openrouter.ai/api/v1");
      updateActivePresetField({ apiUrl: "https://openrouter.ai/api/v1" });
    }
  }, [provider]);

  const updateActivePresetField = (fieldUpdates: Partial<LLMApiPreset>) => {
    if (!activePresetId) return;
    setPresets((prev) =>
      prev.map((p) => (p.id === activePresetId ? { ...p, ...fieldUpdates } : p))
    );
  };

  const handlePresetChange = (presetId: string) => {
    const target = presets.find((p) => p.id === presetId);
    if (!target) return;

    setActivePresetId(presetId);
    setProvider(target.provider);
    setApiUrl(target.apiUrl);
    setApiKey(target.apiKey);
    setSelectedModel(target.selectedModel);
    setModels(target.models && target.models.length > 0 ? target.models : DEFAULT_MODELS);
    setManualModel("");
    setShowManualInput(false);
  };

  const getPresetDefaultName = (url: string, model: string) => {
    let domain = "";
    try {
      const urlObj = new URL(url);
      domain = urlObj.hostname.split('.')[0];
    } catch (e) {
      const match = url.match(/https?:\/\/([^/:]+)/);
      if (match && match[1]) {
        domain = match[1].split('.')[0];
      }
    }
    if (!domain || domain === "localhost" || domain === "127.0.0.1") {
      domain = "abcdapi";
    }
    const modelShortName = model.includes("/") ? model.split("/")[1] : model;
    return `${domain}/${modelShortName}`;
  };

  const triggerAddPresetFlow = () => {
    const defaultName = getPresetDefaultName(apiUrl, selectedModel);
    setPresetDefaultName(defaultName);
    setIsAddPresetDialogOpen(true);
  };

  const handleAddPresetConfirm = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    // Ensure uniqueness of preset names
    let finalName = trimmed;
    let counter = 1;
    while (presets.some((p) => p.name === finalName)) {
      finalName = `${trimmed} (${counter})`;
      counter++;
    }

    const newId = `preset-${Math.random().toString(36).substring(2, 9)}`;
    const newPreset: LLMApiPreset = {
      id: newId,
      name: finalName,
      provider: provider,
      apiUrl: apiUrl,
      apiKey: apiKey,
      selectedModel: selectedModel,
      models: models.length > 0 ? models : DEFAULT_MODELS,
    };

    setPresets((prev) => [...prev, newPreset]);
    setActivePresetId(newId);
    setIsAddPresetDialogOpen(false);
  };

  const triggerDeletePresetFlow = () => {
    if (presets.length <= 1) {
      showAlert("至少需要保留一个方案！", "提示", "warning");
      return;
    }
    setIsDeletePresetDialogOpen(true);
  };

  const handleDeletePresetConfirm = () => {
    const newPresets = presets.filter((p) => p.id !== activePresetId);
    setPresets(newPresets);

    const fallbackPreset = newPresets[0];
    setActivePresetId(fallbackPreset.id);
    setProvider(fallbackPreset.provider);
    setApiUrl(fallbackPreset.apiUrl);
    setApiKey(fallbackPreset.apiKey);
    setSelectedModel(fallbackPreset.selectedModel);
    setModels(fallbackPreset.models && fallbackPreset.models.length > 0 ? fallbackPreset.models : DEFAULT_MODELS);
    setManualModel("");
    setShowManualInput(false);

    setIsDeletePresetDialogOpen(false);
  };

  const handleFetchModels = async () => {
    if (!apiKey) {
      setStatusMsg({ type: "error", text: "请输入 API 密钥以获取模型。" });
      return;
    }

    setIsFetching(true);
    setStatusMsg(null);

    try {
      const cleanUrl = apiUrl.replace(/\/$/, "");
      const response = await fetch(`${cleanUrl}/models`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP 错误！状态码: ${response.status}`);
      }

      const data = await response.json();
      if (data && Array.isArray(data.data)) {
        const fetchedIds: string[] = data.data.map((m: any) => m.id);
        if (fetchedIds.length > 0) {
          setModels(fetchedIds);
          let newSelected = selectedModel;
          if (!fetchedIds.includes(selectedModel)) {
            newSelected = fetchedIds[0];
            setSelectedModel(fetchedIds[0]);
          }
          updateActivePresetField({ models: fetchedIds, selectedModel: newSelected });
          setStatusMsg({ type: "success", text: `成功拉取了 ${fetchedIds.length} 个模型！` });
        } else {
          throw new Error("模型列表为空");
        }
      } else {
        throw new Error("API 返回的数据格式不正确，未找到 data 数组");
      }
    } catch (err: any) {
      console.error(err);
      setStatusMsg({
        type: "error",
        text: `拉取失败: ${err.message || "请检查 API 密钥和地址是否正确，或是否遭遇 CORS 跨域限制。"}`
      });
    } finally {
      setIsFetching(false);
    }
  };

  const handleSave = async () => {
    let finalModel = selectedModel;
    if (showManualInput && manualModel) {
      finalModel = manualModel.trim();
    }

    const savedSettings = await getSettings();

    const newSettings: LLMSettings = {
      ...savedSettings,
      provider,
      apiUrl,
      apiKey: apiKey.trim(),
      selectedModel: finalModel,
      models: models.length > 0 ? models : DEFAULT_MODELS,
      username: username.trim(),
      apiPresets: presets,
      activePresetId,
    };

    await saveSettings(newSettings);
    onSave();
    showToast ? showToast("系统配置已成功保存！", "success") : showAlert("系统配置已成功保存！", "控制面板", "info");
    onClose();
  };

  return (
    <div className="flex flex-col gap-4 text-xs p-3 pb-6 select-none">
      {/* 1. Username settings at the very top */}
      <div className="p-3 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 flex flex-col gap-2">
        <span className="font-bold text-black">插画师署名 (用户名):</span>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="您的画笔"
          className="w-full px-2 py-1 bg-white border-2 border-t-gray-800 border-l-gray-800 border-b-white border-r-white text-black outline-none font-bold"
        />
      </div>

      {/* 2. Group API Preset Select & API Provider together */}
      <div className="p-3 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 flex flex-col gap-3">
        <div className="flex flex-col gap-1.5">
          <span className="font-bold text-black">选择 API 配置方案:</span>
          <div className="flex gap-2 items-center">
            <div className="flex-grow">
              <Dropdown
                options={presets.map((p) => p.name)}
                value={presets.find((p) => p.id === activePresetId)?.name || ""}
                onChange={(name) => {
                  const target = presets.find((p) => p.name === name);
                  if (target) {
                    handlePresetChange(target.id);
                  }
                }}
              />
            </div>
            <button
              onClick={triggerAddPresetFlow}
              className="px-2 py-0.5 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 active:border-t-gray-800 active:border-l-gray-800 active:border-b-white active:border-r-white font-bold text-black cursor-pointer text-[10px] flex items-center gap-1 flex-shrink-0"
            >
              <Icon icon="streamline-pixel:interface-essential-add" className="w-3.5 h-3.5" />
              <span>新建方案</span>
            </button>
            {presets.length > 1 && (
              <button
                onClick={triggerDeletePresetFlow}
                className="px-2 py-0.5 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 active:border-t-gray-800 active:border-l-gray-800 active:border-b-white active:border-r-white font-bold text-red-800 cursor-pointer text-[10px] flex items-center gap-1 flex-shrink-0"
              >
                <Icon icon="streamline-pixel:interface-essential-bin" className="w-3.5 h-3.5" />
                <span>删除</span>
              </button>
            )}
          </div>
        </div>

        <div className="h-[1px] bg-gray-400 my-1"></div>

        <div className="flex flex-col gap-1.5">
          <span className="font-bold text-black">选择 API 提供商:</span>
          <div className="flex gap-4">
            <label className="flex items-center gap-1 cursor-pointer font-bold">
              <input
                type="radio"
                name="provider"
                checked={provider === "custom"}
                onChange={() => {
                  setProvider("custom");
                  updateActivePresetField({ provider: "custom" });
                }}
                className="cursor-pointer"
              />
              <span>自定义 API 接口</span>
            </label>
            <label className="flex items-center gap-1 cursor-pointer font-bold">
              <input
                type="radio"
                name="provider"
                checked={provider === "openrouter"}
                onChange={() => {
                  setProvider("openrouter");
                  updateActivePresetField({ provider: "openrouter" });
                }}
                className="cursor-pointer"
              />
              <span>OpenRouter</span>
            </label>
          </div>
        </div>
      </div>

      {/* 3. Inputs */}
      <div className="p-3 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label className="font-bold text-black">API 请求根地址:</label>
          <input
            type="text"
            value={apiUrl}
            onChange={(e) => {
              const val = e.target.value;
              setApiUrl(val);
              updateActivePresetField({ apiUrl: val });
            }}
            disabled={provider === "openrouter"}
            className="w-full px-2 py-1 bg-white border-2 border-t-gray-800 border-l-gray-800 border-b-white border-r-white text-black outline-none disabled:bg-gray-200 disabled:text-gray-600 font-bold"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="font-bold text-black">API 密钥 (API Key):</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => {
              const val = e.target.value;
              setApiKey(val);
              updateActivePresetField({ apiKey: val });
            }}
            placeholder="请输入 API 密钥..."
            className="w-full px-2 py-1 bg-white border-2 border-t-gray-800 border-l-gray-800 border-b-white border-r-white text-black outline-none font-bold"
          />
        </div>

        <div className="flex gap-2 items-center">
          <button
            onClick={handleFetchModels}
            disabled={isFetching}
            className="px-4 py-1.5 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 active:border-t-gray-800 active:border-l-gray-800 active:border-b-white active:border-r-white font-bold text-black flex items-center justify-center gap-1 disabled:bg-gray-300 disabled:text-gray-500 disabled:border-t-gray-800 disabled:border-l-gray-800 disabled:border-b-white disabled:border-r-white cursor-pointer disabled:cursor-not-allowed text-[11px]"
          >
            {isFetching ? "获取中..." : "获取/拉取模型列表"}
          </button>
        </div>

        {statusMsg && (
          <div
            className={`p-2 border-2 ${
              statusMsg.type === "success"
                ? "bg-green-100 text-green-800 border-green-300 font-bold"
                : "bg-red-100 text-red-800 border-red-300 font-bold"
            }`}
          >
            {statusMsg.text}
          </div>
        )}
      </div>

      {/* Model Selection */}
      <div className="p-3 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <div className="flex justify-between items-center">
            <label className="font-bold text-black">选择要使用的模型:</label>
            <button
              onClick={() => setShowManualInput(!showManualInput)}
              className="text-blue-700 underline hover:text-blue-900 cursor-pointer font-bold"
            >
              {showManualInput ? "选择下拉列表" : "手动输入模型ID"}
            </button>
          </div>

          {showManualInput ? (
            <input
              type="text"
              value={manualModel}
              onChange={(e) => {
                setManualModel(e.target.value);
                updateActivePresetField({ selectedModel: e.target.value });
              }}
              placeholder="e.g. google/gemini-2.5-flash"
              className="w-full px-2 py-1 bg-white border-2 border-t-gray-800 border-l-gray-800 border-b-white border-r-white text-black outline-none font-bold"
            />
          ) : (
            <Dropdown
              options={models}
              value={selectedModel}
              onChange={(val) => {
                setSelectedModel(val);
                updateActivePresetField({ selectedModel: val });
              }}
            />
          )}
        </div>

        {/* Vision notice */}
        <div className="flex gap-2 items-start bg-yellow-50 border border-yellow-300 p-2 text-yellow-900">
          <Icon icon="streamline-pixel:interface-essential-alert-circle-2" className="w-5 h-5 flex-shrink-0 text-yellow-600 mt-0.5" />
          <div>
            <p className="font-bold"> 重要提示:</p>
            <p className="mt-0.5">请确保您选择的模型支持视觉/多模态，否则 AI 评论家将无法看到并点评您的画作！</p>
          </div>
        </div>
      </div>


      {/* Save / Cancel buttons */}
      <div className="flex justify-end gap-2 mt-4">
        <button
          onClick={handleSave}
          className="px-6 py-2 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 active:border-t-gray-800 active:border-l-gray-800 active:border-b-white active:border-r-white font-bold text-black cursor-pointer"
        >
          保存设置
        </button>
        <button
          onClick={onClose}
          className="px-6 py-2 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 active:border-t-gray-800 active:border-l-gray-800 active:border-b-white active:border-r-white text-black cursor-pointer"
        >
          取消
        </button>
      </div>

      {/* Custom Dialog Modals */}
      <PromptDialog
        isOpen={isAddPresetDialogOpen}
        title="新建配置方案"
        message="请输入新方案的名称："
        defaultValue={presetDefaultName}
        onConfirm={handleAddPresetConfirm}
        onClose={() => setIsAddPresetDialogOpen(false)}
      />

      <ChoiceDialog
        isOpen={isDeletePresetDialogOpen}
        title="确认删除方案"
        message={`您确定要删除当前配置方案吗？`}
        confirmText="确定"
        cancelText="取消"
        onConfirm={handleDeletePresetConfirm}
        onCancel={() => setIsDeletePresetDialogOpen(false)}
      />
    </div>
  );
}
