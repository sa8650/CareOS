// Privacy policy: default template + a tiny, safe markdown renderer.
// Supported syntax (kept deliberately small so non-technical admins can use it):
//   ## Heading          -> <h2>
//   ### Sub heading     -> <h3>
//   - bullet            -> <ul><li>
//   **bold**            -> <strong>
//   [text](https://..)  -> <a>
//   blank line          -> paragraph break
// Everything is HTML-escaped first, so admins cannot inject scripts.

export const DEFAULT_PRIVACY_POLICY = `## Information We Collect
We collect personal information you provide when booking appointments, including your name, phone number, email address, and any messages you include. This information is used solely for managing your appointments and providing healthcare services.

## How We Use Your Information
Your personal information is used to:
- Schedule and manage your appointments
- Contact you regarding your appointments
- Provide medical care and follow-up
- Improve our services

## Information Security
We implement appropriate security measures to protect your personal information. Your data is stored securely and accessed only by authorized personnel.

## Information Sharing
We do not sell, trade, or rent your personal information to third parties. Your information may be shared only as required by law or with your explicit consent.

## Your Rights
You have the right to access, correct, or request deletion of your personal information. To exercise these rights, please contact us using the details on our Contact page.

## Contact Us
If you have questions about this privacy policy, please contact us through the phone number or email address listed on our Contact page.`;

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function inline(text) {
  let out = escapeHtml(text);
  // links: [label](https://url)  (only http/https/mailto/tel allowed)
  out = out.replace(/\[([^\]]+)\]\(((?:https?:\/\/|mailto:|tel:)[^)\s]+)\)/g,
    (_, label, url) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${label}</a>`);
  // bold
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  return out;
}

export function renderSimpleMarkdown(src) {
  const lines = String(src || '').replace(/\r\n?/g, '\n').split('\n');
  const html = [];
  let para = [];
  let list = [];

  const flushPara = () => {
    if (para.length) { html.push(`<p>${para.map(inline).join('<br />')}</p>`); para = []; }
  };
  const flushList = () => {
    if (list.length) { html.push(`<ul>${list.map(li => `<li>${inline(li)}</li>`).join('')}</ul>`); list = []; }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const trimmed = line.trim();

    if (!trimmed) { flushPara(); flushList(); continue; }

    const h3 = trimmed.match(/^###\s+(.*)$/);
    const h2 = trimmed.match(/^##\s+(.*)$/);
    const h1 = trimmed.match(/^#\s+(.*)$/);
    const li = trimmed.match(/^[-*•]\s+(.*)$/);

    if (h3) { flushPara(); flushList(); html.push(`<h3>${inline(h3[1])}</h3>`); continue; }
    if (h2 || h1) { flushPara(); flushList(); html.push(`<h2>${inline((h2 || h1)[1])}</h2>`); continue; }
    if (li) { flushPara(); list.push(li[1]); continue; }

    flushList();
    para.push(trimmed);
  }
  flushPara(); flushList();
  return html.join('\n');
}
