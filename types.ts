export interface User {
  id: string;
  name: string;
  avatar: string;
  handle: string;
  coverImage?: string;
  coverPosition?: string; // CSS object-position value
  bio?: string;
  isPrivate?: boolean; // New: privacy setting
}

export type FriendshipStatus = 'pending' | 'accepted' | 'rejected' | 'none';

export interface FriendRequest {
  id: string; // User ID of the requester
  name: string;
  avatar: string;
  handle: string;
  timestamp: string;
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
  SAVED = 'SAVED',
  NOTIFICATIONS = 'NOTIFICATIONS'
}

export interface FriendSuggestion {
  id: string;
  name: string;
  avatar: string;
  info: string;
  isFollowing: boolean;
  status?: FriendshipStatus; // Add status to track pending requests
}