import type { Metadata } from "next";
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { getInitColorSchemeScript } from '@mui/material/styles';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: "ML-PEG Leaderboard",
  description: "Machine Learning Interatomic Potentials benchmarking leaderboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        {getInitColorSchemeScript()}
        <AppRouterCacheProvider>
          <Providers>
            {children}
          </Providers>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
