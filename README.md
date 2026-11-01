# Simple New Tab

Chromium の新しいタブをシンプルに置き換える拡張機能です。WXT + React + TypeScript で開発しています。

**現在は開発環境とニュータブ用の最小プレースホルダーのみ**で、機能はまだ実装していません。

## 対応ブラウザ

Chrome 104 以降を対象としています。Chromium 系（Edge / Brave / Arc など）でも動作する想定ですが、動作保証は Chrome のみです。

## スタック

- **WXT** — マニフェスト生成、Chrome 向けビルド、HMR
- **React 19 + TypeScript** — ニュータブページの UI
- **rollup-plugin-license** — バンドルに含まれる第三者ライセンスの抽出
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
├── scripts/notices.ts       # 第三者ライセンスの整形
├── THIRD_PARTY_NOTICES.txt  # ビルド時に生成する第三者ライセンス一覧
├── assets/icon.svg          # アイコンの原本
├── public/icon/             # 16 / 32 / 48 / 96 / 128 px の PNG
├── wxt.config.ts            # 表示名・説明・ライセンス生成の設定
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

## 第三者ライセンス

`pnpm build` は、実際にバンドルされた第三者パッケージの `LICENSE` / `NOTICE` を収集し、リポジトリ直下の `THIRD_PARTY_NOTICES.txt` を生成します。生成物はビルド出力にもコピーされ、配布 ZIP に同梱されます。

- 対象はバンドルに含まれたコードのみです。ビルドに含まれない devDependencies は対象外ですが、WXT のランタイムのようにバンドルされる devDependency は対象になります
- tree-shake で消えた依存は含まれません
- ライセンス本文が見つからないパッケージがある場合、ビルドは失敗します
- 依存を追加・更新したら `pnpm build` を実行し、`THIRD_PARTY_NOTICES.txt` の差分をコミットしてください
- CI はビルド後の `THIRD_PARTY_NOTICES.txt` に差分がないか確認します

## チェック

Husky の `pre-commit` で `lint-staged` が実行され、ステージしたファイルに Biome と ESLint の自動修正がかかります。GitHub Actions では push / pull request 時に `pnpm check` と `pnpm build` / `pnpm zip` を実行し、`THIRD_PARTY_NOTICES.txt` が最新かどうかも検証します。

## ライセンス

このプロジェクトは MIT ライセンスです。配布物に含まれる第三者ソフトウェアのライセンスは [THIRD_PARTY_NOTICES.txt](THIRD_PARTY_NOTICES.txt) にまとめています。
