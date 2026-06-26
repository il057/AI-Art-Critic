import { getSettings, saveSettings } from "../utils/storage";

export interface GeneratedWordBank {
  words: string[];
  stats: Record<string, { height: string; weight: string }>;
}

function cleanAndParseJson(text: string) {
  let cleaned = text.trim();
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    cleaned = jsonMatch[0];
  }
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.error("Failed to parse JSON content:", text);
    throw new Error("无法解析模型返回的 JSON。");
  }
}

/**
 * Calls the LLM API to generate a themed word bank with Pokémon-style stats.
 * Saves the result to IndexedDB and returns the parsed data.
 */
export async function generateCustomWords(theme: string): Promise<GeneratedWordBank> {
  const settings = await getSettings();
  if (!settings || !settings.apiKey) {
    throw new Error("NO_API_KEY");
  }

  const { provider, apiUrl, apiKey, selectedModel } = settings;

  const systemPrompt = `你是一个词库生成助手。你的任务是根据用户输入的主题，生成12个与该主题密切相关的、具体、简单、非常适合做简笔画创作的中文名词词语（例如对于"太空"主题，生成"火箭"、"宇航员"、"外星人"、"飞碟"、"流星"，绝对不要有"探索"、"浩瀚"等抽象词汇）。
同时，参考宝可梦卡牌的设定，请为每个生成的词语估算一个有趣或合理的身高（以米m或厘米cm为单位）和体重（以千克kg或克g为单位，例如："火箭"身高"15m"体重"45000kg"；"流星"身高"0.5m"体重"15kg"）。
要求：
1. 词语必须是具体的事物、动物、食物、植物或交通工具等，禁止出现抽象概念。
2. 每个词语必须是纯中文，长度控制在2-4个字之间。
3. 必须返回一个标准的 JSON 对象，格式如下：
{
  "words": [
    {"word": "词语1", "height": "身高规格", "weight": "体重规格"},
    {"word": "词语2", "height": "身高规格", "weight": "体重规格"},
    ...
  ]
}`;

  const requestUrl = `${apiUrl.replace(/\/$/, "")}/chat/completions`;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };
  if (provider === "openrouter") {
    headers["HTTP-Referer"] = window.location.origin;
    headers["X-Title"] = "AI Art Critic Win95";
  }

  const response = await fetch(requestUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({
      model: selectedModel,
      messages: [
        {
          role: "user",
          content: `主题是："${theme}"\n请生成符合上述要求的12个词语。`,
        },
        { role: "system", content: systemPrompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`API 返回状态码 ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "";
  const parsed = cleanAndParseJson(content);

  if (!parsed.words || !Array.isArray(parsed.words)) {
    throw new Error("模型返回的格式不正确，缺少 words 数组。");
  }

  const wordsList: string[] = [];
  const statsMap: Record<string, { height: string; weight: string }> = {};

  for (const item of parsed.words) {
    if (typeof item === "string") {
      wordsList.push(item);
    } else if (item && typeof item === "object") {
      const w = String(item.word || "");
      if (w) {
        wordsList.push(w);
        if (item.height && item.weight) {
          statsMap[w] = { height: String(item.height), weight: String(item.weight) };
        }
      }
    }
  }

  if (wordsList.length === 0) {
    throw new Error("未能成功解析出任何词语。");
  }

  // Persist to storage
  const saved = await getSettings();
  await saveSettings({
    ...(saved || {
      provider: "openrouter",
      apiUrl: "https://openrouter.ai/api/v1",
      apiKey: "",
      selectedModel: "google/gemini-2.5-flash",
      models: [],
    }),
    wordBank: "custom",
    customTheme: theme,
    customWords: wordsList,
    customStats: statsMap,
  });

  return { words: wordsList, stats: statsMap };
}
