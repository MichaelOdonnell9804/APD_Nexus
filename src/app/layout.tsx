import './globals.css';
import 'katex/dist/katex.min.css';
import { Space_Grotesk } from 'next/font/google';
import { Shell } from '@/components/layout/shell';
import { getUserAndProfile } from '@/lib/auth';

const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-sans' });

export const metadata = {
  title: 'APD Nexus',
  description: 'Internal collaboration platform for Texas Tech APD Lab'
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await getUserAndProfile();

  return (
    <html lang="en" className={spaceGrotesk.variable}>
      <body>{profile ? <Shell profile={profile}>{children}</Shell> : children}</body>
    </html>
  );
}
