# 文本处理工具 (Text Processing Tool)

一款现代化、多功能的文本处理与 AI 辅助工具，旨在为您提供高效的文本转换、信息提取以及灵活的 AI 对话能力。

## ✨ 核心特性

- 🤖 **无缝 AI 接入**: 支持通过提供 API Key 和 Model ID 直接接入包括 OpenAI、DeepSeek、Gemini 在内的主流大语言模型。
  - **原生 Gemini 支持**: 输入包含 `gemini` 的模型名称，系统将自动使用 Google 原生 SDK，提供最稳定的连接体验。
  - **智能 URL 解析**: 填入 OpenAI 兼容的 API (如 DeepSeek)，系统会自动补全和修正路径，免受 CORS 跨域困扰。
- ⚡ **极速转换 (本地)**: 瞬间剥离复杂的 Markdown 语法，将任何文档精简为最纯粹的文本，完全在本地完成，保护隐私。
- 🖼️ **词元提取 (本地)**: 能够智能识别文本中的结构化提示词（如图片提示词、视频提示词），并按类别有序提取。
- 💅 **现代化 UI/UX**: 采用 React + TailwindCSS 构建，支持极致顺滑的 Dark Mode (暗色模式) 与各种交互微动画，体验媲美顶级商用软件。
- 🏷️ **快捷指令**: 可以将常用的 AI 提示词保存为独立按钮，一键触发，提高重复工作效率。

## 🚀 快速开始

本项目使用 Vite 与 React 进行开发。

### 前置要求
- Node.js (推荐 v18+)
- npm 或 yarn 或 pnpm

### 本地运行

1. **克隆或下载项目**
2. **安装依赖**
   ```bash
   npm install
   ```
3. **启动开发服务器**
   ```bash
   npm run dev
   ```
4. 打开浏览器访问 `http://localhost:3000`

### 环境变量 (可选)
你可以在根目录创建一个 `.env.local` 文件来提供默认参数：
```env
VITE_GEMINI_API_KEY=your_default_api_key_here
```

## 🛠️ 技术栈

- **框架**: React 18, Vite
- **样式**: Tailwind CSS
- **图标**: Lucide React
- **AI 互通**: `@google/genai` (For Gemini), Native `fetch` (For OpenAI-compatible)

## 💡 使用说明

1. **基本配置**: 点击右上角的齿轮 ⚙️ 设置图标，即可填入你的 API 链接、Key 和 模型 ID。
2. **执行任务**:
   - 在主输入框内输入你想处理的文本。
   - 点击下面对应的功能按钮。
   - 选择 **“AI 指令”** 可以临时要求 AI 处理复杂的文字任务，并可选择将其保存为永久的快捷键。
3. **撤销与重做**: 在应用顶部，随时可以撤销上一次的修改，不怕误操作。

---

*这是一个由 AI 辅助打造的效率工具项目。*
