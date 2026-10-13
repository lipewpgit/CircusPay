import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "CircusPay", template: "%s | CircusPay" },
  description: "Gestão de pagamentos, produtos e saques.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/circuspay-original-v5-192.png", apple: "/circuspay-original-touch-v5.png" },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#080808" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body>{children}<Toaster richColors position="top-right" /></body></html>;
}
