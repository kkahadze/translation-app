'use client'

import { useState } from 'react';

type Provider = 'openai' | 'anthropic';

export default function TranslationForm() {
  const [text, setText] = useState('');
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('es');
  const [provider, setProvider] = useState<Provider>('openai');
  const [mode, setMode] = useState<'text' | 'json'>('text');  // NEW: mode toggle
  const [translatedText, setTranslatedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showToast, setShowToast] = useState(false);

  // Helper function to show toast notification
  const showCopyToast = () => {
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000); // Hide after 2 seconds
  };

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'zh', name: 'Mandarin Chinese' },
    { code: 'de', name: 'German' },
    { code: 'es', name: 'Spanish' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' },
    { code: 'ar', name: 'Arabic' },
    { code: 'ru', name: 'Russian' }
  ];

  const handleTranslate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setError('');
    setTranslatedText('');
    
    if (!text.trim()) {
      setError('Please enter text to translate');
      return;
    }

    // NEW: Validate JSON if in JSON mode
    if (mode === 'json') {
      try {
        JSON.parse(text);
      } catch (err) {
        setError('Invalid JSON format. Please check your input.');
        return;
      }
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/translate/${provider}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          sourceLang,
          targetLang,
          isJson: mode === 'json',  // NEW: pass mode to API
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Translation failed');
      }

      setTranslatedText(data.translatedText);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-4xl font-bold mb-8 text-center">
        AI Translation App
      </h1>

      <form onSubmit={handleTranslate} className="space-y-6">
        {/* Mode Toggle */}
        <div className="bg-white rounded-lg shadow p-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Translation Mode
          </label>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setMode('text')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                mode === 'text'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              📝 Text Translation
            </button>
            <button
              type="button"
              onClick={() => setMode('json')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                mode === 'json'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              🗂️ JSON Translation
            </button>
          </div>
          {mode === 'json' && (
            <p className="mt-3 text-sm text-gray-600">
              In JSON mode, only string values will be translated. Keys remain unchanged.
            </p>
          )}
        </div>

        {/* Provider Selection */}
        <div className="bg-white rounded-lg shadow p-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            AI Provider
          </label>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setProvider('openai')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                provider === 'openai'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              OpenAI (GPT-4o-mini)
            </button>
            <button
              type="button"
              onClick={() => setProvider('anthropic')}
              className={`flex-1 py-3 px-4 rounded-lg font-medium transition-colors ${
                provider === 'anthropic'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Anthropic (Claude Opus 4.5)
            </button>
          </div>
        </div>

        {/* Language Selection */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="sourceLang" className="block text-sm font-medium text-gray-700 mb-2">
                From
              </label>
              <select
                id="sourceLang"
                value={sourceLang}
                onChange={(e) => setSourceLang(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="targetLang" className="block text-sm font-medium text-gray-700 mb-2">
                To
              </label>
              <select
                id="targetLang"
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {languages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {/* Swap Button */}
          <div className="flex justify-center mt-4">
            <button
              type="button"
              onClick={() => {
                const temp = sourceLang;
                setSourceLang(targetLang);
                setTargetLang(temp);
              }}
              className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors flex items-center gap-2"
            >
              🔄 Swap Languages
            </button>
          </div>
        </div>

    {/* Text/JSON Input */}
    <div className="bg-white rounded-lg shadow p-6">
    <div className="flex items-center justify-between mb-2">
        <label htmlFor="text" className="block text-sm font-medium text-gray-700">
        {mode === 'text' ? 'Text to Translate' : 'JSON to Translate'}
        </label>
        <div className="flex items-center gap-3">
        {text && (
            <button
            type="button"
            onClick={() => {
                navigator.clipboard.writeText(text);
                showCopyToast();
            }}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
            📋 Copy
            </button>
        )}
        <span className="text-sm text-gray-500">
            {text.length} characters
        </span>
        </div>
    </div>
    
    {/* File Upload (JSON mode only) */}
    {mode === 'json' && (
        <div className="mb-3">
        <input
            type="file"
            accept=".json"
            onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (event) => {
                const content = event.target?.result as string;
                setText(content);
                };
                reader.readAsText(file);
            }
            }}
            className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-lg file:border-0
            file:text-sm file:font-medium
            file:bg-blue-50 file:text-blue-700
            hover:file:bg-blue-100
            cursor-pointer"
        />
        <p className="mt-1 text-xs text-gray-500">
            Upload a .json file or paste JSON below
        </p>
        </div>
    )}
    
    <textarea
        id="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={mode === 'text' 
        ? 'Enter text to translate...' 
        : 'Enter valid JSON to translate...'
        }
        rows={6}
        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none font-mono"
    />
    </div>

        {/* Translate Button */}
        <button
          type="submit"
          disabled={isLoading}
          className={`w-full py-4 px-6 rounded-lg font-semibold text-white transition-colors ${
            isLoading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {isLoading ? 'Translating...' : 'Translate'}
        </button>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            <p className="font-medium">Error:</p>
            <p>{error}</p>
          </div>
        )}

   {/* Translation Result */}
    {translatedText && (
    <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-2">
        <label className="block text-sm font-medium text-gray-700">
            Translation
        </label>
        <div className="flex gap-2">
            <button
            type="button"
            onClick={() => {
                navigator.clipboard.writeText(translatedText);
                showCopyToast();
            }}
            className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
            📋 Copy
            </button>
            {mode === 'json' && (
            <button
                type="button"
                onClick={() => {
                const blob = new Blob([translatedText], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'translated.json';
                a.click();
                URL.revokeObjectURL(url);
                }}
                className="px-3 py-1 text-sm bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md transition-colors"
            >
                💾 Download
            </button>
            )}
        </div>
        </div>
        <div className="p-4 bg-gray-50 rounded-lg">
        {mode === 'json' ? (
            <pre className="text-sm overflow-x-auto whitespace-pre-wrap">
            {(() => {
                try {
                return JSON.stringify(JSON.parse(translatedText), null, 2);
                } catch (e) {
                return translatedText;
                }
            })()}
            </pre>
        ) : (
            <p className="text-lg">{translatedText}</p>
        )}
        </div>
    </div>
    )}
      </form>

      {/* Toast Notification */}
      {showToast && (
        <div className="fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-fade-in">
          ✓ Copied to clipboard!
        </div>
      )}
    </div>
  );
}