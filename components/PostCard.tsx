import React, { useState } from 'react';
import { Post, Comment } from '../types';

interface PostCardProps {
  post: Post;
  currentUserId?: string; // New: to check ownership
  currentUserAvatar?: string; // Avatar do usuário atual
  onLike: (postId: string) => void;
  onAddComment: (postId: string, content: string) => void;
  onSave?: (postId: string) => void;
  onDelete?: (postId: string) => void; // New: delete callback
  onUserClick?: (userId: string) => void; // New: navigate to user profile
}

export const PostCard: React.FC<PostCardProps> = ({ post, currentUserId, currentUserAvatar, onLike, onAddComment, onSave, onDelete, onUserClick }) => {
  const [commentText, setCommentText] = useState('');
  const [showMenu, setShowMenu] = useState(false);

  const isOwner = currentUserId === post.user.id;

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentText.trim()) {
      onAddComment(post.id, commentText);
      setCommentText('');
    }
  };

  return (
    <div className="bg-slate-800/40 backdrop-blur-md rounded-[1.5rem] shadow-xl border border-slate-700/50 p-4 sm:p-5 mb-6 transition-all duration-300 hover:border-blue-500/30 group relative">
      {/* HUD Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className={`absolute inset-0 bg-blue-500 rounded-full blur-md opacity-20 group-hover:opacity-40 transition-opacity`}></div>
            <img
              src={post.user.avatar}
              alt={post.user.name}
              className="relative w-11 h-11 rounded-xl object-cover border-2 border-slate-700 cursor-pointer hover:border-blue-500 transition-all"
              onClick={() => onUserClick && onUserClick(post.user.id)}
            />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h4
                className="font-black text-white text-sm sm:text-base cursor-pointer hover:text-blue-400 transition-colors tracking-tight"
                onClick={() => onUserClick && onUserClick(post.user.id)}
              >
                {post.user.name}
              </h4>
              <div className="h-1 w-1 bg-slate-600 rounded-full"></div>
              {post.sentiment && (
                <span className="text-[10px] uppercase font-bold tracking-widest text-blue-400/80 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                  {post.sentiment}
                </span>
              )}
            </div>
            <div className="flex items-center text-[10px] sm:text-xs font-mono text-slate-500 mt-0.5">
              <span className="text-blue-500/60 uppercase">{post.user.handle}</span>
              <span className="mx-2 opacity-30">•</span>
              <span className="uppercase tracking-tighter">{post.timestamp}</span>
            </div>
          </div>
        </div>

        {/* Tactical Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="text-slate-500 hover:text-white transition-all p-2 rounded-xl hover:bg-slate-700/50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" /></svg>
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)}></div>
              <div className="absolute right-0 mt-3 w-56 bg-slate-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-700/50 py-2 z-20 animate-fade-in-up">
                {isOwner && onDelete && (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      if (window.confirm("Deseja descartar este boletim informativo?")) {
                        onDelete(post.id);
                      }
                    }}
                    className="w-full text-left px-4 py-2 text-xs font-bold text-red-400 hover:bg-red-500/10 flex items-center gap-3 transition-colors uppercase tracking-widest"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    Encerrar Boletim
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onSave && onSave(post.id);
                  }}
                  className="w-full text-left px-4 py-2 text-xs font-bold text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-3 transition-colors uppercase tracking-widest"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" /></svg>
                  {post.isSaved ? "Arquivar Registro" : "Salvar em Comandos"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Informativo Content */}
      <div className="mb-5 px-1">
        <p className="text-slate-200 leading-relaxed mb-4 whitespace-pre-wrap text-sm sm:text-base selection:bg-blue-500/30">{post.content}</p>
        {post.image && (
          <div className="rounded-[1.25rem] overflow-hidden border border-slate-700 shadow-inner group/image relative">
            <img src={post.image} alt="Intelligence Report" className="w-full h-auto object-cover max-h-[600px] transition-transform duration-700 group-hover/image:scale-[1.02]" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent opacity-0 group-hover/image:opacity-100 transition-opacity"></div>
          </div>
        )}
      </div>

      {/* Telemetry Stats */}
      <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-4 px-2">
        <div className="flex items-center space-x-3">
          <div className="flex items-center gap-1.5 text-blue-400">
            <span className="w-1 h-1 bg-current rounded-full animate-ping"></span>
            {post.likes} Apoios
          </div>
        </div>
        <div className="text-slate-400">
          {post.comments.length} Intervenções Registradas
        </div>
      </div>

      {/* Command Actions */}
      <div className="grid grid-cols-3 gap-2 border-t border-slate-700/30 pt-3 mb-5">
        <button
          onClick={() => onLike(post.id)}
          className={`flex items-center justify-center gap-2 py-2.5 rounded-xl transition-all ${post.isLiked ? 'bg-blue-600/10 text-blue-400 border border-blue-500/30' : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'}`}
          title="Prestar Apoio"
        >
          <svg className={`w-5 h-5 ${post.isLiked ? 'fill-current' : 'fill-none'}`} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" /></svg>
          <span className="text-[10px] font-bold uppercase hidden sm:inline">Apoiar</span>
        </button>
        <button
          className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-slate-400 hover:bg-purple-600/10 hover:text-purple-400 transition-all border border-transparent hover:border-purple-500/30"
          title="Intervir"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
          <span className="text-[10px] font-bold uppercase hidden sm:inline">Intervir</span>
        </button>
        <button
          className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-slate-400 hover:bg-cyan-600/10 hover:text-cyan-400 transition-all border border-transparent hover:border-cyan-500/30"
          title="Transmitir"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
          <span className="text-[10px] font-bold uppercase hidden sm:inline">QAP</span>
        </button>
      </div>

      {/* Logs Table (Comments Area) */}
      <div className="space-y-4 px-1 pb-2">
        {post.comments.length > 0 && (
          <div className="space-y-4 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
            {post.comments.map(comment => (
              <div key={comment.id} className="flex space-x-3 group/comment">
                <img src={comment.user.avatar} alt={comment.user.name} className="w-8 h-8 rounded-lg object-cover border border-slate-700 flex-shrink-0" />
                <div className="bg-slate-700/30 p-3 rounded-2xl rounded-tl-none flex-1 border border-transparent group-hover/comment:border-slate-600 transition-all">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-black text-[10px] text-blue-400 tracking-tighter uppercase">{comment.user.name}</span>
                    <span className="text-[9px] font-mono text-slate-500">{comment.timestamp}</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{comment.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Input HUD */}
        <div className="flex items-center space-x-3 pt-2">
          <div className="relative h-9 w-9 flex-shrink-0">
            <img src={currentUserAvatar || 'https://picsum.photos/seed/me/150/150'} alt="Current Operator" className="h-full w-full rounded-lg object-cover border border-blue-500/50" />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-800 shadow-glow"></div>
          </div>
          <form onSubmit={handleSubmitComment} className="flex-1 relative group">
            <input
              type="text"
              placeholder="Registrar intervenção tática..."
              className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl py-2.5 pl-4 pr-12 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
            <button
              type="submit"
              disabled={!commentText.trim()}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-500 disabled:text-slate-600 hover:text-blue-400 p-1.5 transition-all active:scale-90"
            >
              <svg className="w-5 h-5 transition-transform group-focus-within:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};