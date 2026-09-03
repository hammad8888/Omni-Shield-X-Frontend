import React from "react";
import type { NetworkEventItem } from "../../types";

interface TimelineProps {
  events: NetworkEventItem[];
  className?: string;
}

export const Timeline: React.FC<TimelineProps> = ({ events, className = "" }) => {
  const getTypeDot = (type: NetworkEventItem["type"]) => {
    switch (type) {
      case "success":
        return "bg-emerald-500 ring-4 ring-emerald-100";
      case "warning":
        return "bg-amber-500 ring-4 ring-amber-100";
      case "critical":
        return "bg-rose-500 ring-4 ring-rose-100";
      default:
        return "bg-blue-500 ring-4 ring-blue-100";
    }
  };

  return (
    <div className={`relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 ${className}`}>
      {events.map((evt) => (
        <div key={evt.id} className="relative group">
          {/* Timeline Dot */}
          <div
            className={`absolute -left-[27px] top-1 h-3 w-3 rounded-full ${getTypeDot(
              evt.type
            )} transition-transform group-hover:scale-125`}
          />

          <div className="bg-white border border-slate-200/80 rounded-xl p-3.5 shadow-subtle hover:border-slate-300 transition-colors">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-slate-100 text-slate-700">
                  {evt.category}
                </span>
                <span className="text-xs font-bold text-slate-900">{evt.message}</span>
              </div>
              <span className="text-[11px] font-medium text-slate-400 font-mono shrink-0">
                {evt.timestamp}
              </span>
            </div>
            {evt.details && (
              <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">{evt.details}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
