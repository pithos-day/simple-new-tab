import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { browser } from 'wxt/browser';
import App from '../entrypoints/newtab/App';

const searchQuery = vi.spyOn(browser.search, 'query');
const fetchMock = vi.spyOn(globalThis, 'fetch');

function getInput() {
  return screen.getByRole<HTMLInputElement>('combobox', { name: '検索' });
}

function submitSearch(value: string) {
  const input = getInput();

  fireEvent.change(input, { target: { value } });

  if (!input.form) {
    throw new Error('Search form not found');
  }

  fireEvent.submit(input.form);
}

async function openSuggestions(items: string[]) {
  render(<App />);
  fetchMock.mockResolvedValue(Response.json(['query', items]));

  const input = getInput();
  fireEvent.focus(input);
  fireEvent.change(input, { target: { value: 'wx' } });

  await screen.findByRole('listbox', { name: '検索候補' });

  return input;
}

function deferredResponse() {
  let resolve!: (response: Response) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<Response>((onResolve, onReject) => {
    resolve = onResolve;
    reject = onReject;
  });

  return { promise, resolve, reject };
}

function flushPromises() {
  return new Promise((resolve) => setTimeout(resolve));
}

function expectSearchedFor(text: string) {
  expect(searchQuery).toHaveBeenCalledWith({ text, disposition: 'CURRENT_TAB' });
}

beforeEach(() => {
  searchQuery.mockReset();
  searchQuery.mockResolvedValue(undefined);
  fetchMock.mockReset();
});

describe('new tab', () => {
  it('renders the search bar', () => {
    render(<App />);

    expect(getInput()).toBeTruthy();
  });

  it('searches with the default search provider', () => {
    render(<App />);

    submitSearch('  WXT  ');

    expectSearchedFor('WXT');
  });

  it('does not search when the query is blank', () => {
    render(<App />);

    submitSearch('   ');

    expect(searchQuery).not.toHaveBeenCalled();
  });
});

describe('suggestions', () => {
  it('searches for a clicked suggestion', async () => {
    await openSuggestions(['WXT', 'WXT React']);

    fireEvent.click(screen.getByRole('option', { name: 'WXT React' }));

    expectSearchedFor('WXT React');
  });

  it('selects a suggestion with the arrow keys and searches with Enter', async () => {
    const input = await openSuggestions(['WXT', 'WXT React']);

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'ArrowUp' });

    expect(screen.getByRole('option', { name: 'WXT React' }).getAttribute('aria-selected')).toBe(
      'true',
    );

    fireEvent.keyDown(input, { key: 'Enter' });

    expectSearchedFor('WXT React');
  });

  it('selects the last suggestion with ArrowUp when nothing is selected', async () => {
    const input = await openSuggestions(['WXT', 'WXT React']);

    fireEvent.keyDown(input, { key: 'ArrowUp' });

    expect(screen.getByRole('option', { name: 'WXT React' }).getAttribute('aria-selected')).toBe(
      'true',
    );
  });

  it('reopens the list on the first suggestion with ArrowDown after Escape', async () => {
    const input = await openSuggestions(['WXT', 'WXT React']);

    fireEvent.keyDown(input, { key: 'ArrowUp' });
    fireEvent.keyDown(input, { key: 'Escape' });
    fireEvent.keyDown(input, { key: 'ArrowDown' });

    expect(screen.getByRole('option', { name: 'WXT' }).getAttribute('aria-selected')).toBe('true');
  });

  it('reopens the list on the last suggestion with ArrowUp after Escape', async () => {
    const input = await openSuggestions(['WXT', 'WXT React']);

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Escape' });
    fireEvent.keyDown(input, { key: 'ArrowUp' });

    expect(screen.getByRole('option', { name: 'WXT React' }).getAttribute('aria-selected')).toBe(
      'true',
    );
  });

  it('does not search for the selected suggestion again after the list closes', async () => {
    const input = await openSuggestions(['WXT', 'WXT React']);

    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(searchQuery).toHaveBeenCalledTimes(1);
    expect(input.getAttribute('aria-activedescendant')).toBeNull();
  });

  it('closes the list with Escape', async () => {
    const input = await openSuggestions(['WXT']);

    fireEvent.keyDown(input, { key: 'Escape' });

    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('leaves key presses to the IME while composing', async () => {
    const input = await openSuggestions(['WXT']);

    fireEvent.keyDown(input, { key: 'ArrowDown', isComposing: true });
    fireEvent.keyDown(input, { key: 'Enter', isComposing: true });

    expect(screen.getByRole('option', { name: 'WXT' }).getAttribute('aria-selected')).toBe('false');
    expect(searchQuery).not.toHaveBeenCalled();
  });

  it('keeps the typed text as the search target while hovering a suggestion', async () => {
    const input = await openSuggestions(['WXT']);

    fireEvent.mouseEnter(screen.getByRole('option', { name: 'WXT' }));
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(searchQuery).not.toHaveBeenCalled();
  });

  it('keeps the current suggestions while the next ones are loading', async () => {
    const input = await openSuggestions(['WXT']);

    fireEvent.change(input, { target: { value: 'wxt' } });

    expect(screen.getByRole('option', { name: 'WXT' })).toBeTruthy();
  });

  it('hides the suggestions when the request fails', async () => {
    const input = await openSuggestions(['WXT']);
    fetchMock.mockRejectedValueOnce(new Error('network error'));

    fireEvent.change(input, { target: { value: 'wxt' } });

    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull());
  });

  it('ignores the response of a superseded request', async () => {
    const input = await openSuggestions(['WXT']);
    const superseded = deferredResponse();
    fetchMock.mockReturnValueOnce(superseded.promise);
    fireEvent.change(input, { target: { value: 'a' } });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

    fetchMock.mockResolvedValueOnce(Response.json(['ab', ['Latest']]));
    fireEvent.change(input, { target: { value: 'ab' } });
    await screen.findByRole('option', { name: 'Latest' });

    superseded.resolve(Response.json(['a', ['Stale']]));
    await flushPromises();

    expect(screen.getByRole('option', { name: 'Latest' })).toBeTruthy();
    expect(screen.queryByRole('option', { name: 'Stale' })).toBeNull();
  });

  it('ignores the failure of a superseded request', async () => {
    const input = await openSuggestions(['WXT']);
    const superseded = deferredResponse();
    fetchMock.mockReturnValueOnce(superseded.promise);
    fireEvent.change(input, { target: { value: 'a' } });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

    fetchMock.mockResolvedValueOnce(Response.json(['ab', ['Latest']]));
    fireEvent.change(input, { target: { value: 'ab' } });
    await screen.findByRole('option', { name: 'Latest' });

    superseded.reject(new Error('network error'));
    await flushPromises();

    expect(screen.getByRole('option', { name: 'Latest' })).toBeTruthy();
  });

  it('hides the suggestions when the input is cleared', async () => {
    const input = await openSuggestions(['WXT']);

    fireEvent.change(input, { target: { value: '' } });

    expect(screen.queryByRole('listbox')).toBeNull();
  });
});
