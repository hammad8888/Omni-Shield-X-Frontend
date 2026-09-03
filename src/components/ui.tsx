import type { ButtonHTMLAttributes, FormEvent, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

export function FreshnessBadge({ freshness }: { freshness?: string | null }) {
  const value = freshness ?? "UNKNOWN";
  const color =
    value === "LIVE"
      ? "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30"
      : value === "DEMO"
        ? "bg-violet-500/15 text-violet-300 ring-violet-500/30"
        : value === "STALE"
          ? "bg-orange-500/15 text-orange-300 ring-orange-500/30"
          : value === "UNAVAILABLE"
            ? "bg-slate-500/15 text-slate-300 ring-slate-500/30"
            : "bg-amber-500/15 text-amber-200 ring-amber-500/20";
  return <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ${color}`}>{value}</span>;
}

export function StatusPill({ value }: { value?: string | null }) {
  const tone = String(value ?? "").toUpperCase();
  const color =
    tone === "ACTIVE" || tone === "ONLINE" || tone === "SUCCESS" || tone === "APPROVED"
      ? "text-emerald-300"
      : tone === "SUSPENDED" || tone === "FAILED" || tone === "REVOKED" || tone === "REJECTED"
        ? "text-red-300"
        : "text-slate-300";
  return <span className={color}>{value ?? "—"}</span>;
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        {description ? <p className="mt-1 max-w-3xl text-sm text-slate-400">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-white/10 bg-ink-900 ${className}`}>{children}</div>;
}

export function Button({
  children,
  variant = "primary",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" }) {
  const styles =
    variant === "danger"
      ? "bg-red-500/15 text-red-200 ring-1 ring-red-500/30 hover:bg-red-500/25"
      : variant === "ghost"
        ? "bg-white/5 text-slate-200 hover:bg-white/10"
        : "bg-accent-500 text-ink-950 hover:bg-accent-400";
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium disabled:opacity-60 ${styles} ${props.className ?? ""}`}
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block text-sm">
      <span className="text-slate-300">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

const inputClass =
  "w-full rounded-md bg-ink-800 px-3 py-2 text-sm outline-none ring-accent-500 focus:ring-2 disabled:opacity-60";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputClass} ${props.className ?? ""}`} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputClass} min-h-24 ${props.className ?? ""}`} />;
}

export function Select(props: InputHTMLAttributes<HTMLSelectElement> & { children: ReactNode }) {
  return (
    <select {...props} className={`${inputClass} ${props.className ?? ""}`}>
      {props.children}
    </select>
  );
}

export function Banner({ kind, children }: { kind: "error" | "ok" | "info"; children: ReactNode }) {
  const color =
    kind === "error" ? "border-red-500/30 bg-red-500/10 text-red-200" : kind === "ok" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200" : "border-white/10 bg-white/5 text-slate-300";
  return <div className={`rounded-lg border px-3 py-2 text-sm ${color}`}>{children}</div>;
}

export function Loading() {
  return <p className="text-sm text-slate-400">Loading…</p>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="px-4 py-8 text-center text-sm text-slate-500">{children}</p>;
}

export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl border border-white/10 bg-ink-900 p-5 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button className="text-slate-400 hover:text-white" onClick={onClose} type="button">
            Close
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function DataTable({
  columns,
  rows,
  empty,
}: {
  columns: Array<{ key: string; label: string; render?: (row: Record<string, unknown>) => ReactNode }>;
  rows: Array<Record<string, unknown>>;
  empty: ReactNode;
}) {
  if (!rows.length) return <Card><Empty>{empty}</Empty></Card>;
  return (
    <Card className="overflow-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead className="bg-ink-800 text-slate-400">
          <tr>
            {columns.map((column) => (
              <th key={column.key} className="p-3 text-left font-medium">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={String(row.id ?? index)} className="border-t border-white/10">
              {columns.map((column) => (
                <td key={column.key} className="p-3 align-top">
                  {column.render ? column.render(row) : String(row[column.key] ?? "—")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

export function formValues(event: FormEvent<HTMLFormElement>) {
  const data = new FormData(event.currentTarget);
  const output: Record<string, unknown> = {};
  for (const [key, value] of data.entries()) {
    if (typeof value !== "string") continue;
    if (value === "") continue;
    output[key] = value;
  }
  const form = event.currentTarget;
  for (const input of Array.from(form.querySelectorAll("input[type=checkbox]")) as HTMLInputElement[]) {
    output[input.name] = input.checked;
  }
  return output;
}
