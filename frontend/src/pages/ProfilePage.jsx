import React, { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { useAuth } from "../contexts/AuthContext.jsx";

const ProfilePage = () => {
  const { user, refresh } = useAuth();
  const [form, setForm] = useState({
    username: "",
    age: "",
    school: "",
    program: "",
    major: "",
    interest_tags: []
  });
  const [tagsInput, setTagsInput] = useState("");
  const [status, setStatus] = useState("");

  useEffect(() => {
    const load = async () => {
      const data = await api.getProfile();
      setForm({
        username: data.username || "",
        age: data.age || "",
        school: data.school || "",
        program: data.program || "",
        major: data.major || "",
        interest_tags: data.interest_tags || []
      });
      setTagsInput((data.interest_tags || []).join(", "));
    };
    load();
  }, []);

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

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      <div className="bg-white rounded-2xl border border-slate-200 p-8">
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
      </div>
    </main>
  );
};

export default ProfilePage;
