import type { JudgeResult } from "../types/app";
import { getSettings } from "../utils/storage";

type CritiqueStyle =
  | "arrogant"
  | "supportive"
  | "poetic"
  | "philosophical"
  | "nonsense"
  | "random";

export interface JudgeParams {
  base64Image: string;
  targetWord: string;
  critiqueStyle: CritiqueStyle;
  wordBank: string;
  customTheme: string;
  durationLimit: number;
  isTimeout?: boolean;
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

function buildStylePrompt(style: Exclude<CritiqueStyle, "random">): string {
  switch (style) {
    case "supportive":
      return `你是一个极度溺爱、毫无审美底线的狂热信徒。
        要求：无论画作多离谱，都要用一种歇斯底里、热泪盈眶的传销式语言进行吹捧。使用极端的造神词汇（如"人类文明的灯塔"、"达芬奇看了都要自叹不如"、"震撼灵魂的重击"）。通过对破烂画作的降维式夸奖制造荒诞感。评分必须给95分以上。`;
    case "poetic":
      return `你是一位多愁善感、随时会崩溃的先锋派现代诗人。
        要求：评论必须像是一首无病呻吟的现代诗。大量使用宏大但破碎的意象（如：流血的晚霞、腐烂的星云、塞纳河的叹息）。把简笔画的每一根歪曲线条都解读为对生命流逝的哀歌。行文要有极强的跳跃性和矫情味，制造极致的高雅与简陋画作的对立反差。`;
    case "philosophical":
      return `你是一位深陷虚无主义危机的硬核哲学家。
        要求：强行用尼采、黑格尔或加缪的哲学理论来解构这幅画。大量使用哲学专有名词（如：绝对精神、西西弗斯的荒诞、存在先于本质、本体论）。将歪斜的线条解读为人类反抗荒谬世界的隐喻。态度必须绝对严肃、沉重，在宏大的哲学命题下探讨一幅涂鸦。`;
    case "nonsense":
      return `你是一个精神状态极度不稳定、前言不搭后语的网络乐子人。
        要求：逻辑必须是断裂的，比喻必须是跨物种且毫无因果关系的（例如"这根线条狂野得像我奶奶在太平洋跳钢管舞"）。融入极具画面感的奇怪场景和微小的日常荒诞事件。绝对不要进行任何正经的艺术分析。`;
    case "arrogant":
    default:
      return `你是一位古板、刻薄且自视甚高的皇家艺术学院院长。
        要求：通篇使用晦涩的专业艺术黑话（如解构主义、透视坍塌、视觉锚点）。用居高临下的态度对画面进行显微镜级别的过度审视。核心笑点在于"用写SCI论文的严谨态度去分析一坨涂鸦"。禁止使用任何网络流行语。`;
  }
}

export async function callJudgeAPI(params: JudgeParams): Promise<JudgeResult> {
  const { base64Image, targetWord, critiqueStyle, wordBank, customTheme, durationLimit, isTimeout = false } = params;

  const settings = await getSettings();
  if (!settings || !settings.apiKey) {
    throw new Error("请先配置 API 密钥");
  }

  const { provider, apiUrl, apiKey, selectedModel } = settings;

  const styleList = ["arrogant", "supportive", "poetic", "philosophical", "nonsense"] as const;
  const activeStyle: Exclude<CritiqueStyle, "random"> =
    critiqueStyle === "random"
      ? styleList[Math.floor(Math.random() * styleList.length)]
      : critiqueStyle;

  const stylePrompt = buildStylePrompt(activeStyle);

  const timeLimitText = isTimeout
    ? `\n[系统提示：用户没有在规定的 ${durationLimit} 秒内画完，时间到了强制提交。这是他们还没画完的烂尾半成品。请在你的猜测和点评中融入这一点，一本正经地调侃评论他们手速太慢，留下了一个未完成的烂摊子，或将"未完成的留白"一本正经地拔高为一种"刻意为之的残缺美学"或"创作者对时间流逝的无声妥协"，但千万不要让他们感到伤心。]`
    : "";

  const themeContext =
    wordBank === "custom" && customTheme
      ? `当前作画内容属于"${customTheme}"主题。请务必深度结合该主题的世界观设定、背景故事、角色机制或相关知名事件进行点评，让内容具有强烈的代入感。`
      : `请结合该事物在流行文化、历史典故或现实生活中的知名梗与典型特征进行延伸，避免纯粹的物理外观描述。`;

  const prompt = `你是一个AI艺术评论家。
${stylePrompt}${timeLimitText}
${themeContext}

注意：
1. 请仔细理解"好笑"与"冒犯"的区别：
   - 冒犯：直接对用户本人进行言语羞辱，贬低用户的智商或绘画能力（例如"你画得很垃圾"、"你是手残吧"、"这画得丑死了"）。这是绝不被允许的，会让用户感到不适！
   - 好笑：你需要通过荒谬的过度解读、角色扮演或夸张的比喻来制造幽默，让评论极具网络传播的节目效果。
2. 用户的目标是画一个"${targetWord}"。 ${themeContext} 你的回答要充满荒诞的幽默感和张力，使其非常适合分享到社交媒体。
   - 【重要】关于"猜测"(guess字段)：请不要直接、死板地重复目标词语"${targetWord}"或简单描述。哪怕你能认出画的是什么，也请基于画面的实际视觉特征，给出一个极度离谱但又具备某种荒诞视觉逻辑的误读。让猜测本身成为笑点。例如，如果目标词是"香蕉"，你可以猜它是"一只弯曲的金色飞镖"或"一艘搁浅的太空香蕉船"；如果目标词是"猫"，你可以猜它是"一位穿着毛皮大衣的四足虚无主义哲学家"。让猜测本身成为笑点！猜测长度控制在 5 到 25 个字之间。
   - 【字数限制】：艺术评论 (critique) 的总字数必须控制在 100 到 180 个中文字符之间。请务必保持语言精炼且信息与笑点密度高。
   - 评分 (score)：根据你的当前人格设定给出评分。除非完全交白卷，否则请在你的风格逻辑内合理给分。
3. 返回完全符合以下Schema的JSON对象，不要添加任何 markdown 包裹，只需返回原始 JSON 字符串：
{
  "guess": "猜测结果",
  "score": 分数数字,
  "critique": "艺术评论"
}`;

  const cleanUrl = apiUrl.replace(/\/$/, "");
  const requestUrl = `${cleanUrl}/chat/completions`;
  const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");
  const dataUri = `data:image/png;base64,${base64Data}`;

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
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: dataUri } },
          ],
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    let errMessage = `API 错误（状态码 ${response.status}）`;
    try {
      const errJson = JSON.parse(errText);
      if (errJson.error?.message) errMessage = errJson.error.message;
    } catch (_) {
      // ignore
    }
    throw new Error(errMessage);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "";
  const parsed = cleanAndParseJson(content);

  if (typeof parsed.score !== "number" || !parsed.critique) {
    throw new Error("模型返回的 JSON 格式不完整");
  }

  return {
    guess: parsed.guess || "看不懂的东西",
    score: parsed.score,
    critique: parsed.critique,
  };
}
