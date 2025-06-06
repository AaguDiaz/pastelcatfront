'use client';

import {useState} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
const API_BASE_URL = 'http://localhost:5000'; //'https://pastelcatback.onrender.com';;

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try{
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({email, password})
      });
      const data = await res.json();

      if(!res.ok){
        throw new Error(data.message || "Error al iniciar sesión");
      }
      localStorage.setItem("token", data.session.access_token);
      router.push("/dashboard");
    } catch (err: unknown){
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
    } finally{
      setLoading(false);
    }
  };
    return (
      <div className="min-h-screen flex items-start bg-pastel-beige justify-center pt-16 ">
          <div className="w-full max-w-md p-8 bg-pastel-cream shadow-2xl rounded-lg ">
            <h2 className="text-2xl font-bold mb-6 text-center">Iniciar Sesión</h2>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium ">Correo</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2 mt-1 border rounded focus:ring-1"
                  placeholder="tu@correo.com"
                  required
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium">Contraseña</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-2 mt-1 border rounded focus:ring-1"
                  placeholder="••••••••"
                  required
                />
              </div>
              {error && <p className="text-red-500 text-sm text-center">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 bg-pastel-blue rounded-lg hover:bg-blue-500 transition"
              >
                {loading ? "Cargando..." : "Iniciar Sesión"}
              </button>
            </form>
            <p className="mt-2 text-sm text-center ">
              ¿No tienes cuenta? <Link href="#" className="text-blue-500 hover:underline">Regístrate</Link>
            </p>
          </div>
        
      </div>
    );
  
}