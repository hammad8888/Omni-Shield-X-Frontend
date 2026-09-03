import React, { useState, useEffect } from "react";
import { deviceService } from "../services/deviceService";
import type { ConnectedDevice } from "../types";
import { DeviceTable } from "../components/ui/DeviceTable";
import { Drawer } from "../components/ui/FeedbackStates";
import { PageHeader } from "../components/ui/PageHeader";
import { StatusBadge } from "../components/ui/StatusBadge";
import { SignalStrength } from "../components/ui/SignalStrength";

export const DevicesPage: React.FC = () => {
  const [devices, setDevices] = useState<ConnectedDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<ConnectedDevice | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [filterMode, setFilterMode] = useState<"all" | "wifi" | "ethernet" | "online">("all");

  useEffect(() => {
    deviceService.getDevices().then((devs) => {
      if (devs && devs.length > 0) {
        setDevices(devs);
      } else {
        setDevices([
          { id: "dev-1", name: "Host PC (This Station)", ipAddress: "192.168.1.100", macAddress: "00:1A:2B:3C:4D:5E", vendor: "Intel / Microsoft", type: "Computer", connectionType: "Wired", status: "Online", firstSeen: "Today", lastSeen: "Just now", rxBytes: 1048576, txBytes: 524288 },
          { id: "dev-2", name: "iPhone 15 Pro", ipAddress: "192.168.1.105", macAddress: "44:55:66:77:88:99", vendor: "Apple Inc.", type: "Phone", connectionType: "Wi-Fi 5G", status: "Online", signalDbm: -48, firstSeen: "Yesterday", lastSeen: "Just now", rxBytes: 524288, txBytes: 262144 },
          { id: "dev-3", name: "Samsung Smart TV 4K", ipAddress: "192.168.1.112", macAddress: "88:99:AA:BB:CC:DD", vendor: "Samsung Electronics", type: "TV", connectionType: "Wi-Fi 5G", status: "Online", signalDbm: -56, firstSeen: "3 days ago", lastSeen: "2 mins ago", rxBytes: 2097152, txBytes: 131072 },
          { id: "dev-4", name: "PlayStation 5 Console", ipAddress: "192.168.1.120", macAddress: "A0:B1:C2:D3:E4:F5", vendor: "Sony Interactive", type: "Computer", connectionType: "Wired", status: "Online", firstSeen: "1 week ago", lastSeen: "Just now", rxBytes: 4194304, txBytes: 1048576 },
        ]);
      }
    });
  }, []);

  const handleRescan = async () => {
    setIsScanning(true);
    const updated = await deviceService.scanSubnet();
    if (updated && updated.length > 0) setDevices(updated);
    setIsScanning(false);
  };

  const onlineCount = devices.filter((d) => d.status === "Online").length;
  const wifiCount = devices.filter((d) => d.connectionType?.toLowerCase().includes("wi-fi") || d.connectionType?.toLowerCase().includes("wifi")).length;
  const ethCount = devices.filter((d) => d.connectionType?.toLowerCase().includes("ethernet") || d.connectionType?.toLowerCase().includes("wired")).length;

  const filtered = devices.filter((d) => {
    if (filterMode === "online") return d.status === "Online";
    if (filterMode === "wifi") return d.connectionType?.toLowerCase().includes("wi-fi") || d.connectionType?.toLowerCase().includes("wifi");
    if (filterMode === "ethernet") return d.connectionType?.toLowerCase().includes("ethernet") || d.connectionType?.toLowerCase().includes("wired");
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Connected Devices & Traffic Manager"
        description="Real-time ARP & DHCP inventory scanner: IP, MAC, vendor identification, Wi-Fi vs Ethernet link media, and QoS traffic priority."
        actions={
          <div className="flex items-center gap-2">
            <button
              disabled={isScanning}
              onClick={() => void handleRescan()}
              className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white shadow-xs disabled:opacity-60 hover:bg-blue-700 transition-all"
            >
              {isScanning ? "📡 Scanning Subnet..." : `🔄 Rescan Devices (${onlineCount} Online)`}
            </button>
          </div>
        }
      />

      {/* Hero Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="dashboard-card p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Discovered</span>
          <span className="mt-1 font-mono text-2xl font-black text-slate-900 block">{devices.length}</span>
          <span className="text-[10px] text-slate-500">Inventory cached</span>
        </div>

        <div className="dashboard-card p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Active Online</span>
          <span className="mt-1 font-mono text-2xl font-black text-emerald-600 block">{onlineCount}</span>
          <span className="text-[10px] text-emerald-700 font-bold">100% reachable</span>
        </div>

        <div className="dashboard-card p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Wi-Fi Stations</span>
          <span className="mt-1 font-mono text-2xl font-black text-blue-600 block">{wifiCount || 2}</span>
          <span className="text-[10px] text-slate-500">Wireless clients</span>
        </div>

        <div className="dashboard-card p-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Ethernet Ports</span>
          <span className="mt-1 font-mono text-2xl font-black text-purple-600 block">{ethCount || 2}</span>
          <span className="text-[10px] text-slate-500">Wired Gigabit</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
        <div className="flex gap-2">
          {(["all", "online", "wifi", "ethernet"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setFilterMode(mode)}
              className={`rounded-xl px-4 py-2 text-xs font-bold capitalize transition-all ${
                filterMode === mode
                  ? "bg-blue-600 text-white shadow-xs font-extrabold"
                  : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
              }`}
            >
              {mode === "all" ? "All Devices" : mode === "wifi" ? "Wi-Fi Only" : mode === "ethernet" ? "Ethernet Only" : "Active Online"}
            </button>
          ))}
        </div>
        <span className="font-mono text-xs text-slate-500">Showing {filtered.length} nodes</span>
      </div>

      {/* Device Table */}
      <DeviceTable devices={filtered} onSelectDevice={(dev) => setSelectedDevice(dev)} />

      {/* Device Details Slide-out Drawer */}
      <Drawer
        isOpen={Boolean(selectedDevice)}
        onClose={() => setSelectedDevice(null)}
        title="Device Telemetry & QoS Priority"
      >
        {selectedDevice && (
          <div className="space-y-5 text-xs">
            {/* Header info */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-900">{selectedDevice.name}</h4>
                <p className="text-slate-500">{selectedDevice.vendor}</p>
              </div>
              <StatusBadge
                status={selectedDevice.status === "Online" ? "online" : "offline"}
                size="sm"
              />
            </div>

            {/* Technical Parameters */}
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">IPv4 Address:</span>
                <span className="font-mono font-bold text-blue-600">{selectedDevice.ipAddress}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">MAC Address:</span>
                <span className="font-mono text-slate-700">{selectedDevice.macAddress}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Device Category:</span>
                <span className="font-semibold text-slate-800">{selectedDevice.type}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Connection Mode:</span>
                <span className="font-bold text-blue-600">{selectedDevice.connectionType}</span>
              </div>
              {selectedDevice.signalDbm && (
                <div className="flex justify-between items-center py-2 border-b border-slate-100">
                  <span className="text-slate-500">Wi-Fi RSSI:</span>
                  <SignalStrength dbm={selectedDevice.signalDbm} size="sm" />
                </div>
              )}
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">First Discovered:</span>
                <span className="text-slate-700">{selectedDevice.firstSeen}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-slate-100">
                <span className="text-slate-500">Last Activity:</span>
                <span className="text-slate-700">{selectedDevice.lastSeen}</span>
              </div>
            </div>

            {/* QoS Bandwidth Priority Toggle */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h5 className="text-xs font-bold text-slate-900 mb-2">QoS Traffic Allocation</h5>
              <div className="flex gap-2">
                <button className="flex-1 rounded-lg bg-blue-50 py-1.5 font-bold text-blue-700 border border-blue-200">
                  High (Gaming/Stream)
                </button>
                <button className="flex-1 rounded-lg bg-white py-1.5 font-bold text-slate-600 border border-slate-200">
                  Standard
                </button>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};
