import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { CreatePost } from './components/CreatePost';
import { PostCard } from './components/PostCard';
import { FriendRequestCard } from './components/FriendRequestCard';
import { FriendService } from './services/friendService';
import { PostService } from './services/postService';
import { Post, User, ViewState, FriendSuggestion, FriendRequest } from './types';
import { useAuth } from './contexts/AuthContext';
import { Login } from './pages/Login';
import { uploadImage } from './services/supabase';

// Helper to determine privacy access
// For now, simpler: profiles are public, posts are private
const isFriend = (userStatus: string) => userStatus === 'accepted';

const App: React.FC = () => {
  const { user: authUser, loading: authLoading, signOut, updateProfile } = useAuth();

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [view, setView] = useState<ViewState>(ViewState.FEED);
  const [loading, setLoading] = useState(true);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Friends & Requests State
  const [friends, setFriends] = useState<any[]>([]);
  const [followersCount, setFollowersCount] = useState<number>(0);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);

  const [friendSearchQuery, setFriendSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Saved Posts State
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);

  // Suggestions State
  const [suggestions, setSuggestions] = useState<FriendSuggestion[]>([]);

  // Friends Tab State
  const [friendsTab, setFriendsTab] = useState<'suggestions' | 'received' | 'sent'>('suggestions');

  // Sent Requests State (requests I sent)
  const [sentRequests, setSentRequests] = useState<any[]>([]);

  // Validation State
  const [handleError, setHandleError] = useState<string | null>(null);

  // Updated for Dark Theme
  const [settingsForm, setSettingsForm] = useState({
    name: '',
    handle: '',
    bio: '',
    avatar: '',
    coverImage: '',
    notifications: true
  });

  // Cover Reposition State
  const [isRepositioning, setIsRepositioning] = useState(false);
  const [tempCoverPosition, setTempCoverPosition] = useState('50% 50%');
  const [dragStartY, setDragStartY] = useState<number | null>(null);
  const [initialYPercent, setInitialYPercent] = useState(50);

  // File State for Uploads
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);

  // Sync currentUser with authUser
  useEffect(() => {
    if (authUser) {
      setCurrentUser(authUser);
      setSettingsForm({
        name: authUser.name,
        handle: authUser.handle,
        bio: authUser.bio || '',
        avatar: authUser.avatar,
        coverImage: authUser.coverImage || '',
        notifications: true
      });
    } else {
      setCurrentUser(null);
    }
  }, [authUser]);

  // Data Loading
  useEffect(() => {
    if (currentUser) {
      loadFeed();
      loadFriends();
      loadSuggestions();
      loadSavedPosts();
      loadFriendRequests();
      loadSentRequests();
    }
  }, [currentUser]);

  const loadFeed = async () => {
    if (!currentUser) return;
    setLoading(true);
    const realPosts = await PostService.getFeedPosts(currentUser.id);
    setPosts(realPosts);
    setLoading(false);
  };

  const loadFriends = async () => {
    if (!currentUser) return;
    const myFriends = await FriendService.getFriends(currentUser.id);
    setFriends(myFriends);
    const count = await FriendService.getFollowersCount(currentUser.id);
    setFollowersCount(count);
  };

  const loadFriendRequests = async () => {
    if (!currentUser) return;
    setRequestsLoading(true);
    const reqs = await FriendService.getPendingRequests(currentUser.id);
    setFriendRequests(reqs);
    setRequestsLoading(false);
  };

  const loadSentRequests = async () => {
    if (!currentUser) return;
    // Get requests I sent that are still pending
    const allUsers = await FriendService.searchUsers('', currentUser.id);
    const enriched = await Promise.all((allUsers || []).map(async (u: any) => {
      const status = await FriendService.checkIsFollowing(currentUser.id, u.id);
      return { ...u, status };
    }));
    setSentRequests(enriched.filter(u => u.status === 'pending'));
  };

  const loadSuggestions = async () => {
    if (!currentUser) return;
    const mySuggestions = await FriendService.getSuggestions(currentUser.id);
    setSuggestions(mySuggestions);
  };

  const loadSavedPosts = async () => {
    if (!currentUser) return;
    const saved = await PostService.getSavedPosts(currentUser.id);
    setSavedPosts(saved);
  };

  // Search
  useEffect(() => {
    const doSearch = async () => {
      if (!currentUser) return;
      if (friendSearchQuery.trim().length > 0) {
        const results = await FriendService.searchUsers(friendSearchQuery, currentUser.id);

        // Enrich results with status
        const enriched = await Promise.all(results.map(async (u: any) => {
          const status = await FriendService.checkIsFollowing(currentUser.id, u.id);
          return { ...u, status };
        }));

        setSearchResults(enriched);
      } else {
        setSearchResults([]);
      }
    };
    const debounce = setTimeout(doSearch, 500);
    return () => clearTimeout(debounce);
  }, [friendSearchQuery, currentUser]);


  // Actions
  const handleFollow = async (targetUserId: string) => {
    if (!currentUser) return;

    // Optimistic Update for Search Results
    setSearchResults(prev => prev.map(u => {
      if (u.id === targetUserId) {
        return { ...u, status: 'pending' };
      }
      return u;
    }));

    try {
      await FriendService.followUser(currentUser.id, targetUserId);
      console.log("✅ Solicitação de amizade enviada com sucesso!");
    } catch (error) {
      console.error("❌ Erro ao enviar solicitação:", error);
      alert("Erro ao enviar solicitação de amizade. Tente novamente.");
      // Revert
      setSearchResults(prev => prev.map(u => {
        if (u.id === targetUserId) {
          return { ...u, status: 'none' };
        }
        return u;
      }));
    }
  };

  const handleUnfollow = async (targetUserId: string) => {
    if (!currentUser) return;
    if (!window.confirm("Deixar de seguir?")) return;

    setSearchResults(prev => prev.map(u => {
      if (u.id === targetUserId) return { ...u, status: 'none' };
      return u;
    }));
    setFriends(prev => prev.filter(f => f.id !== targetUserId));

    try {
      await FriendService.unfollowUser(currentUser.id, targetUserId);
      loadFeed();
    } catch (e) { console.error(e); }
  };

  const handleAcceptRequest = async (requesterId: string) => {
    if (!currentUser) return;

    // Optimistic
    setFriendRequests(prev => prev.filter(r => r.id !== requesterId));
    setFollowersCount(c => c + 1);

    try {
      await FriendService.acceptRequest(currentUser.id, requesterId);
      console.log("✅ Solicitação aceita com sucesso!");
      // Reload friends list to show the new friend
      loadFriends();
      loadFeed(); // Refresh feed to show new friend's posts
    } catch (error) {
      console.error("❌ Erro ao aceitar solicitação:", error);
      alert("Erro ao aceitar solicitação. Tente novamente.");
      loadFriendRequests(); // Reload to revert
      setFollowersCount(c => c - 1); // Revert count
    }
  };

  const handleRejectRequest = async (requesterId: string) => {
    if (!currentUser) return;
    setFriendRequests(prev => prev.filter(r => r.id !== requesterId));
    try {
      await FriendService.rejectRequest(currentUser.id, requesterId);
    } catch (error) {
      console.error("Error rejecting", error);
    }
  };

  const handleCreatePost = async (content: string, image?: string, sentiment?: string) => {
    if (!currentUser) return;
    try {
      await PostService.createPost(currentUser.id, content, image, sentiment);
      loadFeed();
    } catch (error) {
      console.error("Error creating post", error);
      alert("Erro ao criar post.");
    }
  };

  const handleLike = async (postId: string) => {
    if (!currentUser) return;
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    setPosts(posts.map(p => p.id === postId ? { ...p, likes: p.isLiked ? p.likes - 1 : p.likes + 1, isLiked: !p.isLiked } : p));
    try { await PostService.toggleLike(postId, currentUser.id, post.isLiked); } catch (e) { console.error(e); }
  };

  const handleAddComment = async (postId: string, content: string) => {
    if (!currentUser) return;
    // Optimistic
    const tempId = Date.now().toString();
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          comments: [...post.comments, { id: tempId, user: currentUser, content, timestamp: 'Agora mesmo' }]
        };
      }
      return post;
    }));
    try { await PostService.addComment(postId, currentUser.id, content); } catch (error) { console.error(error); }
  };

  const handleDeletePost = async (postId: string) => {
    if (!currentUser) return;
    // Optimistic delete
    setPosts(prev => prev.filter(p => p.id !== postId));

    try {
      await PostService.deletePost(postId, currentUser.id);
    } catch (error) {
      console.error("Error deleting post", error);
      alert("Erro ao deletar post. Tente novamente.");
      loadFeed(); // Revert on error
    }
  };

  // ... Settings Handlers ... (Keep existing simple ones)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'avatar' | 'coverImage') => {
    const file = e.target.files?.[0];
    if (file) {
      if (field === 'avatar') setAvatarFile(file);
      else setCoverFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettingsForm(prev => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const cleanValue = value.replace(/[@\s]/g, '');
    const formattedHandle = `@${cleanValue}`;
    setSettingsForm(prev => ({ ...prev, handle: formattedHandle }));
    // Simple check
    if (cleanValue.length === 0) setHandleError('Nome vazio');
    else setHandleError(null);
  };
  const handleSaveSettings = async () => {
    if (handleError || !currentUser) return;
    setSaveMessage('Salvando...');
    try {
      let avatarUrl = settingsForm.avatar;
      let coverUrl = settingsForm.coverImage;
      if (avatarFile) avatarUrl = await uploadImage(avatarFile) || avatarUrl;
      if (coverFile) coverUrl = await uploadImage(coverFile) || coverUrl;

      await updateProfile({
        name: settingsForm.name,
        handle: settingsForm.handle,
        bio: settingsForm.bio,
        avatar: avatarUrl,
        coverImage: coverUrl
      });
      setSaveMessage('Salvo!');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (e) { console.error(e); setSaveMessage('Erro'); }
  };

  // Cover Reposition Logic
  const startReposition = () => { if (currentUser) { setTempCoverPosition(currentUser.coverPosition || '50% 50%'); setIsRepositioning(true); } };
  const cancelReposition = () => { setIsRepositioning(false); setDragStartY(null); };
  const saveReposition = async () => { if (currentUser) { await updateProfile({ ...currentUser, coverPosition: tempCoverPosition }); setIsRepositioning(false); } };
  const handleCoverMouseDown = (e: React.MouseEvent) => {
    if (!isRepositioning) return;
    e.preventDefault();
    setDragStartY(e.clientY);
    const parts = tempCoverPosition.split(' ');
    const currentY = parts.length > 1 ? parseFloat(parts[1]) : 50;
    setInitialYPercent(isNaN(currentY) ? 50 : currentY);
  };
  const handleCoverMouseMove = (e: React.MouseEvent) => {
    if (!isRepositioning || dragStartY === null) return;
    e.preventDefault();
    const diff = e.clientY - dragStartY;
    let newPercent = initialYPercent - (diff / 4); // Sensitivity
    if (newPercent < 0) newPercent = 0; if (newPercent > 100) newPercent = 100;
    setTempCoverPosition(`50% ${newPercent.toFixed(1)}%`);
  };
  const handleCoverMouseUp = () => setDragStartY(null);


  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-white text-red-600 font-bold text-xl">Carregando...</div>;
  if (!currentUser) return <Login />;

  return (
    <Layout currentView={view} setView={setView} user={currentUser} onCreatePost={() => setView(ViewState.FEED)}>
      {view === ViewState.FEED && (
        <div className="space-y-6">
          {/* Create Post */}
          <CreatePost onPostCreate={handleCreatePost} user={currentUser} />

          {/* Feed */}
          {loading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-64 bg-slate-100 rounded-xl"></div>
              <div className="h-64 bg-slate-100 rounded-xl"></div>
            </div>
          ) : (
            <>
              {posts.length > 0 ? (
                posts.map(post => (
                  <PostCard
                    key={post.id}
                    post={post}
                    currentUserId={currentUser?.id}
                    onLike={handleLike}
                    onAddComment={handleAddComment}
                    onDelete={handleDeletePost}
                  />
                ))
              ) : (
                <div className="text-center py-10 bg-slate-50 rounded-xl">
                  <p className="text-slate-500">Seu feed está vazio.</p>
                  <p className="text-sm text-slate-400 mt-1">Siga mais pessoas para ver publicações!</p>
                  <button onClick={() => setView(ViewState.FRIENDS)} className="mt-4 text-red-600 font-medium">Encontrar Amigos</button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {view === ViewState.NOTIFICATIONS && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900 mb-4">Notificações</h2>
          <h3 className="text-lg font-semibold text-slate-700">Solicitações de Amizade</h3>

          {requestsLoading ? <div className="text-slate-400">Carregando...</div> : (
            friendRequests.length > 0 ? (
              friendRequests.map(req => (
                <FriendRequestCard key={req.id} request={req} onAccept={handleAcceptRequest} onReject={handleRejectRequest} />
              ))
            ) : (
              <div className="p-8 text-center bg-slate-50 rounded-xl text-slate-500">
                Nenhuma solicitação pendente.
              </div>
            )
          )}
        </div>
      )}

      {view === ViewState.FRIENDS && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white">Amizades</h2>

          {/* Tabs */}
          <div className="flex gap-2 border-b border-slate-700">
            <button
              onClick={() => setFriendsTab('suggestions')}
              className={`px-4 py-2 font-medium transition-colors ${friendsTab === 'suggestions'
                ? 'text-blue-500 border-b-2 border-blue-500'
                : 'text-slate-400 hover:text-slate-300'
                }`}
            >
              Sugestões ({suggestions.length})
            </button>
            <button
              onClick={() => setFriendsTab('received')}
              className={`px-4 py-2 font-medium transition-colors ${friendsTab === 'received'
                ? 'text-blue-500 border-b-2 border-blue-500'
                : 'text-slate-400 hover:text-slate-300'
                }`}
            >
              Pendentes ({friendRequests.length})
            </button>
            <button
              onClick={() => setFriendsTab('sent')}
              className={`px-4 py-2 font-medium transition-colors ${friendsTab === 'sent'
                ? 'text-blue-500 border-b-2 border-blue-500'
                : 'text-slate-400 hover:text-slate-300'
                }`}
            >
              Solicitadas ({sentRequests.length})
            </button>
          </div>

          {/* Suggestions Tab */}
          {friendsTab === 'suggestions' && (
            <div className="space-y-4">
              {suggestions.length > 0 ? (
                suggestions.map(user => (
                  <div key={user.id} className="flex items-center justify-between p-4 bg-slate-800 border border-slate-700 rounded-xl shadow-sm">
                    <div className="flex items-center space-x-3">
                      <img src={user.avatar} className="w-12 h-12 rounded-full object-cover" alt={user.name} />
                      <div>
                        <div className="font-bold text-white">{user.name}</div>
                        <div className="text-sm text-slate-400">{user.info}</div>
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        await handleFollow(user.id);
                        loadSuggestions();
                        loadSentRequests();
                      }}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      Adicionar
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 bg-slate-800 rounded-xl">
                  <p className="text-slate-400">Nenhuma sugestão no momento</p>
                </div>
              )}
            </div>
          )}

          {/* Received Requests Tab */}
          {friendsTab === 'received' && (
            <div className="space-y-4">
              {requestsLoading ? (
                <div className="text-slate-400 text-center py-8">Carregando...</div>
              ) : friendRequests.length > 0 ? (
                friendRequests.map(req => (
                  <FriendRequestCard
                    key={req.id}
                    request={req}
                    onAccept={async (id) => {
                      await handleAcceptRequest(id);
                      loadSuggestions();
                    }}
                    onReject={handleRejectRequest}
                  />
                ))
              ) : (
                <div className="text-center py-12 bg-slate-800 rounded-xl">
                  <p className="text-slate-400">Nenhuma solicitação pendente</p>
                </div>
              )}
            </div>
          )}

          {/* Sent Requests Tab */}
          {friendsTab === 'sent' && (
            <div className="space-y-4">
              {sentRequests.length > 0 ? (
                sentRequests.map(user => (
                  <div key={user.id} className="flex items-center justify-between p-4 bg-slate-800 border border-slate-700 rounded-xl shadow-sm">
                    <div className="flex items-center space-x-3">
                      <img src={user.avatar} className="w-12 h-12 rounded-full object-cover" alt={user.name} />
                      <div>
                        <div className="font-bold text-white">{user.name}</div>
                        <div className="text-sm text-slate-400">{user.handle}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-yellow-500 text-sm font-medium bg-yellow-500/10 px-3 py-1 rounded-full">Aguardando</span>
                      <button
                        onClick={async () => {
                          await handleUnfollow(user.id);
                          loadSentRequests();
                          loadSuggestions();
                        }}
                        className="text-red-400 hover:text-red-300 text-sm font-medium"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 bg-slate-800 rounded-xl">
                  <p className="text-slate-400">Nenhuma solicitação enviada</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {view === ViewState.PROFILE && (
        <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-3xl shadow-2xl border border-slate-700/50 overflow-hidden">
          {/* Futuristic Background Effects */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5 pointer-events-none"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

          {/* Profile Header - Futuristic Style */}
          <div className="relative p-6 backdrop-blur-sm">
            {/* Settings & Logout Button */}
            <div className="absolute top-4 right-4 flex gap-2 z-10">
              <button
                onClick={() => setView(ViewState.SETTINGS)}
                className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-600/50 text-slate-300 hover:text-white transition-all hover:scale-110 backdrop-blur-sm"
                title="Configurações"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <button
                onClick={signOut}
                className="p-2 rounded-xl bg-gradient-to-r from-red-600/80 to-pink-600/80 hover:from-red-500 hover:to-pink-500 border border-red-500/50 text-white transition-all hover:scale-110 backdrop-blur-sm shadow-lg shadow-red-500/20"
                title="Sair"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
            <div className="flex items-start gap-6 mb-6">
              {/* Avatar with Repositioning - Futuristic */}
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full blur-md opacity-50 animate-pulse"></div>
                <div
                  className={`relative w-24 h-24 sm:w-32 sm:h-32 rounded-full overflow-hidden border-2 bg-slate-800 ${isRepositioning
                    ? 'cursor-move ring-4 ring-blue-500 shadow-2xl shadow-blue-500/50'
                    : 'border-slate-600 shadow-xl shadow-purple-500/20'
                    } transition-all`}
                  onMouseDown={handleCoverMouseDown}
                  onMouseMove={handleCoverMouseMove}
                  onMouseUp={handleCoverMouseUp}
                  onMouseLeave={handleCoverMouseUp}
                >
                  <img
                    src={currentUser.avatar}
                    className="w-full h-full object-cover pointer-events-none"
                    style={{ objectPosition: isRepositioning ? tempCoverPosition : (currentUser.coverPosition || '50% 50%') }}
                    alt={currentUser.name}
                  />
                </div>

                {/* Reposition Controls */}
                {isRepositioning && (
                  <div className="absolute -bottom-14 left-0 right-0 flex gap-2 justify-center">
                    <button
                      onClick={saveReposition}
                      className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-blue-500/50 hover:shadow-blue-500/70 hover:scale-105 transition-all"
                    >
                      ✓ Salvar
                    </button>
                    <button
                      onClick={cancelReposition}
                      className="bg-slate-700 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-600 hover:scale-105 transition-all"
                    >
                      ✕ Cancelar
                    </button>
                  </div>
                )}
                {!isRepositioning && (
                  <button
                    onClick={startReposition}
                    className="absolute bottom-0 right-0 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white p-2 rounded-full transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:scale-110"
                    title="Reposicionar foto"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Stats - Desktop - Futuristic */}
              <div className="hidden sm:flex flex-1 justify-around items-center">
                <div className="text-center group cursor-pointer">
                  <div className="relative">
                    <span className="font-bold text-white text-2xl block bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent group-hover:scale-110 transition-transform">
                      {posts.filter(p => p.user.id === currentUser.id).length}
                    </span>
                    <div className="absolute inset-0 bg-blue-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </div>
                  <span className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">publicações</span>
                </div>
                <div className="text-center group cursor-pointer">
                  <div className="relative">
                    <span className="font-bold text-white text-2xl block bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent group-hover:scale-110 transition-transform">
                      {followersCount}
                    </span>
                    <div className="absolute inset-0 bg-purple-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </div>
                  <span className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">seguidores</span>
                </div>
                <div className="text-center group cursor-pointer">
                  <div className="relative">
                    <span className="font-bold text-white text-2xl block bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent group-hover:scale-110 transition-transform">
                      {friends.length}
                    </span>
                    <div className="absolute inset-0 bg-pink-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </div>
                  <span className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">seguindo</span>
                </div>
              </div>
            </div>

            {/* User Info - Futuristic */}
            <div className="space-y-2 backdrop-blur-sm bg-slate-800/30 rounded-2xl p-4 border border-slate-700/50">
              <h1 className="text-xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
                {currentUser.name}
              </h1>
              <p className="text-sm text-blue-400 font-medium">{currentUser.handle}</p>
              {currentUser.bio && (
                <p className="text-sm text-slate-300 mt-3 leading-relaxed whitespace-pre-wrap">
                  {currentUser.bio}
                </p>
              )}
            </div>

            {/* Stats - Mobile - Futuristic */}
            <div className="flex sm:hidden justify-around mt-6 pt-6 border-t border-slate-700/50">
              <div className="text-center">
                <span className="font-bold text-white text-lg block bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  {posts.filter(p => p.user.id === currentUser.id).length}
                </span>
                <span className="text-xs text-slate-400">publicações</span>
              </div>
              <div className="text-center">
                <span className="font-bold text-white text-lg block bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                  {followersCount}
                </span>
                <span className="text-xs text-slate-400">seguidores</span>
              </div>
              <div className="text-center">
                <span className="font-bold text-white text-lg block bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent">
                  {friends.length}
                </span>
                <span className="text-xs text-slate-400">seguindo</span>
              </div>
            </div>
          </div>

          {/* Posts Grid */}
          <div className="border-t border-slate-800">
            <div className="grid grid-cols-3 gap-1">
              {posts
                .filter(p => p.user.id === currentUser.id)
                .map(post => (
                  <div key={post.id} className="aspect-square bg-slate-800 relative group overflow-hidden cursor-pointer">
                    {post.image ? (
                      <img src={post.image} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" alt="Post" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-4 text-xs text-slate-400 text-center">{post.content.substring(0, 50)}</div>
                    )}
                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                      <div className="flex items-center gap-1 text-white">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-bold">{post.likes}</span>
                      </div>
                      <div className="flex items-center gap-1 text-white">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-bold">{post.comments.length}</span>
                      </div>
                    </div>
                  </div>
                ))
              }
            </div>
            {posts.filter(p => p.user.id === currentUser.id).length === 0 && (
              <div className="text-center py-16 text-slate-500">
                <svg className="w-16 h-16 mx-auto mb-4 text-slate-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm">Nenhuma publicação ainda</p>
              </div>
            )}
          </div>
        </div>
      )}

      {view === ViewState.SETTINGS && (
        <div className="bg-white p-6 rounded-2xl border border-slate-100">
          <h2 className="text-xl font-bold mb-6">Editar Perfil</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nome</label>
              <input type="text" value={settingsForm.name} onChange={e => setSettingsForm({ ...settingsForm, name: e.target.value })} className="w-full p-2 border rounded-lg" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Handle</label>
              <input type="text" value={settingsForm.handle} onChange={handleUsernameChange} className="w-full p-2 border rounded-lg" />
              {handleError && <p className="text-red-500 text-xs">{handleError}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Bio</label>
              <textarea value={settingsForm.bio} onChange={e => setSettingsForm({ ...settingsForm, bio: e.target.value })} className="w-full p-2 border rounded-lg" rows={3} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Avatar</label>
              <input type="file" onChange={e => handleImageUpload(e, 'avatar')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Capa</label>
              <input type="file" onChange={e => handleImageUpload(e, 'coverImage')} />
            </div>
          </div>

          <div className="mt-6 flex justify-between items-center">
            <button onClick={signOut} className="text-red-600 font-medium hover:underline">Sair da conta</button>
            <div className="flex items-center space-x-4">
              {saveMessage && <span className="text-green-600 text-sm">{saveMessage}</span>}
              <button onClick={handleSaveSettings} className="bg-black text-white px-6 py-2 rounded-lg font-bold hover:bg-gray-800">Salvar</button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;