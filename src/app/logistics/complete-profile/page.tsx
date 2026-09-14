'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LogisticsCompleteProfileRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/auth/complete-profile?role=logistics');
  }, [router]);

  return null;
}
