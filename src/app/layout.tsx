import type { Metadata } from 'next';
import { Inter, Source_Serif_4 } from 'next/font/google';
import { Footer } from '@/components/Footer';
import { TooltipProvider } from '@/components/ui/Tooltip';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const sourceSerif = Source_Serif_4({
  subsets: ['latin'],
  variable: '--font-source-serif',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: 'Dono do Capital — Capital x Trabalho no Brasil',
  description:
    'Simule sua trajetória financeira e descubra, com matemática transparente, como capital e trabalho operam de formas estruturalmente distintas no Brasil.',
  // Resolvida contra `metadataBase` — gera um <link rel="canonical"> absoluto em
  // cada página, usando a URL pública real do site (ver NEXT_PUBLIC_SITE_URL).
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Dono do Capital',
    description:
      'Simule sua trajetória financeira e descubra como capital e trabalho operam de formas estruturalmente distintas no Brasil.',
    type: 'website',
    locale: 'pt_BR',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${sourceSerif.variable}`}>
      <body className="flex min-h-screen flex-col overflow-x-hidden">
        <TooltipProvider>
          <div className="flex-1">{children}</div>
          <Footer />
        </TooltipProvider>
      </body>
    </html>
  );
}
