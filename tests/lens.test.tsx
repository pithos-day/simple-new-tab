import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../entrypoints/newtab/App';
import { parseHttpUrl, readImageSource } from '../entrypoints/newtab/lens';

const imageFile = new File(['image'], 'cat.png', { type: 'image/png' });
const textFile = new File(['text'], 'note.txt', { type: 'text/plain' });

function fakeDataTransfer(files: File[], data: Record<string, string> = {}) {
  return {
    files: files as unknown as FileList,
    getData: (format: string) => data[format] ?? '',
  };
}

const submit = vi.spyOn(HTMLFormElement.prototype, 'submit');

function submittedForm() {
  const form = submit.mock.contexts[0] as HTMLFormElement | undefined;
  return form && { action: form.action, method: form.method, enctype: form.enctype };
}

function openPanel() {
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: 'Google レンズで検索' }));
}

function dispatchWithData(type: string, key: string, data: unknown) {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(event, key, { value: data });
  document.dispatchEvent(event);
}

function dispatchDrop(data: unknown) {
  dispatchWithData('drop', 'dataTransfer', data);
}

function dispatchPaste(data: unknown) {
  dispatchWithData('paste', 'clipboardData', data);
}

function submitImageUrl(value: string) {
  const input = screen.getByRole<HTMLInputElement>('textbox', { name: '画像の URL' });
  fireEvent.change(input, { target: { value } });
  fireEvent.submit(input.form as HTMLFormElement);
}

beforeEach(() => {
  submit.mockReset();
  submit.mockImplementation(() => undefined);
  vi.stubGlobal(
    'DataTransfer',
    class {
      files = [] as File[];
      items = { add: (file: File) => this.files.push(file) };
    },
  );
  vi.spyOn(HTMLInputElement.prototype, 'files', 'set').mockImplementation(() => undefined);
});

describe('parseHttpUrl', () => {
  it('accepts only http and https URLs', () => {
    expect(parseHttpUrl(' https://example.com/a.png ')).toBe('https://example.com/a.png');
    expect(parseHttpUrl('http://example.com/a.png')).toBe('http://example.com/a.png');
    expect(parseHttpUrl('file:///home/a.png')).toBeNull();
    expect(parseHttpUrl('data:image/png;base64,AAAA')).toBeNull();
    expect(parseHttpUrl('cat')).toBeNull();
  });
});

describe('readImageSource', () => {
  it('prefers an image file', () => {
    expect(
      readImageSource(
        fakeDataTransfer([textFile, imageFile], { 'text/uri-list': 'https://example.com/a' }),
      ),
    ).toEqual({ type: 'file', file: imageFile });
  });

  it('falls back to the first URL of a uri-list', () => {
    expect(
      readImageSource(
        fakeDataTransfer([], { 'text/uri-list': '# comment\r\nhttps://example.com/a.png\r\n' }),
      ),
    ).toEqual({ type: 'url', url: 'https://example.com/a.png' });
  });

  it('falls back to plain text', () => {
    expect(
      readImageSource(fakeDataTransfer([], { 'text/plain': 'https://example.com/a.png' })),
    ).toEqual({ type: 'url', url: 'https://example.com/a.png' });
  });

  it('returns null when there is no image', () => {
    expect(readImageSource(fakeDataTransfer([textFile], { 'text/plain': 'cat' }))).toBeNull();
  });
});

describe('Lens panel', () => {
  it('searches for an entered image URL', () => {
    openPanel();

    submitImageUrl('https://example.com/a.png');

    expect(submittedForm()).toMatchObject({
      action: 'https://lens.google.com/uploadbyurl',
      method: 'get',
    });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('shows an error for an invalid URL', () => {
    openPanel();

    submitImageUrl('file:///a.png');

    expect(submit).not.toHaveBeenCalled();
    expect(screen.getByRole('alert').textContent).toContain('画像 URL');
  });

  it('uploads a dropped image', () => {
    openPanel();

    dispatchDrop(fakeDataTransfer([imageFile]));

    expect(submittedForm()).toMatchObject({
      action: 'https://lens.google.com/v3/upload',
      method: 'post',
      enctype: 'multipart/form-data',
    });
  });

  it('uploads a pasted image', () => {
    openPanel();

    dispatchPaste(fakeDataTransfer([imageFile]));

    expect(submittedForm()).toMatchObject({ action: 'https://lens.google.com/v3/upload' });
  });

  it('does not move focus to the URL input when opened', () => {
    openPanel();

    expect(document.activeElement).not.toBe(screen.getByRole('textbox', { name: '画像の URL' }));
  });

  it('searches for a URL pasted outside the URL input', () => {
    openPanel();

    dispatchWithData(
      'paste',
      'clipboardData',
      fakeDataTransfer([], { 'text/plain': 'https://a.jp' }),
    );

    expect(submittedForm()).toMatchObject({ action: 'https://lens.google.com/uploadbyurl' });
  });

  it('leaves text pasted into the URL input to the input', () => {
    openPanel();

    const input = screen.getByRole('textbox', { name: '画像の URL' });
    fireEvent.paste(input, {
      clipboardData: fakeDataTransfer([], { 'text/plain': 'https://a.jp' }),
    });

    expect(submit).not.toHaveBeenCalled();
  });

  it('does not send a pasted image while the panel is closed', () => {
    render(<App />);

    dispatchPaste(fakeDataTransfer([imageFile]));

    expect(submit).not.toHaveBeenCalled();
  });

  it('closes with Escape and returns focus to the button', () => {
    openPanel();

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'Google レンズで検索' }),
    );
  });

  it('closes when clicking outside', () => {
    openPanel();

    fireEvent.mouseDown(document.body);

    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
