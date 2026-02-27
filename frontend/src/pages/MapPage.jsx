import React, { useEffect, useMemo, useState } from "react";
import { api } from "../api/client.js";
import { useAuth } from "../contexts/AuthContext.jsx";
import MapView from "../components/MapView.jsx";
import EventList from "../components/EventList.jsx";
import FilterPanel from "../components/FilterPanel.jsx";
import { useLocation, useNavigate } from "react-router-dom";

const MapPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const mapsKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
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
  const [selectedEventComments, setSelectedEventComments] = useState([]);
  const [modalCommentInput, setModalCommentInput] = useState("");
  const [modalCommentStatus, setModalCommentStatus] = useState("");
  const [isModalEditing, setIsModalEditing] = useState(false);
  const [modalEditForm, setModalEditForm] = useState(null);
  const [modalEditStatus, setModalEditStatus] = useState("");
  const [modalStatus, setModalStatus] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [draftSavedFlash, setDraftSavedFlash] = useState("");
  const isCommentWithinDeleteWindow = (comment) =>
    Date.now() - new Date(comment.created_at).getTime() <= 3 * 60 * 1000;

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

  useEffect(() => {
    if (!location.state?.flashMessage) return;
    setDraftSavedFlash(location.state.flashMessage);
    navigate(location.pathname, { replace: true, state: {} });
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    if (!draftSavedFlash) return;
    const timeout = setTimeout(() => {
      setDraftSavedFlash("");
    }, 3000);
    return () => clearTimeout(timeout);
  }, [draftSavedFlash]);

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

  const mapZoom = useMemo(() => {
    const radius = Number(filters.radiusMiles) || 5;
    if (radius <= 2) return 15;
    if (radius <= 5) return 14;
    if (radius <= 10) return 13;
    if (radius <= 15) return 12;
    return 11;
  }, [filters.radiusMiles]);

  const handleSelectPoint = (point) => {
    openEventModal(point.id);
  };

  const openEventModal = async (eventId) => {
    setShowModal(true);
    setModalStatus("Loading...");
    setModalCommentInput("");
    setModalCommentStatus("");
    try {
      const [eventData, commentsData] = await Promise.all([
        api.getEvent(eventId),
        api.getComments(eventId)
      ]);
      setSelectedEvent(eventData);
      setModalEditForm(null);
      setIsModalEditing(false);
      setModalEditStatus("");
      setSelectedEventComments(commentsData.items || []);
      setModalStatus("");
    } catch (error) {
      setModalStatus(error.message);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedEvent(null);
    setSelectedEventComments([]);
    setModalCommentInput("");
    setModalCommentStatus("");
    setIsModalEditing(false);
    setModalEditForm(null);
    setModalEditStatus("");
    setModalStatus("");
  };

  const updateEventCountsInList = (eventId, updates) => {
    setEvents((prev) =>
      prev.map((item) => {
        if (item.event_id !== eventId) return item;
        return {
          ...item,
          counts: {
            ...(item.counts || {}),
            ...updates
          }
        };
      })
    );
  };

  const handleModalGoing = async () => {
    if (!selectedEvent) return;
    try {
      const response = selectedEvent.viewer_state?.going
        ? await api.unsetGoing(selectedEvent.event_id)
        : await api.setGoing(selectedEvent.event_id);

      setSelectedEvent((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          counts: {
            ...(prev.counts || {}),
            going: response.going_count
          },
          viewer_state: {
            ...(prev.viewer_state || {}),
            going: response.going
          }
        };
      });
      updateEventCountsInList(selectedEvent.event_id, { going: response.going_count });
      setModalStatus("");
    } catch (error) {
      setModalStatus(error.message);
    }
  };

  const handleModalSave = async () => {
    if (!selectedEvent) return;
    try {
      const response = selectedEvent.viewer_state?.interested
        ? await api.unsetInterested(selectedEvent.event_id)
        : await api.setInterested(selectedEvent.event_id);

      setSelectedEvent((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          counts: {
            ...(prev.counts || {}),
            interested: response.interested_count
          },
          viewer_state: {
            ...(prev.viewer_state || {}),
            interested: response.interested
          }
        };
      });
      updateEventCountsInList(selectedEvent.event_id, {
        interested: response.interested_count
      });
      setModalStatus("");
    } catch (error) {
      setModalStatus(error.message);
    }
  };

  const handleModalLike = async () => {
    if (!selectedEvent) return;
    try {
      const response = selectedEvent.viewer_state?.liked
        ? await api.unsetLike(selectedEvent.event_id)
        : await api.setLike(selectedEvent.event_id);

      setSelectedEvent((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          counts: {
            ...(prev.counts || {}),
            likes: response.like_count
          },
          viewer_state: {
            ...(prev.viewer_state || {}),
            liked: response.liked
          }
        };
      });
      setModalStatus("");
    } catch (error) {
      setModalStatus(error.message);
    }
  };

  const handleModalComment = async (eventForm) => {
    eventForm.preventDefault();
    if (!selectedEvent || !modalCommentInput.trim()) return;
    setModalCommentStatus("");
    try {
      const createdComment = await api.postComment(selectedEvent.event_id, {
        body: modalCommentInput.trim()
      });
      setSelectedEventComments((prev) => [createdComment, ...prev]);
      setSelectedEvent((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          counts: {
            ...(prev.counts || {}),
            comments: (prev.counts?.comments || 0) + 1
          }
        };
      });
      setModalCommentInput("");
    } catch (error) {
      setModalCommentStatus(error.message);
    }
  };

  const handleModalDelete = async () => {
    if (!selectedEvent) return;
    const confirmed = window.confirm("Delete this event?");
    if (!confirmed) return;
    setModalStatus("");
    try {
      await api.deleteEvent(selectedEvent.event_id);
      setEvents((prev) => prev.filter((item) => item.event_id !== selectedEvent.event_id));
      setPoints((prev) => prev.filter((item) => item.id !== selectedEvent.event_id));
      closeModal();
    } catch (error) {
      setModalStatus(error.message);
    }
  };

  const handleModalCommentDelete = async (commentId) => {
    if (!selectedEvent) return;
    setModalCommentStatus("");
    try {
      await api.deleteComment(selectedEvent.event_id, commentId);
      setSelectedEventComments((prev) =>
        prev.filter((comment) => comment.comment_id !== commentId)
      );
      setSelectedEvent((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          counts: {
            ...(prev.counts || {}),
            comments: Math.max(0, (prev.counts?.comments || 0) - 1)
          }
        };
      });
      updateEventCountsInList(selectedEvent.event_id, {
        comments: Math.max(0, (selectedEvent.counts?.comments || 0) - 1)
      });
    } catch (error) {
      setModalCommentStatus(error.message);
    }
  };

  const handleModalEditStart = () => {
    if (!selectedEvent) return;
    setModalEditForm({
      title: selectedEvent.title || "",
      description: selectedEvent.description || "",
      category: selectedEvent.category || "",
      place_name: selectedEvent.place_name || "",
      lat: selectedEvent.lat,
      lng: selectedEvent.lng,
      max_participants: selectedEvent.max_participants || 4
    });
    setModalEditStatus("");
    setIsModalEditing(true);
  };

  const handleModalEditCancel = () => {
    setIsModalEditing(false);
    setModalEditForm(null);
    setModalEditStatus("");
  };

  const handleModalEditSave = async (eventForm) => {
    eventForm.preventDefault();
    if (!selectedEvent || !modalEditForm) return;
    setModalEditStatus("");
    try {
      let resolvedLat = Number(modalEditForm.lat);
      let resolvedLng = Number(modalEditForm.lng);
      let resolvedPlaceName = modalEditForm.place_name;

      if (
        mapsKey &&
        modalEditForm.place_name &&
        modalEditForm.place_name.trim() &&
        modalEditForm.place_name.trim() !== selectedEvent.place_name
      ) {
        const geocodeResponse = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
            modalEditForm.place_name.trim()
          )}&key=${mapsKey}`
        );
        const geocodeData = await geocodeResponse.json();
        if (geocodeData.status === "OK" && geocodeData.results?.[0]) {
          const result = geocodeData.results[0];
          resolvedLat = result.geometry.location.lat;
          resolvedLng = result.geometry.location.lng;
          resolvedPlaceName = result.formatted_address;
        } else {
          setModalEditStatus("Could not find that address.");
          return;
        }
      }

      const updated = await api.updateEvent(selectedEvent.event_id, {
        ...modalEditForm,
        lat: resolvedLat,
        lng: resolvedLng,
        place_name: resolvedPlaceName,
        max_participants: Number(modalEditForm.max_participants)
      });
      setSelectedEvent((prev) => ({ ...prev, ...updated }));
      setEvents((prev) =>
        prev.map((item) =>
          item.event_id === selectedEvent.event_id
            ? {
                ...item,
                title: updated.title,
                description: updated.description,
                category: updated.category,
                place_name: updated.place_name,
                lat: updated.lat,
                lng: updated.lng
              }
            : item
        )
      );
      setPoints((prev) =>
        prev.map((item) =>
          item.id === selectedEvent.event_id
            ? { ...item, title: updated.title, lat: updated.lat, lng: updated.lng }
            : item
        )
      );
      setIsModalEditing(false);
      setModalEditForm(null);
    } catch (error) {
      setModalEditStatus(error.message);
    }
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
      <div className="bg-white rounded-2xl border border-slate-200 h-[700px] overflow-hidden">
        <MapView
          points={points}
          onSelect={handleSelectPoint}
          center={userLocation}
          zoom={mapZoom}
        />
      </div>
      <div className="space-y-4 h-[700px] flex flex-col min-h-0">
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
        <div className="flex-1 min-h-0 overflow-y-auto pr-1">
          <EventList
            events={filteredEvents}
            emptyLabel="No events nearby."
            onSelect={(eventItem) => openEventModal(eventItem.event_id)}
          />
        </div>
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
                {isModalEditing && modalEditForm ? (
                  <form className="mt-4 space-y-3" onSubmit={handleModalEditSave}>
                    <label className="block text-sm text-slate-700">
                      Title
                      <input
                        type="text"
                        value={modalEditForm.title}
                        onChange={(eventInput) =>
                          setModalEditForm((prev) => ({ ...prev, title: eventInput.target.value }))
                        }
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                        required
                      />
                    </label>
                    <label className="block text-sm text-slate-700">
                      Description
                      <textarea
                        value={modalEditForm.description}
                        onChange={(eventInput) =>
                          setModalEditForm((prev) => ({
                            ...prev,
                            description: eventInput.target.value
                          }))
                        }
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                        rows="3"
                      />
                    </label>
                    <label className="block text-sm text-slate-700">
                      Category
                      <select
                        value={modalEditForm.category}
                        onChange={(eventInput) =>
                          setModalEditForm((prev) => ({
                            ...prev,
                            category: eventInput.target.value
                          }))
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
                    <label className="block text-sm text-slate-700">
                      Location
                      <input
                        type="text"
                        value={modalEditForm.place_name}
                        onChange={(eventInput) =>
                          setModalEditForm((prev) => ({
                            ...prev,
                            place_name: eventInput.target.value
                          }))
                        }
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                        required
                      />
                    </label>
                    <label className="block text-sm text-slate-700">
                      Max participants
                      <input
                        type="number"
                        value={modalEditForm.max_participants}
                        onChange={(eventInput) =>
                          setModalEditForm((prev) => ({
                            ...prev,
                            max_participants: eventInput.target.value
                          }))
                        }
                        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                      />
                    </label>
                    {modalEditStatus && <p className="text-sm text-rose-500">{modalEditStatus}</p>}
                    <div className="flex gap-3">
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={handleModalEditCancel}
                        className="px-4 py-2 rounded-lg border border-slate-300 text-slate-600 text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <p className="mt-4 text-slate-700">
                    {selectedEvent.description || "No details yet."}
                  </p>
                )}
                <div className="mt-4 flex gap-4 text-sm text-slate-500">
                  <span>Going: {selectedEvent.counts?.going ?? 0}</span>
                  <span>Saved: {selectedEvent.counts?.interested ?? 0}</span>
                  <span>Comments: {selectedEvent.counts?.comments ?? 0}</span>
                </div>
                <div className="mt-6 flex items-center justify-between gap-3">
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleModalGoing}
                      disabled={!user?.is_verified || isModalEditing}
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
                      disabled={!user?.is_verified || isModalEditing}
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
                      onClick={handleModalLike}
                      disabled={!user?.is_verified || isModalEditing}
                      className="p-2 rounded-lg border border-slate-300 text-slate-600 disabled:bg-slate-300"
                      aria-label={
                        selectedEvent.viewer_state?.liked ? "Unlike event" : "Like event"
                      }
                      title={selectedEvent.viewer_state?.liked ? "Unlike" : "Like"}
                    >
                      <svg
                        viewBox="0 0 24 24"
                        className={`h-5 w-5 ${
                          selectedEvent.viewer_state?.liked
                            ? "fill-rose-500 stroke-rose-500"
                            : "fill-none stroke-current"
                        }`}
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                      </svg>
                    </button>
                  </div>
                  {user?.uid === selectedEvent.creator_uid && (
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={isModalEditing ? handleModalEditCancel : handleModalEditStart}
                        className="px-4 py-2 rounded-lg border border-slate-300 text-slate-600"
                      >
                        {isModalEditing ? "Cancel edit" : "Edit"}
                      </button>
                      <button
                        type="button"
                        onClick={handleModalDelete}
                        disabled={isModalEditing}
                        className="px-4 py-2 rounded-lg border border-rose-200 text-rose-600 disabled:bg-slate-200"
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </div>
                <div className="mt-6">
                  <h4 className="text-sm font-semibold text-slate-700">Comments</h4>
                  <form className="mt-2 flex gap-2" onSubmit={handleModalComment}>
                    <input
                      type="text"
                      value={modalCommentInput}
                      onChange={(eventInput) => setModalCommentInput(eventInput.target.value)}
                      className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      placeholder="Say something..."
                      disabled={!user?.is_verified}
                    />
                    <button
                      type="submit"
                      disabled={!user?.is_verified || !modalCommentInput.trim()}
                      className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm disabled:bg-slate-300"
                    >
                      Post
                    </button>
                  </form>
                  {modalCommentStatus && (
                    <p className="mt-2 text-sm text-rose-500">{modalCommentStatus}</p>
                  )}
                  {!user?.is_verified && (
                    <p className="mt-2 text-xs text-slate-500">
                      Sign in with a verified account to comment.
                    </p>
                  )}
                  <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-slate-200 p-3 space-y-3">
                    {selectedEventComments.length === 0 ? (
                      <p className="text-sm text-slate-500">No comments yet.</p>
                    ) : (
                      selectedEventComments.map((comment) => (
                        <div key={comment.comment_id}>
                          <p className="text-xs text-slate-500">@{comment.username || "user"}</p>
                          <p className="text-sm text-slate-700">{comment.body}</p>
                          <div className="mt-1 flex items-center justify-between gap-3">
                            <p className="text-xs text-slate-400">
                              {new Date(comment.created_at).toLocaleString([], {
                                month: "short",
                                day: "2-digit",
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                            </p>
                            {user?.uid === comment.uid && isCommentWithinDeleteWindow(comment) && (
                              <button
                                type="button"
                                onClick={() => handleModalCommentDelete(comment.comment_id)}
                                className="text-xs text-rose-600 hover:text-rose-700"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {draftSavedFlash && (
        <div className="fixed right-4 bottom-4 z-50 rounded-lg border border-emerald-200 bg-white px-4 py-3 shadow-lg">
          <p className="text-sm text-emerald-700">{draftSavedFlash}</p>
        </div>
      )}
    </main>
  );
};

export default MapPage;
