"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import { doc, setDoc, onSnapshot } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useAuthStore } from "../../store/authStore";
import { useGroupStore } from "../../store/groupStore";
import { useLocationStore } from "../../store/locationStore";
import { useMapController } from "../../hooks/useMapController";
import { POIS } from "../../constants/mapData";
import GroupMapOverlay from "../../components/group/GroupMapOverlay";
import NavigationHud from "../../components/map/NavigationHudCard"; 
import { Layers, Cuboid as Cube } from "lucide-react"; // Import high-end layout icons
import * as S from "./MapScreenStyles"; 

const MapComponent = dynamic(
  () => import("../../components/map/MapComponent"),
  {
    ssr: false,
    loading: () => (
      <div style={{ width: "100vw", height: "100vh", background: "#f2f2f7" }} />
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

function haversineMetres(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000;
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
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

type LocationStatus = "idle" | "requesting" | "inside" | "outside" | "denied" | "unavailable";

export default function MapScreen() {
  const { user } = useAuthStore();
  const { currentGroup } = useGroupStore();
  const { groupMembersLocations } = useLocationStore();

  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("idle");
  const [is3D, setIs3D] = useState(false); // ✅ Shared State for 2D/3D toggle
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
  const mapRef = useRef<any | null>(null);

  const {
    routeCoords,
    activeRoute,
    loadingRoute,
    calculateInAppRoute,
    clearActiveRoute,
  } = useMapController(userLocation);

  // 1. Live location synchronizer matrix
  useEffect(() => {
    if (!currentGroup || !currentGroup.members || currentGroup.members.length === 0) return;

    const activeUnsubscribeListeners: (() => void)[] = [];

    currentGroup.members.forEach((memberId: string) => {
      if (memberId === user?.uid) return; 

      const memberDocRef = doc(db, "locations", memberId);
      const unsub = onSnapshot(memberDocRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          useLocationStore.setState((prevState) => ({
            groupMembersLocations: {
              ...prevState.groupMembersLocations,
              [memberId]: {
                latitude: data.latitude,
                longitude: data.longitude,
                displayName: data.displayName || "Circle Member",
                activeDestination: data.activeDestination || null,
              }
            }
          }));
        }
      }, (error) => {
        console.warn(`Handled silent collection filtering logic for id ${memberId}:`, error.message);
      });

      activeUnsubscribeListeners.push(unsub);
    });

    return () => activeUnsubscribeListeners.forEach((unsub) => unsub());
  }, [currentGroup, user?.uid]);

  // 2. Active destination channel streamer
  const syncDestinationToGroup = async (poi: any | null) => {
    if (!user?.uid) return;
    try {
      const locationRef = doc(db, "locations", user.uid);
      await setDoc(locationRef, {
        activeDestination: poi ? { name: poi.name, latitude: poi.lat, longitude: poi.lng } : null
      }, { merge: true });
    } catch (err) {
      console.error("Failed to stream route objective settings:", err);
    }
  };

  const formattedRouteCoords = useMemo<[number, number][]>(() => {
    if (!routeCoords || !Array.isArray(routeCoords)) return [];
    return routeCoords.map((coord: any) => {
      if (Array.isArray(coord)) return [coord[0], coord[1]]; 
      return [coord.longitude ?? coord.lng, coord.latitude ?? coord.lat]; 
    });
  }, [routeCoords]);

  const requestUserLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocationStatus("unavailable");
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setLocationStatus("requesting");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ latitude, longitude });
        const inside = isInsideCamp(latitude, longitude);
        setLocationStatus(inside ? "inside" : "outside");
        if (!inside) {
          setDistanceFromCamp(Math.round(haversineMetres(latitude, longitude, CAMP_CENTER.latitude, CAMP_CENTER.longitude)));
          setViewport({
            latitude: (latitude + CAMP_CENTER.latitude) / 2,
            longitude: (longitude + CAMP_CENTER.longitude) / 2,
            zoom: 11,
          });
        } else {
          setViewport({ latitude, longitude, zoom: 15 });
        }
      },
      () => setLocationStatus("denied"),
      { enableHighAccuracy: true, timeout: 15000 },
    );
  }, []);

  useEffect(() => { requestUserLocation(); }, [requestUserLocation]);

  const filteredPois = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return POIS.map((poi) => {
      const name = poi.name.toLowerCase();
      const category = poi.category.toLowerCase();
      let score = 0;
      if (name.startsWith(q)) score = 3;
      else if (name.split(/\s+/).some((w) => w.startsWith(q))) score = 2;
      else if (name.includes(q)) score = 1;
      else if (category.includes(q)) score = 1;
      return { poi, score };
    })
      .filter(({ score }) => score > 0)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return haversineMetres(userLocation.latitude, userLocation.longitude, a.poi.lat, a.poi.lng) -
               haversineMetres(userLocation.latitude, userLocation.longitude, b.poi.lat, b.poi.lng);
      })
      .map(({ poi }) => poi);
  }, [searchQuery, userLocation]);

  const handleSelectLocation = (poi: any) => {
    setSearchQuery(poi.name);
    setIsSearchFocused(false);
    calculateInAppRoute(poi);
    syncDestinationToGroup(poi); 
    mapRef.current?.flyTo({
      center: [poi.lng, poi.lat],
      zoom: is3D ? 16.5 : 15.5,
      pitch: is3D ? 60 : 0,
      bearing: is3D ? -10 : 0,
      duration: 2200,
    });
  };

  const handleCancelNavigation = () => {
    clearActiveRoute();
    setSearchQuery("");
    syncDestinationToGroup(null); 
  };

  // ✅ Interactive Camera Projection Toggler
  const handleToggle3D = () => {
    const map = mapRef.current;
    if (!map) return;

    if (is3D) {
      map.flyTo({ pitch: 0, bearing: 0, zoom: 14.5, duration: 1200 });
    } else {
      map.flyTo({ pitch: 60, bearing: -15, zoom: 16.5, duration: 1200 });
    }
    setIs3D(!is3D);
  };

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
        is3D={is3D} // ✅ Send down parameter state changes
      />

      {/* ✅ PREMIUM 2D/3D VIEWER TOGGLE FAB CONTROL */}
      <S.ProjectionFab onClick={handleToggle3D} $is3D={is3D}>
        {is3D ? <Layers size={16} /> : <Cube size={16} />}
        <span>{is3D ? "2D Top View" : "3D Architecture"}</span>
      </S.ProjectionFab>

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

      <S.BannerContainer>
        {locationStatus === "requesting" && (
          <S.LocationBanner $type="neutral">
            <S.BannerText>Detecting your location...</S.BannerText>
          </S.LocationBanner>
        )}
        {locationStatus === "outside" && (
          <S.LocationBanner $type="warning">
            <span style={{ fontSize: "16px" }}>📍</span>
            <div>
              <S.BannerTitle>Outside Redemption City</S.BannerTitle>
              <S.BannerSub>
                ~{distanceFromCamp ? (distanceFromCamp / 1000).toFixed(1) : "?"} km away · Select a destination below
              </S.BannerSub>
            </div>
          </S.LocationBanner>
        )}
        {locationStatus === "inside" && (
          <S.LocationBanner $type="success">
            <span style={{ fontSize: "16px" }}>✅</span>
            <S.BannerText>Inside Redemption City</S.BannerText>
          </S.LocationBanner>
        )}
        {(locationStatus === "denied" || locationStatus === "unavailable") && (
          <S.LocationBanner $type="error" onClick={requestUserLocation}>
            <span style={{ fontSize: "16px" }}>⚠️</span>
            <S.BannerText>
              {locationStatus === "denied" ? "Location denied · Click to retry" : "Location unavailable · Click to retry"}
            </S.BannerText>
          </S.LocationBanner>
        )}
      </S.BannerContainer>

      <S.SearchContainer>
        <S.SearchBarWrapper $isFocused={isSearchFocused}>
          <span className="search-icon">🔍</span>
          <S.SearchInput
            type="text"
            placeholder="Search halls, banks, streets, auditoriums..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              if (!isSearchFocused) setIsSearchFocused(true);
            }}
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
          />
          {searchQuery.length > 0 && (
            <S.ClearInputButton onClick={handleCancelNavigation}>✕</S.ClearInputButton>
          )}
        </S.SearchBarWrapper>
        
        {isSearchFocused && filteredPois.length > 0 && (
          <S.SuggestionsMenu>
            {filteredPois.map((item) => (
              <S.SuggestionRow key={item.id} onMouseDown={() => handleSelectLocation(item)}>
                <S.SuggestionLeft>
                  <S.SuggestionName>{item.name}</S.SuggestionName>
                  <S.SuggestionCategory>{item.category}</S.SuggestionCategory>
                </S.SuggestionLeft>
                <S.SuggestionDist>
                  {haversineMetres(userLocation.latitude, userLocation.longitude, item.lat, item.lng) < 1000
                    ? `${Math.round(haversineMetres(userLocation.latitude, userLocation.longitude, item.lat, item.lng))} m away`
                    : `${(haversineMetres(userLocation.latitude, userLocation.longitude, item.lat, item.lng) / 1000).toFixed(1)} km away`}
                </S.SuggestionDist>
              </S.SuggestionRow>
            ))}
          </S.SuggestionsMenu>
        )}
      </S.SearchContainer>

      {loadingRoute && (
        <S.LoaderContainer>
          <div className="spinner" />
          <span>Finding best route...</span>
        </S.LoaderContainer>
      )}

      <S.UIOverlayContainer>
        {activeRoute ? (
          <NavigationHud activeRoute={activeRoute} onCancel={handleCancelNavigation} />
        ) : (
          <S.CarouselContainer>
            <S.CarouselHeaderTitle>Explore Redemption City</S.CarouselHeaderTitle>
            <S.CarouselScroll>
              {POIS.map((poi) => (
                <S.PoiCard key={poi.id} onClick={() => handleSelectLocation(poi)}>
                  <S.PoiCategory>{poi.category.toUpperCase()}</S.PoiCategory>
                  <S.PoiName>{poi.name}</S.PoiName>
                  <S.PoiAction>Tap to Route →</S.PoiAction>
                </S.PoiCard>
              ))}
            </S.CarouselScroll>
          </S.CarouselContainer>
        )}
      </S.UIOverlayContainer>

      <S.MyLocationFab onClick={requestUserLocation} title="Recenter Location">◎</S.MyLocationFab>
    </S.Container>
  );
}