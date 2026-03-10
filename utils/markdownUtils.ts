/**
 * Strips standard Markdown syntax from a string using Regex.
 * This is the "Instant" local version.
 */
export const stripMarkdownRegex = (md: string): string => {
  if (!md) return '';

  let output = md;

  // 1. Remove Horizontal Rules (---, ***, ___)
  output = output.replace(/^(?:[-*_] ?){3,}(?:\n|$)/gm, '');

  // 2. Remove Headers (# H1, ## H2, etc.)
  // Handle optional indentation before the hashes
  output = output.replace(/^\s*#{1,6}\s+(.*)$/gm, '$1');
  
  // 3. Remove Alternate Headers (== or -- underneath)
  output = output.replace(/^(=+|-+)\s*$/gm, '');

  // 4. Remove Images (![alt](url)) - Keep alt text
  output = output.replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1');

  // 5. Remove Links ([text](url)) - Keep text
  output = output.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');

  // 6. Remove Bold/Italic (**text**, __text__, *text*, _text_)
  // Run loop to handle nested styles like ***bold italic***
  for (let i = 0; i < 2; i++) {
    output = output.replace(/(\*\*|__)(.*?)\1/g, '$2');
    output = output.replace(/(\*|_)(.*?)\1/g, '$2');
  }

  // 7. Remove Strikethrough (~~text~~)
  output = output.replace(/~~(.*?)~~/g, '$1');

  // 8. Remove Inline Code (`code`)
  output = output.replace(/`([^`]+)`/g, '$1');

  // 9. Remove Blockquotes (>)
  output = output.replace(/^>\s?/gm, '');

  // 10. Remove Unordered List markers (*, -, +)
  // Added \s* to handle indented lists (e.g. "  * Item")
  output = output.replace(/^\s*[\*\-\+]\s+/gm, ''); 

  // NOTE: We purposefully DO NOT remove Ordered Lists (1., 2., etc.) per user request.
  // output = output.replace(/^\d+\.\s+/gm, ''); <--- Removed

  // 11. Remove Code Blocks (```lang ... ```)
  output = output.replace(/```[\s\S]*?```/g, (match) => {
    // Strip the backticks and language identifier, keep the code content
    return match.replace(/```.*\n?|```/g, '');
  });

  // 12. Remove generic HTML tags if any
  output = output.replace(/<[^>]*>/g, '');

  // 13. Final cleanup for lingering start-of-line asterisks that might have been malformed lists
  // e.g. "*Text" without space
  output = output.replace(/^\s*\*\s?/gm, '');

  return output.trim();
};

/**
 * Extracts image and video prompts from a script text.
 */
export const extractPrompts = (text: string): string => {
  if (!text) return '';

  const imagePrompts: string[] = [];
  const videoPrompts: string[] = [];

  const lines = text.split('\n');
  let currentType: 'image' | 'video' | null = null;
  let currentPrompt: string[] = [];

  const saveCurrentPrompt = () => {
    if (currentType && currentPrompt.length > 0) {
      const promptText = currentPrompt.join('\n').trim();
      if (promptText) {
        if (currentType === 'image') imagePrompts.push(promptText);
        if (currentType === 'video') videoPrompts.push(promptText);
      }
    }
    currentPrompt = [];
  };

  const extractInlinePrompt = (line: string, keyword: string) => {
    const after = line.substring(line.indexOf(keyword) + keyword.length);
    let cleaned = after.replace(/^[^a-zA-Z0-9\u4e00-\u9fa5]+/, '');
    cleaned = cleaned.replace(/^(Seedream|即梦|Midjourney|Runway|Pika|Sora|MJ|可灵|Kling)[^a-zA-Z0-9\u4e00-\u9fa5]*/i, '');
    cleaned = cleaned.replace(/^[^a-zA-Z0-9\u4e00-\u9fa5]+/, '');
    return cleaned.trim();
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.includes('图片提示词')) {
      saveCurrentPrompt();
      currentType = 'image';
      const inline = extractInlinePrompt(line, '图片提示词');
      if (inline) currentPrompt.push(inline);
      continue;
    } else if (line.includes('视频提示词')) {
      saveCurrentPrompt();
      currentType = 'video';
      const inline = extractInlinePrompt(line, '视频提示词');
      if (inline) currentPrompt.push(inline);
      continue;
    } else if (
      line.includes('════════') || 
      line.includes('────────') || 
      line.startsWith('【镜头') ||
      line.startsWith('**▌')
    ) {
      saveCurrentPrompt();
      currentType = null;
      continue;
    }

    if (currentType) {
      if (line) {
        currentPrompt.push(line);
      }
    }
  }

  saveCurrentPrompt();

  if (imagePrompts.length === 0 && videoPrompts.length === 0) {
    throw new Error('未找到提示词');
  }

  let result = '';
  if (imagePrompts.length > 0) {
    result += '### 一、图片提示词（按镜头顺序）\n\n';
    imagePrompts.forEach((prompt, index) => {
      result += `${index + 1}. ${prompt.replace(/\n/g, ' ')}\n`;
    });
  }

  if (videoPrompts.length > 0) {
    if (result) result += '\n---\n\n';
    result += '### 二、视频提示词（按镜头顺序）\n\n';
    videoPrompts.forEach((prompt, index) => {
      result += `${index + 1}. ${prompt.replace(/\n/g, ' ')}\n`;
    });
  }

  return result.trim();
};