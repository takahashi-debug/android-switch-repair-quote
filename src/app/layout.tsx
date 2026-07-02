import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "修理問い合わせ対応アシスト",
  description: "Android / Nintendo Switch修理の問い合わせ対応を補助する業務用モックアプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
