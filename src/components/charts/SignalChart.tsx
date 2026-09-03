import React from "react";
import { TradingWaveChart, type TradingDataPoint } from "./TradingWaveChart";

interface SignalChartProps {
  historyDbm: number[];
  className?: string;
}

export const SignalChart: React.FC<SignalChartProps> = ({ historyDbm, className = "" }) => {
  // Convert -dBm to a positive signal index (0-100%) for intuitive charting
  const points: TradingDataPoint[] = historyDbm.map((val, idx) => {
    const quality = Math.min(100, Math.max(0, Math.round(2 * (val + 100))));
    return {
      label: `${idx * 2}s`,
      value: quality,
      volume: Math.round(quality * 1.5),
    };
  });

  return (
    <div className={className}>
      <TradingWaveChart
        data={points}
        title="Wi-Fi Signal Quality & RSSI Stability"
        subtitle="Live radio signal quality index (0-100%) and RF floor stability"
        unit="%"
        height={220}
        colorScheme="emerald"
        showVolume={true}
        showDeltaBadge={true}
      />
    </div>
  );
};
