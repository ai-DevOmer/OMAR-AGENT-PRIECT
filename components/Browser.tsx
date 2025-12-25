
import React from 'react';
import { BrowserState } from '../types';
import { RotateCw, ChevronLeft, ChevronRight, Lock, Search, ExternalLink, ShieldCheck, Wifi } from 'lucide-react';

interface BrowserProps {
  browserState: BrowserState;
}

export const Browser: React.FC<BrowserProps> = ({ browserState }) => {
  const { url, isLoading, contentSrc, title } = browserState;

  // Check if contentSrc contains search results (passed as JSON string in this architecture)
  let searchResults: any[] = [];
  let isSearchMode = false;

  try {
    if (contentSrc && contentSrc.startsWith('[{')) {
      searchResults = JSON.parse(contentSrc);
      isSearchMode = true;
    }
  } catch (e) {
    // Not JSON, treat as standard image/iframe src
  }

  return (
    <div className="h-full flex flex-col bg-gray-100 rounded-lg overflow-hidden border border-omar-border font-sans shadow-xl">
      {/* Browser Chrome/Header */}
      <div className="bg-gray-200 border-b border-gray-300 p-2 flex items-center gap-2 select-none">
        <div className="flex gap-1.5 mr-2">
          <div className="w-3 h-3 rounded-full bg-red-500 border border-red-600"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-500 border border-yellow-600"></div>
          <div className="w-3 h-3 rounded-full bg-green-500 border border-green-600"></div>
        </div>
        <div className="flex gap-3 text-gray-500 px-2">
           <ChevronLeft size={18} className="cursor-not-allowed opacity-50"/>
           <ChevronRight size={18} className="cursor-not-allowed opacity-50"/>
           <RotateCw size={16} className={`text-gray-600 ${isLoading ? "animate-spin" : ""}`} />
        </div>
        <div className="flex-1 bg-white rounded-md px-3 py-1.5 text-xs text-gray-700 flex items-center gap-2 border border-gray-300 shadow-sm">
            {isLoading ? <Wifi size={12} className="text-amber-500 animate-pulse" /> : <Lock size={12} className="text-green-600" />}
            <span className="truncate flex-1 font-mono">{url || "about:blank"}</span>
            {isLoading && <span className="text-gray-400 text-[10px]">TLS Handshake...</span>}
        </div>
      </div>

      {/* Browser Viewport */}
      <div className="flex-1 bg-white relative overflow-hidden flex flex-col">
        {isLoading && (
            <div className="absolute inset-0 bg-white/90 z-20 flex items-center justify-center backdrop-blur-sm">
                <div className="flex flex-col items-center gap-4 animate-in fade-in duration-300">
                    <div className="relative">
                        <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-600 rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <ShieldCheck size={16} className="text-blue-600" />
                        </div>
                    </div>
                    <div className="text-center">
                         <span className="text-sm font-semibold text-gray-700 block">Establish Secure Tunnel</span>
                         <span className="text-xs text-gray-500 block mt-1">Routing via Proxy 104.23.xx.xx</span>
                    </div>
                </div>
            </div>
        )}
        
        {url === '' && !contentSrc && !isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-300 bg-gray-50">
                <div className="w-20 h-20 bg-white rounded-2xl shadow-sm border border-gray-200 flex items-center justify-center mb-6">
                  <Search size={40} className="text-blue-500 opacity-80" />
                </div>
                <h3 className="text-lg font-semibold text-gray-600 mb-1">Secure Browser Ready</h3>
                <p className="text-sm text-gray-400 max-w-xs text-center">
                    Waiting for navigation command. <br/>
                    Ask Omar to "Search for..." or "Go to..."
                </p>
                <div className="mt-8 flex gap-4 opacity-50">
                    <div className="w-12 h-2 bg-gray-200 rounded"></div>
                    <div className="w-12 h-2 bg-gray-200 rounded"></div>
                    <div className="w-12 h-2 bg-gray-200 rounded"></div>
                </div>
            </div>
        ) : isSearchMode ? (
            <div className="w-full h-full overflow-auto bg-white">
                {/* Simulated Google Header */}
                <div className="border-b border-gray-100 p-4 sticky top-0 bg-white/95 backdrop-blur z-10 flex items-center justify-between">
                     <div className="flex items-center gap-2">
                        <img src="https://www.google.com/favicon.ico" className="w-6 h-6" alt="Google" />
                        <div className="h-8 w-64 bg-gray-100 rounded-full flex items-center px-4">
                            <span className="text-sm text-gray-500 truncate">{url.replace('https://www.google.com/search?q=', '').replace('google://search-results', 'Search Query')}</span>
                        </div>
                     </div>
                     <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">O</div>
                </div>

                <div className="max-w-3xl mx-auto p-6 animate-in slide-in-from-bottom-2 duration-500">
                    <p className="text-xs text-gray-400 mb-4">About {searchResults.length} results (0.34 seconds)</p>
                    <div className="space-y-8">
                        {searchResults.map((result: any, idx: number) => (
                            <div key={idx} className="group cursor-pointer">
                                <a href={result.uri} target="_blank" rel="noopener noreferrer" className="block">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-[10px] text-gray-500 uppercase font-bold">
                                            {result.title.charAt(0)}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] text-gray-800 font-medium line-clamp-1">{new URL(result.uri).hostname}</span>
                                            <span className="text-[10px] text-gray-400 truncate max-w-[200px]">{result.uri}</span>
                                        </div>
                                    </div>
                                    <div className="text-blue-700 text-lg font-medium group-hover:underline leading-snug mb-1">
                                        {result.title}
                                    </div>
                                    <div className="text-sm text-gray-600 leading-relaxed line-clamp-2">
                                        {result.htmlContent || "No description available for this result."}
                                    </div>
                                </a>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        ) : (
            <div className="w-full h-full overflow-auto bg-slate-50 relative">
                {contentSrc && <img src={contentSrc} alt="Web Page Content" className="w-full object-cover min-h-full" />}
            </div>
        )}
      </div>
      
      {/* Status Bar */}
      <div className="bg-gray-100 border-t border-gray-200 px-3 py-1 flex justify-between items-center text-[10px] text-gray-500">
          <span>JavaScript: Enabled</span>
          <span className="flex items-center gap-1"><ShieldCheck size={10} className="text-green-600"/> Protected by OmarShield™</span>
      </div>
    </div>
  );
};
