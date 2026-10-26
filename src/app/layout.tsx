import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Opportunity Hub | Palatine",
  description:
    "Discover local careers, events, and connections in the Palatine community.",
  icons: {
    icon: "/hub-mark.svg",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
