import React, { useEffect, useRef } from 'react';
import { TerminalLine } from '../types';

interface TerminalProps {
  logs: TerminalLine[];
}

export const Terminal: React.FC<TerminalProps> = ({ logs }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="h-full flex flex-col bg-black text-green-500 font-mono text-xs sm:text-sm p-4 overflow-hidden rounded-lg shadow-inner border border-omar-border">
      <div className="flex-none pb-2 border-b border-gray-800 mb-2 flex items-center justify-between">
        <span className="font-bold">omar@elite-v2:~/workspace</span>
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/20"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20"></div>
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/20"></div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto space-y-1" ref={scrollRef}>
        {logs.map((log) => (
          <div key={log.id} className={`${
            log.type === 'error' ? 'text-red-400' :
            log.type === 'command' ? 'text-yellow-300 font-bold' :
            log.type === 'success' ? 'text-emerald-400' : 'text-gray-300'
          }`}>
            <span className="opacity-50 mr-2">[{new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' })}]</span>
            {log.type === 'command' && <span className="mr-2">$</span>}
            {log.content}
          </div>
        ))}
        <div className="animate-pulse">_</div>
      </div>
    </div>
  );
};