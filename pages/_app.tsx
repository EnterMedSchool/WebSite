import type { AppProps } from 'next/app';

// Transitional stub to ensure Next.js generates pages-manifest.json
// while the App Router is used for all routes. This avoids a build
// crash in certain Next.js versions when no Pages Router files exist.
export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

