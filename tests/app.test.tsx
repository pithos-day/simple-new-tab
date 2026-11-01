import { fireEvent, render, screen } from '@testing-library/react';
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

  it('hides the suggestions when the input is cleared', async () => {
    const input = await openSuggestions(['WXT']);

    fireEvent.change(input, { target: { value: '' } });

    expect(screen.queryByRole('listbox')).toBeNull();
  });
});
