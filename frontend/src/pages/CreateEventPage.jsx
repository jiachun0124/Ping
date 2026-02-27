import React, { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../api/client.js";
import { useAuth } from "../contexts/AuthContext.jsx";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";
import {
  loadEventDraftById,
  removeEventDraft,
  saveEventDraft
} from "../utils/eventDraft.js";

const CreateEventPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ""
  });
  const draftId = location.state?.draftId || null;
  const initialDraft = draftId ? loadEventDraftById(user?.uid, draftId) : null;
  const [form, setForm] = useState(
    initialDraft?.form || {
      title: "",
      description: "",
      category: "",
      place_name: "Current location",
      lat: 39.9522,
      lng: -75.1932,
      max_participants: 4
    }
  );
  const [status, setStatus] = useState("");

  const mapsKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

  const updateToCurrentLocation = () => {
    if (!navigator.geolocation) {
      setStatus("Geolocation is not supported in this browser.");
      return;
    }
    setStatus("Detecting your location...");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        let locationLabel = `Lat ${lat.toFixed(5)}, Lng ${lng.toFixed(5)}`;

        if (mapsKey) {
          try {
            const response = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${mapsKey}`
            );
            const data = await response.json();
            if (data.status === "OK" && data.results?.[0]?.formatted_address) {
              locationLabel = data.results[0].formatted_address;
            }
          } catch (error) {
            locationLabel = `Lat ${lat.toFixed(5)}, Lng ${lng.toFixed(5)}`;
          }
        }
        setForm((prev) => ({
          ...prev,
          lat,
          lng,
          place_name: locationLabel
        }));
        setStatus("");
      },
      () => {
        setStatus("Unable to access your location.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const geocodeAddress = async (address) => {
    if (!mapsKey || !address) return;
    setStatus("Locating that address...");
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          address
        )}&key=${mapsKey}`
      );
      const data = await response.json();
      if (data.status === "OK" && data.results?.[0]) {
        const result = data.results[0];
        const lat = result.geometry.location.lat;
        const lng = result.geometry.location.lng;
        setForm((prev) => ({
          ...prev,
          lat,
          lng,
          place_name: result.formatted_address
        }));
        setStatus("");
        return;
      }
      setStatus("Could not find that address.");
    } catch (error) {
      setStatus("Unable to look up that address.");
    }
  };

  const mapCenter = useMemo(
    () => ({ lat: Number(form.lat), lng: Number(form.lng) }),
    [form.lat, form.lng]
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus("");
    try {
      const created = await api.createEvent({
        ...form,
        lat: Number(form.lat),
        lng: Number(form.lng),
        max_participants: Number(form.max_participants)
      });
      if (draftId) {
        removeEventDraft(user?.uid, draftId);
      }
      navigate(`/events/${created.event_id}`);
    } catch (error) {
      setStatus(error.message);
    }
  };

  const handleSaveDraft = () => {
    const result = saveEventDraft(
      user?.uid,
      {
        ...form,
        lat: Number(form.lat),
        lng: Number(form.lng),
        max_participants: Number(form.max_participants)
      },
      draftId
    );
    if (!result.ok) {
      setStatus(result.error);
      return;
    }
    navigate("/map", {
      state: { flashMessage: "Draft saved to your profile." }
    });
  };

  if (!user?.is_verified) {
    return (
      <main className="max-w-xl mx-auto px-4 py-10">
        <div className="bg-white rounded-xl border border-slate-200 p-6 text-sm text-slate-500">
          Only verified users can create events.
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-xl mx-auto px-4 py-10">
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <h1 className="text-xl font-semibold">Create an event</h1>
        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <label className="text-sm text-slate-700">
            Title
            <input
              type="text"
              value={form.title}
              onChange={(eventInput) =>
                setForm((prev) => ({ ...prev, title: eventInput.target.value }))
              }
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              required
            />
          </label>
          <label className="text-sm text-slate-700">
            Description
            <textarea
              value={form.description}
              onChange={(eventInput) =>
                setForm((prev) => ({ ...prev, description: eventInput.target.value }))
              }
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              rows="3"
            />
          </label>
          <label className="text-sm text-slate-700">
            Category
            <select
              value={form.category}
              onChange={(eventInput) =>
                setForm((prev) => ({ ...prev, category: eventInput.target.value }))
              }
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              required
            >
              <option value="" disabled>
                Select a category
              </option>
              <option value="sport">Sport</option>
              <option value="art">Art</option>
              <option value="social">Social</option>
              <option value="study">Study</option>
            </select>
          </label>
          <label className="text-sm text-slate-700">
            Location
            <input
              type="text"
              value={form.place_name}
              onFocus={() => {
                if (!form.place_name || form.place_name === "Current location") {
                  updateToCurrentLocation();
                }
              }}
              onBlur={() => {
                if (form.place_name && form.place_name !== "Current location") {
                  geocodeAddress(form.place_name);
                }
              }}
              onChange={(eventInput) =>
                setForm((prev) => ({ ...prev, place_name: eventInput.target.value }))
              }
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              required
            />
          </label>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-600">Map preview</p>
              <button
                type="button"
                onClick={() => geocodeAddress(form.place_name)}
                className="text-xs text-indigo-600"
              >
                Pin location
              </button>
            </div>
            <div className="h-48 rounded-xl overflow-hidden border border-slate-200">
              {isLoaded ? (
                <GoogleMap
                  zoom={15}
                  center={mapCenter}
                  mapContainerStyle={{ width: "100%", height: "100%" }}
                  options={{ streetViewControl: false, mapTypeControl: false }}
                >
                  <Marker position={mapCenter} />
                </GoogleMap>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-slate-500">
                  Loading map...
                </div>
              )}
            </div>
          </div>
          <label className="text-sm text-slate-700">
            Max participants
            <input
              type="number"
              value={form.max_participants}
              onChange={(eventInput) =>
                setForm((prev) => ({
                  ...prev,
                  max_participants: eventInput.target.value
                }))
              }
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          {status && <p className="text-sm text-rose-500">{status}</p>}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleSaveDraft}
              className="w-full border border-slate-300 text-slate-700 rounded-lg py-2"
            >
              Save draft
            </button>
            <button
              type="submit"
              className="w-full bg-indigo-600 text-white rounded-lg py-2"
            >
              Create event
            </button>
          </div>
        </form>
      </div>
    </main>
  );
};

export default CreateEventPage;
