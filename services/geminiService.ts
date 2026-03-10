import { GoogleGenAI } from "@google/genai";

const getClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found in environment variables");
  }
  return new GoogleGenAI({ apiKey });
};

export const smartCleanMarkdown = async (markdownText: string): Promise<string> => {
  try {
    const ai = getClient();
    
    const prompt = `
      Task: Convert the following Markdown text into clean, readable plain text.
      
      Instructions:
      1. Remove Markdown syntax symbols like asterisks (*), hashes (#), links [text](url), etc.
      2. IMPORTANT: PRESERVE numbered lists (e.g., "1.", "2.", "3."). Do not remove the numbers.
      3. Remove unordered list bullets (like -, *, +) but keep the text.
      4. Keep the original meaning and content intact.
      5. Improve the flow slightly if the removal of markdown creates awkward spacing.
      6. Do not include any introductory remarks. Just provide the converted text.
      7. IMPORTANT: Preserve the original language of the input text (e.g., if input is Chinese, output Chinese).
      
      Markdown Source:
      ${markdownText}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    return response.text || "Could not generate text.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};