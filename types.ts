
export enum MessageRole {
  USER = 'user',
  MODEL = 'model',
  SYSTEM = 'system'
}

export interface Attachment {
  file: File;
  previewUrl: string;
  base64?: string;
}

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  isError?: boolean;
  attachments?: Attachment[];
}

export enum WorkspaceTab {
  TERMINAL = 'TERMINAL',
  BROWSER = 'BROWSER',
  PREVIEW = 'PREVIEW'
}

export interface TerminalLine {
  id: string;
  content: string;
  type: 'info' | 'success' | 'error' | 'command';
  timestamp: number;
}

export interface BrowserState {
  url: string;
  isLoading: boolean;
  title: string;
  contentSrc?: string; // Placeholder image or content
}

export interface VibePreviewState {
  html: string;
  isActive: boolean;
  lastUpdated: number;
}

export interface AppState {
  messages: Message[];
  isThinking: boolean;
  workspaceOpen: boolean;
  activeTab: WorkspaceTab;
  terminalLogs: TerminalLine[];
  browser: BrowserState;
  vibePreview: VibePreviewState;
  apiKey: string | null;
  attachments: Attachment[];
}
