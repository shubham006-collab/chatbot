'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.push('/chat');
  }, [router]);

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950 text-sm text-neutral-500 font-medium">
      Redirecting to chat...
    </div>
  );
}
