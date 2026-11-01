import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import license from 'rollup-plugin-license';
import { defineConfig } from 'wxt';
import { NOTICES_FILE, type NoticeDependency, renderNotices } from './scripts/notices';

const bundledDependencies = new Map<string, NoticeDependency>();

// public/favicon.svg に埋め込んでいる Chromium の新規タブ用アイコン。
// npm パッケージではなく自動収集されないため、ライセンス表記を明示的に追加する。
const CHROMIUM_FAVICON_NOTICE: NoticeDependency = {
  name: 'Chromium new tab favicon',
  version: '689849d',
  license: 'BSD-3-Clause',
  homepage: 'https://www.chromium.org/',
  licenseText: readFileSync(new URL('./assets/chromium-LICENSE', import.meta.url), 'utf8'),
  noticeText: null,
};

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  dev: {
    // Chromium は環境によって `localhost` を IPv4 に解決するが、WXT の既定値では
    // 開発サーバーが IPv6 の ::1 だけで待ち受けて接続できないことがある。
    // ホストと接続元の両方を IPv4 のループバックに揃える。
    server: {
      host: '127.0.0.1',
      origin: '127.0.0.1',
    },
  },
  vite: () => ({
    plugins: [
      license({
        thirdParty: {
          multipleVersions: true,
          output(dependencies) {
            for (const dependency of dependencies) {
              if (!dependency.name || !dependency.version) continue;

              bundledDependencies.set(`${dependency.name}@${dependency.version}`, {
                name: dependency.name,
                version: dependency.version,
                license: dependency.license,
                homepage: dependency.homepage,
                licenseText: dependency.licenseText,
                noticeText: dependency.noticeText,
              });
            }
          },
        },
      }),
    ],
  }),
  hooks: {
    'build:before': () => {
      bundledDependencies.clear();
    },
    'build:publicAssets': (wxt, files) => {
      if (wxt.config.command !== 'build') return;

      if (bundledDependencies.size === 0) {
        throw new Error(
          'No bundled third-party dependencies were found while generating third-party notices.',
        );
      }

      const contents = renderNotices([...bundledDependencies.values(), CHROMIUM_FAVICON_NOTICE]);
      writeFileSync(path.resolve(wxt.config.root, NOTICES_FILE), contents, 'utf8');

      const generatedFile = {
        relativeDest: NOTICES_FILE,
        contents,
      };
      const existingIndex = files.findIndex((file) => file.relativeDest === NOTICES_FILE);

      if (existingIndex >= 0) {
        files[existingIndex] = generatedFile;
      } else {
        files.push(generatedFile);
      }
    },
  },
  manifest: {
    name: 'Simple New Tab',
    description: 'A simple new tab page for Chromium.',
    minimum_chrome_version: '104',
    permissions: ['search'],
    host_permissions: ['https://suggestqueries.google.com/*'],
  },
});
