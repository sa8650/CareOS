/**
 * CareOS SEO core — provider-independent, framework-independent.
 *
 *   import { resolveSeo, applyHead, renderHeadHtml, PAGES, ... } from '../shared/seo/index.js'
 *
 * Nothing in this folder may import React, Cloudflare, or database code.
 */
export * from './pages.js';
export * from './schema.js';
export * from './defaults.js';
export * from './structuredData.js';
export * from './resolve.js';
export * from './head.js';
export * from './sitemap.js';
export * from './content.js';
