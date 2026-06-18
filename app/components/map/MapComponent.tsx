'use client';

import React, { useEffect, useRef, useCallback } from 'react'; 
import styled from 'styled-components';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { POIS } from '../../constants/mapData';

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

export type MapStyle = 'streets' | 'satellite' | 'satellite-streets' | 'dark';

const MAP_STYLES: Record<MapStyle, string> = {
  streets: 'mapbox://styles/mapbox/streets-v12',
  satellite: 'mapbox://styles/mapbox/satellite-v9',
  'satellite-streets': 'mapbox://styles/mapbox/satellite-streets-v12',
  dark: 'mapbox://styles/mapbox/dark-v11',
};

interface MapComponentProps {
  mapRef: React.RefObject<any>;
  viewport: { latitude: number; longitude: number; zoom: number };
  setViewport: React.Dispatch<React.SetStateAction<{ latitude: number; longitude: number; zoom: number }>>;
  locationStatus: string;
  activeRoute: any;
  routeCoords: [number, number][];
  CAMP_CENTER: { latitude: number; longitude: number };
  is3D: boolean;
  mapStyle: MapStyle; 
  onSelectBuildingRoute?: (poi: any) => void;
  onMapClick?: (lat: number, lng: number) => void;
  userLocation: { latitude: number; longitude: number };
  groupMembersLocations: Record<string, { latitude: number; longitude: number; displayName: string; activeDestination?: any }>;
}

function getCategoryStyle(category: string): { icon: string; color: string } {
  const c = category.toLowerCase();
  if (c.includes('gate')) return { icon: '🚪', color: '#f97316' };
  if (c.includes('market')) return { icon: '🛒', color: '#eab308' };
  if (c.includes('bank')) return { icon: '🏦', color: '#06b6d4' };
  if (c.includes('hospital')) return { icon: '🏥', color: '#ef4444' };
  if (c.includes('education')) return { icon: '🎓', color: '#8b5cf6' };
  if (c.includes('auditorium')) return { icon: '🏛️', color: '#3b82f6' };
  return { icon: '🏢', color: '#3b82f6' };
}

export default function MapComponent({
  mapRef,
  viewport,
  locationStatus,
  activeRoute,
  routeCoords,
  CAMP_CENTER,
  is3D,
  mapStyle,
  onSelectBuildingRoute,
  onMapClick,
  userLocation,
  groupMembersLocations = {}
}: MapComponentProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const liveAvatarsRef = useRef<Record<string, mapboxgl.Marker>>({});
  const currentStyleRef = useRef<MapStyle>(mapStyle);

  useEffect(() => {
    if (document.getElementById('avatar-marker-style')) return;
    const styleSheet = document.createElement("style");
    styleSheet.id = 'avatar-marker-style';
    styleSheet.innerHTML = `
      @keyframes avatarPulse {
        0% { transform: scale(1); opacity: 0.8; }
        100% { transform: scale(1.6); opacity: 0; }
      }
      .avatar-pulse-ring {
        position: absolute; width: 100%; height: 100%; border-radius: 50%;
        border: 2px solid #10b981; animation: avatarPulse 2s infinite ease-out; pointer-events: none;
      }
      .member-pulse-ring {
        position: absolute; width: 100%; height: 100%; border-radius: 50%;
        border: 2px solid #3b82f6; animation: avatarPulse 2.5s infinite ease-out; pointer-events: none;
      }
      .mapboxgl-popup-content {
        border-radius: 14px !important;
        padding: 12px 16px !important;
        box-shadow: 0 16px 40px rgba(0,0,0,0.15) !important;
      }
    `;
    document.head.appendChild(styleSheet);
  }, []);

  const setupMapLayers = useCallback((map: mapboxgl.Map) => {
    if (!map.getSource('route')) {
      map.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates: routeCoords },
        },
      });
    }

    if (!map.getLayer('route-layer')) {
      map.addLayer({
        id: 'route-layer',
        type: 'line',
        source: 'route',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#10B981', 'line-width': 6 },
      });
    }

    if (!map.getSource('mapbox-dem') && mapStyle !== 'dark') {
      map.addSource('mapbox-dem', {
        type: 'raster-dem',
        url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
        tileSize: 512
      });
      map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.1 });
    }

    if (!map.getLayer('3d-buildings') && mapStyle !== 'satellite') {
      const layers = map.getStyle().layers;
      const labelLayerId = layers?.find(layer => layer.type === 'symbol' && layer.layout?.['text-field'])?.id;

      map.addLayer(
        {
          id: '3d-buildings',
          source: 'composite',
          'source-layer': 'building',
          filter: ['==', 'extrude', 'true'],
          type: 'fill-extrusion',
          minzoom: 13,
          paint: {
            'fill-extrusion-color': '#2c2c2e',
            'fill-extrusion-height': ['interpolate', ['linear'], ['zoom'], 13, 0, 14.5, ['get', 'height']],
            'fill-extrusion-base': ['interpolate', ['linear'], ['zoom'], 13, 0, 14.5, ['get', 'min_height']],
            'fill-extrusion-opacity': 0.85
          }
        },
        labelLayerId
      );
    }
  }, [routeCoords, mapStyle]);

  useEffect(() => {
    if (!containerRef.current) return;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: MAP_STYLES[mapStyle], 
      center: [viewport.longitude, viewport.latitude],
      zoom: viewport.zoom,
      pitch: is3D ? 60 : 0,
      bearing: is3D ? -15 : 0,
      antialias: true
    });

    (mapRef as any).current = map;

    map.on('load', () => setupMapLayers(map));

    map.on('click', (e) => {
      const clickLng = e.lngLat.lng;
      const clickLat = e.lngLat.lat;

      const features = map.queryRenderedFeatures(e.point, { layers: map.getLayer('3d-buildings') ? ['3d-buildings'] : [] });

      let targetedPoi = POIS[0];
      let shortestDistance = Infinity;

      POIS.forEach((poi) => {
        const distanceMetric = Math.pow(poi.lng - clickLng, 2) + Math.pow(poi.lat - clickLat, 2);
        if (distanceMetric < shortestDistance) {
          shortestDistance = distanceMetric;
          targetedPoi = poi;
        }
      });

      let resolvedBuildingName = "Camp Ground Structure";
      let targetCategory = "Structure";

      if (features && features.length > 0) {
        const props = features[0].properties || {};
        resolvedBuildingName = props.name || props.name_en || props.type || "Camp Ground Structure";
      }

      if (shortestDistance < 0.0001) {
        resolvedBuildingName = targetedPoi.name;
        targetCategory = targetedPoi.category;
      }

      let roofColor = '#10b981';
      const cat = targetCategory.toLowerCase();
      if (cat.includes('gate')) roofColor = '#f97316';       
      else if (cat.includes('auditorium')) roofColor = '#3b82f6'; 
      else if (cat.includes('market')) roofColor = '#eab308';     
      else if (cat.includes('bank')) roofColor = '#06b6d4';       

      if (map.getLayer('3d-buildings') && features && features.length > 0) {
        map.setPaintProperty('3d-buildings', 'fill-extrusion-color', [
          'case',
          ['==', ['get', 'id'], features[0]?.id || ''],
          roofColor,
          '#2c2c2e'
        ]);
      }

      new mapboxgl.Popup({ offset: [0, -15], className: 'custom-navigation-popup' })
        .setLngLat(e.lngLat)
        .setHTML(`
          <div style="font-family: -apple-system, sans-serif; text-align: center; min-width: 140px;">
            <span style="font-size: 9px; font-weight: 800; color: ${roofColor}; letter-spacing: 0.5px; display: block; margin-bottom: 2px;">${targetCategory.toUpperCase()}</span>
            <strong style="color: #1c1c1e; font-size: 13px; display: block; line-height: 1.3;">${resolvedBuildingName}</strong>
            <p style="margin: 6px 0 0 0; font-size: 11px; color: #8e8e93; font-weight: 600;">Calculating best route...</p>
          </div>
        `)
        .addTo(map);

      if (onSelectBuildingRoute) {
        const selectionPayload = shortestDistance < 0.0001 ? targetedPoi : {
          id: `dynamic-${Date.now()}`,
          name: resolvedBuildingName,
          lat: clickLat,
          lng: clickLng,
          category: targetCategory
        };
        onSelectBuildingRoute(selectionPayload);
      }
      if (onMapClick) onMapClick(clickLat, clickLng);
    });

    return () => {
      map.remove();
      Object.values(liveAvatarsRef.current).forEach(marker => marker.remove());
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || mapStyle === currentStyleRef.current) return;
    currentStyleRef.current = mapStyle;

    map.setStyle(MAP_STYLES[mapStyle]);
    map.once('style.load', () => setupMapLayers(map));
  }, [mapStyle, setupMapLayers]);

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

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.easeTo({ pitch: is3D ? 60 : 0, bearing: is3D ? -15 : 0, duration: 800 });
  }, [is3D]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    map.jumpTo({ center: [viewport.longitude, viewport.latitude], zoom: viewport.zoom });
  }, [viewport.latitude, viewport.longitude, viewport.zoom]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    POIS.forEach((poi) => {
      let icon = '🏢';
      let themeColor = '#3b82f6';
      const c = poi.category.toLowerCase();
      if (c.includes('gate')) { icon = '🚪'; themeColor = '#f97316'; }
      else if (c.includes('market')) { icon = '🛒'; themeColor = '#eab308'; }
      else if (c.includes('bank')) { icon = '🏦'; themeColor = '#06b6d4'; }
      else if (c.includes('hospital')) { icon = '🏥'; themeColor = '#ef4444'; }

      const el = document.createElement('div');
      el.style.cursor = 'pointer';
      el.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center;">
          <div style="font-size: 20px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.15));">${icon}</div>
          <span style="background: rgba(255,255,255,0.95); color: #1c1c1e; padding: 3px 6px; border-radius: 6px; font-size: 9px; font-weight: 800; border-top: 2px solid ${themeColor}; box-shadow: 0 4px 10px rgba(0,0,0,0.06); white-space: nowrap; margin-top: 1px;">
            ${poi.name.split('(')[0].trim()}
          </span>
        </div>
      `;
      const poiMarker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([poi.lng, poi.lat])
        .addTo(map);
      markersRef.current.push(poiMarker);
    });
  }, [locationStatus, activeRoute]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (!liveAvatarsRef.current['root-user']) {
      const userDomNode = document.createElement('div');
      userDomNode.innerHTML = `<div class="avatar-pulse-ring"></div><div style="font-size: 10px; font-weight: 900; letter-spacing: -0.2px;">YOU</div>`;
      
      Object.assign(userDomNode.style, {
        width: '42px', height: '42px', backgroundColor: '#10b981', border: '3px solid #ffffff',
        borderRadius: '50%', display: 'flex', alignItems: 'center', justifycontent: 'center',
        color: '#ffffff', boxShadow: '0 10px 24px rgba(16,185,129,0.4)', cursor: 'pointer',
        transformOrigin: 'bottom center', transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)', zIndex: '999'
      });

      liveAvatarsRef.current['root-user'] = new mapboxgl.Marker({ element: userDomNode })
        .setLngLat([userLocation.longitude, userLocation.latitude])
        .addTo(map);
    } else {
      liveAvatarsRef.current['root-user'].setLngLat([userLocation.longitude, userLocation.latitude]);
    }

    const rootDomEl = liveAvatarsRef.current['root-user'].getElement();
    if (rootDomEl) {
      rootDomEl.style.transform = is3D ? 'perspective(600px) rotateX(-60deg) scale(1.2) translateY(-6px)' : 'none';
    }

    Object.entries(groupMembersLocations).forEach(([memberId, loc]: [string, any]) => {
      if (!loc || typeof loc.longitude !== 'number' || typeof loc.latitude !== 'number') return;

      if (!liveAvatarsRef.current[memberId]) {
        const memberDomNode = document.createElement('div');
        const coreInitials = loc.displayName ? loc.displayName.substring(0, 2).toUpperCase() : 'RG';
        memberDomNode.innerHTML = `<div class="member-pulse-ring"></div><div style="font-size: 10px; font-weight: 900;">${coreInitials}</div>`;
        
        Object.assign(memberDomNode.style, {
          width: '42px', height: '42px', backgroundColor: '#3b82f6', border: '3px solid #ffffff',
          borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#ffffff', boxShadow: '0 10px 24px rgba(59,130,246,0.4)', cursor: 'pointer',
          transformOrigin: 'bottom center', transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        });

        liveAvatarsRef.current[memberId] = new mapboxgl.Marker({ element: memberDomNode })
          .setLngLat([loc.longitude, loc.latitude])
          .addTo(map);
      } else {
        liveAvatarsRef.current[memberId].setLngLat([loc.longitude, loc.latitude]);
      }

      const mDomEl = liveAvatarsRef.current[memberId].getElement();
      if (mDomEl) {
        mDomEl.style.transform = is3D ? 'perspective(600px) rotateX(-60deg) scale(1.2) translateY(-6px)' : 'none';
      }
    });

    Object.keys(liveAvatarsRef.current).forEach((key) => {
      if (key !== 'root-user' && !groupMembersLocations[key]) {
        liveAvatarsRef.current[key].remove();
        delete liveAvatarsRef.current[key];
      }
    });

  }, [userLocation, groupMembersLocations, is3D]);

  return <MapContainer ref={containerRef} />;
}

const MapContainer = styled.div`
  width: 100%;
  height: 100%;
  position: absolute;
  inset: 0;
`;