import type { Metadata } from "next";
import { Inter, Space_Grotesk, JetBrains_Mono } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PMBR | Prediction Market Battle Royale",
  description:
    "100 players. One prize pool. Last one standing takes the pot. Predict price movements, survive elimination rounds, and win big.",
  openGraph: {
    title: "PMBR | Prediction Market Battle Royale",
    description:
      "Predict. Compete. Survive. Last one standing takes the pot.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PMBR | Prediction Market Battle Royale",
    description:
      "Predict. Compete. Survive. Last one standing takes the pot.",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable} font-sans bg-surface-950 text-surface-50 antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
