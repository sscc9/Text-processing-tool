import { AISettings } from '../types';

export const runCustomAI = async (text: string, prompt: string, settings: AISettings): Promise<string> => {
  if (!settings.apiKey) {
    throw new Error('请先在设置中配置 API Key');
  }
  
  const apiUrl = settings.apiUrl || 'https://api.openai.com/v1/chat/completions';
  const modelId = settings.modelId || 'gpt-3.5-turbo';

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${settings.apiKey}`
    },
    body: JSON.stringify({
      model: modelId,
      messages: [
        { role: 'system', content: prompt },
        { role: 'user', content: text }
      ],
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `API 请求失败 (${response.status})`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
};
