import type { Metadata } from "next";
import { Figtree, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { THEME_SCRIPT } from "@/lib/themeScript";

const figtree = Figtree({
  variable: "--font-figtree",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "IntuitionRewire — Learn DSA by Watching It Run",
  description:
    "Rewire your intuition for algorithms and memory physics through step-by-step visual dry-runs.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // The theme script below sets the `dark` class before React hydrates.
    <html
      lang="en"
      className={`${figtree.variable} ${jetbrainsMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
      </head>
      <body className="min-h-full flex flex-col bg-surface font-body-md text-on-surface">
        <Header />
        <div className="flex flex-col flex-1 pt-header-height">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
