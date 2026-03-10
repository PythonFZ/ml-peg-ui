import type { Metadata } from "next";

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
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
