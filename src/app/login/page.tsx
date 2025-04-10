import Link from "next/link";

export default function Login() {
  return (
    <div className="min-h-screen flex items-start bg-pastel-cream justify-center pt-16 ">
        <div className="w-full max-w-md p-8 bg-pastel-beige shadow-2xl rounded-lg ">
          <h2 className="text-2xl font-bold mb-6 text-center">Iniciar Sesión</h2>
          <form className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium ">Correo</label>
              <input
                id="email"
                type="email"
                className="w-full p-2 mt-1 border rounded focus:outline-none focus:ring-2 focus:ring-pastel-blue"
                placeholder="tu@correo.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium">Contraseña</label>
              <input
                id="password"
                type="password"
                className="w-full p-2 mt-1 border rounded focus:outline-none focus:ring-2 focus:ring-pastel-blue"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2 bg-pastel-blue rounded-lg hover:bg-blue-500 transition"
            >
              Entrar
            </button>
          </form>
          <p className="mt-2 text-sm text-center ">
            ¿No tienes cuenta? <Link href="#" className="text-blue-500 hover:underline">Regístrate</Link>
          </p>
        </div>
      
    </div>
  );
}