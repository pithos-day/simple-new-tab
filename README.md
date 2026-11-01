# Simple New Tab

Chromium の新しいタブをシンプルに置き換える拡張機能です。WXT + React + TypeScript で開発しています。

新しいタブは検索バーだけのページになり、入力した語句はブラウザの既定の検索エンジンで検索します。入力中は Google の検索候補を表示し、検索バー右端のボタンから画像を Google レンズで検索できます。

## 機能

- 新しいタブを検索バーだけのページに置き換えます
- 入力した語句を、ブラウザの既定の検索エンジンで検索します
- 入力中に Google の検索候補を表示します（矢印キーまたはクリックで選択）
- 検索バー右端のボタンから、ドラッグ＆ドロップ・貼り付け・URL で指定した画像を Google レンズで検索します
- システムのライト / ダークテーマに追従します

Chrome の新しいタブページ自体は拡張機能から直接変更できないため、`chrome_url_overrides.newtab` でページごと置き換えています。

## 権限

| 権限                                  | 用途                                         |
| ------------------------------------- | -------------------------------------------- |
| `search`                              | 既定の検索エンジンで検索するために使用します |
| `https://suggestqueries.google.com/*` | Google の検索候補を取得するために使用します  |

検索候補を取得するため、入力中の語句は既定の検索エンジンの設定にかかわらず Google に送信されます。リクエストに Cookie は含めません。画像は、Google レンズのパネルを開いて指定したときだけ Google に送信します。

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

Chromium が起動し、拡張機能が読み込まれた状態で開発できます。起動直後のタブでは拡張機能がまだ有効になっていないことがあるため、新しいタブを開いて開発中のページを表示してください。

開発ビルド `.output/chrome-mv3-dev` は `pnpm dev` の開発サーバーからスクリプトを読み込むため、サーバーを停止すると新しいタブは表示されません。日常使いや手動での読み込みには、`pnpm build` で生成した `.output/chrome-mv3` を `chrome://extensions` の「パッケージ化されていない拡張機能を読み込む」から指定してください。開発ビルドを手動で読み込む場合は、`pnpm dev` を実行したままにしてください。

権限などマニフェストの変更は、再ビルドしただけでは読み込み済みの拡張機能に反映されません。`chrome://extensions` で再読み込みしてください。

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
│       ├── App.tsx          # 検索バーのみのページ
│       ├── SearchBar.tsx    # 検索バー（検索候補）
│       ├── LensPanel.tsx    # Google レンズの画像指定パネル
│       ├── lens.ts          # Google レンズへの画像送信
│       ├── useSuggestions.ts # 入力に応じた検索候補の取得
│       ├── suggestions.ts   # Google Suggest API の呼び出し
│       ├── search.ts        # 既定の検索エンジンでの検索
│       └── style.css
├── tests/                   # Vitest
├── scripts/notices.ts       # 第三者ライセンスの整形
├── THIRD_PARTY_NOTICES.txt  # ビルド時に生成する第三者ライセンス一覧
├── assets/icon.svg          # 拡張機能アイコンの原本
├── assets/chromium-LICENSE  # favicon の元画像のライセンス
├── public/icon/             # 16 / 32 / 48 / 96 / 128 px の PNG
├── public/favicon.svg       # 新規タブに表示する favicon
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

- 新規タブの favicon は、Chromium の [`favicon_ntp.png`](https://chromium.googlesource.com/chromium/src/+/689849d0acca5f4968fba9f61e4d53f0a5dc0624/chrome/app/theme/default_200_percent/common/favicon_ntp.png)（32 px）を `public/favicon.svg` に埋め込んだものです。拡張機能のページは favicon が未指定、または読み込めないと拡張機能アイコンが表示されるため、明示的に指定しています。Chromium はタブの背景に合わせてアイコンを着色しますが、拡張機能からはタブの色を取得できないため、`prefers-color-scheme` で近似しています。

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
