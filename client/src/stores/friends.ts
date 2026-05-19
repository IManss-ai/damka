import { create } from 'zustand';

export interface Friend {
  friendshipId: string;
  friend: { id: string; username: string; eloRating: number; city: string };
  online: boolean;
}

export interface FriendRequest {
  id: string;
  from: { id: string; username: string; eloRating: number; city: string };
  createdAt: string;
}

export interface IncomingInvite {
  fromUserId: string;
  fromUsername: string;
}

interface FriendsStore {
  friends: Friend[];
  requests: FriendRequest[];
  invite: IncomingInvite | null;
  setFriends: (f: Friend[]) => void;
  setRequests: (r: FriendRequest[]) => void;
  setOnline: (userId: string, online: boolean) => void;
  setInvite: (inv: IncomingInvite | null) => void;
  pendingCount: () => number;
}

export const useFriends = create<FriendsStore>((set, get) => ({
  friends: [],
  requests: [],
  invite: null,
  setFriends: (friends) => set({ friends }),
  setRequests: (requests) => set({ requests }),
  setOnline: (userId, online) =>
    set(s => ({
      friends: s.friends.map(f =>
        f.friend.id === userId ? { ...f, online } : f
      ),
    })),
  setInvite: (invite) => set({ invite }),
  pendingCount: () => get().requests.length,
}));
