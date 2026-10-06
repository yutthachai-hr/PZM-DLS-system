import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans_Thai, Kanit } from "next/font/google";
import "./globals.css";

const display = Kanit({
  variable: "--font-kanit",
  subsets: ["latin", "thai"],
  weight: ["500", "600", "700"],
});

const body = IBM_Plex_Sans_Thai({
  variable: "--font-plex",
  subsets: ["latin", "thai"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: { default: "Pizza Mania · Daily Sales", template: "%s · Pizza Mania" },
  description: "บันทึกและสรุปยอดขายรายวัน Pizza Mania",
};

export const viewport: Viewport = {
  themeColor: "#d7261e",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th" className={`${display.variable} ${body.variable}`}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
