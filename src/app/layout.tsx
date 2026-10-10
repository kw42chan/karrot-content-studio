import type { Metadata } from "next";
import { Anton, Roboto } from "next/font/google";
import "./globals.css";

const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-anton",
});

const roboto = Roboto({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-roboto",
});

export const metadata: Metadata = {
  title: "Karrot Content Studio",
  description: "Private content marketing CMS for Karrot Digital",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant-HK">
      <body className={`${anton.variable} ${roboto.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
