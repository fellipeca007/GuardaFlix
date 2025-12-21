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
import { uploadImage, supabase } from './services/supabase';

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
  const [followers, setFollowers] = useState<any[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<FriendSuggestion[]>([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [friendsTab, setFriendsTab] = useState<'suggestions' | 'received' | 'sent' | 'followers' | 'following'>('suggestions');
  const [profileViewTab, setProfileViewTab] = useState<'posts' | 'followers' | 'friends'>('posts');
  const [sentRequests, setSentRequests] = useState<any[]>([]);

  // Friend Profile State
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [selectedFriend, setSelectedFriend] = useState<User | null>(null);

  // Settings State
  const [handleError, setHandleError] = useState<string | null>(null);
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
      loadFriendRequests();
      loadSentRequests();
    }
  }, [currentUser]);

  const loadFeed = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const realPosts = await PostService.getFeedPosts(currentUser.id);
      setPosts(realPosts);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const loadFriends = async () => {
    if (!currentUser) return;
    try {
      const myFriends = await FriendService.getFriends(currentUser.id);
      setFriends(myFriends);
      const myFollowers = await FriendService.getFollowers(currentUser.id);
      setFollowers(myFollowers);
      setFollowersCount(myFollowers.length);
    } catch (e) { console.error(e); }
  };

  const loadFriendRequests = async () => {
    if (!currentUser) return;
    setRequestsLoading(true);
    try {
      const reqs = await FriendService.getPendingRequests(currentUser.id);
      setFriendRequests(reqs);
    } catch (e) { console.error(e); }
    setRequestsLoading(false);
  };

  const loadSentRequests = async () => {
    if (!currentUser) return;
    try {
      const allUsers = await FriendService.searchUsers('', currentUser.id);
      const enriched = await Promise.all((allUsers || []).map(async (u: any) => {
        const status = await FriendService.checkIsFollowing(currentUser.id, u.id);
        return { ...u, status };
      }));
      setSentRequests(enriched.filter(u => u.status === 'pending'));
    } catch (e) { console.error(e); }
  };

  const loadSuggestions = async () => {
    if (!currentUser) return;
    setSuggestionsLoading(true);
    try {
      const mySuggestions = await FriendService.getSuggestions(currentUser.id);
      setSuggestions(mySuggestions);
    } catch (e) { console.error(e); }
    setSuggestionsLoading(false);
  };

  const handleFollow = async (targetUserId: string) => {
    if (!currentUser) return;
    setSuggestions(prev => prev.filter(u => u.id !== targetUserId));
    try {
      await FriendService.followUser(currentUser.id, targetUserId);
      loadSentRequests();
    } catch (error) {
      console.error(error);
      alert("Erro ao enviar solicitação.");
      loadSuggestions();
    }
  };

  const handleUnfollow = async (targetUserId: string) => {
    if (!currentUser) return;
    if (!window.confirm("Deseja interromper o apoio a este guardião?")) return;
    try {
      await FriendService.unfollowUser(currentUser.id, targetUserId);
      loadFriends();
      loadFeed();
      loadSentRequests();
      loadSuggestions();
    } catch (e) { console.error(e); }
  };

  const handleAcceptRequest = async (requesterId: string) => {
    if (!currentUser) return;
    setFriendRequests(prev => prev.filter(r => r.id !== requesterId));
    try {
      await FriendService.acceptRequest(currentUser.id, requesterId);
      loadFriends();
      loadFeed();
    } catch (error) {
      console.error(error);
      loadFriendRequests();
    }
  };

  const handleRejectRequest = async (requesterId: string) => {
    if (!currentUser) return;
    setFriendRequests(prev => prev.filter(r => r.id !== requesterId));
    try {
      await FriendService.rejectRequest(currentUser.id, requesterId);
    } catch (error) { console.error(error); }
  };

  const handleUserClick = async (userId: string) => {
    if (!currentUser) return;
    if (userId === currentUser.id) {
      setView(ViewState.PROFILE);
      return;
    }
    try {
      const status = await FriendService.checkIsFollowing(currentUser.id, userId);
      if (status === 'accepted') {
        setSelectedFriendId(userId);
        setView(ViewState.FRIEND_PROFILE);
      } else {
        alert('Você precisa ser aliado deste guardião para ver o perfil completo.');
      }
    } catch (error) { console.error(error); }
  };

  useEffect(() => {
    const loadFriendProfile = async () => {
      if (!selectedFriendId || !currentUser) return;
      try {
        const { data, error } = await supabase.from('profiles').select('*').eq('id', selectedFriendId).single();
        if (error) throw error;
        if (data) {
          setSelectedFriend({
            id: data.id,
            name: data.display_name || 'Usuário',
            avatar: data.avatar_url || 'https://picsum.photos/seed/default/150/150',
            handle: data.handle || '@usuario',
            coverImage: data.cover_image_url || 'https://picsum.photos/seed/cover/800/250',
            bio: data.bio,
            coverPosition: data.cover_position
          });
        }
      } catch (error) { console.error(error); }
    };
    loadFriendProfile();
  }, [selectedFriendId, currentUser]);

  const handleCreatePost = async (content: string, image?: string, sentiment?: string) => {
    if (!currentUser) return;
    try {
      await PostService.createPost(currentUser.id, content, image, sentiment);
      loadFeed();
    } catch (error) { console.error(error); alert("Erro ao criar post."); }
  };

  const handleLike = async (postId: string) => {
    if (!currentUser) return;
    const post = posts.find(p => p.id === postId);
    if (!post) return;
    const isLiked = post.isLiked;
    setPosts(posts.map(p => p.id === postId ? { ...p, likes: isLiked ? p.likes - 1 : p.likes + 1, isLiked: !isLiked } : p));
    try { await PostService.toggleLike(postId, currentUser.id, isLiked); } catch (e) { console.error(e); }
  };

  const handleAddComment = async (postId: string, content: string) => {
    if (!currentUser) return;
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
    setPosts(prev => prev.filter(p => p.id !== postId));
    try { await PostService.deletePost(postId, currentUser.id); } catch (error) { console.error(error); loadFeed(); }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'avatar' | 'coverImage') => {
    const file = e.target.files?.[0];
    if (file) {
      if (field === 'avatar') setAvatarFile(file);
      else setCoverFile(file);
      const reader = new FileReader();
      reader.onloadend = () => { setSettingsForm(prev => ({ ...prev, [field]: reader.result as string })); };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveSettings = async () => {
    if (handleError || !currentUser) return;
    setSaveMessage('📤 Transmitindo arquivos...');
    try {
      let avatarUrl = settingsForm.avatar;
      let coverUrl = settingsForm.coverImage;

      // Only upload if a new file was selected
      if (avatarFile) {
        const uploadedUrl = await uploadImage(avatarFile, 'avatars');
        if (uploadedUrl) avatarUrl = uploadedUrl;
      }

      if (coverFile) {
        const uploadedUrl = await uploadImage(coverFile, 'avatars'); // Use 'avatars' for both to be safe
        if (uploadedUrl) coverUrl = uploadedUrl;
      }

      await updateProfile({
        name: settingsForm.name,
        handle: settingsForm.handle,
        bio: settingsForm.bio,
        avatar: avatarUrl,
        coverImage: coverUrl
      });

      setAvatarFile(null);
      setCoverFile(null);
      setSaveMessage('✅ Perfil Atualizado!');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (e) {
      console.error(e);
      setSaveMessage('❌ Erro na Transmissão');
      setTimeout(() => setSaveMessage(null), 3000);
    }
  };

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
    let newPercent = initialYPercent - (diff / 4);
    if (newPercent < 0) newPercent = 0; if (newPercent > 100) newPercent = 100;
    setTempCoverPosition(`50% ${newPercent.toFixed(1)}%`);
  };
  const handleCoverMouseUp = () => setDragStartY(null);

  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-blue-500 font-black text-xl italic uppercase tracking-tighter">Iniciando Sistemas de Guarda...</div>;
  if (!currentUser) return <Login />;

  return (
    <Layout currentView={view} setView={setView} user={currentUser} onCreatePost={() => setView(ViewState.FEED)}>
      {view === ViewState.FEED && (
        <div className="max-w-xl mx-auto space-y-6">
          <CreatePost onPostCreate={handleCreatePost} user={currentUser} />
          {loading ? (
            <div className="animate-pulse space-y-4">
              <div className="h-64 bg-slate-800/50 rounded-3xl"></div>
              <div className="h-64 bg-slate-800/50 rounded-3xl"></div>
            </div>
          ) : (
            <>
              {posts.length > 0 ? (
                posts.map(post => (
                  <PostCard key={post.id} post={post} currentUserId={currentUser.id} currentUserAvatar={currentUser.avatar} onLike={handleLike} onAddComment={handleAddComment} onDelete={handleDeletePost} onUserClick={handleUserClick} />
                ))
              ) : (
                <div className="text-center py-16 bg-slate-900/60 backdrop-blur-xl rounded-[2.5rem] border border-slate-700/50 shadow-2xl">
                  <div className="w-20 h-20 bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-slate-700 shadow-lg">
                    <svg className="w-10 h-10 text-blue-500/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </div>
                  <p className="text-white font-black uppercase italic tracking-tighter text-xl mb-2">Canal de Transmissão Vazio</p>
                  <p className="text-slate-500 text-sm font-medium px-8 leading-relaxed">Recrute mais aliados para receber informes táticos em tempo real.</p>
                  <button onClick={() => setView(ViewState.FRIENDS)} className="mt-8 px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all active:scale-95 shadow-xl shadow-blue-500/20">Recrutar Aliados</button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {view === ViewState.NOTIFICATIONS && (
        <div className="max-w-xl mx-auto space-y-6">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">Alertas de <span className="text-blue-500">Rádio</span></h2>
            <div className="h-1 w-12 bg-blue-600 rounded-full"></div>
          </div>
          {requestsLoading ? (
            <div className="text-blue-500 font-mono text-center py-20 animate-pulse text-xs uppercase tracking-widest">Sintonizando Frequências...</div>
          ) : friendRequests.length > 0 ? (
            friendRequests.map(req => (
              <FriendRequestCard key={req.id} request={req} onAccept={handleAcceptRequest} onReject={handleRejectRequest} />
            ))
          ) : (
            <div className="p-16 text-center bg-slate-900/60 backdrop-blur-xl rounded-[2.5rem] border border-slate-700/50 shadow-2xl">
              <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Silêncio de Rádio</p>
              <p className="text-slate-600 text-[10px] mt-2 font-mono uppercase">Nenhuma solicitação de apoio captada.</p>
            </div>
          )}
        </div>
      )}

      {view === ViewState.FRIENDS && (
        <div className="max-w-xl mx-auto space-y-6 pb-20">
          <div className="relative bg-slate-900/60 backdrop-blur-xl rounded-[2rem] border border-slate-700/50 p-6 shadow-2xl overflow-hidden group">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-black text-white tracking-tighter uppercase italic">Aliados & <span className="text-blue-500">Corporação</span></h2>
                <div className="flex items-center gap-2 mt-1">
                  <div className="h-1 w-8 bg-blue-500 rounded-full"></div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">Base de Dados de Guardiões</span>
                </div>
              </div>
            </div>

            {/* Tactical Switcher (Tabs) */}
            <div className="relative mb-8">
              <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar-hide snap-x no-scrollbar">
                {[
                  { id: 'suggestions', label: 'Sugestões', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
                  { id: 'received', label: 'Chamados', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
                  { id: 'sent', label: 'Pendentes', icon: 'M12 19l9 2-9-18-9 18 9-2zm0 0v-8' },
                  { id: 'followers', label: 'Pelotão', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
                  { id: 'following', label: 'Operações', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setFriendsTab(tab.id as any)}
                    className={`
                      flex items-center gap-2.5 px-6 py-3.5 rounded-2xl whitespace-nowrap snap-start transition-all duration-300 border font-black uppercase tracking-widest text-[10px]
                      ${friendsTab === tab.id
                        ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_20px_rgba(37,99,235,0.4)] scale-105 z-10'
                        : 'bg-slate-800/40 border-slate-700/50 text-slate-500 hover:text-slate-300 hover:bg-slate-700/60 hover:border-slate-600'
                      }
                    `}
                  >
                    <svg className={`w-4 h-4 ${friendsTab === tab.id ? 'text-white' : 'text-slate-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={tab.icon} />
                    </svg>
                    {tab.label}
                  </button>
                ))}
              </div>
              {/* Fade out edges for mobile scroll indicator */}
              <div className="absolute top-0 right-0 h-full w-12 bg-gradient-to-l from-slate-900 to-transparent pointer-events-none lg:hidden"></div>
            </div>

            <div className="space-y-4">
              {friendsTab === 'suggestions' && (
                <div className="space-y-4">
                  {suggestionsLoading ? (
                    <div className="text-blue-500 text-center py-12 animate-pulse font-mono text-xs uppercase tracking-widest">Varrendo Grade de Frequências...</div>
                  ) : suggestions.length > 0 ? (
                    suggestions.map(user => (
                      <div key={user.id} className="group relative flex items-center justify-between p-4 bg-slate-800/40 rounded-2xl border border-slate-700/50 hover:border-blue-500/30 transition-all">
                        <div className="flex items-center space-x-4 cursor-pointer" onClick={() => handleUserClick(user.id)}>
                          <img src={user.avatar} className="w-12 h-12 rounded-xl object-cover border-2 border-slate-700 shadow-lg" alt={user.name} />
                          <div>
                            <div className="font-black text-white text-sm uppercase tracking-tight">{user.name}</div>
                            <div className="text-[10px] font-mono text-blue-400 uppercase tracking-wider">{user.handle}</div>
                          </div>
                        </div>
                        <button onClick={() => handleFollow(user.id)} className="bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-blue-500/20 transition-all active:scale-95">Convocar</button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-16 bg-slate-800/30 rounded-3xl border border-dashed border-slate-700">
                      <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Grade de Sugestões Offline</p>
                    </div>
                  )}
                </div>
              )}

              {friendsTab === 'received' && (
                <div className="space-y-4">
                  {requestsLoading ? (
                    <div className="text-slate-400 text-center py-12 animate-pulse">Processando sinais de entrada...</div>
                  ) : friendRequests.length > 0 ? (
                    friendRequests.map(req => (
                      <FriendRequestCard key={req.id} request={req} onAccept={async (id) => { await handleAcceptRequest(id); loadSuggestions(); }} onReject={handleRejectRequest} />
                    ))
                  ) : (
                    <div className="text-center py-16 bg-slate-800/30 rounded-3xl border border-dashed border-slate-700">
                      <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Sem Sinais Recebidos</p>
                    </div>
                  )}
                </div>
              )}

              {friendsTab === 'sent' && (
                <div className="space-y-4">
                  {sentRequests.length > 0 ? (
                    sentRequests.map(user => (
                      <div key={user.id} className="flex items-center justify-between p-4 bg-slate-800/40 border border-slate-700/50 rounded-2xl">
                        <div className="flex items-center space-x-4">
                          <img src={user.avatar} className="w-12 h-12 rounded-xl object-cover border border-slate-700" alt={user.name} />
                          <div>
                            <div className="font-black text-white text-sm uppercase tracking-tight">{user.name}</div>
                            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">{user.handle}</div>
                          </div>
                        </div>
                        <button onClick={async () => { await handleUnfollow(user.id); loadSentRequests(); loadSuggestions(); }} className="text-red-400 hover:text-red-300 text-[9px] font-black uppercase tracking-[0.2em] border border-red-500/20 px-3 py-1.5 rounded-lg hover:bg-red-500/10 transition-all">Abortar</button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-16 bg-slate-800/30 rounded-3xl border border-dashed border-slate-700">
                      <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Nenhuma Transmissão Pendente</p>
                    </div>
                  )}
                </div>
              )}

              {friendsTab === 'followers' && (
                <div className="space-y-4">
                  {followers.length > 0 ? (
                    followers.map(user => (
                      <div key={user.id} className="group flex items-center justify-between p-4 bg-slate-800/40 border border-slate-700/50 rounded-2xl hover:border-blue-500/30 transition-all">
                        <div className="flex items-center space-x-4 cursor-pointer" onClick={() => handleUserClick(user.id)}>
                          <img src={user.avatar} className="w-12 h-12 rounded-xl object-cover border border-slate-700" alt={user.name} />
                          <div>
                            <div className="font-black text-white text-sm uppercase tracking-tight">{user.name}</div>
                            <div className="text-[10px] font-mono text-blue-400 uppercase tracking-wider">{user.handle}</div>
                          </div>
                        </div>
                        <button onClick={() => handleUnfollow(user.id)} className="text-slate-500 hover:text-red-400 text-[10px] font-black uppercase tracking-widest transition-colors p-2">Remover</button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-16 bg-slate-800/30 rounded-3xl border border-dashed border-slate-700">
                      <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Pelotão em Missão Externa</p>
                    </div>
                  )}
                </div>
              )}

              {friendsTab === 'following' && (
                <div className="space-y-4">
                  {friends.length > 0 ? (
                    friends.map(user => (
                      <div key={user.id} className="group flex items-center justify-between p-4 bg-slate-800/40 border border-slate-700/50 rounded-2xl hover:border-purple-500/30 transition-all">
                        <div className="flex items-center space-x-4 cursor-pointer" onClick={() => handleUserClick(user.id)}>
                          <img src={user.avatar} className="w-12 h-12 rounded-xl object-cover border border-slate-700" alt={user.name} />
                          <div>
                            <div className="font-black text-white text-sm uppercase tracking-tight">{user.name}</div>
                            <div className="text-[10px] font-mono text-purple-400 uppercase tracking-wider">{user.handle}</div>
                          </div>
                        </div>
                        <button onClick={() => handleUnfollow(user.id)} className="bg-slate-700/50 hover:bg-red-600/20 text-slate-400 hover:text-red-400 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-600 hover:border-red-500/30 transition-all">Encerrar</button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-16 bg-slate-800/30 rounded-3xl border border-dashed border-slate-700">
                      <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Sem Operações em Curso</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {view === ViewState.PROFILE && (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
          <div className="relative bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-700/50 overflow-hidden">
            <div className="relative h-48 sm:h-64 overflow-hidden group">
              <img
                src={currentUser.coverImage || 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=1200'}
                className={`w-full h-full object-cover transition-transform duration-700 ${isRepositioning ? 'scale-105 saturate-150' : 'group-hover:scale-105'}`}
                style={{ objectPosition: isRepositioning ? tempCoverPosition : (currentUser.coverPosition || '50% 50%') }}
                alt="Cover"
                onMouseDown={handleCoverMouseDown}
                onMouseMove={handleCoverMouseMove}
                onMouseUp={handleCoverMouseUp}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
              <div className="absolute top-4 right-4 flex gap-2">
                <button onClick={() => setView(ViewState.SETTINGS)} className="p-2.5 rounded-xl bg-slate-900/60 hover:bg-blue-600 border border-slate-700/50 text-white transition-all backdrop-blur-xl group/btn active:scale-95">
                  <svg className="w-5 h-5 group-hover/btn:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
                <button onClick={signOut} className="p-2.5 rounded-xl bg-red-600/20 hover:bg-red-600 border border-red-500/30 text-red-500 hover:text-white transition-all backdrop-blur-xl active:scale-95">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
              </div>
              {isRepositioning && (
                <div className="absolute inset-x-0 bottom-6 flex justify-center gap-3 animate-bounce">
                  <button onClick={saveReposition} className="bg-blue-600 text-white px-6 py-2 rounded-full font-bold shadow-xl border border-blue-400">Confirmar</button>
                  <button onClick={cancelReposition} className="bg-slate-800 text-white px-6 py-2 rounded-full font-bold border border-slate-600">Cancelar</button>
                </div>
              )}
              {!isRepositioning && (
                <button onClick={startReposition} className="absolute bottom-4 right-4 bg-black/40 hover:bg-black/60 text-white p-2 rounded-lg backdrop-blur-md border border-white/10 opacity-0 group-hover:opacity-100 transition-all">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </button>
              )}
            </div>

            <div className="relative px-6 pb-8 -mt-16 sm:-mt-20">
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 sm:gap-8">
                <div className="relative">
                  <div className="absolute inset-0 bg-blue-500 rounded-2xl blur-2xl opacity-40 animate-pulse"></div>
                  <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-[2.5rem] overflow-hidden border-4 border-slate-900 bg-slate-800 shadow-2xl">
                    <img src={currentUser.avatar} className="w-full h-full object-cover" alt={currentUser.name} />
                  </div>
                </div>
                <div className="flex-1 text-center sm:text-left mb-2">
                  <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">{currentUser.name}</h1>
                  <p className="text-blue-400 font-mono text-lg mt-1 tracking-wider uppercase">{currentUser.handle}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6 mt-8">
                <div className="bg-slate-800/40 backdrop-blur-md rounded-3xl p-6 border border-slate-700/50">
                  <h3 className="text-slate-500 uppercase text-[10px] font-black tracking-[0.2em] mb-3">Diretivas Operacionais</h3>
                  <p className="text-slate-200 leading-relaxed italic">{currentUser.bio || "Nenhuma diretiva registrada no sistema."}</p>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <button onClick={() => setProfileViewTab('posts')} className={`p-5 rounded-3xl border transition-all text-center shadow-lg active:scale-95 ${profileViewTab === 'posts' ? 'bg-blue-600/20 border-blue-500 shadow-blue-500/20' : 'bg-slate-800/80 border-slate-700/50 hover:bg-slate-700'}`}>
                    <span className={`block text-2xl sm:text-3xl font-black mb-1 ${profileViewTab === 'posts' ? 'text-blue-400' : 'text-blue-500'}`}>{posts.filter(p => p.user.id === currentUser.id).length}</span>
                    <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Boletins</span>
                  </button>
                  <button onClick={() => setProfileViewTab('followers')} className={`p-5 rounded-3xl border transition-all text-center shadow-lg active:scale-95 ${profileViewTab === 'followers' ? 'bg-blue-600/20 border-blue-500 shadow-blue-500/20' : 'bg-slate-800/80 border-slate-700/50 hover:bg-slate-700'}`}>
                    <span className="block text-2xl sm:text-3xl font-black text-white mb-1">{followersCount}</span>
                    <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Pelotão</span>
                  </button>
                  <button onClick={() => setProfileViewTab('friends')} className={`p-5 rounded-3xl border transition-all text-center shadow-lg active:scale-95 ${profileViewTab === 'friends' ? 'bg-blue-600/20 border-blue-500 shadow-blue-500/20' : 'bg-slate-800/80 border-slate-700/50 hover:bg-slate-700'}`}>
                    <span className="block text-2xl sm:text-3xl font-black text-white mb-1">{friends.length}</span>
                    <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Operações</span>
                  </button>
                </div>
              </div>

              <div className="mt-12 space-y-6">
                <div className="flex items-center justify-between px-2 italic">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-6 bg-blue-600 rounded-full"></div>
                    <h3 className="text-xl font-black text-white tracking-tight uppercase">
                      {profileViewTab === 'posts' ? 'Registros de Boletins' : profileViewTab === 'followers' ? 'Membros do Pelotão' : 'Aliados em Operação'}
                    </h3>
                  </div>
                </div>

                <div className="space-y-4">
                  {profileViewTab === 'posts' && (
                    <>
                      {posts.filter(p => p.user.id === currentUser.id).length > 0 ? (
                        posts.filter(p => p.user.id === currentUser.id).map(post => (
                          <div key={post.id} className="bg-slate-800/40 backdrop-blur-md rounded-[1.5rem] border border-slate-700/50 p-4 sm:p-5 flex flex-col gap-4 group hover:border-blue-500/30 transition-all">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <p className="text-slate-200 text-sm line-clamp-3 mb-3 leading-relaxed">{post.content}</p>
                                <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-slate-500">
                                  <span className="flex items-center gap-1.5"><svg className="w-3 h-3 text-blue-500" fill="currentColor" viewBox="0 0 24 24"><path d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" /></svg>{post.likes} Apoios</span>
                                  <span className="flex items-center gap-1.5"><svg className="w-3 h-3 text-purple-500" fill="currentColor" viewBox="0 0 24 24"><path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>{post.comments.length} Intervenções</span>
                                </div>
                              </div>
                              <button
                                onClick={() => { if (window.confirm("Confirmar exclusão desta publicação?")) handleDeletePost(post.id); }}
                                className="bg-red-600/10 hover:bg-red-600/20 text-red-500 p-2.5 rounded-xl border border-red-500/20 transition-all active:scale-90 flex-shrink-0"
                                title="Deletar Publicação"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                              </button>
                            </div>
                            {post.image && (
                              <div className="relative w-full aspect-video sm:aspect-auto sm:max-h-48 rounded-2xl overflow-hidden border border-slate-700/50">
                                <img src={post.image} className="w-full h-full object-cover" alt="Post Intelligence" />
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="py-20 text-center bg-slate-900/40 rounded-[2.5rem] border border-slate-700/50 border-dashed">
                          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Sem registros ativos.</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {view === ViewState.SETTINGS && (
        <div className="max-w-2xl mx-auto pb-20">
          <div className="bg-slate-900/60 backdrop-blur-xl rounded-[2rem] border border-slate-700/50 p-8 shadow-2xl">
            <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-8 flex items-center gap-3">
              <div className="w-2 h-8 bg-blue-600 rounded-full"></div>
              Configurações de Identidade
            </h2>
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Foto de Perfil</label>
                  <div className="relative group cursor-pointer" onClick={() => (document.getElementById('avatar-upload') as HTMLInputElement)?.click()}>
                    <div className="w-24 h-24 rounded-3xl overflow-hidden border-2 border-slate-700/50 group-hover:border-blue-500 transition-colors bg-slate-800">
                      <img src={settingsForm.avatar} className="w-full h-full object-cover" alt="Avatar Preview" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </div>
                    </div>
                    <input id="avatar-upload" type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'avatar')} />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Imagem de Capa</label>
                  <div className="relative group cursor-pointer" onClick={() => (document.getElementById('cover-upload') as HTMLInputElement)?.click()}>
                    <div className="w-full h-24 rounded-3xl overflow-hidden border-2 border-slate-700/50 group-hover:border-blue-500 transition-colors bg-slate-800">
                      <img src={settingsForm.coverImage} className="w-full h-full object-cover" alt="Cover Preview" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /><path d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      </div>
                    </div>
                    <input id="cover-upload" type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'coverImage')} />
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Nome de Operação</label>
                <input type="text" value={settingsForm.name} onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })} className="w-full bg-slate-800 border-none rounded-2xl p-4 text-white focus:ring-2 focus:ring-blue-500/50" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Diretivas (Bio)</label>
                <textarea value={settingsForm.bio} onChange={(e) => setSettingsForm({ ...settingsForm, bio: e.target.value })} rows={4} className="w-full bg-slate-800 border-none rounded-2xl p-4 text-white focus:ring-2 focus:ring-blue-500/50 resize-none" />
              </div>
              <div className="flex justify-between items-center pt-6 border-t border-slate-800">
                <div className="text-sm font-bold text-green-500">{saveMessage}</div>
                <button onClick={handleSaveSettings} className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest transition-all active:scale-95 shadow-xl shadow-blue-500/20">Salvar Alterações</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {view === ViewState.FRIEND_PROFILE && selectedFriend && (
        <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-fade-in">
          <div className="relative bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-700/50 overflow-hidden">
            {/* Header Tactical Section */}
            <div className="relative h-56 sm:h-72 overflow-hidden group">
              <img
                src={selectedFriend.coverImage || 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=1200'}
                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                style={{ objectPosition: selectedFriend.coverPosition || '50% 50%' }}
                alt="Cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>

              {/* Floating Return Button */}
              <button
                onClick={() => setView(ViewState.FEED)}
                className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-900/80 text-white backdrop-blur-xl border border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all active:scale-95 z-10"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                Retornar ao Comando
              </button>

              {/* Identity Token Overlay */}
              <div className="absolute top-6 right-6 px-4 py-2 rounded-2xl bg-blue-600/20 backdrop-blur-md border border-blue-500/30">
                <span className="text-[9px] font-black text-blue-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse"></span>
                  Perfil Aliado Ativo
                </span>
              </div>
            </div>

            {/* Profile Content HUD */}
            <div className="relative px-8 pb-10 -mt-20">
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6 sm:gap-10">
                <div className="relative group/avatar">
                  <div className="absolute inset-0 bg-blue-500 rounded-[2.5rem] blur-2xl opacity-30 group-hover/avatar:opacity-60 transition-opacity"></div>
                  <div className="relative w-36 h-36 sm:w-44 sm:h-44 rounded-[2.8rem] overflow-hidden border-4 border-slate-900 bg-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.5)] transition-transform duration-500 group-hover/avatar:scale-105">
                    <img src={selectedFriend.avatar} className="w-full h-full object-cover" alt={selectedFriend.name} />
                  </div>
                </div>

                <div className="flex-1 text-center sm:text-left mb-2 space-y-2">
                  <div className="inline-block px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-[10px] font-mono text-slate-400 uppercase tracking-widest mb-2">
                    Nível de Acesso: Aliado
                  </div>
                  <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tighter uppercase italic">{selectedFriend.name}</h1>
                  <p className="text-blue-400 font-mono text-xl tracking-widest uppercase flex items-center justify-center sm:justify-start gap-2">
                    <span className="opacity-50">#</span>{selectedFriend.handle.replace('@', '')}
                  </p>
                </div>
              </div>

              {/* Data Display Grids */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
                <div className="bg-slate-800/20 backdrop-blur-sm rounded-3xl p-8 border border-slate-700/30 flex flex-col justify-center">
                  <h3 className="text-slate-500 uppercase text-[10px] font-black tracking-[0.3em] mb-4 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    Dossiê de Identidade
                  </h3>
                  <p className="text-slate-300 leading-relaxed italic text-lg lg:text-xl">
                    "{selectedFriend.bio || "Este aliado mantém suas diretrizes sob sigilo absoluto."}"
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-800/60 p-6 rounded-3xl border border-slate-700/50 text-center flex flex-col items-center justify-center group hover:border-blue-500/30 transition-all">
                    <span className="text-3xl font-black text-white mb-1">{posts.filter(p => p.user.id === selectedFriend.id).length}</span>
                    <span className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em]">Boletins</span>
                  </div>
                  <div className="bg-slate-800/60 p-6 rounded-3xl border border-slate-700/50 text-center flex flex-col items-center justify-center group hover:border-blue-500/30 transition-all">
                    <span className="text-3xl font-black text-white mb-1">...</span>
                    <span className="text-[10px] text-slate-500 uppercase font-black tracking-[0.2em]">Status: OK</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between px-4 italic">
              <div className="flex items-center gap-3">
                <div className="w-2 h-8 bg-blue-600 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.8)]"></div>
                <h3 className="text-2xl font-black text-white tracking-widest uppercase">Registros de Campo</h3>
              </div>
              <div className="h-px flex-1 bg-gradient-to-r from-blue-600/50 to-transparent mx-8 hidden sm:block"></div>
            </div>

            <div className="space-y-4">
              {posts.filter(p => p.user.id === selectedFriend.id).length > 0 ? (
                posts.filter(p => p.user.id === selectedFriend.id).map(post => (
                  <PostCard key={post.id} post={post} currentUserId={currentUser.id} currentUserAvatar={currentUser.avatar} onLike={handleLike} onAddComment={handleAddComment} onDelete={handleDeletePost} onUserClick={handleUserClick} />
                ))
              ) : (
                <div className="py-24 text-center bg-slate-900/40 rounded-[3rem] border-2 border-dashed border-slate-800/50">
                  <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-slate-700">
                    <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M12 15l-3-3m0 0l3-3m-3 3h12M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </div>
                  <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-xs">Canal de Transmissão Silencioso</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;