// Seed script
//   Local  DB:  npm run seed          (after npm run db:migrate:local)
//   Remote DB:  npm run seed:remote   (after npm run db:migrate)
//
// All statements use INSERT OR IGNORE / only-if-empty guards, so re-running is safe.

import { execSync } from 'child_process';
import { writeFileSync, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';

const REMOTE = process.argv.includes('--remote');
const TARGET_FLAG = REMOTE ? '--remote' : '--local';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@clinic.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// Simple SHA-256 hash (same as in the API)
async function hashPassword(password) {
  const { createHash } = await import('crypto');
  return createHash('sha256').update(password).digest('hex');
}

async function seed() {
  const hash = await hashPassword(ADMIN_PASSWORD);

  const queries = [
    // Admin
    `INSERT OR IGNORE INTO admins (name, email, password_hash, role) VALUES ('Admin', '${ADMIN_EMAIL}', '${hash}', 'admin')`,

    // Doctor profile
    `INSERT OR IGNORE INTO doctor_profile (id, name, title, bio, profile_image, qualifications, specializations, experience, clinic_name, phone, email, address)
     VALUES (1, 'Dr. Sarah Mitchell', 'Board-Certified Dermatologist',
     'With over 15 years of experience in dermatology, Dr. Sarah Mitchell combines medical expertise with a compassionate approach to deliver exceptional patient care. Specializing in medical, surgical, and cosmetic dermatology.',
     NULL,
     '["MD - Harvard Medical School", "Residency - Johns Hopkins Dermatology", "Board Certified - American Board of Dermatology", "Fellow - American Academy of Dermatology"]',
     '["Medical Dermatology", "Cosmetic Dermatology", "PRP Therapy", "Laser Treatments", "Mohs Surgery"]',
     '15+ years of experience in medical, surgical, and cosmetic dermatology.',
     'Mitchell Dermatology Clinic', '+1 (555) 123-4567', 'info@drsarahmitchell.com',
     '123 Medical Plaza, Suite 200, New York, NY 10001')`,

    // Services
    `INSERT OR IGNORE INTO services (name, slug, description, price, duration_minutes, benefits, faq, is_active) VALUES
     ('Acne Treatment', 'acne-treatment', 'Comprehensive acne treatment plans customized for your skin type, including topical treatments, chemical peels, and advanced therapies for lasting clear skin.', 150, 30,
     '["Clearer skin within weeks", "Reduced scarring", "Personalized treatment plan", "Long-lasting results"]',
     '[{"question":"How long until I see results?","answer":"Most patients see improvement within 4-6 weeks of starting treatment."},{"question":"Is the treatment painful?","answer":"Most treatments are comfortable with minimal discomfort."}]',
     1)`,

    `INSERT OR IGNORE INTO services (name, slug, description, price, duration_minutes, benefits, faq, is_active) VALUES
     ('Anti-Aging Treatment', 'anti-aging-treatment', 'Advanced anti-aging solutions including Botox, dermal fillers, and skin tightening treatments to restore youthful appearance and confidence.', 300, 45,
     '["Reduced wrinkles and fine lines", "Natural-looking results", "Minimal downtime", "Boosted confidence"]',
     '[{"question":"How long do results last?","answer":"Results vary by treatment: Botox lasts 3-6 months, fillers 6-18 months."},{"question":"Is there downtime?","answer":"Most treatments require minimal to no downtime."}]',
     1)`,

    `INSERT OR IGNORE INTO services (name, slug, description, price, duration_minutes, benefits, faq, is_active) VALUES
     ('PRP Hair Restoration', 'prp-hair-restoration', 'Platelet-Rich Plasma therapy using your body''s natural growth factors to stimulate hair follicles and promote natural hair regrowth.', 500, 60,
     '["Natural hair regrowth", "No surgery required", "Minimal side effects", "Visible results in 3-6 months", "Stimulates dormant follicles"]',
     '[{"question":"How many sessions do I need?","answer":"Typically 3-4 sessions spaced 4-6 weeks apart for optimal results."},{"question":"Does PRP hurt?","answer":"The procedure involves minimal discomfort with topical numbing available."}]',
     1)`,

    `INSERT OR IGNORE INTO services (name, slug, description, price, duration_minutes, benefits, faq, is_active) VALUES
     ('Laser Skin Resurfacing', 'laser-skin-resurfacing', 'State-of-the-art laser technology to improve skin texture, reduce scars, remove pigmentation, and rejuvenate your complexion.', 400, 45,
     '["Improved skin texture", "Reduced scars and pigmentation", "Collagen stimulation", "Even skin tone"]',
     '[{"question":"How many treatments will I need?","answer":"Most patients need 3-5 sessions for optimal results."},{"question":"What is the recovery time?","answer":"Recovery typically takes 5-7 days with redness and peeling."}]',
     1)`,

    `INSERT OR IGNORE INTO services (name, slug, description, price, duration_minutes, benefits, faq, is_active) VALUES
     ('Chemical Peel', 'chemical-peel', 'Professional-grade chemical peels to exfoliate damaged skin, improve texture, and reveal fresh, glowing skin underneath.', 200, 30,
     '["Brighter complexion", "Reduced fine lines", "Improved skin texture", "Even skin tone"]',
     '[{"question":"Is a chemical peel painful?","answer":"You may feel mild tingling or warmth, but most patients find it very tolerable."}]',
     1)`,

    `INSERT OR IGNORE INTO services (name, slug, description, price, duration_minutes, benefits, faq, is_active) VALUES
     ('Skin Cancer Screening', 'skin-cancer-screening', 'Thorough full-body skin examination using dermoscopy for early detection of skin cancer and suspicious lesions.', 175, 30,
     '["Early detection", "Peace of mind", "Expert evaluation", "Comprehensive examination"]',
     '[{"question":"How often should I get screened?","answer":"Annual screenings are recommended, or more frequently if you have risk factors."}]',
     1)`,

    // Chambers (each with its own default schedule: days / hours / daily limit)
    // visiting_days: JSON array of weekday numbers, 0=Sun ... 6=Sat
    `INSERT INTO chambers (name, address, phone, visiting_days, start_time, end_time, daily_limit, is_active, display_order)
     SELECT 'Dhaka Medical College', 'Secretariat Road, Dhaka 1000', '+880 1700-000001', '[0,1]', '15:00', '20:00', 10, 1, 0
     WHERE NOT EXISTS (SELECT 1 FROM chambers WHERE name = 'Dhaka Medical College')`,
    `INSERT INTO chambers (name, address, phone, visiting_days, start_time, end_time, daily_limit, is_active, display_order)
     SELECT 'Chittagong Medical College', 'K.B. Fazlul Kader Road, Chattogram 4203', '+880 1700-000002', '[4,5,6]', '10:00', '15:00', 15, 1, 1
     WHERE NOT EXISTS (SELECT 1 FROM chambers WHERE name = 'Chittagong Medical College')`,

    // Testimonials
    `INSERT OR IGNORE INTO testimonials (name, review, rating, is_published) VALUES
     ('Maria Johnson', 'Dr. Mitchell is incredibly knowledgeable and caring. She took the time to explain my condition and treatment options. My acne cleared up within weeks!', 5, 1)`,
    `INSERT OR IGNORE INTO testimonials (name, review, rating, is_published) VALUES
     ('David Chen', 'The PRP treatment results exceeded my expectations. Professional staff, clean facility, and Dr. Mitchell truly cares about her patients.', 5, 1)`,
    `INSERT OR IGNORE INTO testimonials (name, review, rating, is_published) VALUES
     ('Sarah Williams', 'Best dermatologist I''ve ever visited. The anti-aging treatment gave me natural-looking results. Highly recommend!', 5, 1)`,

    // Settings
    `INSERT OR IGNORE INTO settings (key, value) VALUES ('clinic_name', 'Mitchell Dermatology Clinic')`,
    `INSERT OR IGNORE INTO settings (key, value) VALUES ('phone', '+1 (555) 123-4567')`,
    `INSERT OR IGNORE INTO settings (key, value) VALUES ('email', 'info@drsarahmitchell.com')`,
    `INSERT OR IGNORE INTO settings (key, value) VALUES ('address', '123 Medical Plaza, Suite 200, New York, NY 10001')`,
  ];

  for (const q of queries) {
    try {
      execSync(`wrangler d1 execute doctor-db --local --command "${q.replace(/"/g, '\\"')}"`, { stdio: 'pipe' });
    } catch (e) {
      console.error('Query failed:', q.slice(0, 80), e.message);
    }
  }

  console.log('✅ Seed data inserted successfully!');
  console.log(`\nAdmin login: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
}

seed();
