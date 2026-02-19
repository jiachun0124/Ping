import React, { useEffect, useState } from "react";
import { api } from "../api/client.js";
import { useAuth } from "../contexts/AuthContext.jsx";
import EventList from "../components/EventList.jsx";

const SavedPage = () => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("");

  const load = async () => {
    setStatus("Loading...");
    try {
      const data = await api.getInterested();
      setItems(data.items || []);
      setStatus("");
    } catch (error) {
      setStatus(error.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (!user?.is_verified) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-10">
        <div className="bg-white rounded-xl border border-slate-200 p-6 text-sm text-slate-500">
          Save lists are only available to verified users.
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-3xl mx-auto px-4 py-10 space-y-4">
      <h1 className="text-2xl font-semibold">Saved events</h1>
      {status && (
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-sm text-slate-500">
          {status}
        </div>
      )}
      <EventList events={items} emptyLabel="No saved events yet." />
    </main>
  );
};

export default SavedPage;
