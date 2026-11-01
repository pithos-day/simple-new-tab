import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from '../entrypoints/newtab/App';

describe('new tab', () => {
  it('renders only the search bar', () => {
    render(<App />);

    expect(screen.getByRole('searchbox', { name: '検索' })).toBeTruthy();
  });
});
