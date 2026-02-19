import React from "react";

const EventList = ({ events, emptyLabel, onSelect }) => {
  if (!events.length) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 text-sm text-slate-500">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {events.map((event) => {
        const postedAt = event.start_time
          ? new Date(event.start_time).toLocaleString([], {
              month: "short",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit"
            })
          : null;
        return (
        <button
          key={event.event_id}
          type="button"
          onClick={() => onSelect?.(event)}
          className="w-full text-left bg-white rounded-xl border border-slate-200 p-4 hover:border-indigo-300 transition"
        >
          <div className="flex items-start justify-between">
            <div className="w-full">
              <div className="flex items-baseline justify-between gap-3">
                <p className="font-semibold text-slate-900">{event.title}</p>
                {postedAt && <p className="text-xs text-slate-500">{postedAt}</p>}
              </div>
              {event.description && (
                <p className="text-xs text-slate-500 mt-1">
                  {event.description.length > 90
                    ? `${event.description.slice(0, 90)}...`
                    : event.description}
                </p>
              )}
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>
              {event.place_name
                ? event.place_name
                    .split(",")
                    .map((part) => part.trim())
                    .filter(Boolean)[0] || "Campus area"
                : "Campus area"}
            </span>
            <span>
              Active
              {typeof event.counts?.going === "number"
                ? ` · ${event.counts.going} going`
                : ""}
            </span>
          </div>
        </button>
      );
      })}
    </div>
  );
};

export default EventList;
