import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client.js";
import { useAuth } from "../contexts/AuthContext.jsx";
import { loadEventDrafts, removeEventDraft } from "../utils/eventDraft.js";

const ProfilePage = () => {
  const { user, refresh } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    username: "",
    age: "",
    school: "",
    program: "",
    major: "",
    interest_tags: [],
    receive_comment_emails: true
  });
  const [tagsInput, setTagsInput] = useState("");
  const [status, setStatus] = useState("");
  const [eventDrafts, setEventDrafts] = useState([]);

  useEffect(() => {
    const load = async () => {
      const data = await api.getProfile();
      setForm({
        username: data.username || "",
        age: data.age || "",
        school: data.school || "",
        program: data.program || "",
        major: data.major || "",
        interest_tags: data.interest_tags || [],
        receive_comment_emails: data.receive_comment_emails !== false
      });
      setTagsInput((data.interest_tags || []).join(", "));
    };
    load();
  }, []);

  useEffect(() => {
    setEventDrafts(loadEventDrafts(user?.uid));
  }, [user?.uid]);

  const handleSave = async (event) => {
    event.preventDefault();
    setStatus("");
    try {
      const tags = tagsInput
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean)
        .slice(0, 4);
      await api.updateProfile({
        ...form,
        age: form.age ? Number(form.age) : null,
        interest_tags: tags
      });
      await refresh();
      setStatus("Saved!");
    } catch (error) {
      setStatus(error.message);
    }
  };

  const handleDeleteDraft = (draftId) => {
    const nextDrafts = removeEventDraft(user?.uid, draftId);
    setEventDrafts(nextDrafts);
  };

  return (
    <main className="max-w-6xl mx-auto px-4 py-10">
      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <section className="w-full justify-self-start bg-white rounded-2xl border border-slate-200 p-8">
        <h1 className="text-2xl font-semibold text-slate-900">Profile</h1>
        <p className="text-sm text-slate-500 mt-2">
          Account status: {user?.is_verified ? "Verified" : "Guest"}
        </p>
        <form className="mt-6 grid gap-4" onSubmit={handleSave}>
          <div className="grid md:grid-cols-2 gap-4">
            <label className="text-sm text-slate-700">
              Username
              <input
                type="text"
                value={form.username}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, username: event.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="text-sm text-slate-700">
              Age
              <input
                type="number"
                value={form.age}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, age: event.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <label className="text-sm text-slate-700">
              School
              <input
                type="text"
                value={form.school}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, school: event.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="text-sm text-slate-700">
              Program
              <input
                type="text"
                value={form.program}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, program: event.target.value }))
                }
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
          </div>
          <label className="text-sm text-slate-700">
            Major
            <input
              type="text"
              value={form.major}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, major: event.target.value }))
              }
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="text-sm text-slate-700">
            Interest tags (1-4, comma separated)
            <input
              type="text"
              value={tagsInput}
              onChange={(event) => setTagsInput(event.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={Boolean(form.receive_comment_emails)}
              onChange={(event) =>
                setForm((prev) => ({
                  ...prev,
                  receive_comment_emails: event.target.checked
                }))
              }
            />
            Receive email notifications for new comments on my events
          </label>
          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg"
            >
              Save profile
            </button>
            {status && <p className="text-sm text-slate-500">{status}</p>}
          </div>
        </form>
        </section>

        <section className="w-full max-w-md justify-self-end bg-white rounded-2xl border border-slate-200 p-6 h-fit">
          <h2 className="text-base font-semibold text-slate-900">Event drafts</h2>
          <p className="mt-1 text-xs text-slate-500">
            You can keep up to 3 drafts.
          </p>
          {eventDrafts.length > 0 ? (
            <div className="mt-3 space-y-3">
              {eventDrafts.map((draft) => (
                <div key={draft.id} className="rounded-xl border border-slate-200 p-3">
                  <p className="text-sm text-slate-700">
                    {draft.form.title?.trim() ? draft.form.title : "Untitled draft"}
                  </p>
                  {draft.updated_at && (
                    <p className="mt-1 text-xs text-slate-500">
                      Last saved {new Date(draft.updated_at).toLocaleString()}
                    </p>
                  )}
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => navigate("/events/new", { state: { draftId: draft.id } })}
                      className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-sm"
                    >
                      Continue
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteDraft(draft.id)}
                      className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-600 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate-500">No saved event drafts yet.</p>
          )}
        </section>
      </div>
    </main>
  );
};

export default ProfilePage;
