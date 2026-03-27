import type { Metadata } from 'next'
import { Inter, Lora } from 'next/font/google'
import './globals.css'
import Providers from '@/components/Providers'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const lora = Lora({ subsets: ['latin'], variable: '--font-lora' })

export const metadata: Metadata = {
  title: 'Psico Agenda',
  description: 'Gestão de agenda e recibos para psicólogos',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className={`h-full ${inter.variable} ${lora.variable}`}>
      <body className={`${inter.className} h-full bg-[#F7F5F0] text-[#1C2B22]`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
