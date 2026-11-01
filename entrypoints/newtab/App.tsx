export default function App() {
  return (
    <main className="newtab">
      <search className="search">
        <form>
          <label className="visually-hidden" htmlFor="search">
            検索
          </label>
          <input
            id="search"
            name="q"
            type="search"
            placeholder="検索"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            enterKeyHint="search"
            spellCheck={false}
          />
        </form>
      </search>
    </main>
  );
}
