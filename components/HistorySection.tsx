import React, { useState } from 'react';
import { type HistoryItem } from '../types';
import TweetCard from './TweetCard';
import { updateTweetStatus } from '../services/geminiService';
import SparklesIcon from './icons/SparklesIcon';

interface HistorySectionProps {
  history: HistoryItem[];
  isLoading: boolean;
  error: string | null;
  onRefresh: () => void;
}

const HistorySection: React.FC<HistorySectionProps> = ({ history, isLoading, error, onRefresh }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleStatusChange = async (historyId: string, groupIndex: number, tweetIndex: number, status: string) => {
    try {
      await updateTweetStatus(historyId, groupIndex, tweetIndex, status);
      // Refresh history to show updated status
      onRefresh();
    } catch (err) {
      alert('更新狀態失敗');
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
        <p className="text-gray-400">載入歷史紀錄中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-10 space-y-4">
        <div className="bg-red-900/20 border border-red-500/50 p-6 rounded-2xl text-red-200 text-center max-w-md">
          <p className="font-bold mb-2">載入失敗</p>
          <p className="text-sm opacity-80 mb-4">
            {error === 'Supabase not configured' ? (
              <span className="text-yellow-400 font-medium">
                ⚠️ 尚未偵測到 Supabase 設定。請點擊左側選單的「Settings」&gt;「Environment Variables」新增變數。
              </span>
            ) : (
              <span className="break-all">{error}</span>
            )}
          </p>
          <button 
            onClick={onRefresh}
            className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-bold transition-all shadow-lg active:scale-95"
          >
            立即重試
          </button>
        </div>
        {(error.includes('relation "tweets_history" does not exist') || error === 'Supabase not configured') && (
          <div className="bg-gray-800 border border-gray-700 p-6 rounded-2xl text-gray-300 text-sm max-w-xl w-full shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="bg-emerald-500/20 text-emerald-400 p-1 rounded">🛠️</span>
              設定指南
            </h3>
            
            <div className="space-y-6">
              {error === 'Supabase not configured' ? (
                <div className="space-y-3">
                  <p className="text-gray-400">請在 AI Studio 的 <span className="text-white font-bold">Settings</span> 選單中新增以下環境變數：</p>
                  <ul className="list-disc list-inside space-y-2 text-emerald-400 font-mono text-xs bg-black/30 p-3 rounded-lg">
                    <li>SUPABASE_URL</li>
                    <li>SUPABASE_ANON_KEY</li>
                  </ul>
                  <p className="text-xs text-gray-500 italic">提示：您可以在 Supabase 專案的 Project Settings &gt; API 頁面找到這些資訊。</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-gray-400">連線成功，但資料庫中缺少資料表。請在 Supabase 的 <span className="text-white font-bold">SQL Editor</span> 執行以下指令：</p>
                  <div className="relative group">
                    <pre className="bg-black/80 p-4 rounded-xl overflow-x-auto text-[11px] text-emerald-400 border border-emerald-500/30">
{`-- 1. 建立推文歷史資料表
CREATE TABLE IF NOT EXISTS tweets_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  language TEXT,
  tone TEXT,
  content JSONB,
  date_range TEXT,
  tweet_type TEXT
);

-- 2. 關閉 RLS 以允許前端存取 (或設定 Policy)
ALTER TABLE tweets_history DISABLE ROW LEVEL SECURITY;`}
                    </pre>
                    <button 
                      onClick={() => {
                        const sql = `-- 1. 建立推文歷史資料表\nCREATE TABLE IF NOT EXISTS tweets_history (\n  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n  created_at TIMESTAMPTZ DEFAULT NOW(),\n  language TEXT,\n  tone TEXT,\n  content JSONB,\n  date_range TEXT,\n  tweet_type TEXT\n);\n\n-- 2. 關閉 RLS 以允許前端存取 (或設定 Policy)\nALTER TABLE tweets_history DISABLE ROW LEVEL SECURITY;`;
                        navigator.clipboard.writeText(sql);
                        alert('SQL 已複製到剪貼簿！');
                      }}
                      className="absolute top-2 right-2 px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      複製 SQL
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-20 bg-gray-800/50 rounded-2xl border border-gray-700 flex flex-col items-center">
        <p className="text-gray-400 mb-4">尚無歷史紀錄</p>
        <div className="flex flex-col gap-4 items-center">
          <div className="flex gap-4">
            <button 
              onClick={onRefresh}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg text-sm transition-colors"
            >
              重新整理
            </button>
            <button 
              onClick={async () => {
                try {
                  const res = await fetch('/backend/ping');
                  const data = await res.json();
                  alert(`伺服器連線：${data.status}\n資料庫設定：${data.supabase ? '已完成' : '未完成'}\n環境：${data.env}`);
                } catch (err) {
                  alert('無法連線到伺服器');
                }
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm transition-colors"
            >
              測試連線狀態
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2 max-w-xs">
            提示：產生推文後會自動儲存到這裡。如果已經產生過但仍沒看到，請點擊「測試連線狀態」檢查設定。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
        <span className="w-1.5 h-8 bg-emerald-500 rounded-full"></span>
        推文歷史紀錄
      </h2>
      
      <div className="grid grid-cols-1 gap-4">
        {history.map((item) => {
          const isExpanded = expandedId === item.id;
          const tweetCount = item.content.reduce((acc, group) => acc + group.tweets.length, 0);
          
          return (
            <div 
              key={item.id} 
              className={`bg-gray-800 border transition-all duration-300 rounded-2xl overflow-hidden ${
                isExpanded ? 'border-emerald-500/50 ring-1 ring-emerald-500/20' : 'border-gray-700 hover:border-gray-600'
              }`}
            >
              {/* Card Header / Summary */}
              <div 
                className="p-5 cursor-pointer flex items-center justify-between hover:bg-gray-700/30 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="bg-emerald-900/30 p-3 rounded-xl">
                    <SparklesIcon className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-100">
                      {item.date_range || '未命名批次'}
                    </h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-500">
                        {new Date(item.created_at).toLocaleString('zh-TW')}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 bg-gray-700 rounded text-gray-400 uppercase font-bold tracking-wider">
                        {tweetCount} 則推文
                      </span>
                      <span className="text-[10px] px-2 py-0.5 bg-blue-900/30 text-blue-400 rounded uppercase font-bold tracking-wider">
                        {item.language}
                      </span>
                      {item.tweet_type && (
                        <span className="text-[10px] px-2 py-0.5 bg-emerald-900/30 text-emerald-400 rounded uppercase font-bold tracking-wider">
                          {item.tweet_type}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="hidden md:flex gap-2">
                    <span className="text-xs px-2 py-1 bg-gray-900/50 rounded-lg text-gray-400 border border-gray-700">
                      {item.tone}
                    </span>
                  </div>
                  <svg 
                    className={`w-5 h-5 text-gray-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} 
                    fill="none" viewBox="0 0 24 24" stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="p-6 bg-gray-900/30 border-t border-gray-700 space-y-8 animate-in fade-in slide-in-from-top-2 duration-300">
                  {item.content.map((group, gIdx) => (
                    <div key={gIdx} className="space-y-4">
                      <h4 className="text-xs font-black text-gray-500 uppercase tracking-[0.2em] flex items-center gap-3">
                        <span className="h-px flex-grow bg-gray-800"></span>
                        {group.date}
                        <span className="h-px flex-grow bg-gray-800"></span>
                      </h4>
                      <div className="grid grid-cols-1 gap-4">
                        {group.tweets.map((tweet, tIdx) => (
                          <TweetCard 
                            key={tIdx} 
                            tweet={tweet} 
                            onStatusChange={(status) => handleStatusChange(item.id, gIdx, tIdx, status)}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HistorySection;
