import type { Metadata } from "next";
import { Sora, Instrument_Serif, IBM_Plex_Mono } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const sora = Sora({ variable: "--font-sora", subsets: ["latin"], display: "swap" });

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "HASHLAB — Integridad, firmas y contraseñas",
  description: "Aplicación de algoritmos hash: SHA-256, SHA-384, SHA-512, bcrypt, sha256crypt y PBKDF2.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${sora.variable} ${instrumentSerif.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-svh bg-ink text-paper">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
