import { type FormEvent, useEffect, useRef, useState } from 'react';
import {
  findImageFile,
  type ImageSource,
  parseImageUrl,
  readImageSource,
  searchWithLens,
} from './lens';

interface LensPanelProps {
  id: string;
  onClose: () => void;
}

export default function LensPanel({ id, onClose }: LensPanelProps) {
  const urlInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');

  // パネル外へのドロップでページが画像に置き換わらないよう、開いている間はページ全体で受け取る。
  // 閉じている間は受け取らず、スクリーンショットの誤貼り付けなどで Google に送信しない。
  useEffect(() => {
    const send = (source: ImageSource) => {
      searchWithLens(source);
      onClose();
    };

    const handlePaste = (event: ClipboardEvent) => {
      if (!event.clipboardData) return;

      // URL 欄への文字列の貼り付けは通常どおり入力させ、それ以外の場所では URL も受け取る。
      const file = findImageFile(event.clipboardData);
      const source: ImageSource | null = file
        ? { type: 'file', file }
        : event.target === urlInputRef.current
          ? null
          : readImageSource(event.clipboardData);
      if (!source) return;

      event.preventDefault();
      send(source);
    };
    const handleDragOver = (event: DragEvent) => {
      event.preventDefault();
      setIsDragging(true);
    };
    const handleDragLeave = (event: DragEvent) => {
      if (!event.relatedTarget) setIsDragging(false);
    };
    const handleDrop = (event: DragEvent) => {
      event.preventDefault();
      setIsDragging(false);

      const source = event.dataTransfer && readImageSource(event.dataTransfer);
      if (source) {
        send(source);
      } else {
        setError('画像をドロップしてください');
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    document.addEventListener('paste', handlePaste);
    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('dragleave', handleDragLeave);
    document.addEventListener('drop', handleDrop);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('dragover', handleDragOver);
      document.removeEventListener('dragleave', handleDragLeave);
      document.removeEventListener('drop', handleDrop);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const handleUrlSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const url = parseImageUrl(urlInputRef.current?.value ?? '');
    if (url) {
      searchWithLens({ type: 'url', url });
      onClose();
    } else {
      setError('http または https の画像 URL を入力してください');
    }
  };

  return (
    <div className="lens-panel" id={id} role="dialog" aria-label="Google レンズで画像を検索">
      <p className="lens-drop" data-dragging={isDragging}>
        画像をドラッグ＆ドロップ、または貼り付け
      </p>
      <form className="lens-url" onSubmit={handleUrlSubmit}>
        <input
          ref={urlInputRef}
          type="url"
          name="url"
          placeholder="画像の URL"
          aria-label="画像の URL"
          autoComplete="off"
          spellCheck={false}
          required
          onChange={() => setError('')}
        />
        <button type="submit">検索</button>
      </form>
      {error && (
        <p className="lens-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
