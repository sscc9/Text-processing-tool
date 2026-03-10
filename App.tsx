import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  Copy,
  Trash2,
  Sparkles,
  Zap,
  Check,
  AlertCircle,
  Undo2,
  PenLine,
  Info,
  Images,
  Settings as SettingsIcon,
  Bot,
  X
} from 'lucide-react';
import { stripMarkdownRegex, extractPrompts } from './utils/markdownUtils';
import { runCustomAI } from './services/aiService';
import { Button } from './components/Button';
import { ToastState, AISettings, AIShortcut } from './types';

export default function App() {
  const [text, setText] = useState('');
  const [previousText, setPreviousText] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>({ show: false, message: '', type: 'info' });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [aiSettings, setAiSettings] = useState<AISettings>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('aiSettings');
      if (saved) return JSON.parse(saved);
    }
    return { apiUrl: 'https://api.openai.com/v1/chat/completions', apiKey: '', modelId: 'gpt-3.5-turbo' };
  });

  const [shortcuts, setShortcuts] = useState<AIShortcut[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('aiShortcuts');
      if (saved) {
        const parsed = JSON.parse(saved);
        // Remove the legacy default shortcut if it exists
        return parsed.filter((s: AIShortcut) => s.name !== '智能润色');
      }
    }
    return [];
  });

  const [showSettings, setShowSettings] = useState(false);
  const [showAITask, setShowAITask] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [shortcutName, setShortcutName] = useState('');

  useEffect(() => {
    localStorage.setItem('aiSettings', JSON.stringify(aiSettings));
  }, [aiSettings]);

  useEffect(() => {
    localStorage.setItem('aiShortcuts', JSON.stringify(shortcuts));
  }, [shortcuts]);

  // Dark Mode State Logic - Strictly follows system preferences
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Apply theme class to DOM
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  const handleInstantConvert = () => {
    if (!text.trim()) {
      showToast('请先输入内容', 'info');
      return;
    }
    setPreviousText(text);
    const result = stripMarkdownRegex(text);
    setText(result);
    showToast('转换完成！', 'success');
  };

  const handleExtractPrompts = () => {
    if (!text.trim()) {
      showToast('请先输入内容', 'info');
      return;
    }
    try {
      setPreviousText(text);
      const result = extractPrompts(text);
      setText(result);
      showToast('提取完成！', 'success');
    } catch (error: any) {
      showToast(error.message || '提取失败', 'error');
      // If error, revert previousText so we don't end up with an empty undo state
      setPreviousText(null);
    }
  };

  const handleRunAI = async (prompt: string, trackingId: string = 'main') => {
    if (!text.trim()) {
      showToast('请先输入一些文本', 'error');
      return;
    }
    if (!aiSettings.apiKey) {
      showToast('请先配置 AI API Key', 'error');
      setShowSettings(true);
      return;
    }

    setProcessingId(trackingId);
    const currentText = text;

    try {
      const result = await runCustomAI(currentText, prompt, aiSettings);
      setPreviousText(currentText);
      setText(result);
      showToast('AI 处理完成！', 'success');
    } catch (error: any) {
      showToast(error.message || 'AI 服务请求失败', 'error');
      console.error(error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleExecuteCustomTask = () => {
    if (!customPrompt.trim()) {
      showToast('请输入 AI 提示词', 'error');
      return;
    }

    let executeId = 'main';

    if (shortcutName.trim()) {
      const newId = Date.now().toString();
      const newShortcut: AIShortcut = {
        id: newId,
        name: shortcutName.trim(),
        prompt: customPrompt.trim()
      };
      setShortcuts([...shortcuts, newShortcut]);
      setShortcutName('');
      executeId = newId; // Use the newly created shortcut's ID for loading state
    }

    setShowAITask(false); // Close modal immediately
    handleRunAI(customPrompt, executeId);
  };

  const removeShortcut = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setShortcuts(shortcuts.filter(s => s.id !== id));
  };

  const handleUndo = () => {
    if (previousText !== null) {
      setText(previousText);
      setPreviousText(null);
      showToast('已恢复原始内容', 'info');
    }
  };

  const copyToClipboard = async () => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      showToast('已复制到剪贴板', 'success');
    } catch (err) {
      showToast('复制失败', 'error');
    }
  };

  const clearAll = () => {
    if (!text) return;
    if (previousText === null) {
      setPreviousText(text);
    }
    setText('');
    showToast('已清空文本', 'success');
  };

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  return (
    <div className="h-[100dvh] flex flex-col bg-zinc-50 dark:bg-zinc-950 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-100/40 via-zinc-50 to-purple-100/40 dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-900 text-zinc-800 dark:text-zinc-100 font-sans selection:bg-indigo-100 selection:text-indigo-900 dark:selection:bg-indigo-500/30 dark:selection:text-indigo-200 transition-colors duration-300 overflow-hidden">
      {/* Header */}
      <header className="px-6 py-4 flex items-center justify-between shrink-0 z-20 backdrop-blur-sm sticky top-0 transition-colors duration-300">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-indigo-500 to-violet-600 p-2.5 rounded-xl shadow-lg shadow-indigo-500/20 ring-1 ring-white/20 dark:ring-white/10">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-800 dark:text-zinc-100 tracking-tight">
              文本处理工具
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800"
            title="设置"
          >
            <SettingsIcon className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 font-medium bg-white/50 dark:bg-zinc-800/50 px-3 py-1 rounded-full border border-white/40 dark:border-white/5 shadow-sm backdrop-blur-md transition-colors duration-300">
            <PenLine className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">多功能文本处理，AI 助力提效</span>
            <span className="sm:hidden">文本处理</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative max-w-5xl mx-auto w-full p-4 sm:p-6 lg:p-8 overflow-hidden">

        <div className="flex-1 flex flex-col bg-white/80 dark:bg-zinc-900/70 backdrop-blur-xl rounded-3xl shadow-[0_8px_40px_rgb(0,0,0,0.04)] dark:shadow-none border border-white/60 dark:border-white/5 ring-1 ring-zinc-900/5 dark:ring-white/5 overflow-hidden relative transition-all duration-300">
          {/* Toolbar area - Top */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100/80 dark:border-white/5 bg-gradient-to-r from-zinc-50/50 to-white/50 dark:from-zinc-900/50 dark:to-zinc-800/50 transition-colors duration-300">
            <div className="flex items-center gap-2">
              {previousText !== null ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleUndo}
                  className="text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 group"
                  icon={<Undo2 className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />}
                >
                  撤销操作
                </Button>
              ) : (
                <div className="flex items-center gap-2 px-2">
                  <div className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]"></div>
                  <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Editor Ready</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={copyToClipboard}
                disabled={!text}
                className="text-zinc-500 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
                title="复制内容"
                icon={<Copy className="w-4 h-4" />}
              />
              <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-800 mx-1 transition-colors"></div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAll}
                disabled={!text}
                className="text-zinc-500 dark:text-zinc-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                title="清空内容"
                icon={<Trash2 className="w-4 h-4" />}
              />
            </div>
          </div>

          {/* Textarea */}
          <div className="flex-1 relative group">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="在此输入内容或粘贴文本...&#10;&#10;您可以要求 AI：&#10;- 帮我把这段内容转成纯文本&#10;- 提取图片和视频提示词，并分开存放&#10;- 帮我翻译这段内容&#10;- 帮我解题"
              className="absolute inset-0 w-full h-full p-6 sm:p-8 resize-none focus:outline-none bg-transparent font-sans text-base sm:text-lg leading-relaxed text-zinc-700 dark:text-zinc-200 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 transition-colors duration-300"
              spellCheck={false}
            />
          </div>

          {/* Action Bar - Bottom */}
          <div className="p-4 sm:p-6 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md border-t border-zinc-100/80 dark:border-white/5 flex flex-col sm:flex-row gap-4 items-center justify-between z-10 transition-colors duration-300">
            <span className="text-xs font-medium text-zinc-400 dark:text-zinc-500 hidden sm:inline-flex items-center gap-2 pl-2 transition-colors">
              {text.length > 0 ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                  {text.length} 字符
                </>
              ) : '等待输入...'}
            </span>

            <div className="flex w-full sm:w-auto gap-3 flex-wrap justify-end">
              {shortcuts.map(shortcut => (
                <div key={shortcut.id} className="relative group flex">
                  <Button
                    variant="gradient"
                    onClick={() => handleRunAI(shortcut.prompt, shortcut.id)}
                    isLoading={processingId === shortcut.id}
                    className="flex-1 sm:flex-none pr-8"
                    icon={<Sparkles className="w-4 h-4" />}
                  >
                    {shortcut.name}
                  </Button>
                  <button
                    onClick={(e) => removeShortcut(shortcut.id, e)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-white/70 hover:text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    title="删除快捷指令"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              <Button
                variant="secondary"
                onClick={() => setShowAITask(true)}
                isLoading={processingId === 'main'}
                className="flex-1 sm:flex-none sm:min-w-[140px]"
                icon={<Bot className="w-4 h-4 text-indigo-500" />}
              >
                AI 指令
              </Button>

              <Button
                variant="secondary"
                onClick={handleExtractPrompts}
                className="flex-1 sm:flex-none sm:min-w-[140px]"
                icon={<Images className="w-4 h-4 text-indigo-500" />}
              >
                提取提示词
              </Button>

              <Button
                variant="secondary"
                onClick={handleInstantConvert}
                className="flex-1 sm:flex-none sm:min-w-[140px]"
                icon={<Zap className="w-4 h-4 text-amber-500 fill-amber-500/20" />}
              >
                极速转换
              </Button>
            </div>
          </div>
        </div>

      </main>

      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 px-5 py-3 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] border flex items-center gap-3 animate-in fade-in slide-in-from-bottom-8 duration-300 z-50 backdrop-blur-md ${toast.type === 'success' ? 'bg-white/90 dark:bg-zinc-800/90 border-green-200/50 dark:border-green-900/30 text-green-700 dark:text-green-400' :
          toast.type === 'error' ? 'bg-white/90 dark:bg-zinc-800/90 border-red-200/50 dark:border-red-900/30 text-red-700 dark:text-red-400' :
            'bg-white/90 dark:bg-zinc-800/90 border-zinc-200/50 dark:border-zinc-700/30 text-zinc-700 dark:text-zinc-200'
          }`}>
          {toast.type === 'success' && <Check className="w-4 h-4 text-green-500" />}
          {toast.type === 'error' && <AlertCircle className="w-4 h-4 text-red-500" />}
          {toast.type === 'info' && <Info className="w-4 h-4 text-indigo-500" />}
          <span className="font-medium text-sm">{toast.message}</span>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-zinc-200 dark:border-zinc-800">
            <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">AI 模型设置</h3>
              <button onClick={() => setShowSettings(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">API 链接 (兼容 OpenAI 格式)</label>
                <input
                  type="text"
                  value={aiSettings.apiUrl}
                  onChange={e => setAiSettings({ ...aiSettings, apiUrl: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-zinc-200"
                  placeholder="https://api.openai.com/v1 (Gemini模型可留空)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">API Key</label>
                <input
                  type="password"
                  value={aiSettings.apiKey}
                  onChange={e => setAiSettings({ ...aiSettings, apiKey: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-zinc-200"
                  placeholder="sk-..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">模型 ID</label>
                <input
                  type="text"
                  value={aiSettings.modelId}
                  onChange={e => setAiSettings({ ...aiSettings, modelId: e.target.value })}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-zinc-200"
                  placeholder="gpt-3.5-turbo"
                />
              </div>
            </div>
            <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
              <Button onClick={() => setShowSettings(false)} variant="primary">保存并关闭</Button>
            </div>
          </div>
        </div>
      )}

      {/* AI Task Modal */}
      {showAITask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-zinc-200 dark:border-zinc-800">
            <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">AI 指令</h3>
              <button onClick={() => setShowAITask(false)} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">提示词要求</label>
                <textarea
                  value={customPrompt}
                  onChange={e => setCustomPrompt(e.target.value)}
                  className="w-full h-32 px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-zinc-200 resize-none"
                  placeholder="例如：帮我把这段内容中的图片提示词和视频提示词，按顺序提取出来。"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">保存为快捷指令（选填）</label>
                <input
                  type="text"
                  value={shortcutName}
                  onChange={e => setShortcutName(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-zinc-200"
                  placeholder="例如：提取提示词"
                />
              </div>
            </div>
            <div className="px-6 py-4 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-100 dark:border-zinc-800 flex justify-end gap-3">
              <Button onClick={() => setShowAITask(false)} variant="ghost">取消</Button>
              <Button onClick={handleExecuteCustomTask} variant="gradient" isLoading={processingId === 'main'}>执行任务</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}