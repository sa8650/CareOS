import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail } from 'lucide-react';
import { login } from '../api/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/admin');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card card">
        <div className="card-body">
          <div className="login-header">
            <div className="login-logo">
              <span>Dr</span>
            </div>
            <h1>Admin Login</h1>
            <p>Sign in to manage your practice</p>
          </div>

          {error && <div className="login-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label"><Mail size={14} /> Email</label>
              <input type="email" className="form-input" value={email}
                onChange={e => setEmail(e.target.value)} placeholder="admin@clinic.com" required />
            </div>
            <div className="form-group">
              <label className="form-label"><Lock size={14} /> Password</label>
              <input type="password" className="form-input" value={password}
                onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
            </div>
            <button type="submit" className="btn btn-primary btn-lg" style={{ width: '100%' }} disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>

      <style>{`
        .login-page {
          min-height: 100vh; display: flex; align-items: center; justify-content: center;
          background: linear-gradient(135deg, #f0f9ff, #e0f2fe); padding: 1rem;
        }
        .login-card { width: 100%; max-width: 420px; }
        .login-header { text-align: center; margin-bottom: 2rem; }
        .login-logo {
          width: 56px; height: 56px; background: var(--color-primary); color: white;
          border-radius: var(--radius-lg); display: flex; align-items: center; justify-content: center;
          font-size: 1.25rem; font-weight: 800; margin: 0 auto 1rem;
        }
        .login-header h1 { font-size: 1.5rem; margin-bottom: 0.25rem; }
        .login-header p { color: var(--color-text-light); font-size: 0.9rem; }
        .login-error {
          background: #fee2e2; color: #991b1b; padding: 0.75rem 1rem;
          border-radius: var(--radius-md); margin-bottom: 1rem; font-size: 0.9rem;
        }
      `}</style>
    </div>
  );
}
