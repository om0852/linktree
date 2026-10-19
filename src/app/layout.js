import { Inter, Fira_Code } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const firaCode = Fira_Code({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata = {
  title: "TreeInBio Atelier — Ultra-Luxury Bio-Link & Creator Studio Platform",
  description: "Next-Gen Bio-Link & Digital Marketing Studio with Editorial Aesthetic, Bento Box Grid, AI CTR Optimizer, and Native Monetization.",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${firaCode.variable} h-full antialiased`}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Abril+Fatface&family=Audiowide&family=Bangers&family=Bebas+Neue&family=Bungee&family=Caveat:wght@600&family=Cinzel:wght@600&family=Comfortaa:wght@600&family=Creepster&family=Dancing+Script:wght@600&family=Faster+One&family=Fredoka:wght@600&family=Great+Vibes&family=Lobster&family=Monoton&family=Pacifico&family=Permanent+Marker&family=Playfair+Display:ital,wght@0,600;1,600&family=Press+Start+2P&family=Righteous&family=Russo+One&family=Sacramento&family=Satisfy&family=Shrikhand&family=Special+Elite&family=Syne:wght@700&family=Titan+One&family=Ultra&family=Plus+Jakarta+Sans:wght@500;700&family=Space+Grotesk:wght@500;700&display=swap"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
        />
      </head>
      <body className="min-h-full flex flex-col bg-[#FFFEFA] text-[#28352F] font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
