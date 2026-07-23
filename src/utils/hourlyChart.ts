import { WeatherResponse } from '@/interfaces';
import { formatHourlyTime, formatRound } from './formatters';

export interface HourlyPoint {
  time: string; // ISO string from weather.hourly.time
  temperature: number; // in the user's unit
  precipitation: number; // probability 0..100
}

export interface ChartGeometry {
  width: number;
  height: number;
  linePath: string; // SVG path "d" for the smooth temperature line
  areaPath: string; // SVG path "d" for the filled area under the line
  precipBars: { x: number; y: number; width: number; height: number; value: number }[];
  hourLabels: { x: number; label: string }[]; // sparse x-axis labels
  tempLabels: { y: number; label: string }[]; // min/max y-axis labels
  minTemp: number;
  maxTemp: number;
  firstPoint: { x: number; y: number };
}

export const parseIsoTime = (timeStr: string): number => {
  if (!timeStr) return NaN;
  const ts = Date.parse(timeStr);
  if (!isNaN(ts)) return ts;

  const formatted =
    timeStr.includes('T') && timeStr.split('T')[1]?.length === 5 ? `${timeStr}:00` : timeStr;
  const ts2 = Date.parse(formatted);
  if (!isNaN(ts2)) return ts2;

  const match = timeStr.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (match) {
    const [, y, m, d, h, min] = match;
    return new Date(Number(y), Number(m) - 1, Number(d), Number(h), Number(min)).getTime();
  }

  return NaN;
};

export const selectNext24Hours = (
  hourly: WeatherResponse['hourly'] | undefined,
  now: number = Date.now(),
): HourlyPoint[] => {
  if (!hourly || !hourly.time || hourly.time.length === 0) return [];

  const points: HourlyPoint[] = [];
  const cutoff = now - 3600000;

  for (let i = 0; i < hourly.time.length; i++) {
    const tStr = hourly.time[i];
    if (!tStr) continue;
    const tMs = parseIsoTime(tStr);

    if (!isNaN(tMs) && tMs < cutoff) {
      continue;
    }

    points.push({
      time: tStr,
      temperature: hourly.temperature_2m[i] ?? 0,
      precipitation: hourly.precipitation_probability[i] ?? 0,
    });

    if (points.length >= 24) break;
  }

  if (points.length < 2) {
    points.length = 0;
    const fallbackCount = Math.min(24, hourly.time.length);
    for (let i = 0; i < fallbackCount; i++) {
      const tStr = hourly.time[i];
      if (!tStr) continue;
      points.push({
        time: tStr,
        temperature: hourly.temperature_2m[i] ?? 0,
        precipitation: hourly.precipitation_probability[i] ?? 0,
      });
    }
  }

  return points;
};

export const buildChartGeometry = (
  points: HourlyPoint[],
  opts: {
    width: number;
    height: number;
    tempUnit: string;
    padding?: { top: number; right: number; bottom: number; left: number };
    hourLabelEvery?: number;
    formatHour?: (iso: string) => string;
  },
): ChartGeometry | null => {
  if (!points || points.length < 2) {
    return null;
  }

  const { width, height, tempUnit } = opts;
  const padding = {
    top: 24,
    right: 16,
    bottom: 28,
    left: 40,
    ...opts.padding,
  };

  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  if (plotWidth <= 0 || plotHeight <= 0) {
    return null;
  }

  const hourLabelEvery = opts.hourLabelEvery ?? 6;
  const formatHour = opts.formatHour ?? formatHourlyTime;

  // Split vertical height: top 70% for temp, bottom 30% for precip bars
  const tempBandHeight = plotHeight * 0.7;
  const precipBandHeight = plotHeight * 0.3;

  const tempBandBottom = padding.top + tempBandHeight;
  const precipBandBottom = height - padding.bottom;

  const rawTemps = points.map((p) => p.temperature);
  const rawMin = Math.min(...rawTemps);
  const rawMax = Math.max(...rawTemps);

  const minTemp = Math.round(rawMin);
  const maxTemp = Math.round(rawMax);

  let tempMinScale = rawMin;
  let tempMaxScale = rawMax;
  if (tempMaxScale === tempMinScale) {
    tempMinScale -= 1;
    tempMaxScale += 1;
  } else {
    // Add 10% padding to avoid line clipping on edges
    const range = tempMaxScale - tempMinScale;
    tempMinScale -= range * 0.1;
    tempMaxScale += range * 0.1;
  }

  const getTempY = (temp: number) => {
    const ratio = (temp - tempMinScale) / (tempMaxScale - tempMinScale);
    return tempBandBottom - ratio * tempBandHeight;
  };

  const getX = (index: number) => {
    return padding.left + (index / (points.length - 1)) * plotWidth;
  };

  // Build point coordinates for line drawing
  const coords = points.map((p, i) => ({
    x: getX(i),
    y: getTempY(p.temperature),
  }));

  const firstCoord = coords[0];
  const lastCoord = coords[coords.length - 1];
  if (!firstCoord || !lastCoord) {
    return null;
  }

  // Smooth Catmull-Rom to Cubic Bezier conversion
  const tension = 0.15;
  let linePath = `M ${firstCoord.x.toFixed(1)},${firstCoord.y.toFixed(1)}`;

  for (let i = 0; i < coords.length - 1; i++) {
    const p1 = coords[i]!;
    const p2 = coords[i + 1]!;
    const p0 = (i === 0 ? p1 : coords[i - 1])!;
    const p3 = (i + 2 >= coords.length ? p2 : coords[i + 2])!;

    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;

    linePath += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }

  const areaPath = `${linePath} L ${lastCoord.x.toFixed(1)},${tempBandBottom.toFixed(1)} L ${firstCoord.x.toFixed(1)},${tempBandBottom.toFixed(1)} Z`;

  // Precip bars
  const barWidth = Math.max(2, (plotWidth / points.length) * 0.5);
  const precipBars = points.map((p, i) => {
    const val = Math.min(100, Math.max(0, p.precipitation));
    const h = (val / 100) * precipBandHeight;
    const x = getX(i) - barWidth / 2;
    const y = precipBandBottom - h;
    return {
      x: Number(x.toFixed(1)),
      y: Number(y.toFixed(1)),
      width: Number(barWidth.toFixed(1)),
      height: Number(h.toFixed(1)),
      value: val,
    };
  });

  // Hour labels
  const hourLabels: { x: number; label: string }[] = [];
  points.forEach((p, i) => {
    if (i % hourLabelEvery === 0) {
      hourLabels.push({
        x: Number(getX(i).toFixed(1)),
        label: formatHour(p.time),
      });
    }
  });

  // Temperature min & max labels
  const tempLabels = [
    {
      y: Number(getTempY(rawMax).toFixed(1)),
      label: `${formatRound(rawMax)}${tempUnit}`,
    },
    {
      y: Number(getTempY(rawMin).toFixed(1)),
      label: `${formatRound(rawMin)}${tempUnit}`,
    },
  ];

  return {
    width,
    height,
    linePath,
    areaPath,
    precipBars,
    hourLabels,
    tempLabels,
    minTemp,
    maxTemp,
    firstPoint: {
      x: Number(firstCoord.x.toFixed(1)),
      y: Number(firstCoord.y.toFixed(1)),
    },
  };
};
