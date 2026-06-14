'use client';

import React, { useEffect, useRef } from 'react';
import styled from 'styled-components';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { POIS } from '../../constants/mapData';

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

interface MapComponentProps {
  mapRef: React.RefObject<any>;
  viewport: { latitude: number; longitude: number; zoom: number };
  setViewport: React.Dispatch<React.SetStateAction<{ latitude: number; longitude: number; zoom: number }>>;
  locationStatus: string;
  activeRoute: any;
  routeCoords: [number, number][];
  CAMP_CENTER: { latitude: number; longitude: number };
  is3D: boolean; // ✅ Extrusion parameters listener
}

export default function MapComponent({
  mapRef,
  viewport,
  locationStatus,
  activeRoute,
  routeCoords,
  CAMP_CENTER,
  is3D,
}: MapComponentProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  // 1. Core Map Initialization Loop
  useEffect(() => {
    if (!containerRef.current) return;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/light-v11', // Optimized, premium baseline vector for clean 3D extrusion contrasts
      center: [viewport.longitude, viewport.latitude],
      zoom: viewport.zoom,
      pitch: is3D ? 60 : 0,
      bearing: is3D ? -15 : 0,
      antialias: true // Smooths aliased jaggies on angled edges
    });

    (mapRef as any).current = map;

    map.on('load', () => {
      // Add standard route layer source
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

      // ✅ INJECT 3D SKY ATMOSPHERE GRID FOGS
      if (!map.getSource('mapbox-dem')) {
        map.addSource('mapbox-dem', {
          type: 'raster-dem',
          url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
          tileSize: 512
        });
        map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.1 });
      }

      // ✅ INJECT VECTOR 3D FILL-EXTRUSION LAYER
      const layers = map.getStyle().layers;
      const labelLayerId = layers?.find(
        (layer) => layer.type === 'symbol' && layer.layout?.['text-field']
      )?.id;

      map.addLayer(
        {
          id: '3d-buildings',
          source: 'composite',
          'source-layer': 'building',
          filter: ['==', 'extrude', 'true'],
          type: 'fill-extrusion',
          minzoom: 13,
          paint: {
            'fill-extrusion-color': '#e3e3e9',
            // Smoothly morph extrusion heights based on proximity scaling zoom factors
            'fill-extrusion-height': [
              'interpolate', ['linear'], ['zoom'],
              13, 0,
              14.5, ['get', 'height']
            ],
            'fill-extrusion-base': [
              'interpolate', ['linear'], ['zoom'],
              13, 0,
              14.5, ['get', 'min_height']
            ],
            'fill-extrusion-opacity': 0.8
          }
        },
        labelLayerId
      );
    });

    return () => map.remove();
  }, []);

  // 2. Watch routing geometry
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

  // 3. Render HTML Custom DOM Pin Badges cleanly on layer slots
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (locationStatus === 'outside' && !activeRoute) {
      const el = document.createElement('div');
      el.style.fontSize = '26px';
      el.style.filter = 'drop-shadow(0 4px 8px rgba(0,0,0,0.15))';
      el.innerText = '📍';

      const campMarker = new mapboxgl.Marker({ element: el })
        .setLngLat([CAMP_CENTER.longitude, CAMP_CENTER.latitude])
        .addTo(map);
      markersRef.current.push(campMarker);
    }

    POIS.forEach((poi) => {
      const el = document.createElement('div');
      el.style.cursor = 'pointer';

      const markerRoot = document.createElement('div');
      markerRoot.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; filter: drop-shadow(0 8px 16px rgba(0,0,0,0.06));">
          <div style="font-size: 22px; transform: scale(1); transition: transform 0.2s;">🏢</div>
          <span style="background: rgba(255,255,255,0.9); backdrop-filter: blur(8px); color: #1c1c1e; padding: 4px 8px; border-radius: 8px; font-size: 10px; font-weight: 700; border: 1px solid rgba(0,0,0,0.04); white-space: nowrap; margin-top: 2px;">
            ${poi.name}
          </span>
        </div>
      `;
      el.appendChild(markerRoot);

      const poiMarker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([poi.lng, poi.lat])
        .addTo(map);

      markersRef.current.push(poiMarker);
    });
  }, [locationStatus, activeRoute, CAMP_CENTER]);

  return <MapContainer ref={containerRef} />;
}