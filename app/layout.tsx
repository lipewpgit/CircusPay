import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "Sync Pay", template: "%s | Sync Pay" },
  description: "Gestão de pagamentos, produtos e saques.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/syncpay-logo-192.png", apple: "/syncpay-logo-touch.png" },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#080808" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}<Toaster richColors position="top-right" /></body></html>;
}
