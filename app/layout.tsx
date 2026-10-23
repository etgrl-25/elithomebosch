import type { Metadata } from 'next';
import './globals.css';
export const metadata:Metadata={title:'Elit home · Satış ve Ciro Takibi',description:'Elit home beyaz eşya mağazası satış ve ciro yönetimi.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="tr"><body>{children}</body></html>}
