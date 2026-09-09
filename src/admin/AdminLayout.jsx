import { useState, useEffect, Suspense } from 'react';
import { Outlet, NavLink, useNavigate, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Calendar, Stethoscope, UserCircle, Image, MessageSquare, Settings, LogOut, Menu, X, Clock, Building2, ShieldCheck, LayoutTemplate, Search } from 'lucide-react';
import useAuth from '../hooks/useAuth';
import '../styles/tailwind.css'; // Tailwind utilities for the shadcn/Magic UI components (admin only)

export default function AdminLayout() {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) navigate('/admin/login');
  }, [loading, user, navigate]);

  // Close the phone drawer whenever the route changes
  useEffect(() => { setSidebarOpen(false); }, [location.pathname]);

  if (loading) return <div className="loading-page"><div className="spinner" /></div>;
  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login');
  };

  const navItems = [
    { to: '/admin', icon: <LayoutDashboard size={18} />, label: 'Dashboard', end: true },
    { to: '/admin/appointments', icon: <Calendar size={18} />, label: 'Appointments' },
    { to: '/admin/schedule', icon: <Clock size={18} />, label: 'Schedule' },
    { to: '/admin/services', icon: <Stethoscope size={18} />, label: 'Services' },
    { to: '/admin/sections', icon: <LayoutTemplate size={18} />, label: 'Home Sections' },
    { to: '/admin/profile', icon: <UserCircle size={18} />, label: 'Profile' },
    { to: '/admin/chambers', icon: <Building2 size={18} />, label: 'Chambers' },
    { to: '/admin/gallery', icon: <Image size={18} />, label: 'Gallery' },
    { to: '/admin/testimonials', icon: <MessageSquare size={18} />, label: 'Testimonials' },
    { to: '/admin/settings', icon: <Settings size={18} />, label: 'Settings' },
    { to: '/admin/privacy', icon: <ShieldCheck size={18} />, label: 'Privacy Policy' },
    { to: '/admin/seo', icon: <Search size={18} />, label: 'SEO Settings' },
  ];

  return (
    <div className="admin-layout">
      <aside className={`admin-sidebar ${sidebarOpen ? 'admin-sidebar--open' : ''}`}>
        <div className="admin-sidebar-header">
          <Link to="/admin" className="admin-logo">
            <span className="admin-logo-icon">Dr</span>
            <span>Admin Panel</span>
          </Link>
          <button className="admin-sidebar-close" onClick={() => setSidebarOpen(false)} aria-label="Close menu"><X size={20} /></button>
        </div>
        <nav className="admin-nav">
          {navItems.map(item => (
            <NavLink key={item.to} to={item.to} end={item.end}
              className={({ isActive }) => `admin-nav-link ${isActive ? 'admin-nav-link--active' : ''}`}
              onClick={() => setSidebarOpen(false)}>
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="admin-sidebar-footer">
          <button onClick={handleLogout} className="admin-logout">
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      <div className={`admin-backdrop ${sidebarOpen ? 'admin-backdrop--show' : ''}`} onClick={() => setSidebarOpen(false)} />
      <main className="admin-main">
        <header className="admin-topbar">
          <button className="admin-menu-btn" onClick={() => setSidebarOpen(true)} aria-label="Open menu"><Menu size={20} /></button>
          <div className="admin-topbar-right">
            <span className="admin-user-name">{user.name}</span>
            <div className="admin-avatar">{user.name?.[0] || 'A'}</div>
          </div>
        </header>
        <div className="admin-content">
          {/* Admin pages are lazy-loaded; keep the shell visible while a chunk downloads */}
          <Suspense fallback={<div className="loading-page"><div className="spinner" /></div>}>
            <Outlet />
          </Suspense>
        </div>
      </main>

      <style>{`
        .admin-layout { display: flex; min-height: 100vh; }
        .admin-sidebar {
          width: 260px; background: #0f172a; color: white; display: flex; flex-direction: column;
          position: fixed; top: 0; bottom: 0; left: 0; z-index: 50; transition: transform 0.3s;
        }
        .admin-sidebar-header { padding: 1.25rem; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #1e293b; }
        .admin-logo { display: flex; align-items: center; gap: 0.5rem; color: white; font-weight: 700; }
        .admin-logo-icon {
          width: 32px; height: 32px; background: var(--color-primary); border-radius: var(--radius-sm);
          display: flex; align-items: center; justify-content: center; font-size: 0.75rem; font-weight: 800;
        }
        .admin-sidebar-close { display: none; color: white; }
        .admin-nav { flex: 1; padding: 0.75rem; display: flex; flex-direction: column; gap: 0.25rem; overflow-y: auto; }
        .admin-nav-link {
          display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem;
          border-radius: var(--radius-md); color: #94a3b8; font-size: 0.9rem; font-weight: 500;
          transition: all 0.2s;
        }
        .admin-nav-link:hover { background: #1e293b; color: white; }
        .admin-nav-link--active { background: var(--color-primary); color: white; }
        .admin-sidebar-footer { padding: 1rem; border-top: 1px solid #1e293b; }
        .admin-logout {
          display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1rem;
          width: 100%; color: #94a3b8; font-size: 0.9rem; font-weight: 500;
          border-radius: var(--radius-md); transition: all 0.2s;
        }
        .admin-logout:hover { background: #1e293b; color: white; }

        /* min-width:0 is the key mobile fix: without it a wide table/grid stretches the whole
           layout instead of scrolling inside .table-wrapper. */
        .admin-main { flex: 1; min-width: 0; margin-left: 260px; background: var(--color-bg-alt); }
        .admin-backdrop { display: none; }
        .admin-topbar {
          height: 64px; background: white; border-bottom: 1px solid var(--color-border);
          display: flex; align-items: center; justify-content: space-between; padding: 0 1.5rem;
          position: sticky; top: 0; z-index: 40;
        }
        .admin-menu-btn { display: none; }
        .admin-topbar-right { display: flex; align-items: center; gap: 0.75rem; }
        .admin-user-name { font-weight: 500; font-size: 0.9rem; }
        .admin-avatar {
          width: 36px; height: 36px; background: var(--color-primary); color: white;
          border-radius: 50%; display: flex; align-items: center; justify-content: center;
          font-weight: 700; font-size: 0.85rem;
        }
        .admin-content { padding: 2rem; }
        .admin-page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem; }

        @media (max-width: 768px) {
          .admin-sidebar { transform: translateX(-100%); }
          .admin-sidebar--open { transform: translateX(0); box-shadow: var(--shadow-xl); }
          .admin-sidebar-close { display: flex; }
          .admin-backdrop--show { display: block; position: fixed; inset: 0; background: rgba(15, 23, 42, 0.45); z-index: 49; }
          .admin-main { margin-left: 0; max-width: 100vw; }
          .admin-menu-btn { display: flex; }
          .admin-topbar { height: 56px; padding: 0 1rem; }
          .admin-content { padding: 1rem 0.85rem 4rem; }
          .admin-content .admin-page-title { font-size: 1.4rem; margin-bottom: 1rem; }
          /* Generic mobile helpers for every admin page */
          .admin-content .table-wrapper { -webkit-overflow-scrolling: touch; }
          .admin-content th, .admin-content td { padding: 0.6rem 0.75rem; }
          .admin-content .card-body { padding: 1rem; }
          .admin-content .modal { width: 100%; max-height: 92vh; border-radius: var(--radius-lg); }
          .admin-content .modal-header, .admin-content .modal-body { padding-left: 1rem; padding-right: 1rem; }
          .admin-content .modal-footer { padding: 0 1rem 1rem; flex-wrap: wrap; }
          .admin-content .modal-footer .btn { flex: 1 1 auto; justify-content: center; }
        }
      `}</style>
    </div>
  );
}
