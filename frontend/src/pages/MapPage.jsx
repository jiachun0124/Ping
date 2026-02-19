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

  const loadData = async () => {
    setStatus("Loading map...");
    try {
      const bounds = {
        north: 39.965,
        south: 39.945,
        east: -75.175,
        west: -75.205,
        max_points: 120
      };
      const pointsResponse = await api.mapPoints(bounds);
      setPoints(pointsResponse.points || []);

      const discoverResponse = await api.discover({
        lat: 39.9522,
        lng: -75.1932,
        radius_m: Math.round(filters.radiusMiles * 1609.34),
        limit: 10
      });
      setEvents(discoverResponse.items || []);
      setStatus("");
    } catch (error) {
      setStatus(error.message);
    }
  };

  useEffect(() => {
    loadData();
  }, [filters.radiusMiles]);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      if (filters.onlyOpen && event.status !== "active") {
        return false;
      }
      if (filters.categories.length === 0) {
        return true;
      }
      const tag = (event.intention || event.mood || "").toLowerCase();
      return filters.categories.some((category) => tag.includes(category));
    });
  }, [events, filters]);

  const handleSelectPoint = (point) => {
    navigate(`/events/${point.id}`);
  };

  return (
    <main className="max-w-6xl mx-auto px-4 py-8 grid lg:grid-cols-[260px_1fr_320px] gap-6">
      <div className="space-y-4">
        <FilterPanel filters={filters} onChange={setFilters} />
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-xs text-slate-500">
          {user?.is_verified
            ? "Verified users can create and join events."
            : "Guest users can browse events."}
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-slate-200 min-h-[480px] overflow-hidden">
        <MapView points={points} onSelect={handleSelectPoint} />
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
        <EventList events={filteredEvents} emptyLabel="No events nearby." />
      </div>
    </main>
  );
};

export default MapPage;
