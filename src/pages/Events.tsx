import React, { useState } from "react";
import { useAnalytics } from "../hooks/useAnalytics";
import { Timeline } from "../components/ui/Timeline";

export const EventsPage: React.FC = () => {
  const { events } = useAnalytics();
  const [filterCategory, setFilterCategory] = useState("All");

  const categories = ["All", "Wi-Fi", "Speed", "DNS", "Device", "Router"];

  const filtered = events.filter((e) => {
    if (filterCategory === "All") return true;
    return e.category === filterCategory;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
            Network Events & Telemetry Timeline
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time event stream capturing AP reassociations, speed test events, DHCP leases, and router warnings
          </p>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl overflow-x-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                filterCategory === cat
                  ? "bg-white text-blue-600 shadow-subtle"
                  : "text-slate-500 hover:text-slate-800"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Card */}
      <div className="dashboard-card p-6">
        <Timeline events={filtered} />
      </div>
    </div>
  );
};
