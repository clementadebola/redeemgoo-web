import { create } from 'zustand';
import { 
  collection, doc, setDoc, updateDoc, arrayUnion, arrayRemove, 
  query, where, getDocs, onSnapshot, serverTimestamp, addDoc, orderBy, limit 
} from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface GroupNotification {
  id: string;
  type: 'invite';
  fromGroupName: string;
  fromUserName: string;
  groupId: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: any;
}

export interface GroupMember {
  uid: string;
  displayName: string;
  username: string;
  isOutsideGeofence: boolean;
}

export interface SearchedUser {
  uid: string;
  displayName: string;
  username: string;
}

interface GroupState {
  currentGroup: { id: string; name: string; ownerId: string; members: string[] } | null;
  groupMembersProfiles: GroupMember[];
  notifications: GroupNotification[];
  searchResults: SearchedUser[];
  isLoading: boolean;
  
  createGroup: (groupName: string, ownerId: string, ownerName: string, ownerUsername: string) => Promise<void>;
  searchUsersByPrefix: (searchText: string) => Promise<void>;
  inviteUserByUsername: (username: string, fromUserId: string, fromUserName: string) => Promise<{ success: boolean; message: string }>;
  generateInviteLink: (groupId: string) => string;
  listenToGroupAndNotifications: (userId: string) => () => void;
  respondToInvite: (notificationId: string, accept: boolean, userId: string, userName: string, userUsername: string) => Promise<void>;
}

export const useGroupStore = create<GroupState>((set, get) => ({
  currentGroup: null,
  groupMembersProfiles: [],
  notifications: [],
  searchResults: [],
  isLoading: false,

  createGroup: async (groupName, ownerId, ownerName, ownerUsername) => {
    set({ isLoading: true });
    try {
      const groupRef = doc(collection(db, 'groups'));
      const newGroup = {
        id: groupRef.id,
        name: groupName,
        ownerId,
        members: [ownerId]
      };
      
      await setDoc(groupRef, newGroup);
      
      set({ 
        currentGroup: newGroup,
        groupMembersProfiles: [{ uid: ownerId, displayName: ownerName, username: ownerUsername, isOutsideGeofence: false }]
      });
    } catch (err) {
      console.error(err);
    } finally {
      set({ isLoading: false });
    }
  },

  // ✅ FIXED: Pointing directly to your "users" collection mapping
  searchUsersByPrefix: async (searchText) => {
    const queryText = searchText.trim().toLowerCase();
    if (!queryText) {
      set({ searchResults: [] });
      return;
    }

    try {
      // Directed query to search inside your "users" collection schema path
      const userQuery = query(
        collection(db, 'users'), 
        where('username', '>=', queryText),
        where('username', '<=', queryText + '\uf8ff'),
        orderBy('username'),
        limit(5)
      );

      const querySnap = await getDocs(userQuery);
      const results: SearchedUser[] = [];
      
      querySnap.forEach((doc) => {
        const data = doc.data();
        results.push({
          uid: data.uid || doc.id,
          displayName: data.displayName || '',
          username: data.username || ''
        });
      });

      set({ searchResults: results });
    } catch (err) {
      console.error("Predictive search lookup failed:", err);
    }
  },

  // ✅ FIXED: Pointing directly to your "users" collection mapping
  inviteUserByUsername: async (username, fromUserId, fromUserName) => {
    const cleanUsername = username.trim().toLowerCase();
    const group = get().currentGroup;
    if (!group) return { success: false, message: 'You must create a group first.' };

    try {
      // Swapped target lookup index collection path parameter from 'profiles' to 'users'
      const userQuery = query(collection(db, 'users'), where('username', '==', cleanUsername));
      const querySnap = await getDocs(userQuery);

      if (querySnap.empty) {
        return { success: false, message: 'User not found. Try sending them an invite link instead!' };
      }

      const targetUserDoc = querySnap.docs[0];
      const targetUserId = targetUserDoc.id;

      if (group.members.includes(targetUserId)) {
        return { success: false, message: 'User is already a member of this group.' };
      }

      await addDoc(collection(db, `users/${targetUserId}/notifications`), {
        type: 'invite',
        fromGroupName: group.name,
        fromUserName,
        groupId: group.id,
        status: 'pending',
        createdAt: serverTimestamp()
      });

      return { success: true, message: `Invitation sent to @${cleanUsername}!` };
    } catch (err) {
      return { success: false, message: 'Error sending invitation.' };
    }
  },

  generateInviteLink: (groupId) => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/signup?groupInvite=${groupId}`;
  },

  // ✅ FIXED: Gathering member profile metadata details safely from your "users" folder
  listenToGroupAndNotifications: (userId) => {
    set({ isLoading: true });

    const notifQuery = query(collection(db, `users/${userId}/notifications`), where('status', '==', 'pending'));
    const unsubNotifs = onSnapshot(notifQuery, (snapshot) => {
      const notifs: GroupNotification[] = [];
      snapshot.forEach((doc) => {
        notifs.push({ id: doc.id, ...doc.data() } as GroupNotification);
      });
      set({ notifications: notifs });
    });

    const groupQuery = query(collection(db, 'groups'), where('members', 'array-contains', userId));
    const unsubGroup = onSnapshot(groupQuery, async (snapshot) => {
      if (snapshot.empty) {
        set({ currentGroup: null, groupMembersProfiles: [], isLoading: false });
        return;
      }

      const groupData = snapshot.docs[0].data() as any;
      set({ currentGroup: groupData });

      try {
        const membersProfiles: GroupMember[] = [];
        for (const mId of groupData.members) {
          // Swapped data synchronization directory path target to "users" collection
          const profileSnap = await getDocs(query(collection(db, 'users'), where('uid', '==', mId)));
          if (!profileSnap.empty) {
            const p = profileSnap.docs[0].data();
            membersProfiles.push({
              uid: mId,
              displayName: p.displayName,
              username: p.username,
              isOutsideGeofence: false
            });
          }
        }
        set({ groupMembersProfiles: membersProfiles });
      } catch (err) {
        console.error("Error updating tracking cache mappings:", err);
      } finally {
        set({ isLoading: false });
      }
    });

    return () => {
      unsubNotifs();
      unsubGroup();
    };
  },

  respondToInvite: async (notificationId, accept, userId, userName, userUsername) => {
    const notifRef = doc(db, `users/${userId}/notifications`, notificationId);
    try {
      if (accept) {
        const notifSnap = await getDocs(query(collection(db, `users/${userId}/notifications`)));
        const targetNotif = notifSnap.docs.find(d => d.id === notificationId)?.data() as GroupNotification;
        
        if (targetNotif) {
          const groupRef = doc(db, 'groups', targetNotif.groupId);
          await updateDoc(groupRef, {
            members: arrayUnion(userId)
          });
        }
      }
      
      await updateDoc(notifRef, { status: accept ? 'accepted' : 'declined' });
    } catch (err) {
      console.error(err);
    }
  }
}));