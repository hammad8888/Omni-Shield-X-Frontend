import React from "react";
import { TradingWaveChart, type TradingDataPoint } from "./TradingWaveChart";
import { convertFromMbps, resolveSpeedUnit, usePrefs } from "../../prefs";

interface SpeedChartProps {
  downloadData: number[];
  uploadData: number[];
  className?: string;
}

export const SpeedChart: React.FC<SpeedChartProps> = ({
  downloadData,
  uploadData,
  className = "",
}) => {
  const { speedUnit } = usePrefs();
  const peak = Math.max(1, ...downloadData, ...uploadData);
  const unit = resolveSpeedUnit(peak, speedUnit);

  const maxLen = Math.max(downloadData.length, uploadData.length);
  if (!maxLen) return null;

  const points: TradingDataPoint[] = Array.from({ length: maxLen }).map((_, idx) => {
    const dl = downloadData[idx] ?? downloadData[downloadData.length - 1] ?? 0;
    const ul = uploadData[idx] ?? 0;
    const convertedDl = convertFromMbps(dl, unit);
    const convertedUl = convertFromMbps(ul, unit);
    return {
      label: `${idx + 1}`,
      value: convertedDl > 0 ? convertedDl : convertedUl,
      volume: Math.max(5, Math.round(convertedDl * 10 + convertedUl * 5)),
    };
  });

  return (
    <div className={className}>
      <TradingWaveChart
        data={points}
        title="Throughput Telemetry Vector"
        subtitle="Continuous multi-stream throughput progression curve"
        unit={unit}
        height={220}
        colorScheme="cyan"
        showVolume={true}
        showDeltaBadge={true}
      />
    </div>
  );
};
