import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";
import OnboardingModal from "@/components/ui/OnboardingModal";

export const metadata: Metadata = {
  title: "ASCENSION",
  description: "v7.0 // ETERNAL",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css"
        />
      </head>
      <body>
        <OnboardingModal />
        <Sidebar />
        <div className="main">
          {children}
        </div>
      </body>
    </html>
  );
}
