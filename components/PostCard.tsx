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
    <div className="bg-white rounded-2xl shadow-sm border border-blue-50 p-4 mb-6 transition-all duration-300 hover:shadow-md relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <img
            src={post.user.avatar}
            alt={post.user.name}
            className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-50 cursor-pointer hover:ring-blue-200 transition-all"
            onClick={() => onUserClick && onUserClick(post.user.id)}
          />
          <div>
            <div className="flex flex-wrap items-center gap-1">
              <h4
                className="font-bold text-slate-800 text-sm cursor-pointer hover:text-blue-600 transition-colors"
                onClick={() => onUserClick && onUserClick(post.user.id)}
              >
                {post.user.name}
              </h4>
              {post.sentiment && (
                <span className="text-xs text-slate-500">
                  está se sentindo <span className="font-medium text-slate-700">{post.sentiment}</span>
                </span>
              )}
            </div>
            <div className="flex items-center text-xs text-slate-400">
              <span>{post.user.handle}</span>
              <span className="mx-1">•</span>
              <span>{post.timestamp}</span>
            </div>
          </div>
        </div>

        {/* 3 Dots Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-100"
            title="Mais opções"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)}></div>
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20">
                {isOwner && onDelete && (
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      if (window.confirm("Apagar este post?")) {
                        onDelete(post.id);
                      }
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Excluir publicação
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onSave && onSave(post.id);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                  </svg>
                  {post.isSaved ? "Remover dos salvos" : "Salvar publicação"}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="mb-4">
        <p className="text-slate-700 leading-relaxed mb-3 whitespace-pre-wrap">{post.content}</p>
        {post.image && (
          <div className="rounded-xl overflow-hidden shadow-sm">
            <img src={post.image} alt="Post content" className="w-full h-auto object-cover max-h-[500px]" loading="lazy" />
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between text-xs text-slate-500 mb-3 px-1">
        <div className="flex items-center space-x-1">
          <div className="bg-blue-100 p-1 rounded-full">
            <svg className="w-3 h-3 text-blue-600 fill-current" viewBox="0 0 20 20"><path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" /></svg>
          </div>
          <span>{post.likes} curtidas</span>
        </div>
        <div>
          {post.comments.length} comentários
        </div>
      </div>

      {/* Actions - Only Icons */}
      <div className="flex items-center justify-around border-t border-b border-blue-50 py-2 mb-4">
        <button
          onClick={() => onLike(post.id)}
          className={`flex items-center justify-center p-2 rounded-lg transition-all hover:scale-110 ${post.isLiked ? 'text-blue-600' : 'text-slate-500 hover:bg-blue-50'}`}
          title="Curtir"
        >
          <svg className={`w-6 h-6 ${post.isLiked ? 'fill-current' : 'fill-none'}`} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
          </svg>
        </button>
        <button
          className="flex items-center justify-center p-2 rounded-lg text-slate-500 hover:bg-blue-50 transition-all hover:scale-110"
          title="Comentar"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
        </button>
        <button
          className="flex items-center justify-center p-2 rounded-lg text-slate-500 hover:bg-blue-50 transition-all hover:scale-110"
          title="Compartilhar"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
        </button>
      </div>

      {/* Comment Section - Always Visible */}
      <div className="space-y-4">
        {post.comments.map(comment => (
          <div key={comment.id} className="flex space-x-2">
            <img src={comment.user.avatar} alt={comment.user.name} className="w-8 h-8 rounded-full object-cover" />
            <div className="bg-blue-50/50 p-3 rounded-2xl rounded-tl-none flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <span className="font-bold text-xs text-slate-800">{comment.user.name}</span>
                <span className="text-xs text-slate-400">{comment.timestamp}</span>
              </div>
              <p className="text-sm text-slate-700">{comment.content}</p>
            </div>
          </div>
        ))}

        <div className="flex items-start space-x-2 pt-2">
          <img src={currentUserAvatar || 'https://picsum.photos/seed/me/150/150'} alt="Current User" className="w-8 h-8 rounded-full object-cover" />
          <form onSubmit={handleSubmitComment} className="flex-1 relative">
            <input
              type="text"
              placeholder="Escreva um comentário..."
              className="w-full bg-slate-50 border border-blue-100 rounded-full py-2 pl-4 pr-10 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
            <button
              type="submit"
              disabled={!commentText.trim()}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-600 disabled:text-slate-300 hover:text-blue-700"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};