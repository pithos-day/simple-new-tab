import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../entrypoints/newtab/App';
import { parseImageUrl, readDroppedImage } from '../entrypoints/newtab/lens';

const image = new File(['image'], 'cat.png', { type: 'image/png' });
const text = new File(['text'], 'note.txt', { type: 'text/plain' });

function dataTransfer(files: File[], data: Record<string, string> = {}) {
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

function dispatchWithData(type: 'drop' | 'paste', key: string, data: unknown) {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(event, key, { value: data });
  document.dispatchEvent(event);
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

describe('parseImageUrl', () => {
  it('accepts only http and https URLs', () => {
    expect(parseImageUrl(' https://example.com/a.png ')).toBe('https://example.com/a.png');
    expect(parseImageUrl('http://example.com/a.png')).toBe('http://example.com/a.png');
    expect(parseImageUrl('file:///home/a.png')).toBeNull();
    expect(parseImageUrl('data:image/png;base64,AAAA')).toBeNull();
    expect(parseImageUrl('cat')).toBeNull();
  });
});

describe('readDroppedImage', () => {
  it('prefers an image file', () => {
    expect(
      readDroppedImage(dataTransfer([text, image], { 'text/uri-list': 'https://example.com/a' })),
    ).toEqual({ type: 'file', file: image });
  });

  it('falls back to the first URL of a uri-list', () => {
    expect(
      readDroppedImage(
        dataTransfer([], { 'text/uri-list': '# comment\r\nhttps://example.com/a.png\r\n' }),
      ),
    ).toEqual({ type: 'url', url: 'https://example.com/a.png' });
  });

  it('falls back to plain text', () => {
    expect(
      readDroppedImage(dataTransfer([], { 'text/plain': 'https://example.com/a.png' })),
    ).toEqual({ type: 'url', url: 'https://example.com/a.png' });
  });

  it('returns null when there is no image', () => {
    expect(readDroppedImage(dataTransfer([text], { 'text/plain': 'cat' }))).toBeNull();
  });
});

describe('Lens panel', () => {
  it('searches for an entered image URL', () => {
    openPanel();

    const input = screen.getByRole<HTMLInputElement>('textbox', { name: '画像の URL' });
    fireEvent.change(input, { target: { value: 'https://example.com/a.png' } });
    fireEvent.submit(input.form as HTMLFormElement);

    expect(submittedForm()).toMatchObject({
      action: 'https://lens.google.com/uploadbyurl',
      method: 'get',
    });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('shows an error for an invalid URL', () => {
    openPanel();

    const input = screen.getByRole<HTMLInputElement>('textbox', { name: '画像の URL' });
    fireEvent.change(input, { target: { value: 'file:///a.png' } });
    fireEvent.submit(input.form as HTMLFormElement);

    expect(submit).not.toHaveBeenCalled();
    expect(screen.getByRole('alert').textContent).toContain('画像 URL');
  });

  it('uploads a dropped image', () => {
    openPanel();

    dispatchWithData('drop', 'dataTransfer', dataTransfer([image]));

    expect(submittedForm()).toMatchObject({
      action: 'https://lens.google.com/v3/upload',
      method: 'post',
      enctype: 'multipart/form-data',
    });
  });

  it('uploads a pasted image', () => {
    openPanel();

    dispatchWithData('paste', 'clipboardData', dataTransfer([image]));

    expect(submittedForm()).toMatchObject({ action: 'https://lens.google.com/v3/upload' });
  });

  it('does not move focus to the URL input when opened', () => {
    openPanel();

    expect(document.activeElement).not.toBe(screen.getByRole('textbox', { name: '画像の URL' }));
  });

  it('searches for a URL pasted outside the URL input', () => {
    openPanel();

    dispatchWithData('paste', 'clipboardData', dataTransfer([], { 'text/plain': 'https://a.jp' }));

    expect(submittedForm()).toMatchObject({ action: 'https://lens.google.com/uploadbyurl' });
  });

  it('leaves text pasted into the URL input to the input', () => {
    openPanel();

    const input = screen.getByRole('textbox', { name: '画像の URL' });
    fireEvent.paste(input, {
      clipboardData: dataTransfer([], { 'text/plain': 'https://a.jp' }),
    });

    expect(submit).not.toHaveBeenCalled();
  });

  it('does not send a pasted image while the panel is closed', () => {
    render(<App />);

    dispatchWithData('paste', 'clipboardData', dataTransfer([image]));

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
