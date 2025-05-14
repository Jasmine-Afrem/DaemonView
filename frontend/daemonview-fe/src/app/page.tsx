'use client'

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import GlobalStyles from '../styles/GlobalStyles';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push('/login');
  }, [router]);

  return null;
}
