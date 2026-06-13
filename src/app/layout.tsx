import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/Providers";
import { UpdateModal } from "@/components/UpdateModal";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://peerpizza.appwrite.network"),
  title: {
    default: "PeerPizza - Secure P2P & Relay File Sharing",
    template: "%s | PeerPizza",
  },
  description:
    "Share files directly with peers (P2P) or use our secure Relay for 24h temporary links. No sign-up required, end-to-end encrypted, and unlimited P2P transfer size.",
  keywords: [
    "file sharing",
    "p2p",
    "peer to peer",
    "secure file transfer",
    "encrypted sharing",
    "large file transfer",
    "no signup",
    "relay transfer",
    "temporary file hosting",
  ],
  authors: [
    { name: "Vishvajeet Shukla", url: "https://vishvajeetshukla.vercel.app/" },
  ],
  creator: "Vishvajeet Shukla",
  publisher: "PeerPizza",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "PeerPizza - Secure P2P & Relay File Sharing",
    description:
      "Share files directly with peers (P2P) or use our secure Relay for 24h temporary links. No sign-up required.",
    url: "https://peerpizza.appwrite.network",
    siteName: "PeerPizza",
    images: [
      {
        url: "/og-image.png", // We'll need to ensure this exists or use a default
        width: 1200,
        height: 630,
        alt: "PeerPizza - Secure File Sharing",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "PeerPizza - Secure P2P & Relay File Sharing",
    description:
      "Share files directly with peers (P2P) or use our secure Relay for 24h temporary links.",
    creator: "@vishu_07", // Assuming discord handle or similar
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://peerpizza.appwrite.network",
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          {children}
          <UpdateModal />
        </Providers>
      </body>
    </html>
  );
}
