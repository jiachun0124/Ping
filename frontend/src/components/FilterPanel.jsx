import React from "react";

const categories = ["sport", "art", "social", "study"];

const FilterPanel = ({ filters, onChange }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4">
      <div>
        <p className="text-sm font-semibold text-slate-700">Distance (miles)</p>
        <input
          type="range"
          min="1"
          max="20"
          value={filters.radiusMiles}
          onChange={(event) =>
            onChange({ ...filters, radiusMiles: Number(event.target.value) })
          }
          className="w-full"
        />
        <div className="text-xs text-slate-500 mt-1">{filters.radiusMiles} miles</div>
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-700">Category</p>
        <div className="flex flex-wrap gap-2 mt-2">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() =>
                onChange({
                  ...filters,
                  categories: filters.categories.includes(category)
                    ? filters.categories.filter((item) => item !== category)
                    : [...filters.categories, category]
                })
              }
              className={`px-3 py-1 rounded-full border text-xs ${
                filters.categories.includes(category)
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "border-slate-200 text-slate-600"
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input
            type="checkbox"
            checked={filters.onlyOpen}
            onChange={(event) =>
              onChange({ ...filters, onlyOpen: event.target.checked })
            }
          />
          Only show open events
        </label>
      </div>
    </div>
  );
};

export default FilterPanel;
