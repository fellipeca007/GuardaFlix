import React, { useState } from 'react';
import { FriendSuggestion } from '../types';

interface RightbarProps {
  suggestions: FriendSuggestion[];
  onFollow: (id: string) => void;
}

const SuggestionItem: React.FC<{ suggestion: FriendSuggestion; onFollow: (id: string) => void }> = ({ suggestion, onFollow }) => {
  const [isHovered, setIsHovered] = useState(false);

  const getButtonText = () => {
    if (!suggestion.isFollowing) return 'Seguir';
    return isHovered ? 'Deixar de seguir' : 'Seguindo';
  };

  const getButtonClasses = () => {
    if (!suggestion.isFollowing) {
      return 'text-red-600 hover:bg-red-50 bg-transparent border border-transparent hover:border-red-100';
    }
    if (isHovered) {
      return 'bg-red-100 text-red-600 border border-red-200';
    }
    return 'bg-slate-100 text-slate-500 border border-transparent';
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <img src={suggestion.avatar} alt={suggestion.name} className="w-10 h-10 rounded-full object-cover" />
        <div>
          <p className="text-sm font-semibold text-slate-800">{suggestion.name}</p>
          <p className="text-xs text-slate-400">{suggestion.info}</p>
        </div>
      </div>
      <button 
        onClick={() => onFollow(suggestion.id)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`text-xs font-medium px-3 py-1.5 rounded-full transition-all duration-200 ${getButtonClasses()}`}
      >
        {getButtonText()}
      </button>
    </div>
  );
};

export const Rightbar: React.FC<RightbarProps> = ({ suggestions, onFollow }) => {
  return (
    <div className="hidden xl:block w-80 fixed right-0 top-16 bottom-0 p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-sm p-5 border border-red-50">
        <h3 className="font-bold text-slate-700 mb-4 text-lg">Sugestões de amizade</h3>
        <div className="space-y-4">
           {suggestions.map((suggestion) => (
             <SuggestionItem 
               key={suggestion.id} 
               suggestion={suggestion} 
               onFollow={onFollow} 
             />
           ))}
           
           {suggestions.length === 0 && (
             <p className="text-slate-400 text-sm text-center">Nenhuma sugestão no momento.</p>
           )}
        </div>
      </div>
    </div>
  );
};