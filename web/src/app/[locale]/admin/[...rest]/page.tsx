import { notFound } from 'next/navigation';

/**
 * Catches any path inside the admin portal that doesn't match a real page (e.g. a typo'd URL).
 * Without this, Next.js treats such a path as having no match anywhere and skips straight past
 * this portal's not-found.tsx to its own generic default - not-found.tsx only fires for a path
 * that resolves to an actual page which then explicitly calls notFound(), which is exactly what
 * this catch-all does.
 */
const AdminCatchAllPage = () => {
  notFound();
};

export default AdminCatchAllPage;
