import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api/client.js";
import { useAuth } from "../contexts/AuthContext.jsx";

const EventPage = () => {
  const { eventId } = useParams();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentInput, setCommentInput] = useState("");
  const [status, setStatus] = useState("");

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
    await api.setGoing(eventId);
    await load();
  };

  const handleInterested = async () => {
    await api.setInterested(eventId);
    await load();
  };

  const handleComment = async (eventForm) => {
    eventForm.preventDefault();
    if (!commentInput.trim()) return;
    await api.postComment(eventId, { body: commentInput.trim() });
    setCommentInput("");
    await load();
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
        <p className="text-sm text-slate-500 mt-2">
          {user?.is_verified ? event.place_name : "Campus area"}
        </p>
        <p className="mt-4 text-slate-700">{event.description || "No details yet."}</p>
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
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white disabled:bg-slate-300"
          >
            Going
          </button>
          <button
            type="button"
            onClick={handleInterested}
            disabled={!user?.is_verified}
            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-600 disabled:text-slate-400"
          >
            Interested
          </button>
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
              <p className="text-sm text-slate-700">{comment.body}</p>
              <p className="text-xs text-slate-400 mt-1">
                {new Date(comment.created_at).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
};

export default EventPage;
