'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function FarmerCompleteProfileRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/auth/complete-profile?role=farmer');
  }, [router]);

  return null;
}
