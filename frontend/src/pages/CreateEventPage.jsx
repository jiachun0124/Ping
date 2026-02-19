import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client.js";
import { useAuth } from "../contexts/AuthContext.jsx";

const CreateEventPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: "",
    description: "",
    place_name: "Current location",
    lat: 39.9522,
    lng: -75.1932,
    max_participants: 4
  });
  const [status, setStatus] = useState("");

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
        const mapsKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
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
      navigate(`/events/${created.event_id}`);
    } catch (error) {
      setStatus(error.message);
    }
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
            Location
            <input
              type="text"
              value={form.place_name}
              onFocus={updateToCurrentLocation}
              onChange={(eventInput) =>
                setForm((prev) => ({ ...prev, place_name: eventInput.target.value }))
              }
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              required
            />
          </label>
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
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white rounded-lg py-2"
          >
            Create event
          </button>
        </form>
      </div>
    </main>
  );
};

export default CreateEventPage;
