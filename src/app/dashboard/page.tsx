'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Dashboard() {
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            router.push("/login");
        }
    }
    , [router]);

    return (
        <div className="min-h-screen flex items-center bg-pastel-cream justify-center ">
            <div className="w-full max-w-md p-8 bg-pastel-beige shadow-2xl rounded-lg mb-20">
                <h2 className="text-2xl font-bold mb-6 text-center">Bienvenido a Dashboard</h2>
                <p className="text-center">Aquí puedes ver tu información.</p>
            </div>
        </div>
    );
}