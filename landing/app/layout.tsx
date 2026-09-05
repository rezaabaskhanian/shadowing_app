import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LingoFlow — یادگیری زبان با شدوئینگ",
  description: "اپلیکیشن یادگیری زبان انگلیسی با روش شدوئینگ (Shadowing)",
  metadataBase: new URL("https://www.lingoflow.ir"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Lalezar&family=Vazirmatn:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
