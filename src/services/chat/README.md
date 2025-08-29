
# Firebase Chat System - Persistent Chat List with Caching

## Overview

This system provides persistent chat lists that survive browser refreshes, logouts, and app restarts by combining Firestore real-time updates with localStorage caching.

## Key Features

- **Instant Loading**: Cached chats display immediately on app load
- **Real-time Updates**: Live Firestore sync updates the UI
- **Offline Support**: Cached data available when offline
- **Auto-cleanup**: Cache cleared on logout for security
- **Performance**: Reduces initial load time and Firestore reads

## Firestore Structure

### 1. Chat Documents (for persistent chat list)
**Path**: `/chats/{chatId}`

```js
// Example chatId: "user1_user2" (sorted alphabetically)
{
  users: ["user1_uid", "user2_uid"], // Array for array-contains queries
  lastMessage: {
    text: "Hello there!",
    timestamp: serverTimestamp(),
    senderId: "user1_uid",
    seen: false
  },
  createdAt: serverTimestamp(),
  updatedAt: serverTimestamp()
}
```

### 2. Message Documents (actual messages)
**Path**: `/chats/{chatId}/messages/{messageId}`

```js
{
  text: "Hello there!",
  senderId: "user1_uid",
  receiverId: "user2_uid",
  timestamp: serverTimestamp(),
  seen: false,
  status: "sent", // "sent" | "delivered" | "seen"
  type: "text", // "text" | "voice" | "image" | "video"
  mediaURL: null // or URL string for media messages
}
```

## Caching System

### localStorage Structure
```js
// Key: genzly_chat_list_{userId}
{
  data: ChatListItem[],
  timestamp: number // Cache creation time
}
```

### Cache Lifecycle
1. **App Load**: Cached chats display immediately
2. **Firestore Sync**: Live data updates the cache and UI
3. **User Logout**: Cache cleared for security
4. **Cache Expiry**: 1 hour TTL for cached data

## Usage Flow

```js
// 1. Subscribe to chat list (returns cached data first, then live updates)
const unsubscribe = subscribeToUserChatList(userId, (chats, isFromCache) => {
  if (isFromCache) {
    // Show cached data immediately
    displayChats(chats);
    showCacheIndicator();
  } else {
    // Update with live data
    displayChats(chats);
    hideCacheIndicator();
  }
});

// 2. Cleanup on logout
clearCachedChatList(userId);
```

## Performance Optimizations

1. **Composite Indexes**: Required for efficient queries
2. **Batched Writes**: Atomic message + chat document updates
3. **Pagination**: Limited to 50 recent chats
4. **Cache TTL**: 1-hour expiry prevents stale data

## Security Rules

```js
// Only chat participants can access chat documents
match /chats/{chatId} {
  allow read: if request.auth != null && 
    request.auth.uid in resource.data.users;
}
```

## Required Firestore Indexes

1. **chats collection**:
   - users (array), updatedAt (desc)

2. **messages subcollection**:
   - timestamp (asc)
   - receiverId (asc), seen (asc)

## Best Practices

- Always wait for auth state before querying
- Clear cache on logout for security
- Handle both cached and live data states in UI
- Use loading states appropriately
- Implement proper error handling with cache fallbacks
