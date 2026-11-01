import {
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import LensPanel from './LensPanel';
import { useSuggestions } from './useSuggestions';

interface SearchBarProps {
  onSearch: (text: string) => void;
}

const LISTBOX_ID = 'search-suggestions';
const LENS_PANEL_ID = 'lens-panel';

function getOptionId(index: number): string {
  return `${LISTBOX_ID}-${index}`;
}

function LensIcon() {
  return (
    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" aria-hidden="true">
      <path
        d="M8 3.5H7A3.5 3.5 0 0 0 3.5 7v1M16 3.5h1A3.5 3.5 0 0 1 20.5 7v1M8 20.5H7A3.5 3.5 0 0 1 3.5 17v-1M20.5 16v1a3.5 3.5 0 0 1-3.5 3.5h-1"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isLensOpen, setIsLensOpen] = useState(false);
  const rootRef = useRef<HTMLElement>(null);
  const lensButtonRef = useRef<HTMLButtonElement>(null);

  const trimmedQuery = query.trim();
  const suggestions = useSuggestions(trimmedQuery, isFocused);
  const isListOpen = isFocused && !isDismissed && suggestions.length > 0;
  const activeSuggestion =
    activeIndex >= 0 && activeIndex < suggestions.length ? suggestions[activeIndex] : undefined;

  // aria-activedescendant ではブラウザがスクロールしないため、選択中の候補を画面内に収める。
  useEffect(() => {
    if (activeIndex < 0) return;

    document.getElementById(getOptionId(activeIndex))?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  useEffect(() => {
    if (!isLensOpen) return;

    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setIsLensOpen(false);
    };

    document.addEventListener('mousedown', closeOnOutsideClick);
    return () => document.removeEventListener('mousedown', closeOnOutsideClick);
  }, [isLensOpen]);

  const closeLens = useCallback(() => {
    setIsLensOpen(false);
    lensButtonRef.current?.focus();
  }, []);

  const runSearch = (text: string) => {
    setIsDismissed(true);
    onSearch(text);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!trimmedQuery) return;

    runSearch(trimmedQuery);
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
    setIsDismissed(false);
    setActiveIndex(-1);
  };

  const handleFocus = () => {
    setIsFocused(true);
    // レンズパネルと候補一覧は同じ位置に重なるため、同時に開かない。
    setIsLensOpen(false);
    setIsDismissed(false);
  };

  const handleBlur = () => {
    setIsFocused(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    // 変換中のキー操作は IME に任せる。Enter で確定したときに検索しない。
    if (event.nativeEvent.isComposing) {
      if (event.key === 'Enter') {
        event.preventDefault();
      }
      return;
    }

    const selectedIndex = isListOpen && activeSuggestion ? activeIndex : -1;
    const showOption = (index: number) => {
      event.preventDefault();
      setIsDismissed(false);
      setActiveIndex(index);
    };

    switch (event.key) {
      case 'ArrowDown': {
        if (suggestions.length === 0) return;

        showOption((selectedIndex + 1) % suggestions.length);
        break;
      }
      case 'ArrowUp': {
        if (suggestions.length === 0) return;

        showOption((selectedIndex <= 0 ? suggestions.length : selectedIndex) - 1);
        break;
      }
      case 'Escape': {
        if (!isListOpen) return;

        event.preventDefault();
        setIsDismissed(true);
        setActiveIndex(-1);
        break;
      }
      case 'Enter': {
        if (!activeSuggestion) return;

        event.preventDefault();
        runSearch(activeSuggestion);
        break;
      }
    }
  };

  return (
    <search ref={rootRef} className="search">
      <form onSubmit={handleSubmit}>
        <div className="search-field">
          <label className="visually-hidden" htmlFor="search">
            検索
          </label>
          <input
            id="search"
            name="q"
            type="search"
            placeholder="検索"
            value={query}
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={isListOpen}
            aria-controls={isListOpen ? LISTBOX_ID : undefined}
            aria-activedescendant={activeSuggestion ? getOptionId(activeIndex) : undefined}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            enterKeyHint="search"
            spellCheck={false}
            onChange={handleChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
          />
          <button
            ref={lensButtonRef}
            type="button"
            className="lens"
            aria-label="Google レンズで検索"
            title="Google レンズで検索"
            aria-expanded={isLensOpen}
            aria-controls={isLensOpen ? LENS_PANEL_ID : undefined}
            onClick={() => setIsLensOpen((wasOpen) => !wasOpen)}
          >
            <LensIcon />
          </button>
          {isListOpen && (
            <div className="suggestions" id={LISTBOX_ID} role="listbox" aria-label="検索候補">
              {suggestions.map((suggestion, index) => (
                // biome-ignore lint/a11y/useKeyWithClickEvents: キーボード操作は input の keydown で扱う
                <div
                  key={suggestion}
                  id={getOptionId(index)}
                  className="suggestion"
                  role="option"
                  aria-selected={index === activeIndex}
                  tabIndex={-1}
                  // input の blur で一覧が消えると click が届かないため、フォーカスを移さない。
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => runSearch(suggestion)}
                >
                  {suggestion}
                </div>
              ))}
            </div>
          )}
        </div>
      </form>
      {isLensOpen && <LensPanel id={LENS_PANEL_ID} onClose={closeLens} />}
    </search>
  );
}
