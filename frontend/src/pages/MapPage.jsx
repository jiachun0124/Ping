import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api/client.js";
import { useAuth } from "../contexts/AuthContext.jsx";
import MapView from "../components/MapView.jsx";
import EventList from "../components/EventList.jsx";
import FilterPanel from "../components/FilterPanel.jsx";
import { useNavigate } from "react-router-dom";

const MapPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [points, setPoints] = useState([]);
  const [events, setEvents] = useState([]);
  const [filters, setFilters] = useState({
    radiusMiles: 5,
    categories: [],
    onlyOpen: true
  });
  const [status, setStatus] = useState("");
  const [userLocation, setUserLocation] = useState({ lat: 39.9522, lng: -75.1932 });
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [modalStatus, setModalStatus] = useState("");
  const [showModal, setShowModal] = useState(false);

  const loadData = async () => {
    setStatus("Loading map...");
    try {
      const radiusMiles = filters.radiusMiles;
      const latDelta = radiusMiles / 69;
      const lngDelta = radiusMiles / (69 * Math.cos((userLocation.lat * Math.PI) / 180));
      const bounds = {
        north: userLocation.lat + latDelta,
        south: userLocation.lat - latDelta,
        east: userLocation.lng + lngDelta,
        west: userLocation.lng - lngDelta,
        max_points: 120
      };
      const pointsResponse = await api.mapPoints(bounds);
      const mapPoints = pointsResponse.points || [];

      const discoverResponse = await api.discover({
        lat: userLocation.lat,
        lng: userLocation.lng,
        radius_m: Math.round(filters.radiusMiles * 1609.34),
        limit: 10
      });
      const discoveredItems = discoverResponse.items || [];
      setEvents(discoveredItems);
      if (mapPoints.length === 0 && discoveredItems.length > 0) {
        setPoints(
          discoveredItems.map((item) => ({
            id: item.event_id,
            type: "event",
            lat: item.lat,
            lng: item.lng,
            title: item.title
          }))
        );
      } else {
        setPoints(mapPoints);
      }
      setStatus("");
    } catch (error) {
      setStatus(error.message);
    }
  };

  useEffect(() => {
    if (!navigator.geolocation) {
      loadData();
      return;
    }
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      () => {
        loadData();
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 10000 }
    );
    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  useEffect(() => {
    loadData();
  }, [filters.radiusMiles, userLocation.lat, userLocation.lng]);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      if (filters.onlyOpen && event.status !== "active") {
        return false;
      }
      if (filters.categories.length === 0) {
        return true;
      }
      const tag = (event.category || "").toLowerCase();
      return filters.categories.some((category) => tag.includes(category));
    });
  }, [events, filters]);

  const handleSelectPoint = (point) => {
    openEventModal(point.id);
  };

  const openEventModal = async (eventId) => {
    setShowModal(true);
    setModalStatus("Loading...");
    try {
      const data = await api.getEvent(eventId);
      setSelectedEvent(data);
      setModalStatus("");
    } catch (error) {
      setModalStatus(error.message);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedEvent(null);
    setModalStatus("");
  };

  const handleModalGoing = async () => {
    if (!selectedEvent) return;
    if (selectedEvent.viewer_state?.going) {
      await api.unsetGoing(selectedEvent.event_id);
    } else {
      await api.setGoing(selectedEvent.event_id);
    }
    await openEventModal(selectedEvent.event_id);
  };

  const handleModalSave = async () => {
    if (!selectedEvent) return;
    if (selectedEvent.viewer_state?.interested) {
      await api.unsetInterested(selectedEvent.event_id);
    } else {
      await api.setInterested(selectedEvent.event_id);
    }
    await openEventModal(selectedEvent.event_id);
  };

  return (
    <main className="max-w-7xl mx-auto px-4 py-8 grid lg:grid-cols-[180px_1fr_320px] gap-6">
      <div className="space-y-4">
        <FilterPanel filters={filters} onChange={setFilters} />
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-xs text-slate-500">
          {user?.is_verified
            ? "Verified users can create and join events."
            : "Guest users can browse events."}
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 min-h-[700px] overflow-hidden">
        <MapView points={points} onSelect={handleSelectPoint} center={userLocation} />
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Live events</h2>
          <button
            type="button"
            className="text-sm text-indigo-600"
            onClick={() => navigate("/events/new")}
          >
            + New
          </button>
        </div>
        {status && (
          <div className="text-sm text-slate-500 bg-white rounded-xl border border-slate-200 p-3">
            {status}
          </div>
        )}
        <EventList
          events={filteredEvents}
          emptyLabel="No events nearby."
          onSelect={(eventItem) => openEventModal(eventItem.event_id)}
        />
      </div>
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold">
                  {selectedEvent?.title || "Event"}
                </h3>
                <p className="text-sm text-slate-500 mt-1">
                  {selectedEvent?.place_name || "Campus area"}
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="text-slate-500 hover:text-slate-900"
              >
                Close
              </button>
            </div>
            {modalStatus && (
              <div className="mt-4 text-sm text-slate-500">{modalStatus}</div>
            )}
            {selectedEvent && !modalStatus && (
              <>
                <p className="mt-4 text-slate-700">
                  {selectedEvent.description || "No details yet."}
                </p>
                <div className="mt-4 flex gap-4 text-sm text-slate-500">
                  <span>Going: {selectedEvent.counts?.going ?? 0}</span>
                  <span>Saved: {selectedEvent.counts?.interested ?? 0}</span>
                  <span>Comments: {selectedEvent.counts?.comments ?? 0}</span>
                </div>
                <div className="mt-6 flex gap-3">
                  <button
                    type="button"
                    onClick={handleModalGoing}
                    disabled={!user?.is_verified}
                    className={`px-4 py-2 rounded-lg disabled:bg-slate-300 ${
                      selectedEvent.viewer_state?.going
                        ? "bg-indigo-600 text-white"
                        : "border border-slate-300 text-slate-600"
                    }`}
                  >
                    Going
                  </button>
                  <button
                    type="button"
                    onClick={handleModalSave}
                    disabled={!user?.is_verified}
                    className={`px-4 py-2 rounded-lg disabled:bg-slate-300 ${
                      selectedEvent.viewer_state?.interested
                        ? "bg-indigo-600 text-white"
                        : "border border-slate-300 text-slate-600"
                    }`}
                  >
                    {selectedEvent.viewer_state?.interested ? "Saved" : "Save"}
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate(`/events/${selectedEvent.event_id}`)}
                    className="px-4 py-2 rounded-lg border border-slate-300 text-slate-600"
                  >
                    Details
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
};

export default MapPage;
