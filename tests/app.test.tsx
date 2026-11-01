import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from '../entrypoints/newtab/App';

describe('new tab', () => {
  it('renders the placeholder heading', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: 'Simple New Tab' })).toBeTruthy();
  });
});
