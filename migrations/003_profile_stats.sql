/* ==========================================================================
   003_profile_stats.sql - editable hero statistics (Patients / Years / Rating)

   For an EXISTING database (your live site): run this once.
   Cloudflare dashboard: D1 -> doctor-db -> Console -> paste -> Execute
   (Fresh installs do not need it: 001_initial.sql already contains the column.)
   ========================================================================== */
ALTER TABLE doctor_profile ADD COLUMN stats TEXT;
