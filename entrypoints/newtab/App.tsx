import SearchBar from './SearchBar';
import { search } from './search';

function handleSearch(text: string) {
  void search(text).catch((error: unknown) => {
    console.error('Failed to search', error);
  });
}

export default function App() {
  return (
    <main className="newtab">
      <SearchBar onSearch={handleSearch} />
    </main>
  );
}
