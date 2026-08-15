import type { Metadata } from "next";
import "./globals.css";
import "./data-quality.css";
import "./polish.css";
import { QueryProvider } from "@/components/query-provider";

export const metadata: Metadata = {
  title: "ArcPay — Spend & Rewards",
  description: "A fast, data-heavy card payments dashboard.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
