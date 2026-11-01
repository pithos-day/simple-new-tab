interface ChromeSearchApi {
  search: {
    query(queryInfo: { text: string; disposition: 'CURRENT_TAB' }): Promise<void>;
  };
}

export async function search(text: string): Promise<void> {
  const chromeApi = (globalThis as typeof globalThis & { chrome?: ChromeSearchApi }).chrome;

  if (!chromeApi) {
    throw new Error('chrome.search is unavailable');
  }

  await chromeApi.search.query({ text, disposition: 'CURRENT_TAB' });
}
