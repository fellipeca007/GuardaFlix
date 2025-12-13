import React, { useState } from 'react';
import { Post, Comment } from '../types';

interface PostCardProps {
  post: Post;
  currentUserId?: string; // New: to check ownership
  onLike: (postId: string) => void;
  onAddComment: (postId: string, content: string) => void;
  onSave?: (postId: string) => void;
  onDelete?: (postId: string) => void; // New: delete callback
}

export const PostCard: React.FC<PostCardProps> = ({ post, currentUserId, onLike, onAddComment, onSave, onDelete }) => {
  const [commentText, setCommentText] = useState('');
  const [showComments, setShowComments] = useState(false);

  const isOwner = currentUserId === post.user.id;

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentText.trim()) {
      onAddComment(post.id, commentText);
      setCommentText('');
      setShowComments(true);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-red-50 p-4 mb-6 transition-all duration-300 hover:shadow-md relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <img src={post.user.avatar} alt={post.user.name} className="w-10 h-10 rounded-full object-cover ring-2 ring-red-50" />
          <div>
            <div className="flex flex-wrap items-center gap-1">
              <h4 className="font-bold text-slate-800 text-sm">{post.user.name}</h4>
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

        <div className="flex items-center space-x-2">
          {/* Delete Button (only for owner) */}
          {isOwner && onDelete && (
            <button
              onClick={() => {
                if (window.confirm("Apagar este post?")) {
                  onDelete(post.id);
                }
              }}
              className="text-slate-400 hover:text-red-600 transition-colors p-1"
              title="Apagar Post"
            >
              <svg className="w-5 h-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}

          <button
            onClick={() => onSave && onSave(post.id)}
            className={`text-slate-400 hover:text-red-600 transition-colors ${post.isSaved ? 'text-red-600 fill-current' : ''}`}
            title={post.isSaved ? "Desfazer salvamento" : "Salvar post"}
          >
            <svg className={`w-5 h-5 ${post.isSaved ? 'fill-red-600' : 'fill-none'}`} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" /></svg>
          </button>
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
          <div className="bg-red-100 p-1 rounded-full">
            <svg className="w-3 h-3 text-red-600 fill-current" viewBox="0 0 20 20"><path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" /></svg>
          </div>
          <span>{post.likes} curtidas</span>
        </div>
        <div className="cursor-pointer hover:underline" onClick={() => setShowComments(!showComments)}>
          {post.comments.length} comentários
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between border-t border-b border-red-50 py-1 mb-4">
        <button
          onClick={() => onLike(post.id)}
          className={`flex-1 flex items-center justify-center space-x-2 py-2 rounded-lg transition-colors ${post.isLiked ? 'text-red-600 font-medium' : 'text-slate-500 hover:bg-red-50'}`}
        >
          <svg className={`w-5 h-5 ${post.isLiked ? 'fill-current' : 'fill-none'}`} stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
          </svg>
          <span>Curtir</span>
        </button>
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex-1 flex items-center justify-center space-x-2 py-2 rounded-lg text-slate-500 hover:bg-red-50 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
          <span>Comentar</span>
        </button>
        <button className="flex-1 flex items-center justify-center space-x-2 py-2 rounded-lg text-slate-500 hover:bg-red-50 transition-colors">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
          <span>Compartilhar</span>
        </button>
      </div>

      {/* Comment Section */}
      {showComments && (
        <div className="space-y-4">
          {post.comments.map(comment => (
            <div key={comment.id} className="flex space-x-2">
              <img src={comment.user.avatar} alt={comment.user.name} className="w-8 h-8 rounded-full object-cover" />
              <div className="bg-red-50/50 p-3 rounded-2xl rounded-tl-none">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-bold text-xs text-slate-800">{comment.user.name}</span>
                  <span className="text-xs text-slate-400">{comment.timestamp}</span>
                </div>
                <p className="text-sm text-slate-700">{comment.content}</p>
              </div>
            </div>
          ))}

          <div className="flex items-start space-x-2 pt-2">
            <img src="https://picsum.photos/seed/me/150/150" alt="Current User" className="w-8 h-8 rounded-full object-cover" />
            <form onSubmit={handleSubmitComment} className="flex-1 relative">
              <input
                type="text"
                placeholder="Escreva um comentário..."
                className="w-full bg-slate-50 border border-red-100 rounded-full py-2 pl-4 pr-10 text-sm focus:outline-none focus:ring-1 focus:ring-red-400"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
              <button
                type="submit"
                disabled={!commentText.trim()}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-red-600 disabled:text-slate-300 hover:text-red-700"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};