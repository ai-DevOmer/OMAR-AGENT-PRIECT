
import React, { useState } from 'react';
import { VibePreviewState } from '../types';
import { Code, Eye, Copy, Check, Terminal, FileCode } from 'lucide-react';

interface VibePreviewProps {
  previewState: VibePreviewState;
}

export const VibePreview: React.FC<VibePreviewProps> = ({ previewState }) => {
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(previewState.html);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e] rounded-lg border border-omar-border overflow-hidden font-sans">
        {/* Vibe Toolbar */}
        <div className="flex-none bg-omar-darker text-gray-400 p-2 flex items-center justify-between border-b border-omar-border">
            <div className="flex items-center gap-2">
                <div className={`p-1 rounded ${previewState.isActive ? 'bg-green-500/20 text-green-400' : 'bg-gray-700/50'}`}>
                    <FileCode size={14} />
                </div>
                <span className="text-xs font-semibold tracking-wider uppercase">Vibe Studio</span>
            </div>
            
            <div className="flex items-center gap-1 bg-black/20 p-0.5 rounded-lg border border-white/5">
                <button 
                    onClick={() => setShowCode(false)}
                    className={`px-3 py-1 text-[10px] font-medium rounded-md transition-all flex items-center gap-1.5 ${!showCode ? 'bg-omar-accent text-white shadow-sm' : 'hover:text-white text-gray-400'}`}
                >
                    <Eye size={12} /> Preview
                </button>
                <button 
                    onClick={() => setShowCode(true)}
                    className={`px-3 py-1 text-[10px] font-medium rounded-md transition-all flex items-center gap-1.5 ${showCode ? 'bg-omar-accent text-white shadow-sm' : 'hover:text-white text-gray-400'}`}
                >
                    <Code size={12} /> Code
                </button>
            </div>

            {previewState.html && (
                <button 
                    onClick={handleCopy}
                    className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition-colors"
                    title="Copy Code"
                >
                    {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                </button>
            )}
        </div>
        
        <div className="flex-1 relative bg-[#1e1e1e] overflow-hidden">
             {previewState.html ? (
                showCode ? (
                    <div className="absolute inset-0 overflow-auto custom-scrollbar">
                        <pre className="p-4 text-xs font-mono text-gray-300 leading-relaxed">
                            <code>{previewState.html}</code>
                        </pre>
                    </div>
                ) : (
                    <iframe 
                        title="Vibe Preview"
                        srcDoc={previewState.html}
                        className="w-full h-full border-none bg-white"
                        sandbox="allow-scripts allow-modals allow-forms allow-popups allow-same-origin"
                    />
                )
             ) : (
                 <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-500 bg-[#1e1e1e]">
                     <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-4 border border-white/10">
                        <Terminal size={32} className="opacity-40" />
                     </div>
                     <p className="text-sm font-medium text-gray-400">Vibe Engine Idle</p>
                     <p className="text-xs text-gray-600 mt-2 max-w-[200px] text-center">
                        Generate UIs, Dashboards, and Apps using the chat commands.
                     </p>
                 </div>
             )}
        </div>
        
        {/* Status Footer */}
        <div className="bg-omar-darker border-t border-omar-border px-3 py-1 flex justify-between items-center text-[10px] text-gray-600 font-mono">
             <span>{previewState.html ? `${previewState.html.length} chars` : '0 chars'}</span>
             <span>{showCode ? 'READ-ONLY' : 'LIVE RENDER'}</span>
        </div>
    </div>
  );
};
