import { useEffect, useState } from 'react';
import { fetchSuggestions } from './suggestions';

const DEBOUNCE_MS = 180;
const EMPTY_SUGGESTIONS: string[] = [];

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

export function useSuggestions(query: string, enabled: boolean): string[] {
  const [items, setItems] = useState(EMPTY_SUGGESTIONS);

  // 入力を消した後に打ち直したとき、以前の候補を一瞬でも表示しない。
  if (!query && items.length > 0) {
    setItems(EMPTY_SUGGESTIONS);
  }

  useEffect(() => {
    if (!enabled || !query) return;

    let cancelled = false;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void fetchSuggestions(query, { signal: controller.signal })
        .then((nextItems) => {
          if (!cancelled) {
            setItems(nextItems);
          }
        })
        .catch((error: unknown) => {
          if (!cancelled && !isAbortError(error)) {
            setItems(EMPTY_SUGGESTIONS);
          }
        });
    }, DEBOUNCE_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [enabled, query]);

  // 次の候補が届くまで現在の候補を残し、入力のたびに一覧がちらつかないようにする。
  return enabled && query ? items : EMPTY_SUGGESTIONS;
}
