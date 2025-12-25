
import React from 'react';
import { Terminal } from './Terminal';
import { Browser } from './Browser';
import { VibePreview } from './VibePreview';
import { AppState, WorkspaceTab } from '../types';
import { TerminalSquare, Globe, LayoutTemplate, X, Cpu } from 'lucide-react';

interface SidebarProps {
  appState: AppState;
  onClose: () => void;
  onTabChange: (tab: WorkspaceTab) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ appState, onClose, onTabChange }) => {
  const { activeTab, terminalLogs, browser, vibePreview, workspaceOpen } = appState;

  // Render nothing if closed, unless we want animation (but straightforward toggle is better for performance here)
  if (!workspaceOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:relative lg:inset-auto lg:z-0 w-full lg:w-[450px] xl:w-[500px] h-full flex flex-col border-l border-omar-border bg-omar-darker/95 backdrop-blur-sm lg:bg-[#020617] shadow-2xl lg:shadow-none transition-all duration-300">
      
      {/* Sidebar Header */}
      <div className="flex-none h-14 flex items-center justify-between px-4 border-b border-omar-border bg-omar-darker">
        <div className="flex items-center gap-2 text-omar-text">
            <Cpu size={18} className="text-omar-accent" />
            <span className="font-semibold text-sm tracking-wide">VIRTUAL WORKSPACE</span>
        </div>
        <button 
            onClick={onClose} 
            className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-md transition-colors"
        >
            <X size={18} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex-none flex items-center p-2 gap-2 bg-omar-darker border-b border-omar-border">
         <button 
            onClick={() => onTabChange(WorkspaceTab.TERMINAL)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-[10px] sm:text-xs font-medium transition-all ${activeTab === WorkspaceTab.TERMINAL ? 'bg-omar-panel text-omar-accent shadow-sm ring-1 ring-omar-border' : 'text-gray-500 hover:bg-omar-panel/50 hover:text-gray-300'}`}
         >
            <TerminalSquare size={14} />
            TERMINAL
         </button>
         <button 
            onClick={() => onTabChange(WorkspaceTab.BROWSER)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-[10px] sm:text-xs font-medium transition-all ${activeTab === WorkspaceTab.BROWSER ? 'bg-omar-panel text-omar-accent shadow-sm ring-1 ring-omar-border' : 'text-gray-500 hover:bg-omar-panel/50 hover:text-gray-300'}`}
         >
            <Globe size={14} />
            BROWSER
         </button>
         <button 
            onClick={() => onTabChange(WorkspaceTab.PREVIEW)}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-[10px] sm:text-xs font-medium transition-all ${activeTab === WorkspaceTab.PREVIEW ? 'bg-omar-panel text-omar-accent shadow-sm ring-1 ring-omar-border' : 'text-gray-500 hover:bg-omar-panel/50 hover:text-gray-300'}`}
         >
            <LayoutTemplate size={14} />
            PREVIEW
         </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-3 overflow-hidden bg-[#0d1117] relative">
        {activeTab === WorkspaceTab.TERMINAL && <Terminal logs={terminalLogs} />}
        {activeTab === WorkspaceTab.BROWSER && <Browser browserState={browser} />}
        {activeTab === WorkspaceTab.PREVIEW && <VibePreview previewState={vibePreview} />}
      </div>
    </div>
  );
};
