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
  is3D: boolean;
  onSelectBuildingRoute?: (poi: any) => void;
}

export default function MapComponent({
  mapRef,
  viewport,
  locationStatus,
  activeRoute,
  routeCoords,
  CAMP_CENTER,
  is3D,
  onSelectBuildingRoute
}: MapComponentProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12', 
      center: [viewport.longitude, viewport.latitude],
      zoom: viewport.zoom,
      pitch: is3D ? 60 : 0,
      bearing: is3D ? -15 : 0,
      antialias: true
    });

    (mapRef as any).current = map;

    map.on('load', () => {
      // Initialize Route Layer
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
        paint: { 'line-color': '#10B981', 'line-width': 6 },
      });

      // Inject Mapbox Digital Elevation Terrain Model
      if (!map.getSource('mapbox-dem')) {
        map.addSource('mapbox-dem', {
          type: 'raster-dem',
          url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
          tileSize: 512
        });
        map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.1 });
      }

      const layers = map.getStyle().layers;
      const labelLayerId = layers?.find(
        (layer) => layer.type === 'symbol' && layer.layout?.['text-field']
      )?.id;

      // ✅ FIXED: Resolved TypeScript compilation error by passing a conditional data expression vector to fill-extrusion-color
      if (!map.getLayer('3d-buildings')) {
        map.addLayer(
          {
            id: '3d-buildings',
            source: 'composite',
            'source-layer': 'building',
            filter: ['==', 'extrude', 'true'],
            type: 'fill-extrusion',
            minzoom: 13,
            paint: {
              // Mapbox reads building topography layers dynamically:
              // If the feature face is evaluating a roof, paint it Emerald Green (#10b981).
              // Otherwise, paint the building walls sleek Charcoal Slate (#2c2c2e).
              'fill-extrusion-color': [
                'case',
                ['boolean', ['get', 'roof'], false],
                '#10b981',
                '#2c2c2e'
              ],
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
              'fill-extrusion-opacity': 0.85
            }
          },
          labelLayerId
        );
      }

      // ✅ FIXED: Dynamically extract the building's real-world name matching Google Maps behavior on click
      map.on('click', '3d-buildings', (e) => {
        if (!e.features || e.features.length === 0) return;
        
        const clickedBuilding = e.features[0];
        const properties = clickedBuilding.properties || {};

        // Query vector metadata parameters for real building identifiers (name, name_en, or description fields)
        let resolvedBuildingName = properties.name || properties.name_en || properties.type;

        const clickLng = e.lngLat.lng;
        const clickLat = e.lngLat.lat;

        // Fallback: If Mapbox tiles don't carry an explicit name string token for this building geometry,
        // perform a mathematical nearest-neighbor search against your local POIS collection database array
        let targetedPoi = POIS[0];
        let shortestDistance = Infinity;

        POIS.forEach((poi) => {
          const distanceMetric = Math.pow(poi.lng - clickLng, 2) + Math.pow(poi.lat - clickLat, 2);
          if (distanceMetric < shortestDistance) {
            shortestDistance = distanceMetric;
            targetedPoi = poi;
          }
        });

        // If the map vector itself didn't have a name property string, use the nearest matched landmark name instead
        if (!resolvedBuildingName && shortestDistance < 0.0001) {
          resolvedBuildingName = targetedPoi.name;
        } else if (!resolvedBuildingName) {
          resolvedBuildingName = "Camp Ground Structure";
        }

        // Initialize a standard Mapbox context popup with the real-world identity data
        new mapboxgl.Popup({ offset: [0, -15], className: 'custom-navigation-popup' })
          .setLngLat(e.lngLat)
          .setHTML(`
            <div style="padding: 8px; font-family: -apple-system, BlinkMacSystemFont, sans-serif; text-align: center; min-width: 140px;">
              <span style="font-size: 9px; font-weight: 800; color: #10b981; letter-spacing: 0.5px; display: block; margin-bottom: 2px;">DESTINATION TARGET</span>
              <strong style="color: #1c1c1e; font-size: 13px; display: block; line-height: 1.3;">${resolvedBuildingName}</strong>
              <p style="margin: 6px 0 0 0; font-size: 11px; color: #8e8e93; font-weight: 600;">Calculating best route...</p>
            </div>
          `)
          .addTo(map);

        // Map route generation parameters to parent state routines
        if (onSelectBuildingRoute) {
          // If we found a named vector structure but it's not a static POI pin, construct a dynamic payload wrapper
          const selectionPayload = shortestDistance < 0.0001 ? targetedPoi : {
            id: `dynamic-${Date.now()}`,
            name: resolvedBuildingName,
            lat: clickLat,
            lng: clickLng,
            category: "Structure"
          };
          onSelectBuildingRoute(selectionPayload);
        }
      });

      map.on('mouseenter', '3d-buildings', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', '3d-buildings', () => { map.getCanvas().style.cursor = ''; });
    });

    return () => map.remove();
  }, []);

  // Watch Route Geometry Mutations
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

  // Sync Global Viewport Coordinates
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.jumpTo({
      center: [viewport.longitude, viewport.latitude],
      zoom: viewport.zoom,
    });
  }, [viewport.latitude, viewport.longitude, viewport.zoom]);

  // Handle Marker Injections
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (locationStatus === 'outside' && !activeRoute) {
      const el = document.createElement('div');
      el.style.fontSize = '26px';
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
        <div style="display: flex; flex-direction: column; align-items: center;">
          <div style="font-size: 22px;">🏢</div>
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