import type { Metadata } from "next";
import { Alegreya, Almendra } from "next/font/google";
import "./globals.css";

const alegreya = Alegreya({
  variable: "--font-alegreya",
  subsets: ["latin"],
});

// Aproximação Google Fonts da Luminari, fonte dos títulos de facção do jogo
const almendra = Almendra({
  variable: "--font-almendra",
  weight: ["400", "700"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Root Ranking",
  description: "Ranking de partidas de Root entre amigos",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      className={`${alegreya.variable} ${almendra.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
