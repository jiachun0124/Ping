import React, { useMemo } from "react";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";

const defaultCenter = { lat: 39.9522, lng: -75.1932 };

const MapView = ({ points, onSelect }) => {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ""
  });

  const markers = useMemo(
    () => points.filter((point) => point.type === "event"),
    [points]
  );

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
      center={defaultCenter}
      mapContainerStyle={{ width: "100%", height: "100%" }}
      options={{ streetViewControl: false, mapTypeControl: false }}
    >
      {markers.map((point) => (
        <Marker
          key={point.id}
          position={{ lat: point.lat, lng: point.lng }}
          onClick={() => onSelect(point)}
        />
      ))}
    </GoogleMap>
  );
};

export default MapView;
