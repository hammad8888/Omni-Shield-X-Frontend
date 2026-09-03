import React from "react";

export const EmptyState: React.FC<{
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  icon?: string;
  className?: string;
}> = ({ title, description, actionText, onAction, icon = "🔍", className = "" }) => (
  <div className={`p-8 text-center bg-white border border-slate-200/80 rounded-xl max-w-md mx-auto ${className}`}>
    <div className="text-3xl mb-2">{icon}</div>
    <h4 className="text-sm font-bold text-slate-800">{title}</h4>
    <p className="text-xs text-slate-500 mt-1">{description}</p>
    {actionText && onAction && (
      <button
        onClick={onAction}
        className="mt-4 px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
      >
        {actionText}
      </button>
    )}
  </div>
);

export const LoadingState: React.FC<{
  message?: string;
  className?: string;
}> = ({ message = "Loading network data...", className = "" }) => (
  <div className={`flex flex-col items-center justify-center p-12 text-center ${className}`}>
    <div className="h-8 w-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
    <span className="mt-3 text-xs font-medium text-slate-500">{message}</span>
  </div>
);

export const ErrorState: React.FC<{
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}> = ({ title = "Data Acquisition Error", message, onRetry, className = "" }) => (
  <div className={`p-6 bg-rose-50 border border-rose-200 rounded-xl text-center max-w-md mx-auto ${className}`}>
    <div className="text-2xl mb-1">⚠️</div>
    <h4 className="text-sm font-bold text-rose-900">{title}</h4>
    <p className="text-xs text-rose-700 mt-1">{message}</p>
    {onRetry && (
      <button
        onClick={onRetry}
        className="mt-3 px-3 py-1.5 text-xs font-semibold text-rose-800 bg-white border border-rose-300 hover:bg-rose-100 rounded-lg shadow-subtle"
      >
        Retry
      </button>
    )}
  </div>
);

export const OfflineState: React.FC<{
  className?: string;
}> = ({ className = "" }) => (
  <div className={`p-6 bg-amber-50 border border-amber-200 rounded-xl text-center max-w-lg mx-auto ${className}`}>
    <div className="text-3xl mb-2">📡</div>
    <h4 className="text-sm font-bold text-amber-900">Offline / Standalone Mode</h4>
    <p className="text-xs text-amber-700 mt-1 leading-relaxed">
      Local browser diagnostics are running in demonstration sandbox mode. Connect the Omni-Shield-X local agent or network daemon to stream live packet captures and physical modem controls.
    </p>
  </div>
);

export const Drawer: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs transition-opacity" onClick={onClose} />
      <div className="relative w-full max-w-md bg-white shadow-2xl h-full flex flex-col z-10 animate-in slide-in-from-right duration-200">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-sm font-bold text-slate-900">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="p-5 flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};

export const Modal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl p-6 z-10 border border-slate-200 animate-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100"
          >
            ✕
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
};

export const Tabs: React.FC<{
  tabs: string[];
  activeTab: string;
  onChange: (tab: string) => void;
  className?: string;
}> = ({ tabs, activeTab, onChange, className = "" }) => (
  <div className={`flex items-center gap-1 border-b border-slate-200 overflow-x-auto pb-px ${className}`}>
    {tabs.map((t) => (
      <button
        key={t}
        onClick={() => onChange(t)}
        className={`px-3.5 py-2 text-xs font-bold border-b-2 whitespace-nowrap transition-colors ${
          activeTab === t
            ? "border-blue-600 text-blue-600"
            : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
        }`}
      >
        {t}
      </button>
    ))}
  </div>
);
