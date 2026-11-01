# Simple New Tab

Chromium の新しいタブをシンプルに置き換える拡張機能です。WXT + React + TypeScript で開発しています。

**現在は開発環境とニュータブ用の最小プレースホルダーのみ**で、機能はまだ実装していません。

## 対応ブラウザ

Chrome 104 以降を対象としています。Chromium 系（Edge / Brave / Arc など）でも動作する想定ですが、動作保証は Chrome のみです。

## スタック

- **WXT** — マニフェスト生成、Chrome 向けビルド、HMR
- **React 19 + TypeScript** — ニュータブページの UI
- **Biome** — フォーマットと基本リント
- **ESLint** — React Hooks / React Refresh 向けの追加リント
- **Vitest + happy-dom + Testing Library** — コンポーネントテスト
- **Knip** — 未使用ファイル・依存関係の検出
- **Husky + lint-staged** — コミット前の自動チェック
- **GitHub Actions** — push / pull request 時の lint・型チェック・テスト・ビルド

## 必要環境

- Node.js 22.13 以上（`.nvmrc` は 24）
- pnpm 11.8.0（`packageManager` / `devEngines` で固定）

## セットアップ

```sh
pnpm install
```

`postinstall` で WXT の型（`.wxt/`）が生成され、`prepare` で Husky のフックが有効になります。

## 開発

```sh
pnpm dev
```

Chrome が起動し、拡張機能が読み込まれた状態で開発できます。新しいタブを開くと開発中のページが表示されます。

手動で読み込む場合は、ビルド後の `.output/chrome-mv3-dev`（本番ビルドは `.output/chrome-mv3`）を `chrome://extensions` の「パッケージ化されていない拡張機能を読み込む」から指定してください。

## スクリプト

| コマンド          | 内容                                      |
| ----------------- | ----------------------------------------- |
| `pnpm dev`        | Chrome 向け開発サーバー                   |
| `pnpm build`      | Chrome 向け本番ビルド                     |
| `pnpm zip`        | 配布用 ZIP の作成                         |
| `pnpm lint`       | Biome + ESLint                            |
| `pnpm lint:fix`   | Biome + ESLint の自動修正                 |
| `pnpm format`     | Biome によるフォーマット                  |
| `pnpm typecheck`  | WXT の型生成 + `tsc --noEmit`             |
| `pnpm test`       | Vitest（1 回実行）                        |
| `pnpm test:watch` | Vitest（ウォッチ）                        |
| `pnpm knip`       | 未使用コード・依存関係の検出              |
| `pnpm check`      | lint / typecheck / test / knip を一括実行 |

## ディレクトリ構成

```text
.
├── .github/workflows/ci.yml # lint / typecheck / test / build
├── entrypoints/
│   └── newtab/              # 新しいタブで開くページ
│       ├── index.html
│       ├── main.tsx
│       ├── App.tsx          # 現状はプレースホルダー
│       └── style.css
├── tests/                   # Vitest
├── assets/icon.svg          # アイコンの原本
├── public/icon/             # 16 / 32 / 48 / 96 / 128 px の PNG
├── wxt.config.ts            # 表示名・説明
├── biome.json
├── eslint.config.js
├── knip.json
└── vitest.config.ts
```

## 開発環境のポイント

- `entrypoints/newtab/index.html` を置くと、WXT が `chrome_url_overrides.newtab` を自動でマニフェストに追加します。
- `@/` はリポジトリルートへのエイリアスです（WXT が生成する `tsconfig` の paths）。
- WXT の自動インポート（`defineBackground` など）は ESLint の globals に `.wxt/eslint-auto-imports.mjs` 経由で反映されます。
- アイコンは `assets/icon.svg` を原本に、`public/icon/*.png` を書き出してコミットしています（現在は仮アイコン）。書き出しには librsvg の `rsvg-convert` を使用します。

  ```sh
  for size in 16 32 48 96 128; do
    rsvg-convert -w "$size" -h "$size" assets/icon.svg -o "public/icon/$size.png"
  done
  ```

## チェック

Husky の `pre-commit` で `lint-staged` が実行され、ステージしたファイルに Biome と ESLint の自動修正がかかります。GitHub Actions では push / pull request 時に `pnpm check` と `pnpm build` / `pnpm zip` を実行します。

## ライセンス

MIT
