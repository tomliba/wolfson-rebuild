import { Heebo } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import ServiceWorkerRegistration from "@/components/ServiceWorkerRegistration";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  weight: ["400", "500", "700"],
  variable: "--font-heebo",
});

export const metadata = {
  title: "CataractMentor Wolfson",
  description: "מערכת מעקב הכשרת קטרקט - וולפסון",
  manifest: "/manifest.json",
  themeColor: "#1a73c8",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "הכשרת קטרקט",
  },
  icons: {
    icon: "/icons/icon-192x192.png",
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport = {
  themeColor: "#1a73c8",
};

export default function RootLayout({ children }) {
  return (
    <html lang="he" dir="rtl">
      <body className={heebo.className}>
        <ServiceWorkerRegistration />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
