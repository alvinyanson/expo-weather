import { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Path, Rect, Circle, Text as SvgText } from 'react-native-svg';
import { WeatherResponse } from '@/interfaces';
import { theme } from '@/theme';
import { t } from '@/services/i18n';
import { buildChartGeometry, selectNext24Hours } from '@/utils/hourlyChart';

interface HourlyTemperatureChartProps {
  weather: WeatherResponse;
  tempUnit: string;
}

const CHART_HEIGHT = 160;

export const HourlyTemperatureChart = ({ weather, tempUnit }: HourlyTemperatureChartProps) => {
  const { width: windowWidth } = useWindowDimensions();
  const defaultChartWidth = Math.max(100, windowWidth - 80);
  const [containerWidth, setContainerWidth] = useState<number>(defaultChartWidth);

  const points = selectNext24Hours(weather.hourly);

  if (!weather.hourly || points.length < 2) {
    return null;
  }

  const handleLayout = (event: LayoutChangeEvent) => {
    const w = event.nativeEvent.layout.width;
    const contentWidth = Math.max(100, w - 40);
    if (w > 0 && Math.abs(contentWidth - containerWidth) > 2) {
      setContainerWidth(contentWidth);
    }
  };

  const geo = buildChartGeometry(points, {
    width: containerWidth,
    height: CHART_HEIGHT,
    tempUnit,
  });

  const a11yLabel = geo
    ? t('hourlyChartA11yLabel', { min: geo.minTemp, max: geo.maxTemp, unit: tempUnit })
    : undefined;

  return (
    <View
      testID="hourly-temperature-chart"
      style={styles.card}
      onLayout={handleLayout}
      accessibilityLabel={a11yLabel}
      accessible={true}
    >
      <View style={styles.headerRow}>
        <Text style={styles.title}>{t('hourlyChartTitle')}</Text>
        <View style={styles.legendRow}>
          <View style={[styles.legendDot, { backgroundColor: theme.colors.accent }]} />
          <Text style={styles.legendText}>{tempUnit}</Text>
          <View style={[styles.legendBar, { backgroundColor: theme.colors.secondary }]} />
          <Text style={styles.legendText}>{t('hourlyChartPrecipLabel')}</Text>
        </View>
      </View>

      {geo ? (
        <Svg
          width={geo.width}
          height={geo.height}
          accessible={false}
          importantForAccessibility="no"
        >
          {/* Temperature Area Fill */}
          <Path d={geo.areaPath} fill={theme.colors.accent} opacity={0.15} />

          {/* Temperature Line */}
          <Path
            d={geo.linePath}
            fill="none"
            stroke={theme.colors.accent}
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Precipitation Bars */}
          {geo.precipBars.map((bar, i) =>
            bar.height > 0 ? (
              <Rect
                key={`precip-bar-${i}`}
                x={bar.x}
                y={bar.y}
                width={bar.width}
                height={bar.height}
                fill={theme.colors.secondary}
                opacity={0.8}
                rx={1}
              />
            ) : null,
          )}

          {/* "Now" Marker Circle */}
          <Circle
            cx={geo.firstPoint.x}
            cy={geo.firstPoint.y}
            r={4}
            fill={theme.colors.accent}
            stroke="white"
            strokeWidth={1.5}
          />

          {/* Min/Max Temperature Labels */}
          {geo.tempLabels.map((lbl, i) => (
            <SvgText
              key={`temp-label-${i}`}
              x={4}
              y={lbl.y + 4}
              fill={theme.colors.textHint}
              fontSize={10}
              fontWeight="600"
            >
              {lbl.label}
            </SvgText>
          ))}

          {/* Sparse Hour Labels */}
          {geo.hourLabels.map((lbl, i) => (
            <SvgText
              key={`hour-label-${i}`}
              x={lbl.x}
              y={geo.height - 4}
              fill={theme.colors.textHint}
              fontSize={10}
              textAnchor="middle"
            >
              {lbl.label}
            </SvgText>
          ))}
        </Svg>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 20,
    backgroundColor: theme.colors.surfaceSubtle,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendBar: {
    width: 6,
    height: 10,
    borderRadius: 2,
    marginLeft: 6,
  },
  legendText: {
    fontSize: 11,
    color: theme.colors.textHint,
  },
});
