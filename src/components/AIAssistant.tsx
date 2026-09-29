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
  Bookmark
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../lib/api';
import { AIMessage } from '../types';

export const AIAssistant: React.FC = () => {
  const { user, isPro, saveProject, addToast } = useApp();
  const [messages, setMessages] = useState<AIMessage[]>([
    {
      id: 'welcome_msg',
      conversation_id: 'conv_default',
      role: 'model',
      message: `Hello ${user.name || 'there'}! I am **BIZNIX**, your executive AI Business Partner.\n\nI am here to help you accelerate **${user.business_name || 'your business'}**:\n\n- 💡 **Business Ideas & Strategic Direction**\n- 🏷️ **High-Converting Business Names & Slogans**\n- 📋 **Comprehensive Business Plans & Playbooks**\n- 📢 **Omni-Channel Marketing & Ad Copy**\n- 🎯 **Target Customer Profiling & Retention**\n- 📈 **Scalable Growth & Acquisition Funnels**\n\nHow can we elevate your enterprise today?`,
      created_at: new Date().toISOString(),
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

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

  const handleSend = async (overrideText?: string) => {
    const text = (overrideText || inputMessage).trim();
    if (!text || isTyping) return;

    const userMsg: AIMessage = {
      id: `usr_${Date.now()}`,
      conversation_id: 'conv_default',
      role: 'user',
      message: text,
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsTyping(true);

    try {
      const historyPayload = [...messages, userMsg].map(m => ({
        role: m.role,
        content: m.message,
      }));

      const reply = await api.sendChatMessage({
        messages: historyPayload,
        conversationId: 'conv_default',
        userContext: {
          businessName: user.business_name,
          businessCategory: user.business_category,
        },
      });

      const modelMsg: AIMessage = {
        id: `ai_${Date.now()}`,
        conversation_id: 'conv_default',
        role: 'model',
        message: reply,
        created_at: new Date().toISOString(),
      };

      setMessages(prev => [...prev, modelMsg]);
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
    setMessages(trimmed);
    setIsTyping(true);

    try {
      const historyPayload = trimmed.map(m => ({
        role: m.role,
        content: m.message,
      }));

      const reply = await api.sendChatMessage({
        messages: historyPayload,
        conversationId: 'conv_default',
        userContext: {
          businessName: user.business_name,
          businessCategory: user.business_category,
        },
      });

      const modelMsg: AIMessage = {
        id: `ai_${Date.now()}`,
        conversation_id: 'conv_default',
        role: 'model',
        message: reply,
        created_at: new Date().toISOString(),
      };

      setMessages(prev => [...prev, modelMsg]);
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

  const handleClear = () => {
    if (window.confirm('Clear conversation history?')) {
      setMessages([
        {
          id: 'welcome_msg',
          conversation_id: 'conv_default',
          role: 'model',
          message: `Conversation reset. How can BIZNIX assist **${user.business_name || 'your business'}** right now?`,
          created_at: new Date().toISOString(),
        }
      ]);
      addToast('Conversation cleared.', 'info');
    }
  };

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0B1728] p-5 rounded-3xl border border-amber-500/20 shadow-[0_6px_24px_rgba(0,0,0,0.4)]">
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
              Executive AI Business Consultant & Strategy Partner
            </p>
          </div>
        </div>

        {/* Chat Control Actions: [New Chat], [Clear] */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            onClick={handleClear}
            id="assistant-new-chat-btn"
            className="px-3 py-1.5 rounded-xl bg-[#0F223D] hover:bg-[#152B4D] border border-sky-500/20 text-sky-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Start New Chat"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Chat</span>
          </button>
          <button
            onClick={handleClear}
            id="assistant-clear-btn"
            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 transition-colors cursor-pointer"
            title="Clear Conversation"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

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
