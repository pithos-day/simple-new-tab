const LENS_UPLOAD_URL = 'https://lens.google.com/v3/upload';
const LENS_URL_SEARCH_URL = 'https://lens.google.com/uploadbyurl';

export type ImageSource = { type: 'file'; file: File } | { type: 'url'; url: string };

export function parseImageUrl(text: string): string | null {
  try {
    const url = new URL(text.trim());
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
  } catch {
    return null;
  }
}

export function findImageFile(data: Pick<DataTransfer, 'files'>): File | null {
  return Array.from(data.files).find((file) => file.type.startsWith('image/')) ?? null;
}

export function readImageSource(data: Pick<DataTransfer, 'files' | 'getData'>): ImageSource | null {
  const file = findImageFile(data);
  if (file) return { type: 'file', file };

  // Web ページからドラッグした画像は、ファイルではなく URL として渡されることがある。
  const uriList = data.getData('text/uri-list');
  const firstUri = uriList.split(/\r?\n/).find((line) => line && !line.startsWith('#'));
  const url = parseImageUrl(firstUri ?? data.getData('text/plain'));

  return url ? { type: 'url', url } : null;
}

function createField(name: string, type: string): HTMLInputElement {
  const field = document.createElement('input');
  field.name = name;
  field.type = type;
  return field;
}

function submitForm(form: HTMLFormElement): void {
  form.hidden = true;
  document.body.append(form);
  form.submit();
  form.remove();
}

// Lens の結果ページへ遷移するため、fetch ではなくフォーム送信で画像を渡す。
export function searchWithLens(source: ImageSource): void {
  const form = document.createElement('form');

  if (source.type === 'url') {
    const field = createField('url', 'hidden');
    field.value = source.url;
    form.action = LENS_URL_SEARCH_URL;
    form.method = 'get';
    form.append(field);
  } else {
    const transfer = new DataTransfer();
    transfer.items.add(source.file);

    const field = createField('encoded_image', 'file');
    field.files = transfer.files;
    form.action = LENS_UPLOAD_URL;
    form.method = 'post';
    form.enctype = 'multipart/form-data';
    form.append(field);
  }

  submitForm(form);
}
