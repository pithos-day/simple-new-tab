import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { browser } from 'wxt/browser';
import App from '../entrypoints/newtab/App';

const searchQuery = vi.spyOn(browser.search, 'query');

function submitSearch(value: string) {
  const input = screen.getByRole<HTMLInputElement>('searchbox', { name: '検索' });

  fireEvent.change(input, { target: { value } });

  if (!input.form) {
    throw new Error('Search form not found');
  }

  fireEvent.submit(input.form);
}

beforeEach(() => {
  searchQuery.mockReset();
  searchQuery.mockResolvedValue(undefined);
});

describe('new tab', () => {
  it('renders only the search bar', () => {
    render(<App />);

    expect(screen.getByRole('searchbox', { name: '検索' })).toBeTruthy();
  });

  it('searches with the default search provider', () => {
    render(<App />);

    submitSearch('  WXT  ');

    expect(searchQuery).toHaveBeenCalledWith({ text: 'WXT', disposition: 'CURRENT_TAB' });
  });

  it('does not search when the query is blank', () => {
    render(<App />);

    submitSearch('   ');

    expect(searchQuery).not.toHaveBeenCalled();
  });
});
