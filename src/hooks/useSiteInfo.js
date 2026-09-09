import { useEffect, useState } from 'react';
import { fetchDoctor, fetchSettings, fetchChambers } from '../api/api';
import { SOCIAL_PLATFORMS, socialHref } from '../utils/helpers';

// Module-level cache so Navbar / Footer / Contact don't each re-fetch.
let cache = null;
let inflight = null;

async function load() {
  const [doctor, settings, chambers] = await Promise.all([
    fetchDoctor().catch(() => null),
    fetchSettings().catch(() => ({})),
    fetchChambers().catch(() => []),
  ]);

  const s = settings || {};
  const pick = (...vals) => vals.find(v => v != null && String(v).trim() !== '') || '';

  // Admin → Settings → Contact Information wins; doctor profile is the fallback.
  const contact = {
    phone: pick(s.phone, doctor?.phone),
    email: pick(s.email, doctor?.email),
    address: pick(s.address, doctor?.address, chambers?.[0]?.address),
    clinic_name: pick(s.clinic_name, doctor?.clinic_name),
  };

  const socials = SOCIAL_PLATFORMS
    .map(p => ({ ...p, value: s[`social_${p.key}`], href: socialHref(p.key, s[`social_${p.key}`]) }))
    .filter(p => p.href);

  return { doctor, settings: s, chambers: chambers || [], contact, socials };
}

/**
 * Site-wide public info: doctor profile + admin settings (contact, socials) + chambers.
 * Returns { doctor, settings, chambers, contact, socials, loading }.
 */
export function useSiteInfo() {
  const [info, setInfo] = useState(cache);

  useEffect(() => {
    if (cache) { setInfo(cache); return; }
    inflight = inflight || load().then(data => { cache = data; return data; }).finally(() => { inflight = null; });
    let alive = true;
    inflight.then(data => { if (alive) setInfo(data); });
    return () => { alive = false; };
  }, []);

  return {
    doctor: info?.doctor || null,
    settings: info?.settings || {},
    chambers: info?.chambers || [],
    contact: info?.contact || { phone: '', email: '', address: '', clinic_name: '' },
    socials: info?.socials || [],
    loading: !info,
  };
}

/** Call after admin saves settings/profile so public pages refetch next time. */
export function invalidateSiteInfo() { cache = null; }
