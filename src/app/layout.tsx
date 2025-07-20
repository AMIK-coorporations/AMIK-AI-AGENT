import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { Noto_Naskh_Arabic, Orbitron, Source_Code_Pro } from 'next/font/google';

export const metadata: Metadata = {
  title: 'AMIK AI AGENT',
  description: 'Urdu AI Agent with reactive visuals',
};

const naskh = Noto_Naskh_Arabic({
  subsets: ['arabic'],
  display: 'swap',
  variable: '--font-naskh',
});

const orbitron = Orbitron({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-orbitron',
});

const sourceCodePro = Source_Code_Pro({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-source-code-pro',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ur" dir="rtl" className="dark">
      <body className={`${naskh.variable} ${orbitron.variable} ${sourceCodePro.variable} font-body antialiased bg-background`}>
        {children}
        <Toaster/>
      </body>
    </html>
  );
}
