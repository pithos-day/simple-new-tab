const SUGGEST_ENDPOINT = 'https://suggestqueries.google.com/complete/search';
const MAX_SUGGESTIONS = 8;

interface FetchSuggestionsOptions {
  signal?: AbortSignal;
  language?: string;
}

export function buildSuggestionUrl(query: string, language: string): string {
  const url = new URL(SUGGEST_ENDPOINT);
  url.searchParams.set('client', 'chrome');
  url.searchParams.set('hl', language);
  // 指定しないと hl=ja などで Shift_JIS が返り、response.json() で文字化けする。
  url.searchParams.set('oe', 'utf-8');
  url.searchParams.set('q', query);
  return url.toString();
}

export function parseSuggestions(payload: unknown): string[] {
  if (!Array.isArray(payload)) return [];

  const candidates: unknown = payload[1];
  if (!Array.isArray(candidates)) return [];

  const suggestions: string[] = [];
  const seen = new Set<string>();

  for (const candidate of candidates) {
    if (typeof candidate !== 'string') continue;

    const text = candidate.trim();
    if (!text || seen.has(text)) continue;

    seen.add(text);
    suggestions.push(text);

    if (suggestions.length >= MAX_SUGGESTIONS) break;
  }

  return suggestions;
}

export async function fetchSuggestions(
  query: string,
  options: FetchSuggestionsOptions = {},
): Promise<string[]> {
  const language = options.language ?? navigator.language;
  const response = await fetch(buildSuggestionUrl(query, language), {
    signal: options.signal,
    // 入力中の語句以外を Google に渡さないよう、Cookie とリファラーを送らない。
    credentials: 'omit',
    referrerPolicy: 'no-referrer',
    redirect: 'error',
    cache: 'no-store',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Google Suggest request failed: ${response.status}`);
  }

  return parseSuggestions(await response.json());
}
