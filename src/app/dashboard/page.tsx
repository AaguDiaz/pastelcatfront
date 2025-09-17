'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

import CorePedidos from '@/components/dashboard/CorePedidos';

export default function Dashboard() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  return (
    <div className='min-h-screen bg-pastel-beige'>
      <CorePedidos />
    </div>
  );
}
