'use client';

/**
 * AutoReloadController: Completely disabled.
 * The application relies strictly on Supabase Realtime (postgres_changes)
 * with sub-second synchronization. Full-page polling/reloads are removed.
 */
export default function AutoReloadController() {
  return null;
}
