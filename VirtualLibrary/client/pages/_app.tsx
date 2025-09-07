import '../styles/globals.css';
import '../styles/spinner.css';
import { useEffect, useState } from 'react';
import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'react-hot-toast';
import { RecoilRoot } from 'recoil';
import type { AppProps } from 'next/app';
import Header from '../components/Header/Header';

function MyApp({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  const [isSSR, setIsSSR] = useState(true);

  useEffect(() => {
    setIsSSR(false);
  }, []);
  if (isSSR) return null;
  return (
    <SessionProvider session={session}>
      <RecoilRoot>
        <Header />
        <Toaster />
        <main className="container mx-auto">
          <Component {...pageProps} />
        </main>
      </RecoilRoot>
    </SessionProvider>
  );
}

export default MyApp;
