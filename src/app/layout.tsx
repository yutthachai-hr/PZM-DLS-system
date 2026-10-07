import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

// LINE Seed Sans TH (SIL OFL 1.1, see ./fonts/OFL.txt) — same typeface as the PZM stock system.
const lineSeed = localFont({
  variable: "--font-line",
  display: "swap",
  src: [
    { path: "./fonts/LINESeedSansTH_W_Rg.woff2", weight: "400", style: "normal" },
    { path: "./fonts/LINESeedSansTH_W_Bd.woff2", weight: "700", style: "normal" },
  ],
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
    <html lang="th" className={lineSeed.variable}>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
