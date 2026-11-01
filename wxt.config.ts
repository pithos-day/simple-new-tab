import { writeFileSync } from 'node:fs';
import path from 'node:path';
import license from 'rollup-plugin-license';
import { defineConfig } from 'wxt';
import { NOTICES_FILE, type NoticeDependency, renderNotices } from './scripts/notices';

const bundledDependencies = new Map<string, NoticeDependency>();

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

      const contents = renderNotices([...bundledDependencies.values()]);
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
