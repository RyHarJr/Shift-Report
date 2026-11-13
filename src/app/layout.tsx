import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import { ToastProvider } from "@/components/ui/Toast";
import "./globals.css";

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Shift Report — PT Tanjung Enim Lestari",
  description:
    "Sistem pencatatan Shift Report inspeksi kualitas chip dan kondisi chipper PT Tanjung Enim Lestari.",
  icons: {
    icon: "/Andritz-Symbol.png",
    shortcut: "/Andritz-Symbol.png",
    apple: "/Andritz-Symbol.png",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="id"
      className={`${ibmPlexSans.variable} ${ibmPlexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
