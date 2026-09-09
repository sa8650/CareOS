import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * React Router keeps the previous scroll position when the route changes
 * (single-page app). On a phone that meant e.g. pressing "Confirm booking" at the
 * bottom of the form and landing on the confirmation page already scrolled to the
 * middle. Reset to the top on every path change (hash links are left alone).
 */
export default function ScrollToTop() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname, hash]);
  return null;
}
