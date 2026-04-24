import { AISettings } from '../types';
import { GoogleGenAI } from "@google/genai";

export const runCustomAI = async (text: string, prompt: string, settings: AISettings): Promise<string> => {
  if (!settings.apiKey) {
    throw new Error('请先在设置中配置 API Key');
  }

  const modelId = settings.modelId || 'gpt-3.5-turbo';
  let isGoogle = false;

  // Detect if it's a google model based on modelId
  if (modelId.toLowerCase().includes('gemini') || modelId.toLowerCase().includes('learnlm')) {
    isGoogle = true;
  }

  if (isGoogle) {
    const ai = new GoogleGenAI({ apiKey: settings.apiKey });
    const stream = await ai.models.generateContentStream({
      model: modelId,
      contents: [{ role: 'user', parts: [{ text: `${prompt}\n\n内容如下：\n${text}` }] }]
    });

    let finalResponse = '';
    for await (const chunk of stream) {
      finalResponse += chunk.text;
    }
    return finalResponse;

  } else {
    // openai-compatible (exactly like chat-studio)
    let baseUrl = settings.apiUrl || 'https://api.openai.com/v1';

    // Since our UI used to ask for the full completion URL, sanitize it to baseUrl
    // if the user still has full URL in their settings cache.
    if (baseUrl.endsWith('/chat/completions')) {
      baseUrl = baseUrl.replace(/\/chat\/completions$/, '');
    }

    const url = `${baseUrl.replace(/\/$/, '')}/chat/completions`;

    const isDeepSeekV4 = modelId.startsWith('deepseek-v4');
    const body: any = {
      model: modelId,
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: text }
      ],
      stream: false
    };

    if (isDeepSeekV4) {
      body.thinking = { type: 'enabled' };
      body.reasoning_effort = 'high';
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${settings.apiKey}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`API Error: ${response.status} ${response.statusText} - ${err}`);
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "";
  }
};
