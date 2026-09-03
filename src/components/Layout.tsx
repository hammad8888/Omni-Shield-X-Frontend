import { useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth";
import { useRealtime, type SidebarMetric } from "../realtime";
import { Button, FreshnessBadge } from "./ui";

type NavItem = { to: string; label: string; permission?: string };

const GROUPS: Array<{ title: string; items: NavItem[] }> = [
  {
    title: "Overview",
    items: [
      { to: "/", label: "Dashboard" },
      { to: "/system", label: "System health" },
      { to: "/agents", label: "Agents", permission: "agents.view" },
    ],
  },
  {
    title: "Network",
    items: [
      { to: "/speedtest", label: "Speed test", permission: "network.view" },
      { to: "/wifi", label: "Wi-Fi analyzer", permission: "wifi.view" },
      { to: "/ethernet", label: "Ethernet", permission: "ethernet.view" },
      { to: "/devices", label: "Devices", permission: "devices.view" },
      { to: "/network", label: "Interfaces", permission: "ethernet.view" },
      { to: "/traffic", label: "Traffic", permission: "traffic.view" },
      { to: "/topology", label: "Topology", permission: "topology.view" },
      { to: "/gaming", label: "Gaming", permission: "network.view" },
    ],
  },
  {
    title: "Router / modem",
    items: [
      { to: "/routers", label: "Routers", permission: "router.view" },
      { to: "/wifi/settings", label: "Wi-Fi settings", permission: "wifi.view" },
      { to: "/ip-management", label: "IPAM", permission: "ipam.view" },
      { to: "/dhcp", label: "DHCP", permission: "dhcp.view" },
      { to: "/dns", label: "DNS", permission: "dns.view" },
      { to: "/packages", label: "Packages", permission: "packages.view" },
    ],
  },
  {
    title: "Security",
    items: [
      { to: "/security", label: "Security Center", permission: "security.audit" },
      { to: "/scanner", label: "Scanner", permission: "scanner.manage" },
      { to: "/security-lab", label: "Security Lab", permission: "lab.manage" },
    ],
  },
  {
    title: "Admin",
    items: [
      { to: "/users", label: "Users", permission: "users.view" },
      { to: "/roles", label: "Roles", permission: "roles.view" },
      { to: "/alerts", label: "Alerts", permission: "alerts.view" },
      { to: "/reports", label: "Reports", permission: "reports.view" },
      { to: "/audit-logs", label: "Audit logs", permission: "audit.view" },
      { to: "/database", label: "Database", permission: "database.view" },
      { to: "/backups", label: "Backups", permission: "backups.manage" },
      { to: "/integrations", label: "Integrations", permission: "integrations.manage" },
      { to: "/settings", label: "Settings", permission: "settings.manage" },
      { to: "/account", label: "Account" },
    ],
  },
];

const LABELS: Record<string, string> = {
  "": "Dashboard",
  system: "System health",
  agents: "Agents",
  speedtest: "Speed test",
  wifi: "Wi-Fi",
  settings: "Settings",
  ethernet: "Ethernet",
  devices: "Devices",
  network: "Interfaces",
  traffic: "Traffic",
  topology: "Topology",
  gaming: "Gaming",
  routers: "Routers",
  "ip-management": "IPAM",
  dhcp: "DHCP",
  dns: "DNS",
  packages: "Packages",
  security: "Security",
  scanner: "Scanner",
  "security-lab": "Security lab",
  users: "Users",
  roles: "Roles",
  alerts: "Alerts",
  reports: "Reports",
  "audit-logs": "Audit logs",
  database: "Database",
  backups: "Backups",
  integrations: "Integrations",
  account: "Account",
};

function crumbLabel(segment: string) {
  return LABELS[segment] ?? segment.replace(/-/g, " ");
}

function LiveRow({ label, metric, onClick }: { label: string; metric?: SidebarMetric; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left hover:bg-white/5">
      <span className="truncate text-slate-400">{label}</span>
      <span className="flex min-w-0 items-center gap-2">
        <span className="truncate text-slate-200">{metric?.value == null || metric.value === "" ? "—" : String(metric.value)}</span>
        <FreshnessBadge freshness={metric?.freshness ?? "UNAVAILABLE"} />
      </span>
    </button>
  );
}

export function Layout() {
  const { user, logout, can } = useAuth();
  const { snapshot, transport, reason } = useRealtime();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const groups = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return GROUPS.map((group) => ({
      ...group,
      items: group.items.filter((item) => can(item.permission) && (!needle || item.label.toLowerCase().includes(needle))),
    })).filter((group) => group.items.length);
  }, [can, query]);

  const crumbs = location.pathname.split("/").filter(Boolean);

  const nav = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="mb-4 shrink-0">
        <p className="text-xs uppercase tracking-[0.2em] text-accent-400">OmniShield X</p>
        <h1 className="text-lg font-semibold">Network console</h1>
        <p className="mt-1 truncate text-xs text-slate-500">{user?.name}</p>
      </div>
      <div className="mb-3 shrink-0 rounded-lg border border-white/10 bg-white/5 p-2">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-[11px] uppercase tracking-wider text-slate-500">Live status</p>
          <FreshnessBadge freshness={transport} />
        </div>
        {reason ? <p className="mb-2 text-[11px] text-slate-500">{reason}</p> : null}
        <LiveRow label="Alerts" metric={snapshot?.alerts} onClick={() => { setOpen(false); navigate("/alerts"); }} />
        <LiveRow label="Findings" metric={snapshot?.findings} onClick={() => { setOpen(false); navigate("/security"); }} />
        <LiveRow
          label="Wi-Fi"
          metric={{ ...snapshot?.wifi, value: snapshot?.wifi?.ssid ?? (snapshot?.wifi?.networks ? `${snapshot.wifi.networks} BSS` : snapshot?.wifi?.value) }}
          onClick={() => { setOpen(false); navigate("/wifi"); }}
        />
        <LiveRow label="Agent" metric={snapshot?.agent} onClick={() => { setOpen(false); navigate("/agents"); }} />
      </div>
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Find a page"
        className="mb-3 w-full shrink-0 rounded-md border border-white/10 bg-ink-800 px-3 py-2 text-sm text-white placeholder:text-slate-500"
        aria-label="Filter sidebar"
      />
      <nav className="min-h-0 flex-1 space-y-5 overflow-y-auto text-sm">
        {groups.map((group) => (
          <div key={group.title}>
            <p className="mb-1 px-3 text-[11px] uppercase tracking-wider text-slate-500">{group.title}</p>
            <div className="space-y-1">
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end
                  onClick={() => setOpen(false)}
                  className={({ isActive }) =>
                    `block rounded-md px-3 py-2 ${isActive ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"}`
                  }
                >
                  {item.label}
                  {item.to === "/alerts" && Number(snapshot?.alerts?.value) > 0 ? (
                    <span className="ml-2 rounded-full bg-accent-500/20 px-1.5 text-[11px] text-accent-300">{String(snapshot?.alerts?.value)}</span>
                  ) : null}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
      <button
        className="mt-3 shrink-0 text-left text-sm text-slate-400 hover:text-white"
        onClick={async () => {
          await logout();
          navigate("/login");
        }}
      >
        Sign out {user?.username}
      </button>
    </div>
  );

  return (
    <div className="flex h-full min-h-0 overflow-hidden lg:grid lg:grid-cols-[272px_1fr]">
      <aside className="hidden h-full min-h-0 flex-col overflow-hidden border-r border-white/10 bg-ink-900 px-4 py-5 lg:flex">{nav}</aside>
      {open ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex h-full w-80 flex-col overflow-hidden border-r border-white/10 bg-ink-900 px-4 py-5">{nav}</aside>
        </div>
      ) : null}
      <div className="flex min-h-0 min-w-0 flex-col overflow-hidden">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm text-slate-400">
              <NavLink to="/" className="hover:text-white">Dashboard</NavLink>
              {crumbs.map((segment, index) => (
                <span key={`${segment}-${index}`}>
                  <span className="px-1 text-slate-600">/</span>
                  <span className={index === crumbs.length - 1 ? "text-white" : ""}>{crumbLabel(segment)}</span>
                </span>
              ))}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <FreshnessBadge freshness={transport} />
            <Button variant="ghost" className="lg:hidden" onClick={() => setOpen(true)}>
              Menu
            </Button>
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-8 sm:py-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
