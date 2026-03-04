import React, { useRef, useCallback, useState } from 'react';
import SparklesIcon from './icons/SparklesIcon';
import UploadIcon from './icons/UploadIcon';
import CloseIcon from './icons/CloseIcon';
import { type Language, type Tone } from '../types';

interface InputSectionProps {
  imagePreview: string | null;
  onImageChange: (file: File) => void;
  onImageRemove: () => void;
  onGenerate: () => void;
  isLoading: boolean;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  tone: Tone;
  onToneChange: (tone: Tone) => void;
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

const InputSection: React.FC<InputSectionProps> = ({ 
  imagePreview, 
  onImageChange, 
  onImageRemove, 
  onGenerate, 
  isLoading,
  language,
  onLanguageChange,
  tone,
  onToneChange
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
      <h2 className="text-lg font-semibold mb-3 text-gray-300">1. 上傳本週 PANNEWS 截圖</h2>
      <p className="text-sm text-gray-500 mb-4">
        點擊或拖曳您的 PANNEWS 截圖至下方區域，AI 將會以此為基礎產生推文。
      </p>
      
      <div className="w-full flex-grow flex flex-col min-h-[200px] mb-4">
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
            <div className="text-center p-8">
              <UploadIcon className="w-12 h-12 mx-auto mb-4 text-gray-500" />
              <p className="font-semibold text-gray-400">點擊或拖曳檔案至此</p>
              <p className="text-xs text-gray-500">支援 PNG, JPG, WEBP</p>
            </div>
          </div>
        )}
      </div>

      <div className="mb-4">
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">輸出語言 / Language</label>
        <div className="flex gap-2">
            {LANGUAGE_OPTIONS.map((option) => (
                <button
                    key={option.value}
                    onClick={() => onLanguageChange(option.value)}
                    className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 border ${
                        language === option.value 
                        ? 'bg-blue-600/90 border-blue-500 text-white shadow-lg shadow-blue-900/50' 
                        : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:border-gray-500'
                    }`}
                >
                    {option.label}
                </button>
            ))}
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">推文口吻 / Tone</label>
        <div className="flex gap-2">
            {TONE_OPTIONS.map((option) => (
                <button
                    key={option.value}
                    onClick={() => onToneChange(option.value)}
                    className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 border ${
                        tone === option.value 
                        ? 'bg-purple-600/90 border-purple-500 text-white shadow-lg shadow-purple-900/50' 
                        : 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:border-gray-500'
                    }`}
                >
                    {option.label}
                </button>
            ))}
        </div>
      </div>

      <button
        onClick={onGenerate}
        disabled={isLoading || !imagePreview}
        className="mt-2 w-full flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-bold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] disabled:scale-100"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            分析圖片並生成中...
          </>
        ) : (
          <>
            <SparklesIcon className="w-5 h-5 mr-2" />
            產生推文
          </>
        )}
      </button>
    </div>
  );
};

export default InputSection;