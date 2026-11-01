import { type FormEvent, useRef } from 'react';
import { search } from './search';

export default function App() {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const text = inputRef.current?.value.trim() ?? '';
    if (!text) return;

    void search(text).catch((error: unknown) => {
      console.error('Failed to search', error);
    });
  };

  return (
    <main className="newtab">
      <search className="search">
        <form onSubmit={handleSubmit}>
          <label className="visually-hidden" htmlFor="search">
            検索
          </label>
          <input
            ref={inputRef}
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
