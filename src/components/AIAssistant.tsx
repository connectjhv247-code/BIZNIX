import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  Copy, 
  RotateCcw, 
  Trash2, 
  Plus, 
  Check, 
  Briefcase, 
  TrendingUp, 
  Lightbulb, 
  Megaphone,
  User,
  Share2,
  FileCheck,
  Bookmark,
  History,
  MessageSquare,
  ChevronDown,
  Clock,
  ArrowLeft
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import { AIMessage } from '../types';

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  messages: AIMessage[];
}

const STORAGE_KEY = 'biznix_ai_chat_sessions_v2';

export const AIAssistant: React.FC = () => {
  const { user, isPro, saveProject, addToast } = useApp();

  const getInitialWelcomeMessage = (): AIMessage => ({
    id: `welcome_${Date.now()}`,
    conversation_id: 'conv_default',
    role: 'model',
    message: `Hello ${user.name || 'there'}! I am **BIZNIX**, your executive AI Business Partner.\n\nI am here to help you accelerate **${user.business_name || 'your business'}**:\n\n- 💡 **Business Ideas & Strategic Direction**\n- 🏷️ **High-Converting Business Names & Slogans**\n- 📋 **Comprehensive Business Plans & Playbooks**\n- 📢 **Omni-Channel Marketing & Ad Copy**\n- 🎯 **Target Customer Profiling & Retention**\n- 📈 **Scalable Growth & Acquisition Funnels**\n\nHow can we elevate your enterprise today?`,
    created_at: new Date().toISOString(),
  });

  // Load chat sessions from localStorage or initialize with default session
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Could not parse saved chat sessions:', e);
    }
    const defaultSessionId = `session_${Date.now()}`;
    return [
      {
        id: defaultSessionId,
        title: 'New Executive Chat',
        createdAt: new Date().toISOString(),
        messages: [
          {
            id: 'welcome_msg',
            conversation_id: defaultSessionId,
            role: 'model',
            message: `Hello ${user.name || 'there'}! I am **BIZNIX**, your executive AI Business Partner.\n\nI am here to help you accelerate **${user.business_name || 'your business'}**:\n\n- 💡 **Business Ideas & Strategic Direction**\n- 🏷️ **High-Converting Business Names & Slogans**\n- 📋 **Comprehensive Business Plans & Playbooks**\n- 📢 **Omni-Channel Marketing & Ad Copy**\n- 🎯 **Target Customer Profiling & Retention**\n- 📈 **Scalable Growth & Acquisition Funnels**\n\nHow can we elevate your enterprise today?`,
            created_at: new Date().toISOString(),
          }
        ]
      }
    ];
  });

  const [activeSessionId, setActiveSessionId] = useState<string>(() => {
    return sessions[0]?.id || `session_${Date.now()}`;
  });

  // UI Dropdown / Modal state for New Chat & Previous Chats options
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Sync sessions to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch (e) {
      console.warn('Unable to persist chat sessions:', e);
    }
  }, [sessions]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Find active session
  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];
  const messages = activeSession ? activeSession.messages : [];

  const quickPrompts = [
    { label: 'Generate Marketing Strategy', text: `Create a high-impact 30-day marketing strategy for ${user.business_name || 'my business'} in ${user.business_category || 'our industry'}, focusing on WhatsApp and social discovery.` },
    { label: 'Craft Business Plan', text: `Write an executive business plan outline for ${user.business_name || 'my venture'}, detailing target customers, products/services, marketing, operations, and growth roadmaps.` },
    { label: 'Pricing Strategy', text: `Recommend a high-converting premium pricing and packaging strategy for our products/services to maximize customer perceived value.` },
    { label: 'Viral Social Campaign', text: `Give me 5 viral social media content ideas and hook scripts for Instagram and TikTok to promote our brand.` },
    { label: 'Customer Retention Playbook', text: `How can we build a VIP customer retention program on WhatsApp that increases repeat orders by 40%?` },
    { label: 'Competitor Analysis Guide', text: `Provide a step-by-step framework to identify and out-position top competitors in our market.` },
  ];

  const scrollToBottom = () => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // Create a brand new chat session
  const handleStartNewChat = () => {
    const newSessionId = `session_${Date.now()}`;
    const newSession: ChatSession = {
      id: newSessionId,
      title: `New Chat (${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`,
      createdAt: new Date().toISOString(),
      messages: [getInitialWelcomeMessage()]
    };

    setSessions(prev => [newSession, ...prev]);
    setActiveSessionId(newSessionId);
    setIsMenuOpen(false);
    setInputMessage('');
    addToast('Opened new chat page in chat box.', 'success');
  };

  // Switch to a previous chat session
  const handleSelectPreviousChat = (sessionId: string) => {
    setActiveSessionId(sessionId);
    setIsMenuOpen(false);
    const targetSession = sessions.find(s => s.id === sessionId);
    addToast(`Loaded previous chat: "${targetSession?.title || 'Chat'}"`, 'info');
  };

  // Delete a specific session from history
  const handleDeleteSession = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (sessions.length <= 1) {
      // Clear current session messages instead of deleting the last session
      const newSessionId = `session_${Date.now()}`;
      setSessions([{
        id: newSessionId,
        title: 'New Executive Chat',
        createdAt: new Date().toISOString(),
        messages: [getInitialWelcomeMessage()]
      }]);
      setActiveSessionId(newSessionId);
      addToast('Conversation reset.', 'info');
      return;
    }

    const filtered = sessions.filter(s => s.id !== sessionId);
    setSessions(filtered);
    if (activeSessionId === sessionId) {
      setActiveSessionId(filtered[0].id);
    }
    addToast('Previous chat deleted from history.', 'info');
  };

  const handleSend = async (overrideText?: string) => {
    const text = (overrideText || inputMessage).trim();
    if (!text || isTyping) return;

    const userMsg: AIMessage = {
      id: `usr_${Date.now()}`,
      conversation_id: activeSessionId,
      role: 'user',
      message: text,
      created_at: new Date().toISOString(),
    };

    // Update session messages and update session title if this is the first user prompt
    setSessions(prev => prev.map(s => {
      if (s.id === activeSessionId) {
        const isDefaultTitle = s.title.startsWith('New Chat') || s.title === 'New Executive Chat';
        const newTitle = isDefaultTitle ? (text.length > 30 ? `${text.slice(0, 30)}...` : text) : s.title;
        return {
          ...s,
          title: newTitle,
          messages: [...s.messages, userMsg]
        };
      }
      return s;
    }));

    setInputMessage('');
    setIsTyping(true);

    try {
      const historyPayload = [...messages, userMsg].map(m => ({
        role: m.role,
        content: m.message,
      }));

      const reply = await api.sendChatMessage({
        messages: historyPayload,
        conversationId: activeSessionId,
        userContext: {
          businessName: user.business_name,
          businessCategory: user.business_category,
        },
      });

      const modelMsg: AIMessage = {
        id: `ai_${Date.now()}`,
        conversation_id: activeSessionId,
        role: 'model',
        message: reply,
        created_at: new Date().toISOString(),
      };

      setSessions(prev => prev.map(s => {
        if (s.id === activeSessionId) {
          return {
            ...s,
            messages: [...s.messages, modelMsg]
          };
        }
        return s;
      }));
    } catch (err: any) {
      addToast(err.message || 'AI Assistant is temporarily unavailable.', 'error');
    } finally {
      setIsTyping(false);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    addToast('Response copied to clipboard!', 'info');
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleRegenerate = async () => {
    const lastUserIdx = messages.map(m => m.role).lastIndexOf('user');
    if (lastUserIdx === -1) return;

    const trimmed = messages.slice(0, lastUserIdx + 1);
    setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: trimmed } : s));
    setIsTyping(true);

    try {
      const historyPayload = trimmed.map(m => ({
        role: m.role,
        content: m.message,
      }));

      const reply = await api.sendChatMessage({
        messages: historyPayload,
        conversationId: activeSessionId,
        userContext: {
          businessName: user.business_name,
          businessCategory: user.business_category,
        },
      });

      const modelMsg: AIMessage = {
        id: `ai_${Date.now()}`,
        conversation_id: activeSessionId,
        role: 'model',
        message: reply,
        created_at: new Date().toISOString(),
      };

      setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: [...s.messages, modelMsg] } : s));
    } catch (err: any) {
      addToast(err.message || 'Could not regenerate response.', 'error');
    } finally {
      setIsTyping(false);
    }
  };

  const handleSaveAsDocument = (text: string) => {
    saveProject({
      type: 'business_plan',
      title: `Executive Note: ${text.slice(0, 30)}...`,
      data: {
        content: text,
        category: 'Assistant Strategy Note',
        created_at: new Date().toISOString(),
      },
    });
    addToast('Strategic note saved to My Projects!', 'success');
  };

  const handleClearCurrentSession = () => {
    if (window.confirm('Clear messages in this conversation?')) {
      setSessions(prev => prev.map(s => {
        if (s.id === activeSessionId) {
          return {
            ...s,
            messages: [getInitialWelcomeMessage()]
          };
        }
        return s;
      }));
      addToast('Conversation cleared.', 'info');
    }
  };

  // Find previous chats (excluding active session)
  const previousChats = sessions.filter(s => s.id !== activeSessionId);

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0B1728] p-5 rounded-3xl border border-amber-500/20 shadow-[0_6px_24px_rgba(0,0,0,0.4)] relative">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700 p-[1.5px] shadow-md shadow-amber-500/20 overflow-hidden shrink-0">
            <img 
              src="/biznix_logo.png" 
              alt="BIZNIX AI" 
              className="w-full h-full object-cover rounded-[14px]"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-xl font-bold text-white tracking-tight">
                BIZNIX AI Assistant
              </h2>
              <span className="gold-badge shadow-xs">
                ⭐ 24/7 Advisor
              </span>
            </div>
            <p className="text-xs text-sky-300/80">
              {activeSession ? activeSession.title : 'Executive AI Business Consultant'}
            </p>
          </div>
        </div>

        {/* Chat Control Actions: [New Chat / Previous Dropdown], [Clear] */}
        <div className="flex items-center gap-2 self-end sm:self-auto relative" ref={menuRef}>
          
          {/* New Chat & History Button */}
          <button
            onClick={() => setIsMenuOpen(prev => !prev)}
            id="assistant-new-chat-btn"
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-300 hover:to-amber-500 text-[#060D19] text-xs font-extrabold flex items-center gap-2 shadow-md shadow-amber-500/20 transition-all cursor-pointer"
            title="Open New Chat or Select Previous Chats"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>New Chat</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          <button
            onClick={handleClearCurrentSession}
            id="assistant-clear-btn"
            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 transition-colors cursor-pointer"
            title="Clear Conversation"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {/* New Chat & Previous Chats Dropdown Menu */}
          {isMenuOpen && (
            <div className="absolute right-0 top-12 w-72 sm:w-80 rounded-2xl bg-[#081220] border border-amber-500/30 shadow-[0_10px_30px_rgba(0,0,0,0.8)] p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              
              {/* Option 1: Start New Chat */}
              <button
                onClick={handleStartNewChat}
                className="w-full p-2.5 rounded-xl bg-[#0F223D] hover:bg-[#152B4D] border border-amber-400/40 text-amber-300 text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer text-left mb-2 shadow-xs group"
              >
                <div className="w-7 h-7 rounded-lg bg-amber-400/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                  <Plus className="w-4 h-4 stroke-[3]" />
                </div>
                <div>
                  <div className="font-extrabold text-white">Open New Chat</div>
                  <div className="text-[10px] text-sky-300/60 font-normal">Start fresh conversation in this chat box</div>
                </div>
              </button>

              <div className="px-2 py-1 flex items-center justify-between text-[10px] font-extrabold uppercase text-sky-400 tracking-wider border-t border-sky-500/15 pt-2">
                <span className="flex items-center gap-1">
                  <History className="w-3 h-3 text-amber-400" />
                  <span>Previous Chats ({sessions.length})</span>
                </span>
                <span className="text-sky-300/40 text-[9px] font-normal">Click to restore</span>
              </div>

              {/* Sessions List */}
              <div className="max-h-60 overflow-y-auto space-y-1 mt-1 pr-0.5">
                {sessions.map((s) => {
                  const isActive = s.id === activeSessionId;
                  const messageCount = s.messages.filter(m => m.role === 'user').length;
                  return (
                    <div
                      key={s.id}
                      onClick={() => handleSelectPreviousChat(s.id)}
                      className={`group flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer transition-all border ${
                        isActive
                          ? 'bg-[#0F223D] border-amber-400/60 text-amber-300 font-bold shadow-xs'
                          : 'bg-[#060D19]/60 hover:bg-[#0F223D]/80 border-sky-500/10 hover:border-sky-500/30 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-amber-400' : 'text-sky-400/70'}`} />
                        <div className="truncate">
                          <p className="truncate text-xs leading-tight">{s.title}</p>
                          <p className="text-[10px] text-sky-300/50 font-normal flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            <span>{new Date(s.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })} • {messageCount} prompts</span>
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={(e) => handleDeleteSession(e, s.id)}
                        className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-opacity ml-1 shrink-0"
                        title="Delete chat from history"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

        </div>
      </div>

      {/* If in a new chat and there are previous chats, offer a quick "Back to Previous Chat" shortcut banner */}
      {previousChats.length > 0 && (
        <div className="p-2.5 px-4 rounded-2xl bg-[#081220] border border-sky-500/15 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 truncate text-sky-300/80">
            <History className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">
              Active: <strong className="text-white">{activeSession?.title}</strong> ({messages.length} messages)
            </span>
          </div>
          <button
            onClick={() => setIsMenuOpen(true)}
            className="text-[11px] font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer shrink-0"
          >
            <span>Switch or View Previous Chats ({previousChats.length})</span>
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Suggested Prompt Chips */}
      <div className="overflow-x-auto pb-1 -mx-1 px-1 flex items-center gap-2 no-scrollbar">
        {quickPrompts.map((qp, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(qp.text)}
            className="whitespace-nowrap px-3.5 py-2 rounded-xl bg-[#0B1728] hover:bg-[#0F223D] border border-sky-500/15 hover:border-amber-400/50 text-xs font-bold text-sky-200 hover:text-amber-300 shadow-xs transition-all shrink-0 flex items-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3 h-3 text-amber-400 fill-amber-400" />
            <span>{qp.label}</span>
          </button>
        ))}
      </div>

      {/* Main Conversation Stream Box */}
      <div className="rounded-3xl bg-[#0B1728] border border-amber-500/20 p-4 sm:p-6 shadow-[0_6px_24px_rgba(0,0,0,0.5)] min-h-[480px] max-h-[620px] flex flex-col justify-between overflow-hidden">
        
        {/* Messages List */}
        <div className="space-y-4 overflow-y-auto pr-1 sm:pr-2 flex-1">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {/* AI Avatar */}
                {!isUser && (
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-300 via-amber-500 to-amber-700 p-[1px] text-white flex items-center justify-center shrink-0 shadow-xs mt-1 overflow-hidden">
                    <img 
                      src="/biznix_logo.png" 
                      alt="BIZNIX" 
                      className="w-full h-full object-cover rounded-[10px]"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}

                {/* Message Bubble */}
                <div
                  className={`relative max-w-[88%] sm:max-w-[78%] rounded-2xl p-4 text-xs sm:text-sm leading-relaxed shadow-xs ${
                    isUser
                      ? 'gold-gradient-btn text-[#060D19] rounded-tr-xs font-semibold'
                      : 'bg-[#081220] border-l-4 border-amber-400 border-t border-r border-b border-sky-500/15 text-slate-100 rounded-tl-xs'
                  }`}
                >
                  <div className="whitespace-pre-wrap font-sans">
                    {msg.message}
                  </div>

                  {/* Message Action Footer */}
                  {!isUser && (
                    <div className="mt-3 pt-2.5 border-t border-sky-900/40 flex items-center justify-between text-[11px] text-sky-300/70">
                      <span className="font-extrabold text-amber-400">
                        BIZNIX
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCopy(msg.message, msg.id)}
                          className="hover:text-white flex items-center gap-1 cursor-pointer font-medium transition-colors"
                          title="Copy message"
                        >
                          {copiedId === msg.id ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                        </button>

                        <button
                          onClick={() => handleSaveAsDocument(msg.message)}
                          className="hover:text-amber-400 flex items-center gap-1 cursor-pointer font-medium transition-colors"
                          title="Save as business document in Projects"
                        >
                          <Bookmark className="w-3 h-3" />
                          <span>Save Doc</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* User Avatar */}
                {isUser && (
                  <div className="w-8 h-8 rounded-xl bg-[#0F223D] border border-sky-500/20 text-sky-300 flex items-center justify-center shrink-0 mt-1 shadow-xs">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {/* AI Typing Indicator */}
          {isTyping && (
            <div className="flex gap-3 justify-start items-center">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 p-[1px] overflow-hidden shrink-0 shadow-xs">
                <img 
                  src="/biznix_logo.png" 
                  alt="BIZNIX" 
                  className="w-full h-full object-cover rounded-[10px]"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="p-3 rounded-2xl bg-[#081220] border border-sky-500/20 text-slate-300 flex items-center gap-1.5 text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" />
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce [animation-delay:0.2s]" />
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce [animation-delay:0.4s]" />
                <span className="ml-1 font-semibold text-sky-200">BIZNIX is formulating strategy...</span>
              </div>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Input Bar & Controls */}
        <div className="mt-4 pt-3 border-t border-sky-900/40 space-y-2">
          
          {/* Action Row above input: Regenerate response */}
          {messages.length > 1 && !isTyping && (
            <div className="flex items-center justify-end">
              <button
                onClick={handleRegenerate}
                id="assistant-regenerate-btn"
                className="text-[11px] font-bold text-sky-300/70 hover:text-amber-400 flex items-center gap-1 cursor-pointer transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Regenerate response</span>
              </button>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ask BIZNIX about business plans, naming, slogans, marketing, or pricing..."
              className="flex-1 px-4 py-3 rounded-2xl bg-[#081220] border border-sky-500/20 text-xs sm:text-sm font-medium text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition-all"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isTyping}
              id="assistant-send-btn"
              className="gold-gradient-btn p-3 rounded-2xl disabled:opacity-50 font-bold cursor-pointer shrink-0"
            >
              <Send className="w-4 h-4 text-[#060D19]" />
            </button>
          </form>

        </div>

      </div>

    </div>
  );
};
