export const NOTICES_FILE = 'THIRD_PARTY_NOTICES.txt';

export interface NoticeDependency {
  name: string;
  version: string;
  license: string | null;
  homepage: string | null;
  licenseText: string | null;
  noticeText: string | null;
}

const HEADER = [
  'THIRD-PARTY NOTICES',
  '===================',
  '',
  'Simple New Tab includes the following third-party software.',
  'Each package is listed with its full license text.',
  '',
  'This file is generated from the production bundle by `pnpm build`.',
  'Do not edit it manually.',
].join('\n');

const SEPARATOR = '-'.repeat(78);

export function renderNotices(dependencies: readonly NoticeDependency[]): string {
  const unique = new Map<string, NoticeDependency>();

  for (const dependency of dependencies) {
    unique.set(`${dependency.name}@${dependency.version}`, dependency);
  }

  const sections = [...unique.values()].sort(compareDependencies).map(renderDependency);

  if (sections.length === 0) {
    return `${HEADER}\n\nNo third-party dependencies were included in the bundle.\n`;
  }

  return `${HEADER}\n\n${sections.join('\n\n')}\n`;
}

function renderDependency(dependency: NoticeDependency): string {
  const licenseText = normalizeText(dependency.licenseText);
  if (!licenseText) {
    throw new Error(
      `Missing license text for ${dependency.name}@${dependency.version}. ` +
        'Make sure the package ships a LICENSE file.',
    );
  }

  const lines = [
    SEPARATOR,
    `${dependency.name} ${dependency.version}`,
    `License: ${dependency.license ?? 'Unknown'}`,
  ];

  if (dependency.homepage) {
    lines.push(`Homepage: ${dependency.homepage}`);
  }

  lines.push('', licenseText);

  const noticeText = normalizeText(dependency.noticeText);
  if (noticeText) {
    lines.push('', 'NOTICE', '', noticeText);
  }

  return lines.join('\n');
}

function compareDependencies(a: NoticeDependency, b: NoticeDependency): number {
  if (a.name !== b.name) return a.name < b.name ? -1 : 1;
  if (a.version !== b.version) return a.version < b.version ? -1 : 1;
  return 0;
}

function normalizeText(text: string | null): string {
  return text?.replace(/\r\n?/g, '\n').trim() ?? '';
}
