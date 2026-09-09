import { json } from './_middleware.js';
import { parseSectionRow } from './_lib/sections.js';

/** Public: GET /api/sections -> active featured sections for the Home page */
export async function onRequestGet(context) {
  const db = context.env.DB;
  try {
    const { results } = await db
      .prepare('SELECT * FROM home_sections WHERE is_active = 1 ORDER BY display_order ASC, id ASC')
      .all();
    return new Response(JSON.stringify(results.map(parseSectionRow)), {
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  } catch (err) {
    // Table not created yet (migration 002 not run) -> empty list instead of a broken home page
    if (/no such table/i.test(err?.message || '')) return json([]);
    return json({ error: err.message }, 500);
  }
}
