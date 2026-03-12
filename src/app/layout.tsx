import type { Metadata } from "next";
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import InitColorSchemeScript from '@mui/material/InitColorSchemeScript';
import { Providers } from './providers';
import { AppHeader } from '@/components/AppHeader';
import { FilterProvider } from '@/lib/filter-context';

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
        <InitColorSchemeScript />
        <AppRouterCacheProvider>
          <Providers>
            <FilterProvider>
              <AppHeader />
              {children}
            </FilterProvider>
          </Providers>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
