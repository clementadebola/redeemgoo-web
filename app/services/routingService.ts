// services/routingService.ts

export type RouteMode = 'driving' | 'foot' | 'bike';

export interface RouteData {
  coordinates: { latitude: number; longitude: number }[];
  distance: string;
  duration: string;
  distanceMeters: number;
  durationMinutes: number;
  mode: RouteMode;
}

export function formatDuration(totalMinutes: number): string {
  if (totalMinutes < 60) {
    return `${totalMinutes} min${totalMinutes !== 1 ? 's' : ''}`;
  }
  if (totalMinutes < 1440) {
    const hrs = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    return `${hrs} hr${hrs > 1 ? 's' : ''}${mins > 0 ? ` ${mins} min` : ''}`;
  }
  const days = Math.floor(totalMinutes / 1440);
  const remainingHrs = Math.floor((totalMinutes % 1440) / 60);
  return `${days} day${days > 1 ? 's' : ''}${remainingHrs > 0 ? ` ${remainingHrs} hr` : ''}`;
}

// ─── Cycling correction factor ────────────────────────────────────────────────
// Mapbox's `mapbox/cycling` profile assumes European bike infrastructure
// (~13 km/h average). On Nigerian roads (Lagos, Ogun), cyclists ride on
// motor roads with traffic — real speed is much higher (~25-35 km/h).
// Fix: use the driving-traffic profile for road geometry/distance, then
// apply a factor to get realistic cycling time. 1.3x driving time matches
// Google Maps results for Lagos-area cycling routes.
const NIGERIA_CYCLING_FACTOR = 1.3;

export async function fetchInAppRoute(
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number },
  mode: RouteMode = 'foot',
): Promise<RouteData | null> {
  try {
    const mapboxToken =
      process.env.NEXT_PUBLIC_MAPBOX_TOKEN ||
      process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

    if (!mapboxToken) {
      console.error('[Routing] Mapbox token is missing');
      return null;
    }

    // ── Profile selection ───────────────────────────────────────────────────
    // Driving and walking: use Mapbox profiles directly — they're accurate.
    // Cycling: use driving-traffic profile to get real road geometry and
    //   traffic-aware driving time, then correct the duration with our factor.
    //   This matches Google Maps results far better than mapbox/cycling.
    let mapboxProfile: string;
    let isCyclingCorrection = false;

    if (mode === 'driving') {
      mapboxProfile = 'mapbox/driving-traffic'; // live traffic data
    } else if (mode === 'bike') {
      mapboxProfile = 'mapbox/driving-traffic'; // use driving roads, fix time below
      isCyclingCorrection = true;
    } else {
      mapboxProfile = 'mapbox/walking'; // accurate for pedestrians
    }

    const url =
      `https://api.mapbox.com/directions/v5/${mapboxProfile}/` +
      `${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}` +
      `?overview=full&geometries=geojson&access_token=${mapboxToken}`;

    const response = await fetch(url);

    if (!response.ok) {
      console.error(`[Routing] Mapbox API error: ${response.status}`);
      return null;
    }

    const data = await response.json();

    if (!data.routes || data.routes.length === 0) {
      console.warn('[Routing] No routes returned from Mapbox');
      return null;
    }

    const route = data.routes[0];
    const rawDistanceMeters = route.distance;           // metres
    const rawDurationSeconds = route.duration;          // seconds (traffic-aware for driving)

    // Apply cycling correction AFTER getting the driving time
    const durationSeconds = isCyclingCorrection
      ? rawDurationSeconds * NIGERIA_CYCLING_FACTOR
      : rawDurationSeconds;

    const minutes = Math.max(1, Math.round(durationSeconds / 60));

    const coordinates = route.geometry.coordinates.map((c: number[]) => ({
      latitude:  c[1],
      longitude: c[0],
    }));

    const distanceStr = rawDistanceMeters < 1000
      ? `${Math.round(rawDistanceMeters)} m`
      : `${(rawDistanceMeters / 1000).toFixed(1)} km`;

    return {
      coordinates,
      distance:        distanceStr,
      duration:        formatDuration(minutes),
      distanceMeters:  Math.round(rawDistanceMeters),
      durationMinutes: minutes,
      mode,
    };

  } catch (error) {
    console.error(`[Routing] fetchInAppRoute failed (${mode}):`, error);
    return null;
  }
}