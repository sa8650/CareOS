import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import About from './pages/About';
import Services from './pages/Services';
import ServiceDetails from './pages/ServiceDetails';
import Appointment from './pages/Appointment';
import AppointmentSuccess from './pages/AppointmentSuccess';
import Contact from './pages/Contact';
import Privacy from './pages/Privacy';
import SeoManager from './seo/SeoManager';
import ScrollToTop from './components/ScrollToTop';

// Admin panel is code-split: patients never download the admin bundle or its CSS.
const Login = lazy(() => import('./admin/Login'));
const AdminLayout = lazy(() => import('./admin/AdminLayout'));
const Dashboard = lazy(() => import('./admin/Dashboard'));
const AdminAppointments = lazy(() => import('./admin/Appointments'));
const AdminServices = lazy(() => import('./admin/Services'));
const Profile = lazy(() => import('./admin/Profile'));
const Gallery = lazy(() => import('./admin/Gallery'));
const Testimonials = lazy(() => import('./admin/Testimonials'));
const Settings = lazy(() => import('./admin/Settings'));
const Schedule = lazy(() => import('./admin/Schedule'));
const Chambers = lazy(() => import('./admin/Chambers'));
const PrivacyEditor = lazy(() => import('./admin/PrivacyEditor'));
const HomeSections = lazy(() => import('./admin/HomeSections'));
const SeoSettings = lazy(() => import('./admin/SeoSettings'));

const AdminFallback = () => <div className="loading-page"><div className="spinner" /></div>;

export default function App() {
  return (
    <>
    {/* Dynamic SEO for all public routes (title, meta, OG, Twitter, canonical, JSON-LD) */}
    <SeoManager />
    <ScrollToTop />
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<><Navbar /><main><Home /></main><Footer /></>} />
      <Route path="/about" element={<><Navbar /><main><About /></main><Footer /></>} />
      <Route path="/services" element={<><Navbar /><main><Services /></main><Footer /></>} />
      <Route path="/services/:slug" element={<><Navbar /><main><ServiceDetails /></main><Footer /></>} />
      <Route path="/appointment" element={<><Navbar /><main><Appointment /></main><Footer /></>} />
      <Route path="/appointment/success/:id" element={<><Navbar /><main><AppointmentSuccess /></main><Footer /></>} />
      <Route path="/contact" element={<><Navbar /><main><Contact /></main><Footer /></>} />
      <Route path="/privacy" element={<><Navbar /><main><Privacy /></main><Footer /></>} />

      {/* Admin routes (lazy) */}
      <Route path="/admin/login" element={<Suspense fallback={<AdminFallback />}><Login /></Suspense>} />
      <Route path="/admin" element={<Suspense fallback={<AdminFallback />}><AdminLayout /></Suspense>}>
        <Route index element={<Dashboard />} />
        <Route path="appointments" element={<AdminAppointments />} />
        <Route path="schedule" element={<Schedule />} />
        <Route path="services" element={<AdminServices />} />
        <Route path="profile" element={<Profile />} />
        <Route path="chambers" element={<Chambers />} />
        <Route path="gallery" element={<Gallery />} />
        <Route path="testimonials" element={<Testimonials />} />
        <Route path="settings" element={<Settings />} />
        <Route path="privacy" element={<PrivacyEditor />} />
        <Route path="sections" element={<HomeSections />} />
        <Route path="seo" element={<SeoSettings />} />
      </Route>
    </Routes>
    </>
  );
}
