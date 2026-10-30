import { ScrollViewStyleReset, useServerDocumentContext } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

// Web-only shell: PWA manifest, home-screen icons, service worker, and a themed background before JS loads.
export default function Root({ children }: PropsWithChildren) {
  const { headNodes, bodyNodes, htmlAttributes, bodyAttributes } = useServerDocumentContext();
  return (
    <html lang="en" {...htmlAttributes}>
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover" />
        <title>Gvozdi</title>
        <meta name="description" content="A calm companion for nail-board practice" />
        <meta property="og:title" content="Gvozdi" />
        <meta property="og:description" content="A calm companion for nail-board practice" />
        <meta property="og:url" content="https://gvozdi.expo.app" />
        <meta property="og:image" content="https://gvozdi.expo.app/og.png" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="theme-color" content="#f5efe6" media="(prefers-color-scheme: light)" />
        <meta name="theme-color" content="#1b1611" media="(prefers-color-scheme: dark)" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Gvozdi" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: css }} />
        <script dangerouslySetInnerHTML={{ __html: sw }} />
        {headNodes}
      </head>
      <body {...bodyAttributes}>
        {children}
        {bodyNodes}
      </body>
    </html>
  );
}

const css = `body{background-color:#f5efe6}@media (prefers-color-scheme: dark){body{background-color:#1b1611}}`;

const sw = `// Chromium fires this once, often before React mounts; InstallHint shows the button instead of the browser's own bar.
window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); window.installPrompt = e; });
if ('serviceWorker' in navigator && location.hostname !== 'localhost') {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js'));
  navigator.serviceWorker.ready.then((r) => r.active && r.active.postMessage('warm'));
}`;
