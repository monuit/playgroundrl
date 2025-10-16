import { Layout } from '@/components/dom/Layout'
import '@/globals.css'
import localFont from 'next/font/local'
import { cn } from './lib/utils'
import { Toaster } from '@/components/ui/sonner'
import { Metadata } from 'next'

const krypton = localFont({ src: '../public/krypton.otf' })

export const metadata: Metadata = {
  appleWebApp: true,
  metadataBase: new URL('https://playgroundrl.vercel.app'),
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/bunny.png',
    shortcut: '/favicon.ico',
  },
  openGraph: {
    url: 'https://playgroundrl.vercel.app',
    title: 'PlaygroundRL',
    description: 'An interactive reinforcement learning playground on the web.',
    images: ['/bunnycard.png'],
  },
  title: 'PlaygroundRL',
  description: 'An interactive reinforcement learning playground on the web.',
  twitter: {
    card: 'summary_large_image',
    site: 'playgroundrl.vercel.app',
    creator: '@playgroundrl',
    images: ['/bunnycard.png'],
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang='en' className={cn('antialiased dark', krypton.className)} suppressHydrationWarning>
      <head />
      <body>
        <Layout>{children}</Layout>
        <Toaster duration={2000} richColors />
      </body>
    </html>
  )
}
