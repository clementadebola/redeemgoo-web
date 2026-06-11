import { useEffect, useRef } from 'react';
import { useLocationStore } from '../store/locationStore';
import { useAuthStore } from '../store/authStore';

export function useLocation() {
  const { user } = useAuthStore();
  const {
    userLocation,
    isTracking,
    hasPermission,
    permissionDenied,
    startTracking,
    stopTracking,
  } = useLocationStore();

  // Use a mutable ref to track tracking activation status safely 
  // without triggering structural component re-renders
  const totalTrackingTriggered = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !user?.uid) return;

    // Only fire start tracking once when the authenticated dashboard mounts
    if (!totalTrackingTriggered.current) {
      totalTrackingTriggered.current = true;
      startTracking(user.uid);
    }

    // Clean up when the dashboard screen completely unmounts
    return () => {
      stopTracking();
      totalTrackingTriggered.current = false;
    };
  }, [user?.uid, startTracking, stopTracking]); // removed isTracking from dependencies!

  return { userLocation, isTracking, hasPermission, permissionDenied };
}