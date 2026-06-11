import { create } from "zustand";
import {
  doc,
  setDoc,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../lib/firebase";
import { REDEMPTION_CITY } from "../constants/theme";

export interface Coordinate {
  latitude: number;
  longitude: number;
}

export interface Place {
  id: string;
  name: string;
  icon: string;
  coordinate: Coordinate;
  category?: string;
}

export interface Route {
  origin: Coordinate;
  destination: Coordinate;
  destinationName: string;
  distance?: string;
  duration?: string;
}

interface LocationState {
  userLocation: Coordinate | null;
  isTracking: boolean;
  hasPermission: boolean;
  permissionDenied: boolean;
  activeRoute: Route | null;
  isNavigating: boolean;
  nearbyPlaces: Place[];
  activeCategory: string | null;
  
  // NEW: Multi-user real-time tracking state storage keys
  groupMembersLocations: Record<string, { latitude: number; longitude: number; displayName: string }>;

  mapRegion: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };

  requestPermission: () => Promise<boolean>;
  startTracking: (userId: string) => Promise<void>;
  stopTracking: () => void;
  
  // NEW: Multi-user live tracking actions
  syncGroupLiveLocations: (memberIds: string[]) => () => void;

  setActiveRoute: (route: Route | null) => void;
  startNavigation: () => void;
  stopNavigation: () => void;

  setActiveCategory: (category: string | null) => void;

  setMapRegion: (region: LocationState["mapRegion"]) => void;

  watchOtherUser: (
    userId: string,
    callback: (loc: Coordinate) => void
  ) => () => void;
}

let watchId: number | null = null;

export const useLocationStore = create<LocationState>(
  (set, get) => ({
    userLocation: null,
    isTracking: false,
    hasPermission: false,
    permissionDenied: false,
    activeRoute: null,
    isNavigating: false,
    nearbyPlaces: [],
    activeCategory: null,
    mapRegion: REDEMPTION_CITY,
    
    // Initializing group states
    groupMembersLocations: {},

    requestPermission: async () => {
      if (typeof window === "undefined") {
        return false;
      }

      if (!navigator.geolocation) {
        set({
          hasPermission: false,
          permissionDenied: true,
        });

        return false;
      }

      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          () => {
            set({
              hasPermission: true,
              permissionDenied: false,
            });

            resolve(true);
          },
          () => {
            set({
              hasPermission: false,
              permissionDenied: true,
            });

            resolve(false);
          }
        );
      });
    },

    startTracking: async (userId: string) => {
      if (typeof window === "undefined") return;

      if (watchId !== null) return;

      const granted =
        get().hasPermission ||
        (await get().requestPermission());

      if (!granted) return;

      set({ isTracking: true });

      watchId = navigator.geolocation.watchPosition(
        async (position) => {
          const coord: Coordinate = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };

          set({
            userLocation: coord,
            mapRegion: {
              ...coord,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            },
          });

          try {
            await setDoc(
              doc(db, "locations", userId),
              {
                latitude: coord.latitude,
                longitude: coord.longitude,
                updatedAt: serverTimestamp(),
                userId,
              },
              { merge: true }
            );
          } catch (error) {
            console.error(
              "Failed to update location:",
              error
            );
          }
        },

        (error) => {
          console.error(
            "Location tracking error:",
            error
          );
        },

        {
          enableHighAccuracy: true,
          maximumAge: 5000,
          timeout: 10000,
        }
      );
    },

    stopTracking: () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
        watchId = null;
      }

      set({
        isTracking: false,
      });
    },

    // NEW: Real-time Multi-user location stream manager connection
    syncGroupLiveLocations: (memberIds: string[]) => {
      if (typeof window === "undefined" || memberIds.length === 0) return () => {};

      const unsubscribes: (() => void)[] = [];

      memberIds.forEach((memberId) => {
        const docRef = doc(db, "locations", memberId);
        const unsub = onSnapshot(docRef, (snapshot) => {
          if (!snapshot.exists()) return;
          const data = snapshot.data();

          set((state) => ({
            groupMembersLocations: {
              ...state.groupMembersLocations,
              [memberId]: {
                latitude: data.latitude,
                longitude: data.longitude,
                displayName: data.displayName || "Circle Member",
              },
            },
          }));
        });
        unsubscribes.push(unsub);
      });

      return () => {
        unsubscribes.forEach((unsub) => unsub());
        set({ groupMembersLocations: {} });
      };
    },

    setActiveRoute: (route) =>
      set({
        activeRoute: route,
      }),

    startNavigation: () =>
      set({
        isNavigating: true,
      }),

    stopNavigation: () =>
      set({
        isNavigating: false,
        activeRoute: null,
      }),

    setActiveCategory: (category) =>
      set({
        activeCategory:
          category === get().activeCategory
            ? null
            : category,
      }),

    setMapRegion: (region) =>
      set({
        mapRegion: region,
      }),

    watchOtherUser: (
      userId: string,
      callback: (loc: Coordinate) => void
    ) => {
      const unsubscribe = onSnapshot(
        doc(db, "locations", userId),
        (snapshot) => {
          const data = snapshot.data();

          if (data) {
            callback({
              latitude: data.latitude,
              longitude: data.longitude,
            });
          }
        }
      );

      return unsubscribe;
    },
  })
);