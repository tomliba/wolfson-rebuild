import { Heebo } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";

const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  weight: ["400", "500", "700"],
  variable: "--font-heebo",
});

export const metadata = {
  title: "CataractMentor Wolfson",
  description: "מערכת מעקב הכשרת קטרקט - וולפסון",
};

export default function RootLayout({ children }) {
  return (
    <html lang="he" dir="rtl">
      <body className={heebo.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
