import { useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { fetchInAppRoute } from "../services/routingService";

export interface Coordinate {
  latitude: number;
  longitude: number;
}

export interface ActiveRouteState {
  destinationName: string;
  distance: string;
  duration: string;
}

export function useMapController(
  userLocation: Coordinate | null
) {
  const mapRef = useRef<mapboxgl.Map | null>(null);

  const [routeCoords, setRouteCoords] = useState<
    Coordinate[]
  >([]);

  const [activeRoute, setActiveRoute] =
    useState<ActiveRouteState | null>(null);

  const [loadingRoute, setLoadingRoute] =
    useState(false);

  const calculateInAppRoute = async (
    poi: {
      name: string;
      lat: number;
      lng: number;
    }
  ) => {
    if (!userLocation) {
      alert("Searching for active location...");
      return;
    }

    setLoadingRoute(true);

    try {
      const destination = {
        latitude: poi.lat,
        longitude: poi.lng,
      };

      const routeData = await fetchInAppRoute(
        userLocation,
        destination
      );

      if (
        routeData &&
        routeData.coordinates.length > 0
      ) {
        setRouteCoords(routeData.coordinates);

        setActiveRoute({
          destinationName: poi.name,
          distance: routeData.distance,
          duration: routeData.duration,
        });

        // Zoom map to fit route
        if (mapRef.current) {
          const bounds =
            new mapboxgl.LngLatBounds();

          bounds.extend([
            userLocation.longitude,
            userLocation.latitude,
          ]);

          bounds.extend([
            destination.longitude,
            destination.latitude,
          ]);

          mapRef.current.fitBounds(bounds, {
            padding: 100,
            duration: 1500,
          });
        }
      } else {
        alert(
          "Unable to calculate route to destination."
        );
      }
    } catch (error) {
      console.error(error);

      alert(
        "An error occurred while calculating route."
      );
    }

    setLoadingRoute(false);
  };

  const clearActiveRoute = () => {
    setRouteCoords([]);
    setActiveRoute(null);
  };

  return {
    mapRef,
    routeCoords,
    activeRoute,
    loadingRoute,
    calculateInAppRoute,
    clearActiveRoute,
  };
}