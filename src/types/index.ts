export type ConnectionState = "Connected" | "Limited" | "Offline" | "Testing";
export type NetworkMediaType = "Wi-Fi" | "Ethernet" | "Cellular" | "Fiber" | "Unknown";

export interface NetworkStatus {
  state: ConnectionState;
  mediaType: NetworkMediaType;
  ssid?: string | null;
  interfaceName: string | null;
  ipAddress: string | null;
  gateway: string | null;
  macAddress: string | null;
  dnsServers: string[];
  isp: string | null;
  publicIp: string | null;
  signalDbm: number | null;
  signalPercent?: number | null;
  linkSpeedMbps: number | null;
  healthScore: number | null;
  healthLabel: "Excellent" | "Good" | "Fair" | "Poor" | "Critical" | string | null;
  freshness?: string;
  source?: string | null;
  reason?: string | null;
  locationHint?: string | null;
}

export interface MetricWithTrend {
  value: number | null;
  unit: string;
  previousValue?: number | null;
  trend: "up" | "down" | "neutral";
  trendPercentage: number | null;
  status: "excellent" | "good" | "fair" | "poor" | "critical" | "neutral";
  sparkline: number[];
}

export interface DashboardMetrics {
  download: MetricWithTrend;
  upload: MetricWithTrend;
  ping: MetricWithTrend;
  jitter: MetricWithTrend;
  packetLoss: MetricWithTrend;
  dnsLatency: MetricWithTrend;
}

export interface HealthBreakdown {
  category: string;
  score: number;
  weight: number;
  status: "excellent" | "good" | "fair" | "poor";
}

export interface ConnectionQualityRating {
  service: string;
  rating: "Excellent" | "Good" | "Fair" | "Poor";
  score: number;
  description: string;
}

export type SpeedTestPhase =
  | "idle"
  | "connecting"
  | "selecting_server"
  | "testing_latency"
  | "testing_download"
  | "testing_upload"
  | "finalizing"
  | "completed"
  | "error";

export interface SpeedTestServer {
  id: string;
  name: string;
  sponsor: string;
  location: string;
  country: string;
  distanceKm: number;
  pingMs: number;
}

export interface SpeedTestProgress {
  phase: SpeedTestPhase;
  progressPercent: number;
  currentSpeedMbps: number;
  pingMs: number;
  jitterMs: number;
  downloadMbps: number;
  uploadMbps: number;
  packetLossPercent: number;
  server?: SpeedTestServer;
  downloadDataPoints: number[];
  uploadDataPoints: number[];
}

export interface SpeedTestResult {
  id: string;
  timestamp: string;
  downloadMbps: number;
  uploadMbps: number;
  pingMs: number;
  jitterMs: number;
  packetLossPercent: number;
  server: SpeedTestServer;
  isp: string;
  networkName: string;
  connectionType: NetworkMediaType;
  healthScore: number;
  rating: string;
}

export interface WifiInfo {
  ssid: string | null;
  bssid: string | null;
  signalDbm: number | null;
  signalPercent: number | null;
  frequencyGhz: number | null;
  band: "2.4 GHz" | "5 GHz" | "6 GHz" | string | null;
  channel: number | null;
  channelWidthMhz: number | null;
  linkSpeedMbps: number | null;
  security: string | null;
  phyType: string | null;
  noiseDbm: number | null;
  snrDb: number | null;
  channelUtilizationPercent: number | null;
  beaconIntervalMs: number | null;
  txPowerDbm: number | null;
  gateway?: string | null;
  localIp?: string | null;
  freshness?: string;
  reason?: string | null;
}

export interface NearbyWifiNetwork {
  bssid: string | null;
  ssid: string | null;
  signalDbm: number | null;
  signalPercent: number | null;
  band: "2.4 GHz" | "5 GHz" | "6 GHz" | string | null;
  channel: number | null;
  channelWidthMhz: number | null;
  security: string | null;
  vendor: string | null;
  isCurrentNetwork: boolean;
  snr: number | null;
}

export interface ChannelAnalysis {
  channel: number;
  band: "2.4 GHz" | "5 GHz" | "6 GHz";
  centerFreqMhz: number;
  networkCount: number;
  overlapRating: "Clear" | "Low Interference" | "Moderate Congestion" | "High Congestion";
  recommended: boolean;
  networks: string[];
}

export type DeviceType = "Router" | "Computer" | "Phone" | "TV" | "IoT" | "Printer" | "Tablet" | "Unknown";
export type DeviceStatus = "Online" | "Offline" | "Idle";

export interface ConnectedDevice {
  id: string;
  name: string;
  ipAddress: string | null;
  macAddress: string | null;
  vendor: string | null;
  type: DeviceType;
  connectionType: "Wired" | "Wi-Fi 2.4G" | "Wi-Fi 5G" | "Wi-Fi 6G" | string | null;
  signalDbm?: number | null;
  status: DeviceStatus;
  firstSeen: string | null;
  lastSeen: string | null;
  rxBytes: number | null;
  txBytes: number | null;
  isCurrentDevice?: boolean;
  source?: string | null;
}

export interface DnsBenchmarkResult {
  serverName: string;
  primaryIp: string;
  secondaryIp: string | null;
  responseTimeMs: number | null;
  status: "Excellent" | "Good" | "Fair" | "Slow" | "Unreachable" | string;
  reliabilityPercent: number | null;
  isCurrent: boolean;
  features: {
    dnsSec: boolean;
    doh: boolean;
    dot: boolean;
    malwareBlocking: boolean;
  };
}

export interface StreamingReadiness {
  resolution: "SD (480p)" | "HD (720p)" | "Full HD (1080p)" | "2K (1440p)" | "4K (2160p)" | "8K (4320p)" | "360° VR";
  bitrateRequiredMbps: number;
  status: "Excellent" | "Good" | "Limited" | "Unstable";
  bufferingRiskPercent: number;
  recommended: boolean;
}

export type RouterManufacturer =
  | "TP-Link"
  | "Huawei"
  | "Tenda"
  | "ZTE"
  | "Nokia"
  | "Fiber ONT"
  | "Netgear"
  | "Generic ISP";

export interface RouterInfo {
  manufacturer: string | null;
  model: string | null;
  serialNumber: string | null;
  hardwareVersion: string | null;
  firmwareVersion: string | null;
  uptimeSeconds: number | null;
  cpuUsagePercent: number | null;
  memoryUsagePercent: number | null;
  temperatureC: number | null;
  wanStatus: "Connected" | "Disconnected" | "Connecting" | string | null;
  lanStatus: string | null;
  wifiStatus: string | null;
  connectedClientsCount: number | null;
  gateway?: string | null;
  publicIp?: string | null;
}

export interface RouterWANConfig {
  connectionType: string | null;
  status: string | null;
  publicIp: string | null;
  subnetMask: string | null;
  gateway: string | null;
  dnsPrimary: string | null;
  dnsSecondary: string | null;
  ipv6Address: string | null;
  ipv6Prefix: string | null;
  macAddress: string | null;
  mtu: number | null;
  uptime: string | null;
  isp?: string | null;
  locationHint?: string | null;
}

export interface RouterLANConfig {
  routerIp: string | null;
  subnetMask: string | null;
  dhcpEnabled: boolean | null;
  dhcpStartIp: string | null;
  dhcpEndIp: string | null;
  leaseTimeHours: number | null;
  domainName: string | null;
  connectedCount: number | null;
  localIp?: string | null;
}

export interface SecurityCheckItem {
  id: string;
  title: string;
  category: "Encryption" | "Credentials" | "Configuration" | "Firewall" | "Services";
  status: "passed" | "warning" | "failed";
  severity: "critical" | "high" | "medium" | "low" | "info";
  description: string;
  remediation: string;
}

export interface SecurityAuditReport {
  score: number | null;
  grade: "A+" | "A" | "B" | "C" | "D" | "F" | string | null;
  timestamp: string;
  networkAudited: string | null;
  checksTotal: number;
  checksPassed: number;
  checksWarning: number;
  checksFailed: number;
  items: SecurityCheckItem[];
  note?: string;
  freshness?: string;
}

export interface PasswordAssessmentConfig {
  networkSsid: string;
  method: "Dictionary Attack" | "Brute Force" | "Hybrid Rules" | "WPA3-SAE Resilience";
  wordlistSize?: number;
  characterSet?: string;
  isAuthorized: boolean;
}

export interface PasswordAssessmentResult {
  strengthRating: "Very Weak" | "Weak" | "Moderate" | "Strong" | "Very Strong" | string | null;
  entropyBits: number | null;
  estimatedTimeToCrack: string | null;
  simulatedKeysPerSec: number | null;
  testedCombinations: number | null;
  vulnerabilityStatus: string | null;
  recommendations: string[];
  freshness?: string;
  error?: { message?: string };
}

export interface HistoryEntry {
  id: string;
  timestamp: string;
  networkName: string;
  connectionType: NetworkMediaType;
  downloadMbps: number;
  uploadMbps: number;
  pingMs: number;
  jitterMs: number;
  packetLossPercent: number;
  score: number;
  serverLocation: string;
}

export interface NetworkEventItem {
  id: string;
  timestamp: string;
  type: "info" | "warning" | "critical" | "success";
  category: "Wi-Fi" | "Speed" | "DNS" | "Security" | "Router" | "Device";
  message: string;
  details?: string;
}

export interface DiagnosticStage {
  id: string;
  name: string;
  category: string;
  status: "pending" | "running" | "passed" | "warning" | "failed";
  latencyMs?: number;
  metric?: string;
  detail?: string;
}
