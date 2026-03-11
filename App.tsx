import React, { useState, useCallback } from 'react';
import Header from './components/Header';
import InputSection from './components/InputSection';
import ResultsSection from './components/ResultsSection';
import HistorySection from './components/HistorySection';
import CelebrationTool from './components/CelebrationTool';
import { DailyTweetGroup, Language, Tone } from './types';
import { generateTweets, generateCelebrationTweets } from './services/geminiService';

const App: React.FC = () => {
  console.log('App component is rendering');
  const [view, setView] = useState<'generator' | 'history'>('generator');
  const [serverStatus, setServerStatus] = useState<'checking' | 'ok' | 'error'>('checking');
  const [supabaseStatus, setSupabaseStatus] = useState<boolean>(false);

  const [serverError, setServerError] = useState<string | null>(null);

  React.useEffect(() => {
    const checkServer = async () => {
      try {
        console.log(`Checking server at: ${window.location.origin}/api/ping`);
        const res = await fetch('/api/ping', { cache: 'no-cache' });
        
        if (!res.ok) {
          const text = await res.text();
          console.error(`Server check failed: ${res.status}`, text);
          throw new Error(`HTTP ${res.status}: ${text.substring(0, 100)}`);
        }
        
        const data = await res.json();
        console.log('Server check success:', data);
        
        if (data.status === 'ok') {
          setServerStatus('ok');
          setSupabaseStatus(data.supabase);
        } else {
          setServerStatus('error');
          setServerError('Invalid response format');
        }
      } catch (err: any) {
        console.error('Fetch error:', err);
        setServerStatus('error');
        setServerError(err.message || 'Unknown connection error');
      }
    };

    checkServer();
  }, []);

  const [pannewsImage, setPannewsImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [generatedTweets, setGeneratedTweets] = useState<DailyTweetGroup[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>('zh-CN');
  const [tone, setTone] = useState<Tone>('professional');

  const handleImageChange = (file: File) => {
    setPannewsImage(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleImageRemove = () => {
    setPannewsImage(null);
    setImagePreview(null);
  };

  const handleGenerate = useCallback(async () => {
    if (!pannewsImage || isLoading) return;

    setIsLoading(true);
    setError(null);
    setGeneratedTweets([]);

    try {
      const tweets = await generateTweets(pannewsImage, language, tone);
      setGeneratedTweets(tweets);
    } catch (err) {
      console.error(err);
      setError('推文生成失敗，請檢查您的網路連線、圖片格式或稍後再試。');
    } finally {
      setIsLoading(false);
    }
  }, [pannewsImage, isLoading, language, tone]);

  const handleCelebrationGenerate = async (asset: string, price: string) => {
    if (isLoading) return;

    setIsLoading(true);
    setError(null);
    setGeneratedTweets([]);

    try {
      const tweets = await generateCelebrationTweets(asset, price, language, tone);
      setGeneratedTweets(tweets);
    } catch (err) {
      console.error(err);
      setError('祝賀推文生成失敗，請稍後再試。');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans flex flex-col">
      <Header />
      
      <div className="container mx-auto px-4 md:px-8 mt-6">
        <div className="flex bg-gray-800 p-1 rounded-xl w-fit border border-gray-700">
          <button
            onClick={() => setView('generator')}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
              view === 'generator' 
                ? 'bg-emerald-600 text-white shadow-lg' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            推文產生器
          </button>
          <button
            onClick={() => setView('history')}
            className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
              view === 'history' 
                ? 'bg-emerald-600 text-white shadow-lg' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            歷史紀錄
          </button>
        </div>
        
        {serverStatus !== 'ok' ? (
          <div className="mt-4 flex justify-center">
            <div className={`text-xs px-3 py-1 rounded-full border ${
              serverStatus === 'checking' 
                ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' 
                : 'bg-red-500/10 border-red-500/30 text-red-400'
            }`}>
              伺服器狀態: {serverStatus === 'checking' ? '檢查中...' : `連線失敗 (${serverError})`}
              {serverStatus === 'error' && (
                <button 
                  onClick={() => {
                    setServerStatus('checking');
                    setServerError(null);
                    window.location.reload();
                  }}
                  className="ml-2 underline hover:text-white"
                >
                  重試
                </button>
              )}
            </div>
          </div>
        ) : !supabaseStatus && (
          <div className="mt-4 flex justify-center">
            <div className="text-xs px-3 py-1 rounded-full border bg-red-500/10 border-red-500/30 text-red-400">
              Supabase 未設定，歷史紀錄功能將無法使用
            </div>
          </div>
        )}
      </div>

      <main className="flex-grow container mx-auto p-4 md:p-8">
        {view === 'generator' ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-1">
                <CelebrationTool 
                  onGenerate={handleCelebrationGenerate} 
                  isLoading={isLoading} 
                />
              </div>
              <div className="lg:col-span-2">
                <InputSection
                  onImageChange={handleImageChange}
                  onImageRemove={handleImageRemove}
                  imagePreview={imagePreview}
                  onGenerate={handleGenerate}
                  isLoading={isLoading}
                  language={language}
                  onLanguageChange={setLanguage}
                  tone={tone}
                  onToneChange={setTone}
                />
              </div>
            </div>
            
            <ResultsSection
              tweetGroups={generatedTweets}
              isLoading={isLoading}
              error={error}
            />
          </div>
        ) : (
          <HistorySection />
        )}
      </main>
      <footer className="text-center p-4 text-gray-500 text-sm">
        <p>由 AI 驅動，為 imKey 打造</p>
      </footer>
    </div>
  );
};

export default App;
