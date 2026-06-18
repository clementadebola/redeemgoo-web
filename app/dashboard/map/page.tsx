"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import dynamic from "next/dynamic";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuthStore } from "../../store/authStore";
import { useGroupStore } from "../../store/groupStore";
import { useLocationStore } from "../../store/locationStore";
import { useMapController } from "../../hooks/useMapController";
import { POIS } from "../../constants/mapData";
import GroupMapOverlay from "../../components/group/GroupMapOverlay";
import NavigationHud from "../../components/map/NavigationHudCard";
import AIAssistantPanel from "../../components/ai/AIAssistantPanel";
import {
  Layers,
  Cuboid as Cube,
  Satellite,
  Map as MapIcon,
  Moon,
  Sparkles,
  X,
  MapPin,
  LocateFixed,
} from "lucide-react";
import type { MapStyle } from "../../components/map/MapComponent";
import * as S from "./MapScreenStyles";

const MapComponent = dynamic(
  () => import("../../components/map/MapComponent"),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          background: "#f2f2f7",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ fontSize: 13, color: "#8e8e93", fontWeight: 600 }}>
          Loading map…
        </div>
      </div>
    ),
  },
);

const CAMP_BOUNDS = {
  minLat: 6.43,
  maxLat: 6.475,
  minLng: 3.375,
  maxLng: 3.415,
};
const CAMP_CENTER = { latitude: 6.4531, longitude: 3.3958 };

function haversineMetres(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const R = 6_371_000;
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1),
    dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function isInsideCamp(lat: number, lng: number): boolean {
  return (
    lat >= CAMP_BOUNDS.minLat &&
    lat <= CAMP_BOUNDS.maxLat &&
    lng >= CAMP_BOUNDS.minLng &&
    lng <= CAMP_BOUNDS.maxLng
  );
}

type LocationStatus =
  | "idle"
  | "requesting"
  | "inside"
  | "outside"
  | "denied"
  | "unavailable";

// ─── Map style cycle ──────────────────────────────────────────────────────────

const STYLE_CYCLE: { style: MapStyle; label: string; icon: React.ReactNode }[] =
  [
    { style: "streets", label: "2D Map", icon: <MapIcon size={14} /> },
    { style: "satellite", label: "Satellite", icon: <Satellite size={14} /> },
    {
      style: "satellite-streets",
      label: "Hybrid",
      icon: <Satellite size={14} />,
    },
    { style: "dark", label: "Dark", icon: <Moon size={14} /> },
  ];

export default function MapScreen() {
  const { user } = useAuthStore();
  const { currentGroup } = useGroupStore();
  const { groupMembersLocations } = useLocationStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("idle");
  const [is3D, setIs3D] = useState(false);
  const [styleIdx, setStyleIdx] = useState(0);
  const [userLocation, setUserLocation] = useState({
    latitude: CAMP_CENTER.latitude,
    longitude: CAMP_CENTER.longitude,
  });
  const [distanceFromCamp, setDistanceFromCamp] = useState<number | null>(null);
  const [viewport, setViewport] = useState({
    latitude: CAMP_CENTER.latitude,
    longitude: CAMP_CENTER.longitude,
    zoom: 14,
  });
  const [clickedCoords, setClickedCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // ── Live tracking toggle state ──────────────────────────────────────────
  // `false` = one-shot "where am I" lookup (current default behaviour)
  // `true`  = continuous watchPosition() feed, map follows + avatar moves live
  const [isTracking, setIsTracking] = useState(false);
  const watchIdRef = useRef<number | null>(null);

  const mapRef = useRef<any | null>(null);

  const {
    routeCoords,
    activeRoute,
    loadingRoute,
    calculateInAppRoute,
    clearActiveRoute,
  } = useMapController(userLocation);

  const currentStyle = STYLE_CYCLE[styleIdx];

  // ─── Group member location sync ────────────────────────────────────────────

  useEffect(() => {
    if (!currentGroup?.members?.length) return;
    const unsubs: (() => void)[] = [];

    currentGroup.members.forEach((memberId: string) => {
      if (memberId === user?.uid) return;
      const ref = doc(db, "locations", memberId);
      const unsub = onSnapshot(
        ref,
        (snap) => {
          if (!snap.exists()) return;
          const d = snap.data();
          useLocationStore.setState((prev) => ({
            groupMembersLocations: {
              ...prev.groupMembersLocations,
              [memberId]: {
                latitude: d.latitude,
                longitude: d.longitude,
                displayName: d.displayName || "Circle Member",
                activeDestination: d.activeDestination ?? null,
                lastSeen: Date.now(),
              },
            },
          }));
        },
        (err) => console.warn(`Location stream ${memberId}:`, err.message),
      );
      unsubs.push(unsub);
    });

    return () => unsubs.forEach((u) => u());
  }, [currentGroup, user?.uid]);

  // ─── Route coords format ───────────────────────────────────────────────────

  const formattedRouteCoords = useMemo<[number, number][]>(() => {
    if (!routeCoords?.length) return [];
    return routeCoords.map((c: any) =>
      Array.isArray(c)
        ? [c[0], c[1]]
        : [c.longitude ?? c.lng, c.latitude ?? c.lat],
    );
  }, [routeCoords]);

  // ─── Shared "apply a fresh position" logic ─────────────────────────────────
  // Used by both the one-shot lookup and the continuous watcher so status,
  // distance-from-camp, and viewport all stay consistent either way.

  const applyPosition = useCallback(
    (latitude: number, longitude: number, recenterMap: boolean) => {
      setUserLocation({ latitude, longitude });
      const inside = isInsideCamp(latitude, longitude);
      setLocationStatus(inside ? "inside" : "outside");

      if (!inside) {
        setDistanceFromCamp(
          Math.round(
            haversineMetres(
              latitude,
              longitude,
              CAMP_CENTER.latitude,
              CAMP_CENTER.longitude,
            ),
          ),
        );
      } else {
        setDistanceFromCamp(null);
      }

      if (recenterMap) {
        if (!inside) {
          setViewport({
            latitude: (latitude + CAMP_CENTER.latitude) / 2,
            longitude: (longitude + CAMP_CENTER.longitude) / 2,
            zoom: 11,
          });
        } else {
          setViewport({ latitude, longitude, zoom: 15 });
        }
        // Also smoothly fly the live map instance, not just internal state
        mapRef.current?.flyTo({
          center: [longitude, latitude],
          zoom: inside ? 16 : 12,
          duration: 1000,
        });
      }
    },
    [],
  );

  // ─── One-shot location lookup (used on first mount) ────────────────────────

  const requestUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationStatus("unavailable");
      return;
    }
    setLocationStatus("requesting");
    navigator.geolocation.getCurrentPosition(
      ({ coords: { latitude, longitude } }) => {
        applyPosition(latitude, longitude, true);
      },
      () => setLocationStatus("denied"),
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }, [applyPosition]);

  useEffect(() => {
    requestUserLocation();
  }, [requestUserLocation]);

  // ─── Live tracking toggle ───────────────────────────────────────────────────
  // Tapping the FAB starts/stops navigator.geolocation.watchPosition, which
  // keeps firing as the device moves — this is what makes the "YOU" avatar
  // in MapComponent actually walk around the map instead of staying frozen.

  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationStatus("unavailable");
      return;
    }
    if (watchIdRef.current !== null) return; // already tracking

    setLocationStatus("requesting");
    const id = navigator.geolocation.watchPosition(
      ({ coords: { latitude, longitude } }) => {
        // Recenter only on the very first fix after starting tracking;
        // after that, let the user pan freely while the avatar still moves.
        applyPosition(latitude, longitude, watchIdRef.current === null);
      },
      () => {
        setLocationStatus("denied");
        setIsTracking(false);
        watchIdRef.current = null;
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 20000 },
    );
    watchIdRef.current = id;
    setIsTracking(true);
  }, [applyPosition]);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
  }, []);

  // Toggle handler bound to the FAB
  const handleToggleTracking = useCallback(() => {
    if (isTracking) {
      stopTracking();
    } else {
      startTracking();
    }
  }, [isTracking, startTracking, stopTracking]);

  // Clean up the watcher if the screen unmounts while tracking is active
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  // ─── Scored search filter ──────────────────────────────────────────────────

  const filteredPois = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return POIS.map((poi) => {
      const name = poi.name.toLowerCase();
      const cat = poi.category.toLowerCase();
      let score = 0;
      if (name.startsWith(q)) score = 4;
      else if (name.split(/\s+/).some((w) => w.startsWith(q))) score = 3;
      else if (name.includes(q)) score = 2;
      else if (cat.includes(q)) score = 1;
      return { poi, score };
    })
      .filter(({ score }) => score > 0)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return (
          haversineMetres(
            userLocation.latitude,
            userLocation.longitude,
            a.poi.lat,
            a.poi.lng,
          ) -
          haversineMetres(
            userLocation.latitude,
            userLocation.longitude,
            b.poi.lat,
            b.poi.lng,
          )
        );
      })
      .map(({ poi }) => poi);
  }, [searchQuery, userLocation]);

  // ─── Group members shaped for AI (panel + group-insight) ──────────────────

  const groupMembersWithDistance = useMemo(() => {
    return Object.values(groupMembersLocations).map((m: any) => ({
      displayName: m.displayName,
      distanceFromYou: haversineMetres(
        userLocation.latitude,
        userLocation.longitude,
        m.latitude,
        m.longitude,
      ),
      distanceFromCamp: haversineMetres(
        CAMP_CENTER.latitude,
        CAMP_CENTER.longitude,
        m.latitude,
        m.longitude,
      ),
      activeDestination: m.activeDestination ?? null,
    }));
  }, [groupMembersLocations, userLocation]);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  const handleSelectLocation = useCallback(
    (poi: any) => {
      setSearchQuery(poi.name);
      setIsSearchFocused(false);
      calculateInAppRoute(poi);
      mapRef.current?.flyTo({
        center: [poi.lng, poi.lat],
        zoom: is3D ? 16.5 : 15.5,
        pitch: is3D ? 60 : 0,
        bearing: is3D ? -10 : 0,
        duration: 2000,
      });
    },
    [calculateInAppRoute, is3D],
  );

  const handleCancelNavigation = useCallback(() => {
    clearActiveRoute();
    setSearchQuery("");
  }, [clearActiveRoute]);

  const handleToggle3D = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    if (is3D) map.flyTo({ pitch: 0, bearing: 0, zoom: 14.5, duration: 1000 });
    else map.flyTo({ pitch: 60, bearing: -15, zoom: 16.5, duration: 1000 });
    setIs3D(!is3D);
  }, [is3D]);

  const handleCycleStyle = useCallback(() => {
    setStyleIdx((i) => (i + 1) % STYLE_CYCLE.length);
  }, []);

  const handleMapClick = useCallback((lat: number, lng: number) => {
    setClickedCoords({ lat, lng });
  }, []);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <S.Container>
      <MapComponent
        mapRef={mapRef}
        viewport={viewport}
        setViewport={setViewport}
        locationStatus={locationStatus}
        activeRoute={activeRoute}
        routeCoords={formattedRouteCoords}
        CAMP_CENTER={CAMP_CENTER}
        is3D={is3D}
        mapStyle={currentStyle.style}
        onSelectBuildingRoute={handleSelectLocation}
        onMapClick={handleMapClick}
        userLocation={userLocation}
        groupMembersLocations={groupMembersLocations}
      />

      {/* ── FAB stack: 3D + style toggle ── */}
      <S.FabStack>
        <S.ProjectionFab
          onClick={handleToggle3D}
          $is3D={is3D}
          title={is3D ? "Switch to 2D" : "Switch to 3D"}
        >
          {is3D ? <Layers size={15} /> : <Cube size={15} />}
          <span>{is3D ? "2D" : "3D"}</span>
        </S.ProjectionFab>
        <S.StyleFab onClick={handleCycleStyle} title="Change map style">
          {currentStyle.icon}
          <span>{currentStyle.label}</span>
        </S.StyleFab>
      </S.FabStack>

      {/* ── Clicked coordinate pill ── */}
      {clickedCoords && (
        <S.CoordPill>
          <MapPin size={11} />
          <span>
            {clickedCoords.lat.toFixed(5)}, {clickedCoords.lng.toFixed(5)}
          </span>
          <S.CoordClose onClick={() => setClickedCoords(null)}>
            <X size={11} />
          </S.CoordClose>
        </S.CoordPill>
      )}

      {/* ── Group radar overlay ── */}
      {currentGroup && Object.keys(groupMembersLocations).length > 0 && (
        <GroupMapOverlay
          membersLocations={groupMembersLocations}
          userLocation={userLocation}
          campCenter={CAMP_CENTER}
          onFocusMember={(lat, lng) => {
            mapRef.current?.flyTo({
              center: [lng, lat],
              zoom: is3D ? 17 : 16,
              pitch: is3D ? 60 : 0,
              duration: 1200,
            });
          }}
        />
      )}

      {/* ── Location banner ── */}
      <S.BannerContainer>
        {locationStatus === "requesting" && (
          <S.LocationBanner $type="neutral">
            <S.BannerText>Detecting your location…</S.BannerText>
          </S.LocationBanner>
        )}
        {locationStatus === "outside" && (
          <S.LocationBanner $type="warning">
            <span style={{ fontSize: 16 }}>📍</span>
            <div>
              <S.BannerTitle>Outside Redemption City</S.BannerTitle>
              <S.BannerSub>
                ~{distanceFromCamp ? (distanceFromCamp / 1000).toFixed(1) : "?"}{" "}
                km away · Map shows camp layout
              </S.BannerSub>
            </div>
          </S.LocationBanner>
        )}
        {locationStatus === "inside" && (
          <S.LocationBanner $type="success">
            <span style={{ fontSize: 16 }}>✅</span>
            <S.BannerText>
              You're inside Redemption City
              {isTracking ? " · Live tracking on" : ""}
            </S.BannerText>
          </S.LocationBanner>
        )}
        {(locationStatus === "denied" || locationStatus === "unavailable") && (
          <S.LocationBanner
            $type="error"
            onClick={requestUserLocation}
            style={{ cursor: "pointer" }}
          >
            <span style={{ fontSize: 16 }}>⚠️</span>
            <S.BannerText>
              {locationStatus === "denied"
                ? "Location denied · Click to retry"
                : "Location unavailable · Click to retry"}
            </S.BannerText>
          </S.LocationBanner>
        )}
      </S.BannerContainer>

      {/* ── Search bar (plain location search — fast exact/fuzzy lookup) ── */}
      <S.SearchContainer>
        <S.SearchBarWrapper $isFocused={isSearchFocused}>
          <span className="search-icon">🔍</span>
          <S.SearchInput
            type="text"
            placeholder="Search halls, banks, gates, auditoriums…"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchFocused(true);
            }}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
          />
          {searchQuery.length > 0 && (
            <S.ClearInputButton onClick={handleCancelNavigation}>
              ✕
            </S.ClearInputButton>
          )}
        </S.SearchBarWrapper>

        {isSearchFocused && filteredPois.length > 0 && (
          <S.SuggestionsMenu>
            {filteredPois.map((item, idx) => {
              const dist = haversineMetres(
                userLocation.latitude,
                userLocation.longitude,
                item.lat,
                item.lng,
              );
              const distLabel =
                dist < 1000
                  ? `${Math.round(dist)} m`
                  : `${(dist / 1000).toFixed(1)} km`;
              return (
                <S.SuggestionRow
                  key={`poi-${item.id}-${idx}`}
                  onMouseDown={() => handleSelectLocation(item)}
                >
                  <S.SuggestionLeft>
                    <S.SuggestionName>{item.name}</S.SuggestionName>
                    <S.SuggestionCategory>{item.category}</S.SuggestionCategory>
                  </S.SuggestionLeft>
                  <S.SuggestionDist>{distLabel} away</S.SuggestionDist>
                </S.SuggestionRow>
              );
            })}
          </S.SuggestionsMenu>
        )}
      </S.SearchContainer>

      {/* ── Route loading indicator ── */}
      {loadingRoute && (
        <S.LoaderContainer>
          <div className="spinner" />
          <span>Finding best route…</span>
        </S.LoaderContainer>
      )}

      {/* ── Bottom sheet ── */}
      <S.UIOverlayContainer>
        {activeRoute ? (
          <NavigationHud
            activeRoute={activeRoute}
            onCancel={handleCancelNavigation}
          />
        ) : (
          <S.CarouselContainer>
            <S.CarouselHeaderTitle>
              Explore Redemption City
            </S.CarouselHeaderTitle>
            <S.CarouselScroll>
              {POIS.map((poi, idx) => {
                const dist = haversineMetres(
                  userLocation.latitude,
                  userLocation.longitude,
                  poi.lat,
                  poi.lng,
                );
                const mins = Math.max(1, Math.round(dist / 1.3 / 60));
                return (
                  <S.PoiCard
                    key={`carousel-${poi.id}-${idx}`}
                    onClick={() => handleSelectLocation(poi)}
                  >
                    <S.PoiCategory>{poi.category.toUpperCase()}</S.PoiCategory>
                    <S.PoiName>{poi.name}</S.PoiName>
                    <S.PoiDistanceRow>
                      <span>⏱️ {mins} min</span>
                      <span>·</span>
                      <span>
                        {dist < 1000
                          ? `${Math.round(dist)}m`
                          : `${(dist / 1000).toFixed(1)}km`}
                      </span>
                    </S.PoiDistanceRow>
                    <S.PoiAction>Tap to Route →</S.PoiAction>
                  </S.PoiCard>
                );
              })}
            </S.CarouselScroll>
          </S.CarouselContainer>
        )}
      </S.UIOverlayContainer>

      {/* ── My Location FAB — toggles continuous live tracking ──
          Single tap (not tracking): re-centres on a fresh one-shot fix.
          Tap again: starts watchPosition(), map + avatar follow you live.
          Tap a third time: stops tracking. */}
      <S.MyLocationFab
        onClick={handleToggleTracking}
        $active={isTracking}
        title={isTracking ? "Stop live tracking" : "Start live tracking"}
      >
        <LocateFixed size={18} />
      </S.MyLocationFab>

      {/* ── AI Assistant (floating chat panel, bottom-left) ── */}
      <AIAssistantPanel
        userLocation={userLocation}
        groupMembers={groupMembersWithDistance}
        onNavigate={handleSelectLocation}
      />
    </S.Container>
  );
}