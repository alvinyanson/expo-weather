import { describe, it, expect } from 'vitest';
import { createCityDeepLink, parseCityDeepLink, validateDeepLinkParams } from '@/utils/deepLink';

describe('validateDeepLinkParams', () => {
  it('validates string and numeric parameters correctly', () => {
    const validString = validateDeepLinkParams({
      lat: '14.5995',
      lon: '120.9842',
      city: 'Manila',
    });
    expect(validString).toEqual({
      latitude: 14.5995,
      longitude: 120.9842,
      city: 'Manila',
    });

    const validNumber = validateDeepLinkParams({
      lat: 35.6762,
      lon: 139.6503,
      city: 'Tokyo',
    });
    expect(validNumber).toEqual({
      latitude: 35.6762,
      longitude: 139.6503,
      city: 'Tokyo',
    });
  });

  it('trims city name spaces', () => {
    const result = validateDeepLinkParams({
      lat: '14.5995',
      lon: '120.9842',
      city: '  Manila  ',
    });
    expect(result?.city).toBe('Manila');
  });

  it('rejects empty or whitespace-only city names', () => {
    expect(validateDeepLinkParams({ lat: '14.5995', lon: '120.9842', city: '' })).toBeNull();
    expect(validateDeepLinkParams({ lat: '14.5995', lon: '120.9842', city: '   ' })).toBeNull();
  });

  it('rejects latitude outside [-90, 90]', () => {
    expect(validateDeepLinkParams({ lat: '90.1', lon: '120.9842', city: 'Manila' })).toBeNull();
    expect(validateDeepLinkParams({ lat: '-90.1', lon: '120.9842', city: 'Manila' })).toBeNull();
  });

  it('accepts latitude at boundaries [-90, 90]', () => {
    expect(validateDeepLinkParams({ lat: '90', lon: '120.9842', city: 'North Pole' })).toEqual({
      latitude: 90,
      longitude: 120.9842,
      city: 'North Pole',
    });
    expect(validateDeepLinkParams({ lat: '-90', lon: '120.9842', city: 'South Pole' })).toEqual({
      latitude: -90,
      longitude: 120.9842,
      city: 'South Pole',
    });
  });

  it('rejects longitude outside [-180, 180]', () => {
    expect(validateDeepLinkParams({ lat: '14.5995', lon: '180.1', city: 'Manila' })).toBeNull();
    expect(validateDeepLinkParams({ lat: '14.5995', lon: '-180.1', city: 'Manila' })).toBeNull();
  });

  it('accepts longitude at boundaries [-180, 180]', () => {
    expect(validateDeepLinkParams({ lat: '14.5995', lon: '180', city: 'Manila' })).toEqual({
      latitude: 14.5995,
      longitude: 180,
      city: 'Manila',
    });
    expect(validateDeepLinkParams({ lat: '14.5995', lon: '-180', city: 'Manila' })).toEqual({
      latitude: 14.5995,
      longitude: -180,
      city: 'Manila',
    });
  });

  it('rejects non-numeric coordinate values', () => {
    expect(validateDeepLinkParams({ lat: 'abc', lon: '120.9842', city: 'Manila' })).toBeNull();
    expect(validateDeepLinkParams({ lat: '14.5995', lon: 'xyz', city: 'Manila' })).toBeNull();
  });

  it('rejects missing or null parameters', () => {
    expect(validateDeepLinkParams(null)).toBeNull();
    expect(validateDeepLinkParams(undefined)).toBeNull();
    expect(validateDeepLinkParams({ lat: '14.5995' })).toBeNull();
    expect(validateDeepLinkParams({ lon: '120.9842', city: 'Manila' })).toBeNull();
  });
});

describe('createCityDeepLink & parseCityDeepLink', () => {
  it('creates and parses city deep links correctly', () => {
    const url = createCityDeepLink(14.5995, 120.9842, 'Manila');
    expect(url).toContain('weather');
    expect(url).toContain('lat=14.5995');
    expect(url).toContain('lon=120.9842');

    const parsed = parseCityDeepLink(url);
    expect(parsed).toEqual({
      latitude: 14.5995,
      longitude: 120.9842,
      city: 'Manila',
    });
  });

  it('returns null when parsing invalid or incomplete URLs', () => {
    expect(parseCityDeepLink('expoweather://weather?lat=999')).toBeNull();
    expect(parseCityDeepLink('invalid-url')).toBeNull();
  });
});
