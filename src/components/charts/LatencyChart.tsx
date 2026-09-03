import React from "react";
import { TradingWaveChart, type TradingDataPoint } from "./TradingWaveChart";

interface LatencyChartProps {
  pingData: number[];
  jitterData?: number[];
  title?: string;
  className?: string;
}

export const LatencyChart: React.FC<LatencyChartProps> = ({
  pingData,
  jitterData,
  title = "Real-Time Ping & Latency Stream",
  className = "",
}) => {
  const points: TradingDataPoint[] = pingData.map((val, idx) => ({
    label: `${idx + 1}s`,
    value: val,
    volume: Math.round(val * 4 + (jitterData?.[idx] ? jitterData[idx] * 8 : 10)),
  }));

  return (
    <div className={className}>
      <TradingWaveChart
        data={points}
        title={title}
        subtitle="Continuous round-trip TCP/ICMP probe samples to selected host"
        unit="ms"
        height={220}
        colorScheme="cyan"
        showVolume={true}
        showDeltaBadge={true}
      />
    </div>
  );
};
