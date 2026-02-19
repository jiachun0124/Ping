import React, { useMemo } from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";

const defaultCenter = { lat: 39.9522, lng: -75.1932 };

const MapView = ({ points, onSelect, center }) => {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ""
  });

  const { eventMarkers, clusterMarkers } = useMemo(() => {
    return {
      eventMarkers: points.filter((point) => point.type === "event"),
      clusterMarkers: points.filter((point) => point.type === "cluster")
    };
  }, [points]);

  if (!isLoaded) {
    return (
      <div className="h-full min-h-[400px] flex items-center justify-center text-slate-500">
        Loading map...
      </div>
    );
  }

  return (
    <GoogleMap
      zoom={14}
      center={center || defaultCenter}
      mapContainerStyle={{ width: "100%", height: "100%" }}
      options={{ streetViewControl: false, mapTypeControl: false }}
    >
      {clusterMarkers.map((point) => (
        <Marker
          key={point.id}
          position={{ lat: point.lat, lng: point.lng }}
          label={{
            text: String(point.count),
            color: "white",
            fontSize: "12px",
            fontWeight: "600"
          }}
          icon={{
            path: window.google?.maps?.SymbolPath?.CIRCLE,
            fillColor: "#4f46e5",
            fillOpacity: 0.9,
            strokeColor: "#4338ca",
            strokeWeight: 1,
            scale: 16
          }}
        />
      ))}
      {eventMarkers.map((point) => (
        <Marker
          key={point.id}
          position={{ lat: point.lat, lng: point.lng }}
          onClick={() => onSelect(point)}
          icon={{
            path: window.google?.maps?.SymbolPath?.CIRCLE,
            fillColor: "#2563eb",
            fillOpacity: 0.9,
            strokeColor: "#1d4ed8",
            strokeWeight: 1,
            scale: 8
          }}
        />
      ))}
    </GoogleMap>
  );
};

export default MapView;
