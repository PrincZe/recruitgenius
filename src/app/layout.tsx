import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { UserProvider } from "@/lib/contexts/UserContext";
import { DeepgramContextProvider } from "@/lib/contexts/DeepgramContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "RecruitGenius - AI Interview Platform",
  description: "AI-powered interview platform for automated candidate screening",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <UserProvider>
          <DeepgramContextProvider>
            {children}
          </DeepgramContextProvider>
        </UserProvider>
      </body>
    </html>
  );
}
