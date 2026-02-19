import React from "react";
import { Link } from "react-router-dom";

const EventList = ({ events, emptyLabel }) => {
  if (!events.length) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 text-sm text-slate-500">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {events.map((event) => (
        <Link
          key={event.event_id}
          to={`/events/${event.event_id}`}
          className="block bg-white rounded-xl border border-slate-200 p-4 hover:border-indigo-300 transition"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-slate-900">{event.title}</p>
              <p className="text-xs text-slate-500 mt-1">
                {event.place_name || "Campus area"}
              </p>
            </div>
            <div className="text-xs text-slate-500">
              {event.ttl_minutes ? `${Math.max(0, Math.round(event.ttl_minutes))} min` : ""}
            </div>
          </div>
          <div className="mt-2 flex items-center gap-3 text-xs text-slate-500">
            <span>{event.mood || event.intention || "Open invite"}</span>
            <span>Active</span>
          </div>
        </Link>
      ))}
    </div>
  );
};

export default EventList;
