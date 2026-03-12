import React, { useRef, useCallback, useState } from 'react';
import SparklesIcon from './icons/SparklesIcon';
import UploadIcon from './icons/UploadIcon';
import CloseIcon from './icons/CloseIcon';
import { type Language, type Tone, type TweetType } from '../types';

interface InputSectionProps {
  imagePreview: string | null;
  onImageChange: (file: File) => void;
  onImageRemove: () => void;
  onGenerate: () => void;
  onGenerateHotTopics: () => void;
  isLoading: boolean;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  tone: Tone;
  onToneChange: (tone: Tone) => void;
  tweetType: TweetType;
  onTweetTypeChange: (type: TweetType) => void;
}

const LANGUAGE_OPTIONS: { value: Language; label: string }[] = [
  { value: 'zh-CN', label: '简体中文' },
  { value: 'zh-TW', label: '繁體中文' },
  { value: 'en', label: 'English' },
];

const TONE_OPTIONS: { value: Tone; label: string }[] = [
  { value: 'professional', label: '專業認真' },
  { value: 'influencer', label: '幣圈大佬' },
  { value: 'humorous', label: '幽默小編' },
];

const TYPE_OPTIONS: { value: TweetType; label: string }[] = [
  { value: 'educational', label: '知識科普' },
  { value: 'promotional', label: '產品推廣' },
  { value: 'interaction', label: '社群互動' },
  { value: 'news', label: '時事新聞' },
  { value: 'poll', label: '投票調查' },
];

const InputSection: React.FC<InputSectionProps> = ({ 
  imagePreview, 
  onImageChange, 
  onImageRemove, 
  onGenerate, 
  onGenerateHotTopics,
  isLoading,
  language,
  onLanguageChange,
  tone,
  onToneChange,
  tweetType,
  onTweetTypeChange
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageChange(e.target.files[0]);
    }
  };
  
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);
  
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onImageChange(e.dataTransfer.files[0]);
    }
  }, [onImageChange]);

  return (
    <div className="bg-gray-800 p-6 rounded-xl shadow-lg flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-300">1. 設定與產生推文</h2>
        <button
          onClick={onGenerateHotTopics}
          disabled={isLoading}
          className="text-[10px] px-3 py-1.5 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 rounded-full hover:bg-emerald-600/30 transition-all font-bold uppercase tracking-wider flex items-center gap-1.5"
        >
          <SparklesIcon className="w-3 h-3" />
          自動選取本週時事
        </button>
      </div>
      
      <p className="text-sm text-gray-500 mb-4">
        上傳截圖或使用自動選取功能，AI 將為 imKey 打造專屬推文。
      </p>
      
      <div className="w-full flex-grow flex flex-col min-h-[180px] mb-4">
        {imagePreview ? (
          <div className="relative w-full h-full flex-grow group">
            <img src={imagePreview} alt="PANNEWS screenshot preview" className="w-full h-full object-contain rounded-lg border border-gray-600" />
            <button
              onClick={onImageRemove}
              className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black/80 rounded-full text-white transition-opacity opacity-0 group-hover:opacity-100"
              aria-label="Remove image"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => inputRef.current?.click()}
            className={`flex flex-col items-center justify-center w-full h-full border-2 border-dashed border-gray-600 hover:border-blue-500 rounded-lg cursor-pointer transition-colors duration-300 flex-grow ${isDragging ? 'border-blue-500 bg-gray-700/50' : ''}`}
          >
            <input
              type="file"
              ref={inputRef}
              onChange={handleFileChange}
              accept="image/png, image/jpeg, image/webp"
              className="hidden"
            />
            <div className="text-center p-6">
              <UploadIcon className="w-10 h-10 mx-auto mb-3 text-gray-500" />
              <p className="font-semibold text-gray-400 text-sm">點擊或拖曳截圖至此</p>
              <p className="text-[10px] text-gray-500">支援 PNG, JPG, WEBP</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">輸出語言</label>
          <div className="grid grid-cols-1 gap-1.5">
              {LANGUAGE_OPTIONS.map((option) => (
                  <button
                      key={option.value}
                      onClick={() => onLanguageChange(option.value)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 border ${
                          language === option.value 
                          ? 'bg-blue-600/90 border-blue-500 text-white shadow-lg' 
                          : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                      }`}
                  >
                      {option.label}
                  </button>
              ))}
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">推文口吻</label>
          <div className="grid grid-cols-1 gap-1.5">
              {TONE_OPTIONS.map((option) => (
                  <button
                      key={option.value}
                      onClick={() => onToneChange(option.value)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 border ${
                          tone === option.value 
                          ? 'bg-purple-600/90 border-purple-500 text-white shadow-lg' 
                          : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                      }`}
                  >
                      {option.label}
                  </button>
              ))}
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">推文類型</label>
          <div className="grid grid-cols-1 gap-1.5">
              {TYPE_OPTIONS.map((option) => (
                  <button
                      key={option.value}
                      onClick={() => onTweetTypeChange(option.value)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 border ${
                          tweetType === option.value 
                          ? 'bg-emerald-600/90 border-emerald-500 text-white shadow-lg' 
                          : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
                      }`}
                  >
                      {option.label}
                  </button>
              ))}
          </div>
        </div>
      </div>

      <button
        onClick={onGenerate}
        disabled={isLoading || !imagePreview}
        className="w-full flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.99]"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            處理中...
          </>
        ) : (
          <>
            <SparklesIcon className="w-5 h-5 mr-2" />
            分析截圖並產生
          </>
        )}
      </button>
    </div>
  );
};

export default InputSection;
