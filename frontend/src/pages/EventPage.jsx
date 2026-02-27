import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../api/client.js";
import { useAuth } from "../contexts/AuthContext.jsx";

const EventPage = () => {
  const { eventId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentInput, setCommentInput] = useState("");
  const [status, setStatus] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [editStatus, setEditStatus] = useState("");
  const isCommentWithinDeleteWindow = (comment) =>
    Date.now() - new Date(comment.created_at).getTime() <= 3 * 60 * 1000;

  const mapsKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

  const load = async () => {
    setStatus("Loading...");
    try {
      const eventData = await api.getEvent(eventId);
      const commentData = await api.getComments(eventId);
      setEvent(eventData);
      setComments(commentData.items || []);
      setStatus("");
    } catch (error) {
      setStatus(error.message);
    }
  };

  useEffect(() => {
    load();
  }, [eventId]);

  const handleGoing = async () => {
    if (event?.viewer_state?.going) {
      await api.unsetGoing(eventId);
    } else {
      await api.setGoing(eventId);
    }
    await load();
  };

  const handleInterested = async () => {
    if (event?.viewer_state?.interested) {
      await api.unsetInterested(eventId);
    } else {
      await api.setInterested(eventId);
    }
    await load();
  };

  const handleDelete = async () => {
    const confirmed = window.confirm("Delete this event?");
    if (!confirmed) return;
    await api.deleteEvent(eventId);
    navigate("/map");
  };

  const handleEditStart = () => {
    setEditForm({
      title: event.title || "",
      description: event.description || "",
      category: event.category || "",
      place_name: event.place_name || "",
      lat: event.lat,
      lng: event.lng,
      max_participants: event.max_participants || 4
    });
    setEditStatus("");
    setIsEditing(true);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
    setEditForm(null);
    setEditStatus("");
  };

  const geocodeAddress = async (address) => {
    if (!mapsKey || !address) return;
    setEditStatus("Locating that address...");
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
        setEditForm((prev) => ({
          ...prev,
          lat,
          lng,
          place_name: result.formatted_address
        }));
        setEditStatus("");
        return;
      }
      setEditStatus("Could not find that address.");
    } catch (error) {
      setEditStatus("Unable to look up that address.");
    }
  };

  const handleEditSave = async (eventForm) => {
    eventForm.preventDefault();
    setEditStatus("");
    try {
      const updated = await api.updateEvent(eventId, {
        ...editForm,
        lat: Number(editForm.lat),
        lng: Number(editForm.lng),
        max_participants: Number(editForm.max_participants)
      });
      setEvent((prev) => ({ ...prev, ...updated }));
      setIsEditing(false);
      setEditForm(null);
    } catch (error) {
      setEditStatus(error.message);
    }
  };

  const canEdit = user?.uid === event?.creator_uid;

  const handleComment = async (eventForm) => {
    eventForm.preventDefault();
    if (!commentInput.trim()) return;
    await api.postComment(eventId, { body: commentInput.trim() });
    setCommentInput("");
    await load();
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await api.deleteComment(eventId, commentId);
      setComments((prev) => prev.filter((comment) => comment.comment_id !== commentId));
      setEvent((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          counts: {
            ...(prev.counts || {}),
            comments: Math.max(0, (prev.counts?.comments || 0) - 1)
          }
        };
      });
    } catch (error) {
      setStatus(error.message);
    }
  };

  if (!event) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-10">
        <div className="bg-white rounded-xl border border-slate-200 p-6 text-sm text-slate-500">
          {status || "Event not found."}
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-10 space-y-6">
      <section className="bg-white rounded-2xl border border-slate-200 p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">{event.title}</h1>
          <span className="text-xs text-slate-500">{event.status}</span>
        </div>
        {isEditing && editForm ? (
          <form className="mt-4 space-y-4" onSubmit={handleEditSave}>
            <label className="text-sm text-slate-700">
              Title
              <input
                type="text"
                value={editForm.title}
                onChange={(eventInput) =>
                  setEditForm((prev) => ({ ...prev, title: eventInput.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                required
              />
            </label>
            <label className="text-sm text-slate-700">
              Description
              <textarea
                value={editForm.description}
                onChange={(eventInput) =>
                  setEditForm((prev) => ({ ...prev, description: eventInput.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                rows="3"
              />
            </label>
            <label className="text-sm text-slate-700">
              Category
              <select
                value={editForm.category}
                onChange={(eventInput) =>
                  setEditForm((prev) => ({ ...prev, category: eventInput.target.value }))
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
                value={editForm.place_name}
                onBlur={() => geocodeAddress(editForm.place_name)}
                onChange={(eventInput) =>
                  setEditForm((prev) => ({ ...prev, place_name: eventInput.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
                required
              />
            </label>
            <label className="text-sm text-slate-700">
              Max participants
              <input
                type="number"
                value={editForm.max_participants}
                onChange={(eventInput) =>
                  setEditForm((prev) => ({
                    ...prev,
                    max_participants: eventInput.target.value
                  }))
                }
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            {editStatus && <p className="text-sm text-rose-500">{editStatus}</p>}
            <div className="flex gap-3">
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-indigo-600 text-white"
              >
                Save
              </button>
              <button
                type="button"
                onClick={handleEditCancel}
                className="px-4 py-2 rounded-lg border border-slate-300 text-slate-600"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <>
            <p className="text-sm text-slate-500 mt-2">
              {user?.is_verified ? event.place_name : "Campus area"}
            </p>
            <p className="mt-4 text-slate-700">{event.description || "No details yet."}</p>
          </>
        )}
        <div className="mt-4 flex gap-4 text-sm text-slate-500">
          <span>Going: {event.counts?.going ?? 0}</span>
          <span>Interested: {event.counts?.interested ?? 0}</span>
          <span>Comments: {event.counts?.comments ?? 0}</span>
        </div>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={handleGoing}
            disabled={!user?.is_verified}
            className={`px-4 py-2 rounded-lg disabled:bg-slate-300 ${
              event.viewer_state?.going
                ? "bg-indigo-600 text-white"
                : "border border-slate-300 text-slate-600"
            }`}
          >
            Going
          </button>
          <button
            type="button"
            onClick={handleInterested}
            disabled={!user?.is_verified}
            className={`px-4 py-2 rounded-lg disabled:bg-slate-300 ${
              event.viewer_state?.interested
                ? "bg-indigo-600 text-white"
                : "border border-slate-300 text-slate-600"
            }`}
          >
            {event.viewer_state?.interested ? "Saved" : "Save"}
          </button>
          {canEdit && (
            <button
              type="button"
              onClick={handleEditStart}
              className="px-4 py-2 rounded-lg border border-slate-300 text-slate-600"
            >
              Edit
            </button>
          )}
          {canEdit && (
            <button
              type="button"
              onClick={handleDelete}
              className="px-4 py-2 rounded-lg border border-rose-200 text-rose-600"
            >
              Delete
            </button>
          )}
        </div>
        {!user?.is_verified && (
          <p className="text-xs text-slate-500 mt-3">
            Sign in with a verified account to join or comment.
          </p>
        )}
      </section>

      <section className="bg-white rounded-2xl border border-slate-200 p-6">
        <h2 className="font-semibold text-lg">Comments</h2>
        <form className="mt-4 flex gap-2" onSubmit={handleComment}>
          <input
            type="text"
            value={commentInput}
            onChange={(eventInput) => setCommentInput(eventInput.target.value)}
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2"
            placeholder="Say something..."
            disabled={!user?.is_verified}
          />
          <button
            type="submit"
            disabled={!user?.is_verified}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white disabled:bg-slate-300"
          >
            Post
          </button>
        </form>
        <div className="mt-4 space-y-3">
          {comments.length === 0 && (
            <p className="text-sm text-slate-500">No comments yet.</p>
          )}
          {comments.map((comment) => (
            <div key={comment.comment_id} className="border-b border-slate-100 pb-2">
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
                    onClick={() => handleDeleteComment(comment.comment_id)}
                    className="text-xs text-rose-600 hover:text-rose-700"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
};

export default EventPage;
