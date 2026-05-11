import React, { useState } from 'react';

interface Sticker {
  id: string;
  emoji: string;
  label: string;
  category: string;
}

const STICKERS: Sticker[] = [
  // Finance theme
  { id: 'money-bag', emoji: '💰', label: 'Money Bag', category: 'finance' },
  { id: 'dollar', emoji: '💵', label: 'Dollar', category: 'finance' },
  { id: 'coin', emoji: '🪙', label: 'Coin', category: 'finance' },
  { id: 'bank', emoji: '🏦', label: 'Bank', category: 'finance' },
  { id: 'credit', emoji: '💳', label: 'Credit Card', category: 'finance' },
  { id: 'chart', emoji: '📈', label: 'Chart', category: 'finance' },
  { id: 'chart-down', emoji: '📉', label: 'Chart Down', category: 'finance' },
  { id: 'piggy', emoji: '🐷', label: 'Piggy Bank', category: 'finance' },

  // Food & Drink
  { id: 'pizza', emoji: '🍕', label: 'Pizza', category: 'food' },
  { id: 'coffee', emoji: '☕', label: 'Coffee', category: 'food' },
  { id: ' sushi', emoji: '🍣', label: 'Sushi', category: 'food' },
  { id: 'cake', emoji: '🎂', label: 'Cake', category: 'food' },
  { id: 'apple', emoji: '🍎', label: 'Apple', category: 'food' },
  { id: 'rice', emoji: '🍚', label: 'Rice', category: 'food' },
  { id: 'beer', emoji: '🍺', label: 'Beer', category: 'food' },
  { id: 'wine', emoji: '🍷', label: 'Wine', category: 'food' },

  // Transport
  { id: 'car', emoji: '🚗', label: 'Car', category: 'transport' },
  { id: 'bus', emoji: '🚌', label: 'Bus', category: 'transport' },
  { id: 'train', emoji: '🚆', label: 'Train', category: 'transport' },
  { id: 'plane', emoji: '✈️', label: 'Plane', category: 'transport' },
  { id: 'bike', emoji: '🚲', label: 'Bike', category: 'transport' },
  { id: 'taxi', emoji: '🚕', label: 'Taxi', category: 'transport' },

  // Shopping
  { id: 'shopping', emoji: '🛒', label: 'Shopping', category: 'shopping' },
  { id: 'bag', emoji: '👜', label: 'Bag', category: 'shopping' },
  { id: 'gift', emoji: '🎁', label: 'Gift', category: 'shopping' },
  { id: 'ring', emoji: '💍', label: 'Ring', category: 'shopping' },
  { id: 'dress', emoji: '👗', label: 'Dress', category: 'shopping' },
  { id: 'shoe', emoji: '👠', label: 'Shoe', category: 'shopping' },

  // Entertainment
  { id: 'game', emoji: '🎮', label: 'Game', category: 'entertainment' },
  { id: 'movie', emoji: '🎬', label: 'Movie', category: 'entertainment' },
  { id: 'music', emoji: '🎵', label: 'Music', category: 'entertainment' },
  { id: 'headphone', emoji: '🎧', label: 'Headphone', category: 'entertainment' },
  { id: 'book', emoji: '📚', label: 'Book', category: 'entertainment' },
  { id: 'ticket', emoji: '🎫', label: 'Ticket', category: 'entertainment' },

  // Health
  { id: 'hospital', emoji: '🏥', label: 'Hospital', category: 'health' },
  { id: 'pill', emoji: '💊', label: 'Pill', category: 'health' },
  { id: 'heart', emoji: '❤️', label: 'Heart', category: 'health' },
  { id: 'muscle', emoji: '💪', label: 'Muscle', category: 'health' },
  { id: 'apple-health', emoji: '🍏', label: 'Apple Health', category: 'health' },

  // Home
  { id: 'home', emoji: '🏠', label: 'Home', category: 'home' },
  { id: 'office', emoji: '🏢', label: 'Office', category: 'home' },
  { id: 'hotel', emoji: '🏨', label: 'Hotel', category: 'home' },
  { id: 'school', emoji: '🏫', label: 'School', category: 'home' },

  // Travel
  { id: 'beach', emoji: '🏖️', label: 'Beach', category: 'travel' },
  { id: 'mountain', emoji: '⛰️', label: 'Mountain', category: 'travel' },
  { id: 'hotel-travel', emoji: '🏨', label: 'Hotel', category: 'travel' },
  { id: 'passport', emoji: '🛂', label: 'Passport', category: 'travel' },

  // Celebrations
  { id: 'party', emoji: '🎉', label: 'Party', category: 'celebration' },
  { id: 'balloon', emoji: '🎈', label: 'Balloon', category: 'celebration' },
  { id: 'star', emoji: '⭐', label: 'Star', category: 'celebration' },
  { id: 'firework', emoji: '🎆', label: 'Firework', category: 'celebration' },
  { id: 'confetti', emoji: '🎊', label: 'Confetti', category: 'celebration' },

  // Nature
  { id: 'sun', emoji: '☀️', label: 'Sun', category: 'nature' },
  { id: 'moon', emoji: '🌙', label: 'Moon', category: 'nature' },
  { id: 'rain', emoji: '🌧️', label: 'Rain', category: 'nature' },
  { id: 'snow', emoji: '❄️', label: 'Snow', category: 'nature' },
  { id: 'flower', emoji: '🌸', label: 'Flower', category: 'nature' },
  { id: 'tree', emoji: '🌲', label: 'Tree', category: 'nature' },

  // Tech
  { id: 'phone', emoji: '📱', label: 'Phone', category: 'tech' },
  { id: 'computer', emoji: '💻', label: 'Computer', category: 'tech' },
  { id: 'camera', emoji: '📷', label: 'Camera', category: 'tech' },
  { id: 'tv', emoji: '📺', label: 'TV', category: 'tech' },
  { id: 'wifi', emoji: '📡', label: 'WiFi', category: 'tech' },
  { id: 'battery', emoji: '🔋', label: 'Battery', category: 'tech' },

  // Animals
  { id: 'cat', emoji: '🐱', label: 'Cat', category: 'animal' },
  { id: 'dog', emoji: '🐶', label: 'Dog', category: 'animal' },
  { id: 'fish', emoji: '🐟', label: 'Fish', category: 'animal' },
  { id: 'bird', emoji: '🐦', label: 'Bird', category: 'animal' },
  { id: 'rabbit', emoji: '🐰', label: 'Rabbit', category: 'animal' },

  // Symbols
  { id: 'check', emoji: '✅', label: 'Check', category: 'symbol' },
  { id: 'cross', emoji: '❌', label: 'Cross', category: 'symbol' },
  { id: 'warning', emoji: '⚠️', label: 'Warning', category: 'symbol' },
  { id: 'info', emoji: 'ℹ️', label: 'Info', category: 'symbol' },
  { id: 'question', emoji: '❓', label: 'Question', category: 'symbol' },
  { id: 'bulb', emoji: '💡', label: 'Idea', category: 'symbol' },

  // Work
  { id: 'briefcase', emoji: '💼', label: 'Briefcase', category: 'work' },
  { id: 'key', emoji: '🔑', label: 'Key', category: 'work' },
  { id: 'lock', emoji: '🔒', label: 'Lock', category: 'work' },
  { id: 'tool', emoji: '🔧', label: 'Tool', category: 'work' },
  { id: 'clipboard', emoji: '📋', label: 'Clipboard', category: 'work' },
];

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'finance', label: '💰 Finance' },
  { id: 'food', label: '🍕 Food' },
  { id: 'transport', label: '🚗 Transport' },
  { id: 'shopping', label: '🛒 Shopping' },
  { id: 'entertainment', label: '🎮 Entertainment' },
  { id: 'health', label: '❤️ Health' },
  { id: 'home', label: '🏠 Home' },
  { id: 'travel', label: '✈️ Travel' },
  { id: 'celebration', label: '🎉 Celebration' },
  { id: 'nature', label: '🌿 Nature' },
  { id: 'tech', label: '📱 Tech' },
  { id: 'animal', label: '🐾 Animal' },
  { id: 'symbol', label: '💡 Symbol' },
  { id: 'work', label: '💼 Work' },
];

interface StickerPickerProps {
  onSelect: (sticker: Sticker) => void;
  onClose: () => void;
  selectedSticker?: string;
}

export const StickerPicker: React.FC<StickerPickerProps> = ({ onSelect, onClose, selectedSticker }) => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredStickers = STICKERS.filter(sticker => {
    const matchesCategory = activeCategory === 'all' || sticker.category === activeCategory;
    const matchesSearch = !searchQuery || 
      sticker.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sticker.emoji.includes(searchQuery);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden border border-white/20"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white">Choose Sticker</h3>
            <button 
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
            >
              ✕
            </button>
          </div>
          
          <input
            type="text"
            placeholder="Search stickers..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 bg-gray-100/50 dark:bg-gray-700/50 rounded-lg border-0 focus:ring-2 focus:ring-purple-500 outline-none text-gray-800 dark:text-white placeholder-gray-500"
          />
        </div>

        <div className="flex overflow-x-auto p-4 gap-2 border-b border-gray-200/50 dark:border-gray-700/50 scrollbar-hide">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all ${
                activeCategory === cat.id
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="p-4 overflow-y-auto max-h-[50vh]">
          <div className="grid grid-cols-8 gap-2">
            {filteredStickers.map(sticker => (
              <button
                key={sticker.id}
                onClick={() => {
                  onSelect(sticker);
                  onClose();
                }}
                className={`aspect-square flex flex-col items-center justify-center rounded-xl p-2 transition-all hover:scale-110 ${
                  selectedSticker === sticker.emoji
                    ? 'bg-purple-100 dark:bg-purple-900 ring-2 ring-purple-500'
                    : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                title={sticker.label}
              >
                <span className="text-2xl">{sticker.emoji}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate w-full text-center">{sticker.label}</span>
              </button>
            ))}
          </div>
          
          {filteredStickers.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No stickers found
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-200/50 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/50">
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <span>Tip:</span>
            <span>Click a sticker to select it for your transaction</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export type { Sticker };