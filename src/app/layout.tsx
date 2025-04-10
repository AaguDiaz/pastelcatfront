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
            <a href="/" className="text-2xl font-bold">Pastel Cat</a>
            <div className="space-x-6">
              <a href="/" className="hover: transition">Inicio</a>
              <a href="/login" className="hover: transition">Iniciar Sesión</a>
            </div>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}
