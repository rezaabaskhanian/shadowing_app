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
      <body>{children}</body>
    </html>
  );
}
