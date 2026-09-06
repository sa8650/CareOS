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
import Login from './admin/Login';
import AdminLayout from './admin/AdminLayout';
import Dashboard from './admin/Dashboard';
import AdminAppointments from './admin/Appointments';
import AdminServices from './admin/Services';
import Profile from './admin/Profile';
import Gallery from './admin/Gallery';
import Testimonials from './admin/Testimonials';
import Settings from './admin/Settings';

export default function App() {
  return (
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

      {/* Admin routes */}
      <Route path="/admin/login" element={<Login />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="appointments" element={<AdminAppointments />} />
        <Route path="services" element={<AdminServices />} />
        <Route path="profile" element={<Profile />} />
        <Route path="gallery" element={<Gallery />} />
        <Route path="testimonials" element={<Testimonials />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}
