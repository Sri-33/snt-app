import { Capacitor } from '@capacitor/core';
import { PRINT_PAGE_STYLE } from '../components/CourierSlip';

export const isNativePlatform = Capacitor.isNativePlatform();

export function buildPrintDocument(innerHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Sri Nandhini Tex - Courier Slip</title>
<style>
  html, body { margin: 0; padding: 0; background: #fff; }
  ${PRINT_PAGE_STYLE}
</style>
</head>
<body>
${innerHtml}
</body>
</html>`;
}

// Print an element's content. On web, open a new window and print. On native,
// write to a file and open the share sheet (browser/PDF print from there).
export async function printElement(node) {
  if (!node) return;
  if (isNativePlatform) {
    await nativePrintNode(node);
    return;
  }
  const html = buildPrintDocument(node.innerHTML);
  const win = window.open('', '_blank');
  if (!win) throw new Error('Popup blocked — allow popups to print.');
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => {
    win.print();
  }, 350);
}

export function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Open a full HTML document string: web opens a new tab; native writes a file
// and opens the share sheet so it can be opened in a browser to print/save.
export async function openHtmlString(html, baseName = 'sri-nandhini-tex-report') {
  if (isNativePlatform) {
    const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');
    const { Share } = await import('@capacitor/share');
    const fileName = `${baseName}-${Date.now()}.html`;
    await Filesystem.writeFile({ path: fileName, data: html, directory: Directory.Cache, encoding: Encoding.UTF8 });
    const { uri } = await Filesystem.getUri({ path: fileName, directory: Directory.Cache });
    await Share.share({ title: 'Sri Nandhini Tex Report', url: uri });
    return;
  }
  const win = window.open('', '_blank');
  if (!win) throw new Error('Popup blocked — allow popups to export.');
  win.document.open();
  win.document.write(html);
  win.document.close();
  win.focus();
}

// Save (web) or share (native) a base64-encoded binary file (xlsx, png, etc.).
export async function saveBase64File(base64, fileName, mimeType) {
  if (!isNativePlatform) {
    const a = document.createElement('a');
    a.href = `data:${mimeType};base64,${base64}`;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    return;
  }
  const { Filesystem, Directory } = await import('@capacitor/filesystem');
  const { Share } = await import('@capacitor/share');
  await Filesystem.writeFile({ path: fileName, data: base64, directory: Directory.Cache });
  const { uri } = await Filesystem.getUri({ path: fileName, directory: Directory.Cache });
  await Share.share({ title: fileName, url: uri });
}

// On Android/iOS WebView, window.print() is unavailable. Instead we write the
// slip HTML to a cache file and open the system share sheet so the user can
// open it in a browser and use its built-in print / save-as-PDF.
export async function nativePrintNode(node) {
  if (!node) return;
  const html = buildPrintDocument(node.innerHTML);

  const { Filesystem, Directory, Encoding } = await import('@capacitor/filesystem');
  const { Share } = await import('@capacitor/share');

  const fileName = `sri-nandhini-tex-slip-${Date.now()}.html`;
  await Filesystem.writeFile({
    path: fileName,
    data: html,
    directory: Directory.Cache,
    encoding: Encoding.UTF8,
  });
  const { uri } = await Filesystem.getUri({ path: fileName, directory: Directory.Cache });

  await Share.share({
    title: 'Sri Nandhini Tex - Courier Slip',
    dialogTitle: 'Open in a browser to print or save as PDF',
    url: uri,
  });
}
