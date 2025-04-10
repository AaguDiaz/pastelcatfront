import Link from 'next/link';
import './globals.css';

export const metadata = {
  title: 'Pastel Cat',
  description: 'Gestión integral para pastelerías y catering',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-pastel-cream">
        <nav className="bg-pastel-pink p-4 shadow-md">
          <div className="flex justify-between items-center px-10">
            <Link href="/" className="text-2xl font-bold">Pastel Cat</Link>
            <div className="space-x-6">
              <Link href="/" className="hover: transition">Inicio</Link>
              <Link href="/login" className="hover: transition">Iniciar Sesión</Link>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
