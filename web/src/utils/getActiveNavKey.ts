/**
 * Picks which nav key should be marked active for the current pathname, so a child route
 * (e.g. `/admin/classes/123/edit`) still highlights its parent nav item (`/admin/classes`)
 * instead of highlighting nothing. Matches exactly or on a `/`-bounded prefix, and when
 * multiple keys match (nested sections), the longest (most specific) one wins.
 */
export const getActiveNavKey = (pathname: string, keys: string[]): string | undefined => {
  const matches = keys.filter((key) => pathname === key || pathname.startsWith(`${key}/`));

  if (matches.length === 0) {
    return undefined;
  }

  return matches.reduce((longest, key) => (key.length > longest.length ? key : longest));
};
