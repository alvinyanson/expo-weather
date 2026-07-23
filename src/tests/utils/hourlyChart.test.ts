import { selectNext24Hours, buildChartGeometry, HourlyPoint } from '@/utils/hourlyChart';
import { WeatherResponse } from '@/interfaces';

describe('hourlyChart utils', () => {
  describe('selectNext24Hours', () => {
    const fixedNow = new Date('2026-07-23T10:00:00Z').getTime();

    it('returns empty array when hourly is undefined or missing time', () => {
      expect(selectNext24Hours(undefined, fixedNow)).toEqual([]);
      expect(selectNext24Hours({} as unknown as WeatherResponse['hourly'], fixedNow)).toEqual([]);
    });

    it('filters past hours and caps at 24 items', () => {
      const times: string[] = [];
      const temps: number[] = [];
      const precips: number[] = [];

      // 30 hours from 2 hours before fixedNow
      const start = fixedNow - 2 * 3600000;
      for (let i = 0; i < 30; i++) {
        times.push(new Date(start + i * 3600000).toISOString());
        temps.push(20 + i);
        precips.push(i * 3);
      }

      const hourly = {
        time: times,
        temperature_2m: temps,
        precipitation_probability: precips,
        weather_code: [],
      } as unknown as WeatherResponse['hourly'];

      const result = selectNext24Hours(hourly, fixedNow);

      // Past hour 2 hours ago (start) is excluded (fixedNow - 2h < fixedNow - 1h)
      // Hour 1 hour ago (start + 1h) is included (fixedNow - 1h >= fixedNow - 1h)
      expect(result.length).toEqual(24);
      expect(result[0]!.temperature).toBe(21);
      expect(result[0]!.precipitation).toBe(3);
    });

    it('applies 0 fallbacks for missing temperature or precipitation values', () => {
      const hourly = {
        time: [new Date(fixedNow).toISOString()],
        temperature_2m: [],
        precipitation_probability: [],
        weather_code: [],
      } as unknown as WeatherResponse['hourly'];

      const result = selectNext24Hours(hourly, fixedNow);
      expect(result.length).toBe(1);
      expect(result[0]!.temperature).toBe(0);
      expect(result[0]!.precipitation).toBe(0);
    });
  });

  describe('buildChartGeometry', () => {
    const mockPoints: HourlyPoint[] = [
      { time: '2026-07-23T10:00:00Z', temperature: 20, precipitation: 0 },
      { time: '2026-07-23T11:00:00Z', temperature: 25, precipitation: 50 },
      { time: '2026-07-23T12:00:00Z', temperature: 18, precipitation: 100 },
      { time: '2026-07-23T13:00:00Z', temperature: 22, precipitation: 10 },
      { time: '2026-07-23T14:00:00Z', temperature: 24, precipitation: 0 },
      { time: '2026-07-23T15:00:00Z', temperature: 21, precipitation: 30 },
      { time: '2026-07-23T16:00:00Z', temperature: 19, precipitation: 0 },
    ];

    it('returns null when points length < 2 or invalid plot dimensions', () => {
      expect(buildChartGeometry([], { width: 300, height: 200, tempUnit: '°C' })).toBeNull();
      expect(
        buildChartGeometry([mockPoints[0]!], { width: 300, height: 200, tempUnit: '°C' }),
      ).toBeNull();
      expect(buildChartGeometry(mockPoints, { width: 40, height: 200, tempUnit: '°C' })).toBeNull(); // plot width <= 0
    });

    it('calculates valid geometry, paths, and labels for valid points', () => {
      const geo = buildChartGeometry(mockPoints, {
        width: 350,
        height: 200,
        tempUnit: '°C',
        hourLabelEvery: 3,
      });

      expect(geo).not.toBeNull();
      if (!geo) return;

      expect(geo.minTemp).toBe(18);
      expect(geo.maxTemp).toBe(25);
      expect(geo.linePath).toContain('M ');
      expect(geo.linePath).toContain('C ');
      expect(geo.areaPath).toContain('Z');

      // Precip bars
      expect(geo.precipBars.length).toBe(7);
      expect(geo.precipBars[0]!.height).toBe(0); // 0%
      expect(geo.precipBars[2]!.height).toBeGreaterThan(0); // 100%

      // Hour labels cadence (0, 3, 6 -> 3 labels)
      expect(geo.hourLabels.length).toBe(3);

      // Temp labels
      expect(geo.tempLabels.length).toBe(2);
      expect(geo.tempLabels[0]!.label).toBe('25°C');
      expect(geo.tempLabels[1]!.label).toBe('18°C');
    });

    it('handles flat temperature series without error', () => {
      const flatPoints: HourlyPoint[] = [
        { time: '2026-07-23T10:00:00Z', temperature: 20, precipitation: 0 },
        { time: '2026-07-23T11:00:00Z', temperature: 20, precipitation: 0 },
      ];

      const geo = buildChartGeometry(flatPoints, { width: 300, height: 200, tempUnit: '°F' });
      expect(geo).not.toBeNull();
      if (!geo) return;

      expect(geo.minTemp).toBe(20);
      expect(geo.maxTemp).toBe(20);
      expect(geo.tempLabels[0]!.label).toBe('20°F');
    });
  });
});
