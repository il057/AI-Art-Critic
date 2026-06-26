import { useState, useEffect } from "react";
import { getSettings, saveSettings, LLMSettings } from "../utils/storage";
import { Icon } from "@iconify/react";
import { Dropdown } from "./Dropdown";

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
  const [provider, setProvider] = useState<"openrouter" | "custom">("openrouter");
  const [apiUrl, setApiUrl] = useState("https://openrouter.ai/api/v1");
  const [apiKey, setApiKey] = useState("");
  const [selectedModel, setSelectedModel] = useState("google/gemini-2.5-flash");
  const [models, setModels] = useState<string[]>(DEFAULT_MODELS);
  const [isFetching, setIsFetching] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [manualModel, setManualModel] = useState("");
  const [showManualInput, setShowManualInput] = useState(false);

  // Load settings on mount
  useEffect(() => {
    getSettings().then((saved) => {
      if (saved) {
        setProvider(saved.provider);
        setApiUrl(saved.apiUrl);
        setApiKey(saved.apiKey);
        setSelectedModel(saved.selectedModel);
        if (saved.models && saved.models.length > 0) {
          setModels(saved.models);
        }
      }
    });
  }, []);

  // Update URL if provider changes and it hasn't been modified or is openrouter
  useEffect(() => {
    if (provider === "openrouter") {
      setApiUrl("https://openrouter.ai/api/v1");
    }
  }, [provider]);

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
          if (!fetchedIds.includes(selectedModel)) {
            setSelectedModel(fetchedIds[0]);
          }
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
    };

    await saveSettings(newSettings);
    onSave();
    showToast ? showToast("系统配置已成功保存！", "success") : showAlert("系统配置已成功保存！", "控制面板", "info");
    onClose();
  };

  return (
    <div className="flex flex-col gap-4 text-xs p-3 pb-6">
      {/* Provider selection */}
      <div className="p-3 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 flex flex-col gap-2">
        <span className="font-bold text-black">选择 API 提供商:</span>
        <div className="flex gap-4">
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="radio"
              name="provider"
              checked={provider === "openrouter"}
              onChange={() => setProvider("openrouter")}
              className="cursor-pointer"
            />
            <span>OpenRouter</span>
          </label>
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="radio"
              name="provider"
              checked={provider === "custom"}
              onChange={() => setProvider("custom")}
              className="cursor-pointer"
            />
            <span>自定义 API 接口</span>
          </label>
        </div>
      </div>

      {/* Inputs */}
      <div className="p-3 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label className="font-bold text-black">API 请求根地址:</label>
          <input
            type="text"
            value={apiUrl}
            onChange={(e) => setApiUrl(e.target.value)}
            disabled={provider === "openrouter"}
            className="w-full px-2 py-1 bg-white border-2 border-t-gray-800 border-l-gray-800 border-b-white border-r-white text-black outline-none disabled:bg-gray-200 disabled:text-gray-600"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="font-bold text-black">API 密钥 (API Key):</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="请输入 API 密钥..."
            className="w-full px-2 py-1 bg-white border-2 border-t-gray-800 border-l-gray-800 border-b-white border-r-white text-black outline-none"
          />
        </div>

        <div className="flex gap-2 items-center">
          <button
            onClick={handleFetchModels}
            disabled={isFetching}
            className="px-4 py-1.5 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-gray-800 border-r-gray-800 active:border-t-gray-800 active:border-l-gray-800 active:border-b-white active:border-r-white font-bold text-black flex items-center justify-center gap-1 disabled:bg-gray-300 disabled:text-gray-500 disabled:border-t-gray-800 disabled:border-l-gray-800 disabled:border-b-white disabled:border-r-white cursor-pointer disabled:cursor-not-allowed"
          >
            {isFetching ? "获取中..." : "获取/拉取模型列表"}
          </button>
        </div>

        {statusMsg && (
          <div
            className={`p-2 border-2 ${
              statusMsg.type === "success"
                ? "bg-green-100 text-green-800 border-green-300"
                : "bg-red-100 text-red-800 border-red-300"
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
              className="text-blue-700 underline hover:text-blue-900 cursor-pointer"
            >
              {showManualInput ? "选择下拉列表" : "手动输入模型ID"}
            </button>
          </div>

          {showManualInput ? (
            <input
              type="text"
              value={manualModel}
              onChange={(e) => setManualModel(e.target.value)}
              placeholder="e.g. google/gemini-2.5-flash"
              className="w-full px-2 py-1 bg-white border-2 border-t-gray-800 border-l-gray-800 border-b-white border-r-white text-black outline-none"
            />
          ) : (
            <Dropdown
              options={models}
              value={selectedModel}
              onChange={setSelectedModel}
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
    </div>
  );
}
