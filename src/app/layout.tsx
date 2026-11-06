import type { Metadata } from "next";
import { Figtree, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NavigationProgress from "@/components/NavigationProgress";
import { THEME_SCRIPT } from "@/lib/themeScript";
import { POSTHOG_SCRIPT } from "@/lib/posthogScript";
import { DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL } from "@/lib/seo";

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

// Defaults for every page; pages set their own through pageMetadata() in @/lib/seo.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  title: "IntuitionRewire: Learn DSA by Watching It Run",
  description:
    "Learn data structures and algorithms by watching them run: hand-drawn lessons, step-by-step dry-run simulators and interview problems in four languages.",
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: "en_US",
    images: [{ url: DEFAULT_OG_IMAGE.url, width: 1200, height: 630, alt: DEFAULT_OG_IMAGE.alt }],
  },
  twitter: { card: "summary_large_image", images: [DEFAULT_OG_IMAGE.url] },
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
        {/* Analytics only on the built site, so local development sends nothing. */}
        {process.env.NODE_ENV === "production" && (
          <script dangerouslySetInnerHTML={{ __html: POSTHOG_SCRIPT }} />
        )}
      </head>
      <body className="min-h-full flex flex-col bg-surface font-body-md text-on-surface">
        <NavigationProgress />
        <Header />
        <div className="flex flex-col flex-1 pt-header-height">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
