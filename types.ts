export interface User {
  id: string;
  name: string;
  avatar: string;
  handle: string;
  coverImage?: string;
  coverPosition?: string; // CSS object-position value
  bio?: string;
}

export interface Comment {
  id: string;
  user: User;
  content: string;
  timestamp: string;
}

export interface Post {
  id: string;
  user: User;
  content: string;
  image?: string; // Optional image URL
  sentiment?: string; // Optional sentiment/mood
  likes: number;
  comments: Comment[];
  timestamp: string;
  isLiked: boolean; // Local state for the current user
}

export enum ViewState {
  FEED = 'FEED',
  PROFILE = 'PROFILE',
  SETTINGS = 'SETTINGS',
  FRIENDS = 'FRIENDS',
  SAVED = 'SAVED'
}

export interface FriendSuggestion {
  id: string;
  name: string;
  avatar: string;
  info: string;
  isFollowing: boolean;
}