'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TaxisRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/');
  }, [router]);

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="w-8 h-8 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
