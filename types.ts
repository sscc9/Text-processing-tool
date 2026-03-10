export enum ConversionMode {
  INSTANT = 'INSTANT',
  AI_SMART = 'AI_SMART'
}

export interface ToastState {
  show: boolean;
  message: string;
  type: 'success' | 'error' | 'info';
}

export interface AISettings {
  apiUrl: string;
  apiKey: string;
  modelId: string;
}

export interface AIShortcut {
  id: string;
  name: string;
  prompt: string;
}