import { describe, expect, it } from 'vitest';
import { type NoticeDependency, renderNotices } from '../scripts/notices';

function dependency(overrides: Partial<NoticeDependency> = {}): NoticeDependency {
  return {
    name: 'example',
    version: '1.0.0',
    license: 'MIT',
    homepage: 'https://example.com/',
    licenseText: 'MIT License\n\nCopyright (c) Example',
    noticeText: null,
    ...overrides,
  };
}

describe('renderNotices', () => {
  it('sorts packages by name and includes their license text', () => {
    const text = renderNotices([
      dependency({ name: 'zeta', licenseText: 'ZETA LICENSE' }),
      dependency({ name: 'alpha', version: '2.0.0', licenseText: 'ALPHA LICENSE' }),
    ]);

    expect(text).toContain('THIRD-PARTY NOTICES');
    expect(text.indexOf('alpha 2.0.0')).toBeLessThan(text.indexOf('zeta 1.0.0'));
    expect(text).toContain('ALPHA LICENSE');
    expect(text).toContain('ZETA LICENSE');
  });

  it('normalizes line endings, trims text, and includes NOTICE text', () => {
    const text = renderNotices([
      dependency({
        name: 'apache',
        license: 'Apache-2.0',
        licenseText: 'Apache License\r\n\r\nText\r\n',
        noticeText: '  Notice text\r\n',
      }),
    ]);

    expect(text).toContain('Apache License\n\nText');
    expect(text).not.toContain('\r');
    expect(text).toContain('NOTICE\n\nNotice text');
  });

  it('deduplicates the same package version', () => {
    const text = renderNotices([
      dependency({ name: 'react', version: '19.3.1', licenseText: 'MIT TEXT' }),
      dependency({ name: 'react', version: '19.3.1', licenseText: 'MIT TEXT' }),
    ]);

    expect(text.split('react 19.3.1')).toHaveLength(2);
  });

  it('throws when a package has no license text', () => {
    expect(() => renderNotices([dependency({ name: 'unlicensed', licenseText: null })])).toThrow(
      /Missing license text for unlicensed@1\.0\.0/,
    );
  });
});
