
// Shared types used across multiple components and services

export interface User {
  id: string;
  username: string;
  displayName: string;
  email?: string;
  avatar?: string;
  bio?: string;
  isOnline?: boolean;
  lastSeen?: Date;
}

export interface MediaContent {
  type: 'image' | 'video' | 'audio' | 'file';
  url: string;
  name: string;
  file?: File;
  thumbnail?: string;
}

export interface NotificationData {
  id: string;
  type: 'message' | 'like' | 'comment' | 'follow' | 'mention';
  title: string;
  body: string;
  data?: Record<string, unknown>;
  timestamp: Date;
  read: boolean;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationParams {
  page: number;
  limit: number;
  offset?: number;
}

export interface SearchParams {
  query: string;
  filters?: Record<string, unknown>;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ErrorInfo {
  message: string;
  code?: string | number;
  details?: Record<string, unknown>;
}
