export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-pastel-cream">
      <h1 className="text-5xl mb-4">PastelCat</h1>
      <p className="text-lg max-w-md text-center">
        Tu solución integral para pastelerías y catering.
      </p>
      <button className="mt-6 px-6 py-2 bg-pastel-blue font-medium rounded-2xl shadow-md hover:bg-pastel-pink transition">
        Comenzar
      </button>
  </div>
  );
}