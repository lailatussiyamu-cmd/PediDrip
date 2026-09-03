import { Platform } from 'react-native';
import * as Print from 'expo-print';
import { buildTherapyHtml } from './printHtml';

// On web, expo-print ignores the html and just prints the current page.
// So we render our own document in a popup window (fallback: hidden iframe) and print that.
function webPrint(html) {
  const w = typeof window !== 'undefined' ? window.open('', '_blank') : null;
  if (w && w.document) {
    w.document.open();
    w.document.write(html);
    w.document.close();
    w.focus();
    setTimeout(() => { try { w.print(); } catch (e) {} }, 500);
    return;
  }
  // Popup blocked → hidden iframe
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';
  document.body.appendChild(iframe);
  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();
  setTimeout(() => {
    try { iframe.contentWindow.focus(); iframe.contentWindow.print(); }
    finally { setTimeout(() => iframe.remove(), 1500); }
  }, 500);
}

export async function printTherapy(states, bb, patient) {
  const html = buildTherapyHtml(states, bb, patient || {});
  if (Platform.OS === 'web') { webPrint(html); return; }
  await Print.printAsync({ html });
}

export { buildTherapyHtml };
