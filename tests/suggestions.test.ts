import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildSuggestionUrl,
  fetchSuggestions,
  parseSuggestions,
} from '../entrypoints/newtab/suggestions';

describe('parseSuggestions', () => {
  it('extracts trimmed and unique suggestions', () => {
    expect(parseSuggestions(['query', ['  WXT  ', 'WXT', 'React', 1, '', null, 'Vite']])).toEqual([
      'WXT',
      'React',
      'Vite',
    ]);
  });

  it('limits suggestions to eight items', () => {
    const candidates = Array.from({ length: 12 }, (_, index) => `suggestion ${index}`);

    expect(parseSuggestions(['query', candidates])).toHaveLength(8);
  });

  it('returns an empty array for malformed responses', () => {
    expect(parseSuggestions(null)).toEqual([]);
    expect(parseSuggestions({})).toEqual([]);
    expect(parseSuggestions(['query'])).toEqual([]);
    expect(parseSuggestions(['query', 'not a list'])).toEqual([]);
  });
});

describe('buildSuggestionUrl', () => {
  it('encodes the query and language', () => {
    const url = new URL(buildSuggestionUrl('猫 検索', 'ja-JP'));

    expect(url.origin).toBe('https://suggestqueries.google.com');
    expect(url.pathname).toBe('/complete/search');
    expect(url.searchParams.get('client')).toBe('chrome');
    expect(url.searchParams.get('hl')).toBe('ja-JP');
    expect(url.searchParams.get('oe')).toBe('utf-8');
    expect(url.searchParams.get('q')).toBe('猫 検索');
  });
});

describe('fetchSuggestions', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('requests suggestions without credentials or a referrer', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ['query', ['WXT', 'React']],
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchSuggestions('WXT', { language: 'ja' })).resolves.toEqual(['WXT', 'React']);

    expect(fetchMock).toHaveBeenCalledWith(
      buildSuggestionUrl('WXT', 'ja'),
      expect.objectContaining({
        credentials: 'omit',
        referrerPolicy: 'no-referrer',
        redirect: 'error',
        cache: 'no-store',
      }),
    );
  });

  it('throws when the request fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        json: async () => null,
      }),
    );

    await expect(fetchSuggestions('WXT', { language: 'ja' })).rejects.toThrow(
      'Google Suggest request failed: 503',
    );
  });
});
