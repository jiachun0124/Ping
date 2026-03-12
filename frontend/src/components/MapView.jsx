import React, { useEffect, useMemo, useRef, useState } from "react";
import { GoogleMap, useJsApiLoader } from "@react-google-maps/api";

const defaultCenter = { lat: 39.9522, lng: -75.1932 };
const mapId = import.meta.env.VITE_GOOGLE_MAP_ID || "DEMO_MAP_ID";

const makeMarkerContent = ({ color, size, label }) => {
  const node = document.createElement("div");
  node.style.width = `${size}px`;
  node.style.height = `${size}px`;
  node.style.borderRadius = "50%";
  node.style.background = color;
  node.style.border = "1px solid rgba(15, 23, 42, 0.35)";
  node.style.boxSizing = "border-box";
  node.style.display = "flex";
  node.style.alignItems = "center";
  node.style.justifyContent = "center";
  node.style.color = "white";
  node.style.fontSize = "12px";
  node.style.fontWeight = "600";
  if (label) {
    node.textContent = label;
  }
  return node;
};

const MapView = ({ points, onSelect, center, zoom = 14 }) => {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "",
    libraries: ["marker"]
  });
  const [map, setMap] = useState(null);
  const activeMarkersRef = useRef([]);

  const { eventMarkers, clusterMarkers } = useMemo(() => {
    return {
      eventMarkers: points.filter((point) => point.type === "event"),
      clusterMarkers: points.filter((point) => point.type === "cluster")
    };
  }, [points]);

  useEffect(() => {
    if (!isLoaded || !map || !window.google?.maps?.marker?.AdvancedMarkerElement) {
      return undefined;
    }

    activeMarkersRef.current.forEach((marker) => {
      marker.map = null;
    });
    activeMarkersRef.current = [];

    clusterMarkers.forEach((point) => {
      const marker = new window.google.maps.marker.AdvancedMarkerElement({
        map,
        position: { lat: point.lat, lng: point.lng },
        title: `Cluster with ${point.count} events`,
        content: makeMarkerContent({
          color: "#4f46e5",
          size: 32,
          label: String(point.count)
        })
      });
      activeMarkersRef.current.push(marker);
    });

    eventMarkers.forEach((point) => {
      const marker = new window.google.maps.marker.AdvancedMarkerElement({
        map,
        position: { lat: point.lat, lng: point.lng },
        title: point.title || "Event",
        content: makeMarkerContent({
          color: "#2563eb",
          size: 16
        })
      });
      marker.addListener("click", () => onSelect(point));
      activeMarkersRef.current.push(marker);
    });

    return () => {
      activeMarkersRef.current.forEach((marker) => {
        marker.map = null;
      });
      activeMarkersRef.current = [];
    };
  }, [isLoaded, map, clusterMarkers, eventMarkers, onSelect]);

  if (!isLoaded) {
    return (
      <div className="h-full min-h-[400px] flex items-center justify-center text-slate-500">
        Loading map...
      </div>
    );
  }

  return (
    <GoogleMap
      zoom={zoom}
      center={center || defaultCenter}
      mapContainerStyle={{ width: "100%", height: "100%" }}
      options={{ streetViewControl: false, mapTypeControl: false, mapId }}
      onLoad={setMap}
      onUnmount={() => setMap(null)}
    >
      {/* Markers are rendered via AdvancedMarkerElement in a side effect. */}
    </GoogleMap>
  );
};

export default MapView;
