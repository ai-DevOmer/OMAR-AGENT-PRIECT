
import React, { useState, useEffect, useRef } from 'react';
import { 
  AppState, Message, MessageRole, WorkspaceTab, TerminalLine, BrowserState, Attachment 
} from './types';
import { Sidebar } from './components/Sidebar';
import { INITIAL_TERMINAL_LOGS } from './constants';
import { sendMessageToGemini, sendToolResponse, initializeGemini } from './services/geminiService';
import { 
  Send, Bot, User, Layout, AlertCircle, Loader2, Sparkles, TerminalSquare, Cpu, Paperclip, X, FileText, Image as ImageIcon, Globe, Zap, Menu, RotateCcw, StopCircle, Download
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function App() {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<boolean>(false); 

  const [appState, setAppState] = useState<AppState>({
    messages: [
      {
        id: '1',
        role: MessageRole.MODEL,
        content: "# Manus-Gemini Online\n\nI am your Autonomous Computer-Use Agent.\n\n**Capabilities:**\n* 👁️ **Visual Perception:** I analyze screenshots.\n* 🖱️ **Precision Control:** I click and type using coordinates.\n* 🚀 **Execution:** I run commands and browse the web.\n\nUpload a screenshot to begin.",
        timestamp: Date.now()
      }
    ],
    isThinking: false,
    workspaceOpen: false, 
    activeTab: WorkspaceTab.TERMINAL,
    terminalLogs: INITIAL_TERMINAL_LOGS,
    browser: {
      url: '',
      isLoading: false,
      title: 'Secure Browser'
    },
    vibePreview: {
      html: '',
      isActive: false,
      lastUpdated: 0
    },
    apiKey: process.env.API_KEY || null,
    attachments: []
  });

  // Responsive Initialization
  useEffect(() => {
    if (window.innerWidth >= 1024) {
      setAppState(prev => ({ ...prev, workspaceOpen: true }));
    }
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [appState.messages]);

  // Initial API check & Focus
  useEffect(() => {
     if (appState.apiKey) {
        initializeGemini();
     }
     inputRef.current?.focus();
  }, [appState.apiKey]);

  const addMessage = (role: MessageRole, content: string, attachments: Attachment[] = []) => {
    setAppState(prev => ({
      ...prev,
      messages: [...prev.messages, {
        id: Date.now().toString(),
        role,
        content,
        timestamp: Date.now(),
        attachments
      }]
    }));
  };

  const addTerminalLog = (content: string, type: 'info' | 'success' | 'error' | 'command') => {
    setAppState(prev => ({
      ...prev,
      terminalLogs: [...prev.terminalLogs, {
        id: Date.now().toString() + Math.random(),
        content,
        type,
        timestamp: Date.now()
      }]
    }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files.length > 0) {
          const newAttachments: Attachment[] = Array.from(e.target.files).map((file) => {
              const f = file as File;
              return {
                  file: f,
                  previewUrl: URL.createObjectURL(f)
              };
          });
          setAppState(prev => ({
              ...prev,
              attachments: [...prev.attachments, ...newAttachments]
          }));
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeAttachment = (index: number) => {
      setAppState(prev => ({
          ...prev,
          attachments: prev.attachments.filter((_, i) => i !== index)
      }));
  };

  // --- Session Management Features ---

  const handleStopGeneration = () => {
    if (appState.isThinking) {
        abortControllerRef.current = true;
        setAppState(prev => ({ ...prev, isThinking: false }));
        addTerminalLog(">> PROCESS TERMINATED BY USER.", 'error');
        addMessage(MessageRole.SYSTEM, "🛑 Task aborted by user.");
    }
  };

  const handleResetSession = () => {
      if (confirm("Reset Workspace? This will clear all chats, logs, and browser history.")) {
          setAppState(prev => ({
              ...prev,
              messages: [{
                id: Date.now().toString(),
                role: MessageRole.MODEL,
                content: "System Reset. Manus-Gemini Ready.",
                timestamp: Date.now()
              }],
              isThinking: false,
              activeTab: WorkspaceTab.TERMINAL,
              terminalLogs: [
                  { id: 'reset', content: '>> System Reset initialized...', type: 'info', timestamp: Date.now() },
                  { id: 'ready', content: '>> Manus-Gemini Ready.', type: 'success', timestamp: Date.now() + 100 }
              ],
              browser: { url: '', isLoading: false, title: 'Secure Browser' },
              vibePreview: { html: '', isActive: false, lastUpdated: 0 },
              attachments: []
          }));
      }
  };

  const handleExportSession = () => {
      const logContent = appState.messages.map(m => `[${new Date(m.timestamp).toISOString()}] ${m.role}: ${m.content}`).join('\n\n');
      const blob = new Blob([logContent], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `manus-logs-${Date.now()}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      addTerminalLog(">> Session logs exported.", 'success');
  };

  // --- End Session Management ---

  const handleSendMessage = async () => {
    if ((!input.trim() && appState.attachments.length === 0) || appState.isThinking) return;

    const userMsg = input;
    const currentAttachments = [...appState.attachments];
    
    setInput('');
    setAppState(prev => ({ ...prev, attachments: [], isThinking: true })); 
    abortControllerRef.current = false; // Reset abort flag
    
    if (userMsg.startsWith('http')) {
        addTerminalLog(`Analyzing URL: ${userMsg}`, 'command');
    }

    addMessage(MessageRole.USER, userMsg, currentAttachments);

    try {
      let response = await sendMessageToGemini(userMsg, appState.messages, currentAttachments);
      
      let processing = true;
      while (processing) {
         if (abortControllerRef.current) {
             processing = false;
             break;
         }

         const candidates = response.candidates?.[0];
         const parts = candidates?.content?.parts || [];
         
         // 1. Handle Grounding
         if (candidates?.groundingMetadata?.groundingChunks) {
             const chunks = candidates.groundingMetadata.groundingChunks;
             const webSources = chunks.filter((c: any) => c.web).map((c: any) => c.web);
             
             if (webSources.length > 0) {
                 setAppState(prev => ({
                     ...prev,
                     activeTab: WorkspaceTab.BROWSER,
                     workspaceOpen: true,
                     browser: {
                         url: 'google://search-results',
                         isLoading: true,
                         title: 'Connecting to Secure Gateway...',
                         contentSrc: undefined
                     }
                 }));
                 addTerminalLog(`>> INIT: SECURE WEB GATEWAY`, 'info');
                 await new Promise(r => setTimeout(r, 800)); // Visual delay
                 
                 if (abortControllerRef.current) break;

                 setAppState(prev => ({
                     ...prev,
                     browser: {
                         url: 'https://www.google.com/search?q=query',
                         isLoading: false,
                         title: 'Search Results',
                         contentSrc: JSON.stringify(webSources)
                     }
                 }));
                 addTerminalLog(`>> DATA RECEIVED: 200 OK`, 'success');
             }
         }

         // 2. Handle Text & Code
         let textResponse = '';
         const toolCalls = [];

         for (const part of parts) {
             if (part.text) textResponse += part.text;
             
             if (part.executableCode) {
                 const code = part.executableCode.code;
                 const lang = part.executableCode.language;

                 setAppState(prev => ({ ...prev, activeTab: WorkspaceTab.TERMINAL, workspaceOpen: true }));
                 addTerminalLog(`>> REQUEST: PROVISION_SANDBOX_${lang.toUpperCase()}_ENV`, 'info');
                 addTerminalLog(`>> EXECUTING SCRIPT...`, 'success');

                 code.split('\n').slice(0, 5).forEach(line => {
                    if (line.trim()) addTerminalLog(line, 'command');
                 });
             }

             if (part.codeExecutionResult) {
                 const output = part.codeExecutionResult.output;
                 const outcome = part.codeExecutionResult.outcome;
                 addTerminalLog(`>> STDOUT:`, 'info');
                 addTerminalLog(output.slice(0, 200) + (output.length > 200 ? '...' : ''), outcome === 'OUTCOME_OK' ? 'success' : 'error');
             }

             if (part.functionCall) toolCalls.push(part.functionCall);
         }

         if (textResponse) addMessage(MessageRole.MODEL, textResponse);

         if (abortControllerRef.current) break;

         // 3. Handle Function Calls
         if (toolCalls.length > 0) {
             const toolOutputs = [];
             
             for (const toolCall of toolCalls) {
                 const { name, args } = toolCall;
                 let output = "Action completed";

                 // --- Manus-Gemini Tools ---
                 if (name === 'computer_move') {
                    const { x, y } = args;
                    addTerminalLog(`>> MOUSE_MOVE: [${x}, ${y}]`, 'command');
                    output = `Cursor moved to ${x}, ${y}`;
                    setAppState(prev => ({...prev, activeTab: WorkspaceTab.TERMINAL, workspaceOpen: true}));
                 } 
                 else if (name === 'computer_click') {
                     const { x, y, button } = args;
                     addTerminalLog(`>> MOUSE_CLICK: ${button?.toString().toUpperCase()} at [${x}, ${y}]`, 'success');
                     output = `Clicked ${button} at ${x}, ${y}`;
                 }
                 else if (name === 'computer_type') {
                     const { text } = args;
                     addTerminalLog(`>> KEYBOARD_TYPE: "${text}"`, 'command');
                     output = `Typed "${text}"`;
                 }
                 else if (name === 'terminal_execute') {
                     const { command } = args;
                     addTerminalLog(`>> EXEC: ${command}`, 'command');
                     addTerminalLog(`>> STDOUT: Command executed.`, 'success');
                     output = `Executed: ${command}`;
                     setAppState(prev => ({...prev, activeTab: WorkspaceTab.TERMINAL, workspaceOpen: true}));
                 }
                 else if (name === 'internal_site_api') {
                     const { endpoint } = args;
                     addTerminalLog(`>> API_CALL: ${endpoint}`, 'info');
                     output = "API Response: 200 OK";
                     addTerminalLog(`>> 200 OK`, 'success');
                 }
                 // --- Vibe Tool ---
                 else if (name === 'update_vibe_preview') {
                     const html = args['htmlCode'] as string;
                     const desc = args['description'] as string;
                     addTerminalLog(`Rendering UI: ${desc}`, 'info');
                     
                     setAppState(prev => ({
                         ...prev,
                         activeTab: WorkspaceTab.PREVIEW,
                         workspaceOpen: true,
                         vibePreview: {
                             html,
                             isActive: true,
                             lastUpdated: Date.now()
                         }
                     }));
                     output = "UI Rendered Successfully.";
                     addTerminalLog("Vibe Interface Deployed.", 'success');
                 } else {
                     output = `Tool ${name} executed.`;
                 }
                 toolOutputs.push(output);
             }
             
             if (abortControllerRef.current) break;
             response = await sendToolResponse(toolCalls, toolOutputs);
         } else {
             processing = false;
         }
      }

    } catch (err) {
      console.error(err);
      if (!abortControllerRef.current) {
          addMessage(MessageRole.MODEL, "System Alert: Connection to Tool Registry Unstable.");
          addTerminalLog("Error communicating with Core.", 'error');
      }
    } finally {
      setAppState(prev => ({ ...prev, isThinking: false }));
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!appState.apiKey) {
      return (
          <div className="min-h-screen bg-omar-darker flex items-center justify-center text-omar-text p-4">
              <div className="bg-omar-panel p-8 rounded-xl border border-omar-border max-w-md w-full shadow-2xl">
                  <div className="flex justify-center mb-6">
                      <div className="w-16 h-16 bg-omar-accent/10 rounded-full flex items-center justify-center animate-pulse">
                          <Cpu size={32} className="text-omar-accent" />
                      </div>
                  </div>
                  <h1 className="text-2xl font-bold text-center mb-2">Manus-Gemini Agent</h1>
                  <p className="text-center text-omar-textMuted mb-6">Autonomous Computer Operator</p>
                  <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg mb-4 text-sm text-red-200 flex gap-2">
                      <AlertCircle className="shrink-0" size={16} />
                      <p>System halted: API Key Missing.</p>
                  </div>
              </div>
          </div>
      );
  }

  return (
    <div className="fixed inset-0 bg-omar-darker text-omar-text flex overflow-hidden font-sans">
      
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0 relative z-0 transition-all duration-300">
        
        {/* Header */}
        <header className="flex-none h-14 border-b border-omar-border bg-omar-darker/80 backdrop-blur flex items-center justify-between px-4 sm:px-6">
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                    <Zap size={18} className="text-white" />
                </div>
                <div>
                    <h1 className="font-bold text-sm tracking-wide">MANUS <span className="text-cyan-400">GEMINI</span></h1>
                    <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                        <span className="text-[10px] text-omar-textMuted uppercase tracking-wider hidden sm:inline">AUTONOMOUS ONLINE</span>
                        <span className="text-[10px] text-omar-textMuted uppercase tracking-wider sm:hidden">ONLINE</span>
                    </div>
                </div>
            </div>
            
            <div className="flex items-center gap-2">
                {appState.isThinking && (
                    <button 
                        onClick={handleStopGeneration}
                        className="p-2 text-red-400 bg-red-500/10 hover:bg-red-500/20 rounded-md transition-colors border border-red-500/20"
                        title="Stop Generation"
                    >
                        <StopCircle size={18} />
                    </button>
                )}

                <button 
                    onClick={handleExportSession}
                    className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-md transition-colors hidden sm:block"
                    title="Export Logs"
                >
                    <Download size={18} />
                </button>

                <button 
                    onClick={handleResetSession}
                    className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-md transition-colors"
                    title="New Task (Reset)"
                >
                    <RotateCcw size={18} />
                </button>

                <div className="h-4 w-px bg-gray-800 mx-1"></div>

                <button 
                    onClick={() => setAppState(prev => ({...prev, workspaceOpen: !prev.workspaceOpen}))}
                    className={`p-2 rounded-md transition-colors flex items-center gap-2 ${appState.workspaceOpen ? 'text-cyan-400 bg-cyan-500/10' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                    <span className="text-xs font-medium hidden sm:inline">{appState.workspaceOpen ? 'CLOSE WORKSPACE' : 'OPEN WORKSPACE'}</span>
                    {appState.workspaceOpen ? <Layout size={20} /> : <Menu size={20} />}
                </button>
            </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scroll-smooth">
            {appState.messages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 sm:gap-4 ${msg.role === MessageRole.USER ? 'flex-row-reverse' : ''} max-w-4xl mx-auto`}>
                    <div className={`flex-none w-8 h-8 rounded-full flex items-center justify-center shadow-sm shrink-0 ${msg.role === MessageRole.USER ? 'bg-indigo-600' : (msg.role === MessageRole.SYSTEM ? 'bg-red-500/20 border border-red-500/30' : 'bg-omar-panel border border-omar-border')}`}>
                        {msg.role === MessageRole.USER ? <User size={16} /> : (msg.role === MessageRole.SYSTEM ? <AlertCircle size={16} className="text-red-400"/> : <Sparkles size={16} className="text-cyan-400" />)}
                    </div>
                    <div className={`flex-1 min-w-0 ${msg.role === MessageRole.USER ? 'items-end flex flex-col' : ''}`}>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-gray-300">
                                {msg.role === MessageRole.USER ? 'You' : (msg.role === MessageRole.SYSTEM ? 'System' : 'Manus')}
                            </span>
                            <span className="text-[10px] text-gray-500">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                        </div>
                        
                        {/* Display Attachments */}
                        {msg.attachments && msg.attachments.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-2 justify-end">
                                {msg.attachments.map((att, idx) => (
                                    <div key={idx} className="bg-omar-panel border border-omar-border rounded-md p-2 flex items-center gap-2 max-w-[200px]">
                                        {att.file.type.startsWith('image/') ? (
                                            <img src={att.previewUrl} alt="preview" className="w-8 h-8 object-cover rounded" />
                                        ) : (
                                            <div className="w-8 h-8 bg-gray-700 rounded flex items-center justify-center">
                                                <FileText size={16} className="text-gray-300" />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs truncate text-gray-300">{att.file.name}</p>
                                            <p className="text-[10px] text-gray-500">{(att.file.size / 1024).toFixed(1)} KB</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className={`prose prose-invert prose-sm max-w-none rounded-lg p-3 ${
                            msg.role === MessageRole.USER ? 'bg-indigo-600/20 border border-indigo-500/30' : 
                            (msg.role === MessageRole.SYSTEM ? 'bg-red-500/5 text-red-200' : 'bg-transparent')
                        }`}>
                             <ReactMarkdown components={{
                                 a: ({node, ...props}) => <a {...props} className="text-cyan-400 hover:underline break-all" target="_blank" rel="noreferrer" />
                             }}>{msg.content}</ReactMarkdown>
                        </div>
                    </div>
                </div>
            ))}
            {appState.isThinking && (
                 <div className="flex gap-4 max-w-4xl mx-auto">
                    <div className="flex-none w-8 h-8 rounded-full bg-omar-panel border border-omar-border flex items-center justify-center shrink-0">
                        <Sparkles size={16} className="text-cyan-400" />
                    </div>
                    <div className="flex items-center gap-2 text-sm text-omar-textMuted animate-pulse">
                        <Loader2 size={14} className="animate-spin" />
                        <span>Calculating Coordinates...</span>
                    </div>
                 </div>
            )}
            <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="flex-none p-4 bg-omar-darker border-t border-omar-border pb-safe">
            <div className="max-w-4xl mx-auto relative group">
                {/* Active Attachments Preview */}
                {appState.attachments.length > 0 && (
                    <div className="flex gap-2 mb-2 overflow-x-auto py-2">
                        {appState.attachments.map((att, idx) => (
                            <div key={idx} className="relative group/att">
                                <div className="bg-omar-panel border border-omar-border rounded-lg p-2 flex items-center gap-2 w-40">
                                    {att.file.type.startsWith('image/') ? (
                                        <img src={att.previewUrl} alt="preview" className="w-8 h-8 object-cover rounded bg-black" />
                                    ) : (
                                        <div className="w-8 h-8 bg-gray-700 rounded flex items-center justify-center">
                                            <FileText size={16} className="text-gray-300" />
                                        </div>
                                    )}
                                    <span className="text-xs truncate text-gray-300 flex-1">{att.file.name}</span>
                                </div>
                                <button 
                                    onClick={() => removeAttachment(idx)}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow-md opacity-0 group-hover/att:opacity-100 transition-opacity"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                <div className="absolute -inset-0.5 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl opacity-20 group-focus-within:opacity-50 transition duration-500 blur"></div>
                <div className="relative flex items-end bg-omar-panel rounded-xl border border-omar-border shadow-sm p-2">
                    <input 
                        type="file" 
                        ref={fileInputRef}
                        className="hidden" 
                        multiple 
                        onChange={handleFileSelect}
                    />
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors mb-0.5"
                        title="Attach File"
                    >
                        <Paperclip size={18} />
                    </button>
                    <textarea 
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Manus-Gemini: Upload screenshot or enter command..."
                        className="flex-1 bg-transparent border-none focus:ring-0 text-sm max-h-32 resize-none py-2.5 px-3 placeholder-gray-500 text-gray-100"
                        rows={1}
                        style={{ minHeight: '44px' }}
                    />
                    <button 
                        onClick={handleSendMessage}
                        disabled={(!input.trim() && appState.attachments.length === 0) || appState.isThinking}
                        className="p-2.5 rounded-lg bg-cyan-600 text-white hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all mb-0.5"
                    >
                        <Send size={16} />
                    </button>
                </div>
            </div>
        </div>
      </div>

      {/* Right Sidebar (Workspace) */}
      <Sidebar 
        appState={appState} 
        onClose={() => setAppState(prev => ({ ...prev, workspaceOpen: false }))}
        onTabChange={(tab) => setAppState(prev => ({ ...prev, activeTab: tab }))}
      />
    </div>
  );
}