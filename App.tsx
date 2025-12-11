import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { Rightbar } from './components/Rightbar';
import { CreatePost } from './components/CreatePost';
import { PostCard } from './components/PostCard';
import { MobileNav } from './components/MobileNav';
import { generateInitialPosts } from './services/geminiService';
import { FriendService } from './services/friendService';
import { PostService } from './services/postService'; // Import PostService
import { Post, User, ViewState, FriendSuggestion } from './types';
import { useAuth } from './contexts/AuthContext'; // Import useAuth
import { Login } from './pages/Login'; // Import Login
import { uploadImage } from './services/supabase'; // Import uploadImage

// Initial Mock User Data Removed


const INITIAL_FRIENDS = Array.from({ length: 8 }).map((_, i) => ({
  id: `friend-${i}`,
  name: i % 2 === 0 ? `Amigo ${i + 1}` : `Amiga ${i + 1}`,
  handle: `@amigo_cinefilo_${i + 1}`,
  avatar: `https://picsum.photos/seed/friend${i + 20}/150/150`,
  mutual: Math.floor(Math.random() * 20) + 3,
  job: i % 3 === 0 ? 'Crítico de Cinema' : i % 3 === 1 ? 'Editor' : 'Diretor'
}));

const INITIAL_SUGGESTIONS: FriendSuggestion[] = [
  { id: 'sug-1', name: 'Ana Silva', avatar: 'https://picsum.photos/seed/user10/50/50', info: '2 amigos em comum', isFollowing: false },
  { id: 'sug-2', name: 'Carlos Lima', avatar: 'https://picsum.photos/seed/user11/50/50', info: 'Novo na rede', isFollowing: false },
  { id: 'sug-3', name: 'Beatriz Souza', avatar: 'https://picsum.photos/seed/user12/50/50', info: 'Amigos de amigos', isFollowing: false },
];

const App: React.FC = () => {
  const { user: authUser, loading: authLoading, signOut, updateProfile } = useAuth(); // Use Auth Context

  // Initialize currentUser with authUser when available, or keep it null until loaded
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [posts, setPosts] = useState<Post[]>([]);
  const [view, setView] = useState<ViewState>(ViewState.FEED);
  const [loading, setLoading] = useState(true);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Friends State - Initialized empty
  const [friends, setFriends] = useState<any[]>([]);
  const [followersCount, setFollowersCount] = useState<number>(0); // Add followers count state
  const [friendSearchQuery, setFriendSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Saved Posts State
  const [savedPosts, setSavedPosts] = useState<Post[]>([]);

  // Suggestions State
  const [suggestions, setSuggestions] = useState<FriendSuggestion[]>([]);

  // Validation State
  const [handleError, setHandleError] = useState<string | null>(null);

  // Settings State - initialize empty, will update in useEffect
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
    }
  }, [authUser]);

  // Initialize Feed
  useEffect(() => {
    const fetchPosts = async () => {
      // Fetch both AI posts (optional, if you want starter content) AND real posts
      // For now, let's prioritize Real, then AI if empty?
      // Or just fetch Real.
      const realPosts = await PostService.getFeedPosts();

      if (realPosts.length > 0) {
        setPosts(realPosts);
      } else {
        // Fallback to AI only if no real posts exist (to avoid empty feed on fresh install)
        const generatedPosts = await generateInitialPosts();
        setPosts(generatedPosts);
      }
      setLoading(false);
    };
    fetchPosts();
  }, []);

  const handleCreatePost = async (content: string, image?: string, sentiment?: string) => {
    if (!currentUser) return;

    try {
      await PostService.createPost(currentUser.id, content, image, sentiment);

      // Refresh feed
      const updatedPosts = await PostService.getFeedPosts();
      setPosts(updatedPosts);

    } catch (error) {
      console.error("Error creating post", error);
      alert("Erro ao criar post.");
    }
  };

  const handleSavePost = async (postId: string) => {
    if (!currentUser) return;

    // Find the post
    const postToSave = posts.find(p => p.id === postId);
    if (!postToSave) return;

    const isAlreadySaved = savedPosts.some(p => p.id === postId);

    if (isAlreadySaved) {
      // Unsave
      setSavedPosts(prev => prev.filter(p => p.id !== postId));
      // Also update local posts state to reflect unsaved if needed
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, isSaved: false } : p));

      try {
        await PostService.unsavePost(currentUser.id, postId);
      } catch (error) {
        console.error("Error unsaving post", error);
      }
    } else {
      // Save
      const newSavedPost = { ...postToSave, isSaved: true };
      setSavedPosts(prev => [newSavedPost, ...prev]);
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, isSaved: true } : p));

      try {
        await PostService.savePost(currentUser.id, newSavedPost);
      } catch (error) {
        console.error("Error saving post", error);
      }
    }
  };
  const handleLike = async (postId: string) => {
    if (!currentUser) return;

    const post = posts.find(p => p.id === postId);
    if (!post) return;

    // Optimistic Update
    setPosts(posts.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          likes: p.isLiked ? p.likes - 1 : p.likes + 1,
          isLiked: !p.isLiked
        };
      }
      return p;
    }));

    try {
      await PostService.toggleLike(postId, currentUser.id, post.isLiked);
    } catch (error) {
      console.error("Error toggling like", error);
      // Revert if needed
    }
  };

  const handleAddComment = async (postId: string, content: string) => {
    if (!currentUser) return;

    // Optimistic Update
    const tempId = Date.now().toString();
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          comments: [
            ...post.comments,
            {
              id: tempId,
              user: currentUser,
              content,
              timestamp: 'Agora mesmo'
            }
          ]
        };
      }
      return post;
    }));

    try {
      await PostService.addComment(postId, currentUser.id, content);
      // Ideally refresh posts or comments to get real ID, but optimistic is fine for now
    } catch (error) {
      console.error("Error adding comment", error);
    }
  };

  // Load Friends on Auth
  useEffect(() => {
    if (authUser) {
      loadFriends();
      loadSuggestions();
      loadSavedPosts();
    }
  }, [authUser]);

  const loadFriends = async () => {
    if (!authUser) return;
    const myFriends = await FriendService.getFriends(authUser.id);
    setFriends(myFriends);

    // Load followers count as well
    const count = await FriendService.getFollowersCount(authUser.id);
    setFollowersCount(count);
  };

  const loadSuggestions = async () => {
    if (!authUser) return;
    const mySuggestions = await FriendService.getSuggestions(authUser.id);
    setSuggestions(mySuggestions);
  };

  const loadSavedPosts = async () => {
    if (!authUser) return;
    const saved = await PostService.getSavedPosts(authUser.id);
    setSavedPosts(saved);
  };

  // Search Users when query changes
  useEffect(() => {
    const doSearch = async () => {
      if (!currentUser) return;
      if (friendSearchQuery.trim().length > 0) {
        const results = await FriendService.searchUsers(friendSearchQuery, currentUser.id);
        setSearchResults(results);
      } else {
        setSearchResults([]);
      }
    };
    const debounce = setTimeout(doSearch, 500);
    return () => clearTimeout(debounce);
  }, [friendSearchQuery, currentUser]);

  const handleFollow = async (targetUserId: string) => {
    if (!currentUser) return;

    // Optimistic Update for Suggestions
    setSuggestions(prev => prev.map(s => {
      if (s.id === targetUserId) {
        return { ...s, isFollowing: true };
      }
      return s;
    }));

    // Optimistic Update for Search Results
    // If we follow someone from search, add to friends list immediately
    const searchedUser = searchResults.find(u => u.id === targetUserId);
    if (searchedUser) {
      setFriends(prev => [searchedUser, ...prev]);
    }

    try {
      await FriendService.followUser(currentUser.id, targetUserId);
      loadFriends(); // Reload friends list to be sure
    } catch (error) {
      console.error("Error following user", error);
      // revert if needed
    }
  };

  const handleUnfriend = async (friendId: string) => {
    if (!currentUser) return;

    if (window.confirm('Tem certeza que deseja deixar de seguir?')) {
      // Optimistic Remove
      setFriends(prev => prev.filter(f => f.id !== friendId));

      try {
        await FriendService.unfollowUser(currentUser.id, friendId);
        loadFriends(); // Reload friends list
      } catch (error) {
        console.error("Error unfollowing", error);
        loadFriends(); // Revert on error
      }
    }
  };

  // Function to handle file uploads for avatar and cover
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'avatar' | 'coverImage') => {
    const file = e.target.files?.[0];
    if (file) {
      // Save file for upload on save
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
    // Remove spaces and existing @ to normalize
    const cleanValue = value.replace(/[@\s]/g, '');
    const formattedHandle = `@${cleanValue}`;

    setSettingsForm(prev => ({ ...prev, handle: formattedHandle }));

    // Check uniqueness against mock friends (simulating existing users)
    const isTaken = friends.some(friend => friend.handle.toLowerCase() === formattedHandle.toLowerCase());

    if (isTaken) {
      setHandleError('Este nome de usuário já está em uso.');
    } else if (cleanValue.length === 0) {
      setHandleError('O nome de usuário não pode ser vazio.');
    } else {
      setHandleError(null);
    }
  };

  const handleSaveSettings = async () => {
    if (handleError) return;
    if (settingsForm.handle === '@' || settingsForm.handle.trim() === '') {
      setHandleError('O nome de usuário não pode ser vazio.');
      return;
    }

    if (!currentUser) return;

    setSaveMessage('Salvando alterações...');

    try {
      let avatarUrl = settingsForm.avatar;
      let coverUrl = settingsForm.coverImage;

      // Upload images if new files selected
      if (avatarFile) {
        const url = await uploadImage(avatarFile);
        if (url) avatarUrl = url;
      }

      if (coverFile) {
        const url = await uploadImage(coverFile);
        if (url) coverUrl = url;
      }

      // Update Supabase Profile
      await updateProfile({
        name: settingsForm.name,
        handle: settingsForm.handle,
        bio: settingsForm.bio,
        avatar: avatarUrl,
        coverImage: coverUrl
      });

      // Update local state (Optimistic or synced)
      // Note: updateProfile already updates AuthContext user, which triggers useEffect
      // but we update local currentUser here too for consistency with Posts updates

      const updatedUser = {
        ...currentUser,
        name: settingsForm.name,
        handle: settingsForm.handle,
        bio: settingsForm.bio,
        avatar: avatarUrl,
        coverImage: coverUrl
      };

      setCurrentUser(updatedUser);

      // Update existing posts
      setPosts(prevPosts => prevPosts.map(post => {
        const isPostAuthor = post.user.id === updatedUser.id;
        const updatedComments = post.comments.map(comment => {
          if (comment.user.id === updatedUser.id) {
            return { ...comment, user: updatedUser };
          }
          return comment;
        });

        return {
          ...post,
          user: isPostAuthor ? updatedUser : post.user,
          comments: updatedComments
        };
      }));

      // Clear files
      setAvatarFile(null);
      setCoverFile(null);

      setSaveMessage('Alterações salvas com sucesso!');
      setTimeout(() => setSaveMessage(null), 3000);

    } catch (error) {
      console.error(error);
      setSaveMessage('Erro ao salvar.');
    }
  };

  // Cover Reposition Handlers
  const startReposition = () => {
    if (!currentUser) return;
    setTempCoverPosition(currentUser.coverPosition || '50% 50%');
    setIsRepositioning(true);
  };

  const cancelReposition = () => {
    setIsRepositioning(false);
    setDragStartY(null);
  };

  const saveReposition = async () => {
    if (!currentUser) return;
    try {
      await updateProfile({ ...currentUser, coverPosition: tempCoverPosition });
      setIsRepositioning(false);
    } catch (error) {
      console.error("Error saving position", error);
    }
  };

  const handleCoverMouseDown = (e: React.MouseEvent) => {
    if (!isRepositioning) return;
    e.preventDefault();
    setDragStartY(e.clientY);
    // Parse current percent
    const parts = tempCoverPosition.split(' ');
    // Handle both "50% 50%" and just "50%" cases, though 2nd part provides Y
    const currentY = parts.length > 1 ? parseFloat(parts[1]) : 50;
    setInitialYPercent(isNaN(currentY) ? 50 : currentY);
  };

  const handleCoverMouseMove = (e: React.MouseEvent) => {
    if (!isRepositioning || dragStartY === null) return;
    e.preventDefault();
    const diff = e.clientY - dragStartY;
    // Sensitivity: 500px height = 100%? Let's say 4px = 1%
    const deltaPercent = diff / 4;

    // Drag Down (positive diff) -> Move Image Down -> Show Top -> Decrease Y%
    let newPercent = initialYPercent - deltaPercent;

    // Clamp 0-100
    if (newPercent < 0) newPercent = 0;
    if (newPercent > 100) newPercent = 100;

    setTempCoverPosition(`50% ${newPercent.toFixed(1)}%`);
  };

  const handleCoverMouseUp = () => {
    setDragStartY(null);
  };

  // Determine display list: Search Results OR Friends
  const displayFriends = friendSearchQuery.trim().length > 0 ? searchResults : friends;

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-[#fef2f2] text-red-600">Carregando...</div>;
  }

  if (!currentUser) {
    return <Login />;
  }

  return (
    <div className="min-h-screen bg-[#fef2f2]">
      <Navbar currentView={view} setView={setView} user={currentUser} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex justify-center lg:justify-between">

          <Sidebar currentView={view} setView={setView} />

          <main className="w-full max-w-xl lg:ml-72 xl:mr-80 pb-24 lg:pb-20">
            {view === ViewState.FEED && (
              <>
                <CreatePost onPostCreate={handleCreatePost} user={currentUser} />

                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="bg-white rounded-2xl p-4 h-64 shadow-sm border border-red-50 animate-pulse">
                        <div className="flex space-x-4 mb-4">
                          <div className="w-10 h-10 bg-red-100 rounded-full"></div>
                          <div className="space-y-2">
                            <div className="h-4 bg-red-100 rounded w-24"></div>
                            <div className="h-3 bg-red-100 rounded w-16"></div>
                          </div>
                        </div>
                        <div className="h-32 bg-red-50 rounded-xl mb-4"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  posts.map(post => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onLike={handleLike}
                      onAddComment={handleAddComment}
                    />
                  ))
                )}

                {!loading && posts.length === 0 && (
                  <div className="text-center py-10 text-slate-500">
                    <p>Nenhuma publicação encontrada.</p>
                  </div>
                )}
              </>
            )}

            {view === ViewState.PROFILE && (
              <>
                <div className="bg-white rounded-2xl shadow-sm border border-red-50 overflow-hidden mb-6">
                  {/* Expanded Cover Height: h-96 */}
                  <div
                    className={`h-96 relative bg-red-100 overflow-hidden ${isRepositioning ? 'cursor-move' : 'group'}`}
                    onMouseDown={handleCoverMouseDown}
                    onMouseMove={handleCoverMouseMove}
                    onMouseUp={handleCoverMouseUp}
                    onMouseLeave={handleCoverMouseUp}
                  >
                    {currentUser.coverImage && (
                      <img
                        src={currentUser.coverImage}
                        alt="Capa"
                        className="w-full h-full object-cover select-none pointer-events-none"
                        style={{ objectPosition: isRepositioning ? tempCoverPosition : (currentUser.coverPosition || '50% 50%') }}
                      />
                    )}

                    {/* Reposition Controls */}
                    <div className={`absolute top-4 right-4 flex space-x-2 transition-opacity duration-200 ${isRepositioning ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                      {isRepositioning ? (
                        <>
                          <button
                            onClick={cancelReposition}
                            className="bg-white/90 text-slate-700 px-4 py-2 rounded-full text-sm font-medium shadow-sm hover:bg-white"
                          >
                            Cancelar
                          </button>
                          <button
                            onClick={saveReposition}
                            className="bg-red-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-sm hover:bg-red-700"
                          >
                            Salvar Posição
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={startReposition}
                          className="bg-black/40 text-white px-4 py-2 rounded-full text-sm font-medium backdrop-blur-sm hover:bg-black/50"
                        >
                          Ajustar Capa
                        </button>
                      )}
                    </div>

                    {isRepositioning && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="bg-black/30 text-white px-4 py-2 rounded-lg text-sm font-medium backdrop-blur-sm">
                          Arraste para ajustar verticalmente
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="px-8 pb-8 text-center relative">
                    <div className="relative -mt-16 mb-4 inline-block">
                      <img
                        src={currentUser.avatar}
                        className="w-32 h-32 rounded-full border-4 border-white shadow-md bg-white object-cover"
                        alt="Profile"
                      />
                    </div>

                    <h2 className="text-2xl font-bold text-slate-800">{currentUser.name}</h2>
                    <p className="text-red-600 mb-2">{currentUser.handle}</p>
                    <p className="text-slate-600 mb-6 max-w-md mx-auto">{currentUser.bio}</p>

                    <div className="flex justify-center space-x-8 text-slate-600 py-4 border-t border-slate-100">
                      <div className="text-center">
                        <div className="font-bold text-lg text-slate-800">{posts.filter(p => p.user.id === currentUser.id).length}</div>
                        <div className="text-xs uppercase tracking-wide">Posts</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-lg text-slate-800">{followersCount}</div>
                        <div className="text-xs uppercase tracking-wide">Seguidores</div>
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-lg text-slate-800">{friends.length}</div>
                        <div className="text-xs uppercase tracking-wide">Amigos</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-700 px-2">Minhas Publicações</h3>
                  {posts.filter(p => p.user.id === currentUser.id).length > 0 ? (
                    posts
                      .filter(p => p.user.id === currentUser.id)
                      .map(post => (
                        <PostCard
                          key={post.id}
                          post={post}
                          onLike={handleLike}
                          onAddComment={handleAddComment}
                        />
                      ))
                  ) : (
                    <div className="bg-white rounded-2xl border border-red-50 p-8 text-center text-slate-500">
                      <div className="mb-4 flex justify-center">
                        <div className="bg-red-50 p-3 rounded-full">
                          <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </div>
                      </div>
                      <p className="font-medium">Você ainda não publicou nada.</p>
                      <p className="text-sm mt-1">Crie um post no Feed para ver ele aqui!</p>
                      <button onClick={() => setView(ViewState.FEED)} className="mt-4 text-red-600 hover:text-red-700 font-medium text-sm">
                        Ir para o Feed
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}

            {view === ViewState.FRIENDS && (
              <div className="bg-white rounded-2xl shadow-sm border border-red-50 p-6 min-h-[500px]">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-slate-800">Seus Amigos (Seguindo)</h2>
                  <span className="bg-red-100 text-red-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">{friends.length} Amigos</span>
                </div>

                <div className="relative mb-6">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-red-200 focus:border-red-300 transition-all duration-200"
                    placeholder="Buscar amigo por usuário (@...)"
                    value={friendSearchQuery}
                    onChange={(e) => setFriendSearchQuery(e.target.value)}
                  />
                </div>

                {displayFriends.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {displayFriends.map(friend => {
                      const isAlreadyFriend = friends.some(f => f.id === friend.id);

                      return (
                        <div key={friend.id} className="flex items-center space-x-3 p-3 rounded-xl border border-slate-100 hover:border-red-200 hover:bg-red-50/50 transition-all cursor-pointer group">
                          <img src={friend.avatar} alt={friend.name} className="w-14 h-14 rounded-full object-cover ring-2 ring-red-50 group-hover:ring-red-200" />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-slate-800 truncate">{friend.name}</h3>
                            <p className="text-xs text-red-600 truncate">{friend.handle}</p>
                            <div className="flex items-center text-xs text-slate-400 mt-1">
                              <span className="truncate">{friend.mutual} amigos em comum</span>
                            </div>
                          </div>

                          {isAlreadyFriend ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUnfriend(friend.id);
                              }}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                              title="Desfazer amizade"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
                              </svg>
                            </button>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleFollow(friend.id);
                              }}
                              className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-full transition-colors"
                              title="Seguir"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                              </svg>
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-10 text-slate-500 bg-slate-50 rounded-xl mb-6">
                    <p className="font-medium">Nenhum amigo encontrado.</p>
                    <p className="text-xs mt-1">Tente buscar por outro usuário.</p>
                  </div>
                )}
              </div>
            )}

            {view === ViewState.SETTINGS && (
              <div className="bg-white rounded-2xl shadow-sm border border-red-50 p-6">
                <h2 className="text-xl font-bold text-slate-800 mb-6">Configurações do Perfil</h2>

                {/* Avatar & Cover */}
                <div className="mb-8">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Imagens do Perfil</label>
                  <div className="flex flex-col items-center space-y-4">
                    <div className="relative w-full h-32 bg-red-100 rounded-xl overflow-hidden group">
                      {settingsForm.coverImage ? (
                        <img src={settingsForm.coverImage} className="w-full h-full object-cover" />
                      ) : <div className="w-full h-full flex items-center justify-center text-red-300">Sem capa</div>}
                      <label className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                        <span className="text-sm font-medium">Alterar Capa</span>
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'coverImage')} />
                      </label>
                    </div>
                    <div className="relative -mt-12">
                      <img src={settingsForm.avatar} className="w-24 h-24 rounded-full border-4 border-white object-cover bg-white" />
                      <label className="absolute bottom-0 right-0 bg-red-600 text-white p-1.5 rounded-full cursor-pointer hover:bg-red-700 border-2 border-white shadow-sm">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'avatar')} />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nome de Exibição</label>
                    <input
                      type="text"
                      value={settingsForm.name}
                      onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-red-200 focus:border-red-400 outline-none transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Usuário (@handle)</label>
                    <input
                      type="text"
                      value={settingsForm.handle}
                      onChange={handleUsernameChange}
                      className={`w-full bg-slate-50 border rounded-xl px-4 py-2 focus:ring-2 outline-none transition-all ${handleError ? 'border-red-300 focus:ring-red-200' : 'border-slate-200 focus:ring-red-200 focus:border-red-400'}`}
                    />
                    {handleError && <p className="text-red-500 text-xs mt-1">{handleError}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Biografia</label>
                    <textarea
                      value={settingsForm.bio}
                      onChange={(e) => setSettingsForm({ ...settingsForm, bio: e.target.value })}
                      rows={3}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-red-200 focus:border-red-400 outline-none transition-all resize-none"
                    />
                  </div>
                </div>

                {/* Save Button */}
                <div className="mt-8 flex items-center justify-between">
                  <button
                    onClick={signOut}
                    className="px-4 py-2 border border-red-200 text-red-600 rounded-xl hover:bg-red-50 transition-colors bg-white font-medium"
                  >
                    Sair da Conta
                  </button>
                  {saveMessage && <span className="text-green-600 text-sm font-medium animate-fade-in">{saveMessage}</span>}
                  <button
                    onClick={handleSaveSettings}
                    disabled={!!handleError}
                    className="ml-auto bg-red-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-red-700 shadow-md shadow-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </div>
            )}

            {view === ViewState.SAVED && (
              <div className="space-y-4">
                <div className="bg-white rounded-2xl p-6 border border-red-50 text-center mb-6">
                  <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800">Itens Salvos</h3>
                  <p className="text-slate-500 max-w-xs mx-auto mt-2">Aqui estão os posts que você salvou.</p>
                </div>

                {savedPosts.length > 0 ? (
                  savedPosts.map(post => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onLike={handleLike}
                      onAddComment={handleAddComment}
                      onSave={handleSavePost}
                    />
                  ))
                ) : (
                  <div className="text-center py-10 text-slate-500">
                    <p>Você ainda não salvou nenhuma publicação.</p>
                  </div>
                )}
              </div>
            )}

          </main>

          <Rightbar suggestions={suggestions} onFollow={handleFollow} />
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav currentView={view} setView={setView} />
    </div>
  );
};

export default App;