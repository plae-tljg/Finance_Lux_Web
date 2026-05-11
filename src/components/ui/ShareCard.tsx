import { useState, useRef, useEffect } from 'react';
import { Modal } from './Modal';
import { ShareService, type ShareCardOptions } from '../services/export/ShareService';

interface ShareCardProps {
  isOpen: boolean;
  onClose: () => void;
  data: ShareCardOptions['data'];
  selectedMonth: string;
}

export function ShareCard({ isOpen, onClose, data, selectedMonth }: ShareCardProps) {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && data) {
      generatePreview();
    }
  }, [isOpen, data, theme]);

  const generatePreview = async () => {
    setIsGenerating(true);
    try {
      const url = await ShareService.generateShareCard({ data, theme });
      setPreviewUrl(url);
    } catch (error) {
      console.error('Failed to generate preview:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      await ShareService.generateAndDownload({ data, theme }, `financial-report-${selectedMonth}`);
      onClose();
    } catch (error) {
      console.error('Failed to download:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyToClipboard = async () => {
    if (!previewUrl) return;
    try {
      const response = await fetch(previewUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      alert('Image copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy:', error);
      alert('Failed to copy image to clipboard');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share Report" size="lg">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Theme</span>
          <div className="flex gap-2">
            <button
              onClick={() => setTheme('dark')}
              className={`px-4 py-2 rounded-lg transition-all ${
                theme === 'dark'
                  ? 'bg-purple-500 text-white shadow-lg'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              🌙 Dark
            </button>
            <button
              onClick={() => setTheme('light')}
              className={`px-4 py-2 rounded-lg transition-all ${
                theme === 'light'
                  ? 'bg-yellow-500 text-white shadow-lg'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              ☀️ Light
            </button>
          </div>
        </div>

        <div
          ref={previewRef}
          className="relative bg-gray-100 dark:bg-gray-900 rounded-xl overflow-hidden"
          style={{ minHeight: '300px' }}
        >
          {isGenerating ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent"></div>
            </div>
          ) : previewUrl ? (
            <img
              src={previewUrl}
              alt="Share preview"
              className="w-full h-auto rounded-xl shadow-xl"
            />
          ) : null}
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleDownload}
            disabled={isGenerating || !previewUrl}
            className="flex-1 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Download Image
            </span>
          </button>
          <button
            onClick={handleCopyToClipboard}
            disabled={isGenerating || !previewUrl}
            className="flex-1 px-4 py-3 rounded-xl bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold transition-all border border-gray-200 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            <span className="flex items-center justify-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              Copy to Clipboard
            </span>
          </button>
        </div>

        <p className="text-xs text-center text-gray-500 dark:text-gray-400">
          Share your financial report as a beautiful image
        </p>
      </div>
    </Modal>
  );
}