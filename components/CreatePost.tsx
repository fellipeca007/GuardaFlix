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
    <div className="bg-white rounded-2xl shadow-sm border border-blue-50 p-4 mb-6 relative">
      <div className="flex items-start space-x-3 sm:space-x-4">
        <img
          src={user.avatar}
          alt={user.name}
          className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover border border-blue-100 flex-shrink-0"
        />
        <form className="flex-1 min-w-0" onSubmit={handleSubmit}>

          {selectedMood && (
            <div className="mb-2 inline-flex items-center bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full text-sm border border-yellow-100 animate-fade-in">
              <span className="mr-2">Está se sentindo <strong>{selectedMood.label}</strong> {selectedMood.emoji}</span>
              <button
                type="button"
                onClick={() => setSelectedMood(null)}
                className="hover:text-blue-500 focus:outline-none"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          <textarea
            className="w-full bg-slate-50 border-none rounded-xl p-3 focus:ring-2 focus:ring-blue-200 focus:bg-white transition-all text-slate-700 placeholder-slate-400 resize-none text-sm sm:text-base"
            placeholder={`No que você está pensando, ${user.name.split(' ')[0]}?`}
            rows={2}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          {imagePreview && (
            <div className="relative mt-2">
              <img src={imagePreview} alt="Preview" className="w-full max-h-60 object-cover rounded-xl" />
              <button
                type="button"
                onClick={() => setImagePreview(null)}
                className="absolute top-2 right-2 bg-gray-900/50 text-white rounded-full p-1 hover:bg-gray-900/70"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between mt-3 pt-3 border-t border-slate-100 gap-2 relative">
            <div className="flex items-center space-x-2">
              <label className="cursor-pointer flex items-center space-x-1 sm:space-x-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 px-2 sm:px-3 py-2 rounded-full transition-all duration-200 group">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500 group-hover:scale-110 transition-transform">
                  <path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 012.25-2.25h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6zM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0021 18v-1.94l-2.69-2.689a1.5 1.5 0 00-2.12 0l-.88.879.97.97a.75.75 0 11-1.06 1.06l-5.16-5.159a1.5 1.5 0 00-2.12 0L3 16.061zm10.125-7.81a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0z" clipRule="evenodd" />
                </svg>
                <span className="text-xs sm:text-sm font-medium">Foto</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>

              <div className="relative" ref={moodPickerRef}>
                <button
                  type="button"
                  onClick={() => setShowMoodPicker(!showMoodPicker)}
                  className={`flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-2 rounded-full transition-all duration-200 group ${showMoodPicker || selectedMood ? 'text-yellow-600 bg-yellow-50' : 'text-slate-500 hover:text-yellow-600 hover:bg-yellow-50'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-400 group-hover:scale-110 transition-transform">
                    <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm-2.625 6c-.54 0-.828.419-.936.634a.75.75 0 001.342.674c.018-.036.055-.087.095-.087.04 0 .076.05.095.087a.75.75 0 001.342-.674c-.108-.215-.396-.634-.936-.634zm4.314.634c.108.215.396.634.936.634.54 0 .828-.419.936-.634a.75.75 0 00-1.342-.674c-.018.036-.055.087-.095.087-.04 0-.076-.05-.095-.087a.75.75 0 00-1.342.674zM8.625 12.75a.75.75 0 111.5 0 .75.75 0 01-1.5 0zm6 0a.75.75 0 111.5 0 .75.75 0 01-1.5 0zM12 16.5c1.61 0 3.03-.84 3.75-2.105a.75.75 0 00-1.298-.757C13.91 14.602 13.032 15 12 15s-1.91-.398-2.452-1.362a.75.75 0 00-1.298.757C9.97 15.66 11.39 16.5 12 16.5z" clipRule="evenodd" />
                  </svg>
                  <span className="text-xs sm:text-sm font-medium">Sentimento</span>
                </button>

                {showMoodPicker && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-blue-50 z-50 p-2 grid grid-cols-2 gap-1 animate-fade-in-up">
                    {MOODS.map((mood) => (
                      <button
                        key={mood.label}
                        type="button"
                        onClick={() => {
                          setSelectedMood(mood);
                          setShowMoodPicker(false);
                        }}
                        className="flex items-center space-x-2 px-3 py-2 hover:bg-blue-50 rounded-lg transition-colors text-left"
                      >
                        <span className="text-xl">{mood.emoji}</span>
                        <span className="text-sm text-slate-700">{mood.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={!content.trim() && !imagePreview && !selectedMood}
              className="bg-blue-600 text-white px-4 sm:px-6 py-2 rounded-full font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-blue-200 text-sm sm:text-base ml-auto sm:ml-0"
            >
              Publicar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};