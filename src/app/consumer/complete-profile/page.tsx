'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ConsumerCompleteProfileRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/auth/complete-profile?role=consumer');
  }, [router]);

  return null;
}
