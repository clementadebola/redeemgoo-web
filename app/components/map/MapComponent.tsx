'use client';

import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { POIS } from '../../constants/mapData';

// Inject your access token directly into the official package configuration
mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';


const MapContainer = styled.div`
  width: 100%;
  height: 100%;
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
`;

const MarkerWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const MarkerIcon = styled.div`
  font-size: 20px;
  cursor: pointer;
`;

const MarkerLabel = styled.span`
  background: white;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  font-weight: 600;
  white-space: nowrap;
`;

interface MapComponentProps {
  mapRef: React.RefObject<any>; // Tracks the raw mapboxgl.Map instance
  viewport: { latitude: number; longitude: number; zoom: number };
  setViewport: React.Dispatch<React.SetStateAction<{ latitude: number; longitude: number; zoom: number }>>;
  locationStatus: string;
  activeRoute: any;
  routeCoords: [number, number][];
  CAMP_CENTER: { latitude: number; longitude: number };
}

export default function MapComponent({
  mapRef,
  viewport,
  locationStatus,
  activeRoute,
  routeCoords,
  CAMP_CENTER,
}: MapComponentProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  // 1. Initialize Core Map Instance
  useEffect(() => {
    if (!containerRef.current) return;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [viewport.longitude, viewport.latitude],
      zoom: viewport.zoom,
    });

    // Save map instance reference so parent controllers can use flyTo mechanisms
    (mapRef as any).current = map;

    // Handle polyline route injection on initialization loads
    map.on('load', () => {
      map.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates: routeCoords },
        },
      });

      map.addLayer({
        id: 'route-layer',
        type: 'line',
        source: 'route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#10B981', 'line-width': 5 },
      });
    });

    return () => map.remove();
  }, []);

  // 2. Watch and Apply Real-Time Route Coordinate Updates
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const source = map.getSource('route') as mapboxgl.GeoJSONSource;
    if (source) {
      source.setData({
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: routeCoords },
      });
    }
  }, [routeCoords]);

  // 3. React to Changing Viewport Coordinate Shifts
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    map.jumpTo({
      center: [viewport.longitude, viewport.latitude],
      zoom: viewport.zoom,
    });
  }, [viewport.latitude, viewport.longitude, viewport.zoom]);

  // 4. Render Camp and POI Pins directly into Map DOM Layers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Flush and reset stale map marker instances safely
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Fallback Core Destination City Pin
    if (locationStatus === 'outside' && !activeRoute) {
      const el = document.createElement('div');
      el.style.fontSize = '24px';
      el.innerText = '📍';

      const campMarker = new mapboxgl.Marker({ element: el })
        .setLngLat([CAMP_CENTER.longitude, CAMP_CENTER.latitude])
        .addTo(map);

      markersRef.current.push(campMarker);
    }

    // Mount Active City Points of Interest
    POIS.forEach((poi) => {
      const el = document.createElement('div');
      el.className = 'custom-campus-marker';

      // Create a small isolated React tree for styling the marker
      const markerRoot = document.createElement('div');
      markerRoot.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center;">
          <div style="font-size: 20px; cursor: pointer;">🏢</div>
          <span style="background: white; color: #1c1c1e; padding: 2px 6px; border-radius: 4px; font-size: 10px; box-shadow: 0 1px 3px rgba(0,0,0,0.2); font-weight: 600; white-space: nowrap;">
            ${poi.name}
          </span>
        </div>
      `;
      el.appendChild(markerRoot);

      const poiMarker = new mapboxgl.Marker({ element: el })
        .setLngLat([poi.lng, poi.lat])
        .addTo(map);

      markersRef.current.push(poiMarker);
    });
  }, [locationStatus, activeRoute, CAMP_CENTER]);

  return <MapContainer ref={containerRef} />;
}