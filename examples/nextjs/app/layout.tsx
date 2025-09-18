import { Metadata } from 'next';
import { PostHogProvider } from './providers';

export const metadata: Metadata = {
  title: 'Next.js HogTyped Example',
  description: 'Type-safe analytics with generated PostHog wrapper',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <PostHogProvider>{children}</PostHogProvider>
      </body>
    </html>
  );
}