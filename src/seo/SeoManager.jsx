import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useSiteInfo } from '../hooks/useSiteInfo';
import { fetchServices } from '../api/api';
import { resolveSeo, applyHead, matchPage } from '../../shared/seo/index.js';
import { loadSeoRecords } from './seoService';

// Services are cached once for the whole session (used for defaults + service-page schema).
let servicesCache = null;
let servicesInflight = null;
function loadServices() {
  if (servicesCache) return Promise.resolve(servicesCache);
  servicesInflight = servicesInflight || fetchServices().then(d => { servicesCache = Array.isArray(d) ? d : []; return servicesCache; }).catch(() => []).finally(() => { servicesInflight = null; });
  return servicesInflight;
}
/** Admin → Services saves call this so new/renamed services get fresh SEO defaults. */
export function invalidateSeoServices() { servicesCache = null; }

/**
 * Mount ONCE (in App). Watches the route and applies title / meta / OG / Twitter / canonical /
 * JSON-LD for every public page. Pages never touch <head> themselves.
 *
 * The server already injects the same tags into the first HTML response (see
 * functions/_middleware.js — or the equivalent hook on another host), so this component is the
 * fallback / update mechanism: it leaves the server tags alone until it has enough data to
 * produce the same (or newer) result, then re-applies on every client-side route change.
 *
 * Data flow:  useSiteInfo (doctor, settings, chambers)  +  services  +  SEO overrides
 *             → resolveSeo() (shared, pure)  → applyHead() (DOM)
 */
export default function SeoManager() {
  const { pathname } = useLocation();
  const { doctor, settings, chambers, loading } = useSiteInfo();
  const [records, setRecords] = useState(null);
  const [services, setServices] = useState(null);

  useEffect(() => {
    let alive = true;
    loadSeoRecords().then(r => alive && setRecords(r));
    loadServices().then(s => alive && setServices(s));
    return () => { alive = false; };
  }, [pathname]);

  useEffect(() => {
    const isAdmin = pathname === '/admin' || pathname.startsWith('/admin/');
    if (isAdmin) {
      // Admin: never indexable, no public metadata (title only).
      applyHead({ title: `Admin${doctor?.name ? ` | ${doctor.name}` : ''}`, robots: 'noindex, nofollow', minimal: true }, document);
      return;
    }
    if (!matchPage(pathname)) {
      // Unknown route: the server already answered 404 + noindex; mirror it client-side.
      if (loading && !doctor) return;
      applyHead({ title: `Page not found${doctor?.name ? ` | ${doctor.name}` : ''}`, robots: 'noindex, nofollow', minimal: true }, document);
      return;
    }
    if (loading || !records || !services) return;            // keep the server-rendered tags until we have data

    const siteUrl = (settings?.seo_site_url || records.siteUrl || window.location.origin).replace(/\/+$/, '');
    const seo = resolveSeo({ path: pathname, doctor, settings, chambers, services, servicesKnown: true, records: records.records, siteUrl });
    applyHead(seo, document);
  }, [pathname, doctor, settings, chambers, services, records, loading]);

  return null;
}
