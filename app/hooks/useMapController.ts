// hooks/useMapController.ts
import { useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { fetchInAppRoute, RouteMode } from "../services/routingService";

export interface Coordinate {
  latitude: number;
  longitude: number;
}

export interface ActiveRouteState {
  destinationName: string;
  distance: string;
  duration: string;
  mode: RouteMode;
}

export function useMapController(userLocation: Coordinate | null) {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [routeCoords, setRouteCoords] = useState<Coordinate[]>([]);
  const [activeRoute, setActiveRoute] = useState<ActiveRouteState | null>(null);
  const [loadingRoute, setLoadingRoute] = useState(false);

  // Keep track of the active POI so we can switch modes without asking the AI again
  const [activePoi, setActivePoi] = useState<{ name: string; lat: number; lng: number } | null>(null);

  const calculateInAppRoute = async (
    poi: { name: string; lat: number; lng: number },
    mode: RouteMode = 'foot'
  ) => {
    if (!userLocation) {
      alert("Searching for active location...");
      return;
    }

    setLoadingRoute(true);
    setActivePoi(poi);

    try {
      const destination = { latitude: poi.lat, longitude: poi.lng };
      const routeData = await fetchInAppRoute(userLocation, destination, mode);

      if (routeData && routeData.coordinates.length > 0) {
        setRouteCoords(routeData.coordinates);

        setActiveRoute({
          destinationName: poi.name,
          distance: routeData.distance,
          duration: routeData.duration,
          mode: routeData.mode,
        });

        if (mapRef.current) {
          const bounds = new mapboxgl.LngLatBounds();
          bounds.extend([userLocation.longitude, userLocation.latitude]);
          bounds.extend([destination.longitude, destination.latitude]);

          mapRef.current.fitBounds(bounds, { padding: 80, duration: 1500 });
        }
      } else {
        alert(`Unable to calculate ${mode} route.`);
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred while calculating route.");
    }

    setLoadingRoute(false);
  };

  const switchRouteMode = async (newMode: RouteMode) => {
    if (activePoi) {
      await calculateInAppRoute(activePoi, newMode);
    }
  };

  const clearActiveRoute = () => {
    setRouteCoords([]);
    setActiveRoute(null);
    setActivePoi(null);
  };

  return {
    mapRef,
    routeCoords,
    activeRoute,
    loadingRoute,
    calculateInAppRoute,
    switchRouteMode,
    clearActiveRoute,
  };
}