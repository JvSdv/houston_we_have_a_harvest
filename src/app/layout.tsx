import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "weharvest · Houston, We Have a Harvest",
  description:
    "If I plant soybeans on this date, in how many of the last 45 years would the second-crop corn have met frost or drought in its critical stage? Decision support built on NASA POWER daily data since 1981.",
};

export const viewport: Viewport = {
  themeColor: "#0A1424",
  colorScheme: "light",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${archivo.variable} ${plexMono.variable} h-full antialiased`}>
      <body className="min-h-full bg-palha text-texto font-sans">{children}</body>
    </html>
  );
}
