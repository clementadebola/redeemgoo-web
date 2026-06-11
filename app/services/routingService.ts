export interface RouteData {
  coordinates: { latitude: number; longitude: number }[];
  distance: string;
  duration: string;
}

export async function fetchInAppRoute(
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number }
): Promise<RouteData | null> {
  try {
    // Format: longitude,latitude;longitude,latitude
    const url = `https://router.project-osrm.org/route/v1/driving/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?overview=full&geometries=geojson`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.routes && data.routes.length > 0) {
      const coordinates = data.routes[0].geometry.coordinates.map((coord: number[]) => ({
        latitude: coord[1],
        longitude: coord[0],
      }));

      return {
        coordinates,
        distance: `${(data.routes[0].distance / 1000).toFixed(1)} km`,
        duration: `${Math.round(data.routes[0].duration / 60)} mins`,
      };
    }
    return null;
  } catch (error) {
    console.error("In-app routing engine error: ", error);
    return null;
  }
}