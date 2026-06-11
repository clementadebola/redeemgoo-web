import { create } from 'zustand';
import { 
  collection, doc, setDoc, updateDoc, arrayUnion, arrayRemove, 
  query, where, getDocs, onSnapshot, serverTimestamp, addDoc 
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

interface GroupState {
  currentGroup: { id: string; name: string; ownerId: string; members: string[] } | null;
  groupMembersProfiles: GroupMember[];
  notifications: GroupNotification[];
  isLoading: boolean;
  
  createGroup: (groupName: string, ownerId: string, ownerName: string, ownerUsername: string) => Promise<void>;
  inviteUserByUsername: (username: string, fromUserId: string, fromUserName: string) => Promise<{ success: boolean; message: string }>;
  generateInviteLink: (groupId: string) => string;
  listenToGroupAndNotifications: (userId: string) => () => void;
  respondToInvite: (notificationId: string, accept: boolean, userId: string, userName: string, userUsername: string) => Promise<void>;
}

export const useGroupStore = create<GroupState>((set, get) => ({
  currentGroup: null,
  groupMembersProfiles: [],
  notifications: [],
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
      
      // Seed self inside user profiles register cache
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

  inviteUserByUsername: async (username, fromUserId, fromUserName) => {
    const cleanUsername = username.trim().toLowerCase();
    const group = get().currentGroup;
    if (!group) return { success: false, message: 'You must create a group first.' };

    try {
      // 1. Find user by username property map query
      const userQuery = query(collection(db, 'profiles'), where('username', '==', cleanUsername));
      const querySnap = await getDocs(userQuery);

      if (querySnap.empty) {
        return { success: false, message: 'User not found. Try sending them an invite link instead!' };
      }

      const targetUserDoc = querySnap.docs[0];
      const targetUserId = targetUserDoc.id;

      if (group.members.includes(targetUserId)) {
        return { success: false, message: 'User is already a member of this group.' };
      }

      // 2. Insert functional in-app notification context payload
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

  listenToGroupAndNotifications: (userId) => {
    set({ isLoading: true });

    // 1. Listen to active incoming notifications feed channel live
    const notifQuery = query(collection(db, `users/${userId}/notifications`), where('status', '==', 'pending'));
    const unsubNotifs = onSnapshot(notifQuery, (snapshot) => {
      const notifs: GroupNotification[] = [];
      snapshot.forEach((doc) => {
        notifs.push({ id: doc.id, ...doc.data() } as GroupNotification);
      });
      set({ notifications: notifs });
    });

    // 2. Listen to active group membership channels live
    const groupQuery = query(collection(db, 'groups'), where('members', 'array-contains', userId));
    const unsubGroup = onSnapshot(groupQuery, async (snapshot) => {
      if (snapshot.empty) {
        set({ currentGroup: null, groupMembersProfiles: [], isLoading: false });
        return;
      }

      const groupData = snapshot.docs[0].data() as any;
      set({ currentGroup: groupData });

      // Fetch member profiles details asynchronously
      try {
        const membersProfiles: GroupMember[] = [];
        for (const mId of groupData.members) {
          const profileSnap = await getDocs(query(collection(db, 'profiles'), where('uid', '==', mId)));
          if (!profileSnap.empty) {
            const p = profileSnap.docs[0].data();
            membersProfiles.push({
              uid: mId,
              displayName: p.displayName,
              username: p.username,
              isOutsideGeofence: false // Geofencing tracker will update this value later
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
      
      // Update invitation document processing state status token
      await updateDoc(notifRef, { status: accept ? 'accepted' : 'declined' });
    } catch (err) {
      console.error(err);
    }
  }
}));