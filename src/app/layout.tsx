import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Inmueble Virtual Showcase | Real Estate Revolution",
  description: "Virtual staging and automated video showcase for high-end properties.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Manrope:wght@200;400;600;700;800&display=swap" rel="stylesheet" />
        
        {/* Style blocks for backwards capability with Tailwind vars */}
        <style dangerouslySetInnerHTML={{__html: `
          :root {
            --font-manrope: 'Manrope', sans-serif;
            --font-inter: 'Inter', sans-serif;
          }
        `}} />
      </head>
      <body className={`font-body bg-black`}>
        {children}
      </body>
    </html>
  );
}
