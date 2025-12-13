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
    <Layout currentView={view} setView={setView} user={currentUser}>
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
          <h2 className="text-2xl font-bold text-slate-900">Explorar</h2>

          {/* Search */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:ring-2 focus:ring-red-500 transition-all outline-none"
              placeholder="Buscar pessoas..."
              value={friendSearchQuery}
              onChange={(e) => setFriendSearchQuery(e.target.value)}
            />
          </div>

          {/* Results */}
          {searchResults.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {searchResults.map(user => (
                <div key={user.id} className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-xl shadow-sm">
                  <div className="flex items-center space-x-3">
                    <img src={user.avatar} className="w-12 h-12 rounded-full object-cover" />
                    <div>
                      <div className="font-bold text-slate-900">{user.name}</div>
                      <div className="text-sm text-slate-500">{user.handle}</div>
                    </div>
                  </div>
                  <div>
                    {user.status === 'accepted' ? (
                      <span className="text-green-600 text-sm font-medium bg-green-50 px-3 py-1 rounded-full">Amigos</span>
                    ) : user.status === 'pending' ? (
                      <button disabled className="text-slate-500 bg-slate-100 px-4 py-2 rounded-lg text-sm font-medium">Solicitado</button>
                    ) : (
                      <button onClick={() => handleFollow(user.id)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">Solicitar</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-slate-500 text-center py-8">
              {friendSearchQuery ? "Nenhum usuário encontrado." : "Busque por nome ou @usuario"}
            </div>
          )}
        </div>
      )}

      {view === ViewState.PROFILE && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div
            className={`h-64 relative bg-slate-200 ${isRepositioning ? 'cursor-move' : ''}`}
            onMouseDown={handleCoverMouseDown}
            onMouseMove={handleCoverMouseMove}
            onMouseUp={handleCoverMouseUp}
            onMouseLeave={handleCoverMouseUp}
          >
            {currentUser.coverImage && (
              <img src={currentUser.coverImage} className="w-full h-full object-cover pointer-events-none" style={{ objectPosition: isRepositioning ? tempCoverPosition : (currentUser.coverPosition || '50% 50%') }} />
            )}
            {isRepositioning && (
              <div className="absolute top-4 right-4 space-x-2">
                <button onClick={saveReposition} className="bg-white text-black px-4 py-2 rounded-full text-sm font-bold shadow-lg">Salvar</button>
                <button onClick={cancelReposition} className="bg-black/50 text-white px-4 py-2 rounded-full text-sm font-bold backdrop-blur-md">Cancelar</button>
              </div>
            )}
            {!isRepositioning && (
              <button onClick={startReposition} className="absolute top-4 right-4 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full backdrop-blur-md transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" /></svg>
              </button>
            )}
          </div>

          <div className="px-6 pb-6">
            <div className="relative -mt-16 mb-4 flex justify-between items-end">
              <img src={currentUser.avatar} className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-white object-cover" />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900">{currentUser.name}</h1>
              <p className="text-slate-500 font-medium">{currentUser.handle}</p>
              <p className="mt-2 text-slate-700">{currentUser.bio || "Sem biografia."}</p>
            </div>

            <div className="flex space-x-6 mt-6 border-t border-slate-100 pt-4">
              <div className="text-center"><span className="font-bold text-slate-900 block">{posts.filter(p => p.user.id === currentUser.id).length}</span><span className="text-xs text-slate-500 uppercase">Posts</span></div>
              <div className="text-center"><span className="font-bold text-slate-900 block">{followersCount}</span><span className="text-xs text-slate-500 uppercase">Seguidores</span></div>
              <div className="text-center"><span className="font-bold text-slate-900 block">{friends.length}</span><span className="text-xs text-slate-500 uppercase">Seguindo</span></div>
            </div>
          </div>

          {/* My Posts or Private Warning */}
          <div className="px-2 pb-8">
            <div className="grid grid-cols-3 gap-1">
              {posts
                .filter(p => p.user.id === currentUser.id)
                .map(post => (
                  <div key={post.id} className="aspect-square bg-slate-100 relative group overflow-hidden cursor-pointer">
                    {post.image ? (
                      <img src={post.image} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center p-4 text-xs text-slate-400 text-center">{post.content.substring(0, 50)}</div>
                    )}
                  </div>
                ))
              }
            </div>
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