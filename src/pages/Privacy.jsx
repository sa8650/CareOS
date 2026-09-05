export default function Privacy() {
  return (
    <div>
      <section className="page-hero">
        <div className="container">
          <h1>Privacy Policy</h1>
          <p>Last updated: January 2026</p>
        </div>
      </section>

      <section className="section">
        <div className="container privacy-content">
          <h2>Information We Collect</h2>
          <p>We collect personal information you provide when booking appointments, including your name, phone number, email address, and any messages you include. This information is used solely for managing your appointments and providing healthcare services.</p>

          <h2>How We Use Your Information</h2>
          <p>Your personal information is used to:</p>
          <ul>
            <li>Schedule and manage your appointments</li>
            <li>Contact you regarding your appointments</li>
            <li>Provide medical care and follow-up</li>
            <li>Improve our services</li>
          </ul>

          <h2>Information Security</h2>
          <p>We implement appropriate security measures to protect your personal information. Your data is stored securely and accessed only by authorized personnel.</p>

          <h2>Information Sharing</h2>
          <p>We do not sell, trade, or rent your personal information to third parties. Your information may be shared only as required by law or with your explicit consent.</p>

          <h2>Your Rights</h2>
          <p>You have the right to access, correct, or request deletion of your personal information. To exercise these rights, please contact us at info@drsarahmitchell.com.</p>

          <h2>Contact Us</h2>
          <p>If you have questions about this privacy policy, please contact us at:</p>
          <p>
            Mitchell Dermatology Clinic<br />
            123 Medical Plaza, Suite 200<br />
            New York, NY 10001<br />
            Phone: +1 (555) 123-4567<br />
            Email: info@drsarahmitchell.com
          </p>
        </div>
      </section>

      <style>{`
        .page-hero { padding: 8rem 0 3rem; background: linear-gradient(135deg, #f0f9ff, #e0f2fe); text-align: center; }
        .page-hero h1 { font-size: 2.5rem; margin-bottom: 0.5rem; }
        .page-hero p { color: var(--color-text-light); font-size: 1.1rem; }
        .privacy-content { max-width: 800px; }
        .privacy-content h2 { font-size: 1.5rem; margin: 2rem 0 0.75rem; }
        .privacy-content h2:first-child { margin-top: 0; }
        .privacy-content p { color: var(--color-text-light); line-height: 1.7; margin-bottom: 1rem; }
        .privacy-content ul { margin: 0.5rem 0 1.5rem 1.5rem; list-style: disc; }
        .privacy-content ul li { color: var(--color-text-light); margin-bottom: 0.5rem; }
      `}</style>
    </div>
  );
}
