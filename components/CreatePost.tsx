import React, { useState, useRef, useEffect } from 'react';
import { User } from '../types';

interface CreatePostProps {
  onPostCreate: (content: string, image?: string, sentiment?: string) => void;
  user: User;
}

const MOODS = [
  { emoji: '😄', label: 'Feliz' },
  { emoji: '🤩', label: 'Animado' },
  { emoji: '😎', label: 'Relaxado' },
  { emoji: '😢', label: 'Triste' },
  { emoji: '😡', label: 'Irritado' },
  { emoji: '🤔', label: 'Pensativo' },
  { emoji: '🤒', label: 'Doente' },
  { emoji: '😴', label: 'Com sono' },
  { emoji: '🥳', label: 'Festivo' },
  { emoji: '🥰', label: 'Apaixonado' },
];

export const CreatePost: React.FC<CreatePostProps> = ({ onPostCreate, user }) => {
  const [content, setContent] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showMoodPicker, setShowMoodPicker] = useState(false);
  const [selectedMood, setSelectedMood] = useState<{ emoji: string; label: string } | null>(null);
  const moodPickerRef = useRef<HTMLDivElement>(null);

  // Close picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (moodPickerRef.current && !moodPickerRef.current.contains(event.target as Node)) {
        setShowMoodPicker(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !imagePreview && !selectedMood) return;

    const sentimentString = selectedMood ? `${selectedMood.label} ${selectedMood.emoji}` : undefined;

    onPostCreate(content, imagePreview || undefined, sentimentString);

    // Reset form
    setContent('');
    setImagePreview(null);
    setSelectedMood(null);
    setShowMoodPicker(false);
  };

  return (
    <div className="bg-slate-800/40 backdrop-blur-xl rounded-[1.5rem] shadow-2xl border border-slate-700/50 p-4 sm:p-5 mb-8 relative overflow-hidden group">
      {/* Decorative HUD lines */}
      <div className="absolute top-0 left-0 w-16 h-[2px] bg-blue-500/50"></div>
      <div className="absolute top-0 left-0 w-[2px] h-8 bg-blue-500/50"></div>

      <div className="flex items-start space-x-3 sm:space-x-4">
        <div className="relative flex-shrink-0">
          <div className="absolute inset-0 bg-blue-500 rounded-xl blur-lg opacity-20 group-focus-within:opacity-40 transition-opacity"></div>
          <img
            src={user.avatar}
            alt={user.name}
            className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl object-cover border-2 border-slate-700 shadow-lg"
          />
        </div>

        <form className="flex-1 min-w-0" onSubmit={handleSubmit}>
          {selectedMood && (
            <div className="mb-3 inline-flex items-center bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-blue-500/20 animate-fade-in">
              <span className="mr-2">Status: <strong>{selectedMood.label}</strong> {selectedMood.emoji}</span>
              <button
                type="button"
                onClick={() => setSelectedMood(null)}
                className="hover:text-white focus:outline-none transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          <textarea
            className="w-full bg-slate-900/50 border border-slate-700/30 rounded-2xl p-4 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 transition-all text-slate-100 placeholder-slate-500 resize-none text-sm sm:text-base outline-none min-h-[100px]"
            placeholder={`O que há de novo no posto, Guardão ${user.name.split(' ')[0]}?`}
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          {imagePreview && (
            <div className="relative mt-3 group/preview">
              <img src={imagePreview} alt="Preview" className="w-full max-h-72 object-cover rounded-2xl border border-slate-700" />
              <button
                type="button"
                onClick={() => setImagePreview(null)}
                className="absolute top-3 right-3 bg-slate-900/80 text-white rounded-xl p-2 hover:bg-red-600 transition-all shadow-xl backdrop-blur-md"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between mt-4 pt-4 border-t border-slate-700/30 gap-3">
            <div className="flex items-center space-x-2">
              <label className="cursor-pointer flex items-center space-x-2 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 px-3 py-2 rounded-xl transition-all group/btn border border-transparent hover:border-blue-500/20">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-blue-500 group-hover/btn:scale-110 transition-transform">
                  <path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 012.25-2.25h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6zM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0021 18v-1.94l-2.69-2.689a1.5 1.5 0 00-2.12 0l-.88.879.97.97a.75.75 0 11-1.06 1.06l-5.16-5.159a1.5 1.5 0 00-2.12 0L3 16.061zm10.125-7.81a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0z" clipRule="evenodd" />
                </svg>
                <span className="text-xs font-black uppercase tracking-widest hidden sm:inline">Imagem</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>

              <div className="relative" ref={moodPickerRef}>
                <button
                  type="button"
                  onClick={() => setShowMoodPicker(!showMoodPicker)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-xl transition-all group/btn border ${showMoodPicker || selectedMood ? 'text-purple-400 bg-purple-500/10 border-purple-500/30' : 'text-slate-400 hover:text-purple-400 hover:bg-purple-500/10 border-transparent hover:border-purple-500/20'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={`w-5 h-5 text-purple-500 group-hover/btn:scale-110 transition-transform`}>
                    <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-2.625 6c-.54 0-.828.419-.936.634a.75.75 0 001.342.674c.018-.036.055-.087.095-.087.04 0 .076.05.095.087a.75.75 0 001.342-.674c-.108-.215-.396-.634-.936-.634zm4.314.634c.108.215.396.634.936.634.54 0 .828-.419.936-.634a.75.75 0 00-1.342-.674c-.018.036-.055.087-.095.087-.04 0-.076-.05-.095-.087a.75.75 0 00-1.342.674zM8.625 12.75a.75.75 0 111.5 0 .75.75 0 01-1.5 0zm6 0a.75.75 0 111.5 0 .75.75 0 01-1.5 0zM12 16.5c1.61 0 3.03-.84 3.75-2.105a.75.75 0 00-1.298-.757C13.91 14.602 13.032 15 12 15s-1.91-.398-2.452-1.362a.75.75 0 00-1.298.757C9.97 15.66 11.39 16.5 12 16.5z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs font-black uppercase tracking-widest hidden sm:inline">Sentimento</span>
                </button>

                {showMoodPicker && (
                  <div className="absolute top-full left-0 mt-3 w-64 bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl z-50 p-2 grid grid-cols-2 gap-1 animate-fade-in-up backdrop-blur-xl">
                    {MOODS.map((mood) => (
                      <button
                        key={mood.label}
                        type="button"
                        onClick={() => {
                          setSelectedMood(mood);
                          setShowMoodPicker(false);
                        }}
                        className="flex items-center space-x-2 px-3 py-2.5 hover:bg-slate-800 rounded-xl transition-colors text-left group/item"
                      >
                        <span className="text-xl group-hover/item:scale-125 transition-transform">{mood.emoji}</span>
                        <span className="text-[10px] font-bold text-slate-400 group-hover:text-white uppercase tracking-tighter">{mood.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={!content.trim() && !imagePreview && !selectedMood}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest text-[10px] sm:text-xs hover:from-blue-500 hover:to-indigo-500 disabled:opacity-30 disabled:grayscale transition-all shadow-lg shadow-blue-500/20 active:scale-95"
            >
              Lançar Boletim
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};