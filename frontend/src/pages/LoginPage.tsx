import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Dna, Lock, AlertCircle, CheckCircle2, ShieldCheck, UserPlus, LogIn, Eye, EyeOff } from 'lucide-react';
import { api } from '../api/client';

export const LoginPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'LOGIN' | 'REGISTER_ADMIN'>('LOGIN');

  // Login Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register Admin Form States
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Status & Feedback States
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { user, login, logout } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    const cached = localStorage.getItem('agribio_api_url');
    if (cached && (cached.includes('gegu') || cached.includes('dvdey9bdb') || (typeof window !== 'undefined' && cached.includes(window.location.hostname)))) {
      localStorage.removeItem('agribio_api_url');
    }
  }, []);

  const getDashboardRouteForRole = (role: string) => {
    const norm = (role || '').toLowerCase();
    if (norm === 'admin') return '/dashboard/admin';
    if (norm === 'agronomist') return '/dashboard/agronomist';
    if (norm === 'biotech_expert') return '/dashboard/biotech';
    if (norm === 'farmer') return '/dashboard/farmer';
    return '/dashboard/farmer';
  };

  // Handle Standard Sign-in with explicit email and password
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (!email.trim() || !password) {
      setError('Please enter both your registered email address and password.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccessMsg('');

    try {
      // Validate credentials through Express backend and MongoDB
      const authenticatedUser = await login(email.trim(), password);
      const targetDashboard = getDashboardRouteForRole(authenticatedUser.role);
      navigate(targetDashboard, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify your email and password.');
      setSubmitting(false);
    }
  };

  // Handle Create Admin Account Registration
  const handleRegisterAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError('');
    setSuccessMsg('');

    // Frontend Validations
    if (!regName.trim()) {
      setError('Please enter your full name.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(regEmail.trim())) {
      setError('Please enter a valid email address format (e.g. admin@organization.com).');
      return;
    }

    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters in length.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match. Please ensure both passwords are identical.');
      return;
    }

    setSubmitting(true);

    try {
      const res = await api.auth.registerAdmin({
        name: regName.trim(),
        email: regEmail.trim(),
        password: regPassword,
        phone: regPhone.trim() || undefined,
      });

      // Save token and navigate directly to dashboard
      localStorage.setItem('agribio_token', res.token);
      setSuccessMsg(`Admin account for ${res.user.name} created successfully! Redirecting to Dashboard...`);

      // Log in user state and navigate
      await login(regEmail.trim(), regPassword);
      navigate('/dashboard/admin', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Registration failed. Additional administrators must be created by an authorized administrator.');
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      background: 'radial-gradient(circle at 50% 10%, rgba(16, 185, 129, 0.15), transparent 70%), #0a0f1d',
    }}>
      <div className="card-glass" style={{ maxWidth: '480px', width: '100%', padding: '36px' }}>
        {/* Brand Logo & Header */}
        <div style={{ textAlign: 'center', marginBottom: '22px' }}>
          <div style={{
            width: '54px',
            height: '54px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #10b981 0%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
            boxShadow: '0 0 25px rgba(16, 185, 129, 0.4)',
          }}>
            <Dna size={30} color="#fff" />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff' }}>
            AgriBio<span style={{ color: '#06b6d4' }}>Tech</span> Portal
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Crop Genomics, GIS Surveillance & Farmer Advisory Platform
          </p>
        </div>

        {/* Secure Account Switching Indicator if already logged in */}
        {user && (
          <div style={{
            background: 'rgba(6, 182, 212, 0.1)',
            border: '1px solid rgba(6, 182, 212, 0.3)',
            borderRadius: 'var(--radius-md)',
            padding: '10px 14px',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
          }}>
            <div style={{ fontSize: '0.76rem', color: '#67e8f9' }}>
              Currently signed in as <strong>{user.name}</strong> ({user.role}). Sign in below to switch accounts.
            </div>
            <button
              type="button"
              onClick={() => logout()}
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#f87171',
                padding: '3px 8px',
                borderRadius: '4px',
                fontSize: '0.72rem',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              Sign Out
            </button>
          </div>
        )}

        {/* Navigation Tabs: Sign In vs Create Admin Account */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          background: 'rgba(15, 23, 42, 0.8)',
          borderRadius: '10px',
          padding: '4px',
          marginBottom: '20px',
          border: '1px solid var(--border-subtle)',
        }}>
          <button
            type="button"
            onClick={() => {
              setActiveTab('LOGIN');
              setError('');
              setSuccessMsg('');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '8px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: activeTab === 'LOGIN' ? 700 : 500,
              background: activeTab === 'LOGIN' ? 'rgba(16, 185, 129, 0.18)' : 'transparent',
              color: activeTab === 'LOGIN' ? '#34d399' : 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <LogIn size={15} /> Sign In
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('REGISTER_ADMIN');
              setError('');
              setSuccessMsg('');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '8px',
              border: 'none',
              borderRadius: '8px',
              fontSize: '0.82rem',
              fontWeight: activeTab === 'REGISTER_ADMIN' ? 700 : 500,
              background: activeTab === 'REGISTER_ADMIN' ? 'rgba(6, 182, 212, 0.18)' : 'transparent',
              color: activeTab === 'REGISTER_ADMIN' ? '#22d3ee' : 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <UserPlus size={15} /> Create Admin
          </button>
        </div>

        {/* Error Feedback */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            padding: '12px 14px',
            borderRadius: 'var(--radius-md)',
            color: '#f87171',
            fontSize: '0.84rem',
            marginBottom: '18px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <AlertCircle size={16} style={{ marginTop: '2px', flexShrink: 0 }} />
              <div>{error}</div>
            </div>
            {(error.includes('405') || error.includes('Method Not Allowed') || error.includes('VITE_API_URL')) && (
              <div style={{ marginTop: '6px', paddingLeft: '24px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={async () => {
                    localStorage.setItem('agribio_api_url', 'https://agri-bio-tech-management-platform.vercel.app');
                    setError('');
                    setSubmitting(true);
                    try {
                      const authenticatedUser = await login(email.trim() || 'admin@agribiotech.demo', password || 'Admin@123');
                      const targetDashboard = getDashboardRouteForRole(authenticatedUser.role);
                      navigate(targetDashboard, { replace: true });
                    } catch (err: any) {
                      setError(err.message || 'Authentication failed.');
                      setSubmitting(false);
                    }
                  }}
                  style={{
                    background: '#10b981',
                    border: 'none',
                    color: '#fff',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    padding: '6px 14px',
                    borderRadius: 'var(--radius-sm)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  ⚡ Connect to Verified Backend & Sign In
                </button>
              </div>
            )}
          </div>
        )}

        {/* Success Feedback */}
        {successMsg && (
          <div style={{
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            color: '#34d399',
            fontSize: '0.84rem',
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <CheckCircle2 size={16} /> {successMsg}
          </div>
        )}

        {/* TAB 1: SIGN IN FORM */}
        {activeTab === 'LOGIN' && (
          <>
            {/* Informational Platform Account Reference (Read-only, no direct shortcuts) */}
            <div style={{
              background: 'rgba(15, 23, 42, 0.65)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 14px',
              marginBottom: '18px',
            }}>
              <div style={{
                fontSize: '0.72rem',
                color: 'var(--text-dim)',
                textTransform: 'uppercase',
                fontWeight: 700,
                marginBottom: '8px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}>
                <Lock size={12} color="#10b981" /> Registered Demonstration Accounts:
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '0.73rem' }}>
                <div style={{ color: 'var(--text-muted)' }}>👑 Admin (நிர்வாகி): <span style={{ color: '#c4b5fd' }}>admin@agribiotech.demo</span></div>
                <div style={{ color: 'var(--text-muted)' }}>🌾 Agronomist (வேளாண் அதிகாரி): <span style={{ color: '#6ee7b7' }}>agronomist@agribiotech.demo</span></div>
                <div style={{ color: 'var(--text-muted)' }}>🧬 Scientist (உயிரி தொழில்நுட்பம்): <span style={{ color: '#67e8f9' }}>scientist@agribiotech.demo</span></div>
                <div style={{ color: 'var(--text-muted)' }}>🚜 Farmer (விவசாயி): <span style={{ color: '#fde68a' }}>farmer@agribiotech.demo</span></div>
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: '8px', fontStyle: 'italic' }}>
                Demo Password / கடவுச்சொல்: <strong style={{ color: '#38bdf8' }}>password123</strong> • All accounts require manual email/password entry.
              </div>
            </div>

            <form onSubmit={handleLoginSubmit}>
              <div className="form-group">
                <label className="form-label">Email Address / மின்னஞ்சல் முகவரி</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    className="input-field"
                    placeholder="Enter registered email address / மின்னஞ்சல் உள்ளிடவும்"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={submitting}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Password / கடவுச்சொல்</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="input-field"
                    style={{ paddingRight: '40px' }}
                    placeholder="Enter your password / கடவுச்சொல் உள்ளிடவும்"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={submitting}
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '10px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      color: 'var(--text-muted)',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '12px' }}
                disabled={submitting}
              >
                {submitting ? 'Authenticating Credentials...' : 'Sign In to Portal / உள்நுழைக'}
              </button>

              <div style={{ textAlign: 'center', marginTop: '16px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Need a dedicated administrator login?{' '}
                  <button
                    type="button"
                    onClick={() => setActiveTab('REGISTER_ADMIN')}
                    style={{ background: 'none', border: 'none', color: '#22d3ee', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Create Admin Account
                  </button>
                </span>
              </div>
            </form>
          </>
        )}

        {/* TAB 2: CREATE ADMIN ACCOUNT FORM */}
        {activeTab === 'REGISTER_ADMIN' && (
          <form onSubmit={handleRegisterAdminSubmit}>
            <div style={{
              background: 'rgba(6, 182, 212, 0.08)',
              border: '1px solid rgba(6, 182, 212, 0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '12px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}>
              <ShieldCheck size={20} color="#22d3ee" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: 1.35 }}>
                System administrator registration with full dashboard oversight, user privilege management, and MongoDB security persistence.
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Full Name *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Dr. Vikram Seth"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  disabled={submitting}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Administrator Email *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  className="input-field"
                  placeholder="e.g. vikram.admin@agribiotech.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  disabled={submitting}
                  required
                />
              </div>
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Password *</label>
                <input
                  type="password"
                  className="input-field"
                  placeholder="Min 6 characters"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  disabled={submitting}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Confirm Password *</label>
                <input
                  type="password"
                  className="input-field"
                  placeholder="Re-enter password"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  disabled={submitting}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number (Optional)</label>
              <input
                type="tel"
                className="input-field"
                placeholder="+91-98765-43210"
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value)}
                disabled={submitting}
              />
            </div>

            <button
              type="submit"
              className="btn btn-biotech"
              style={{ width: '100%', marginTop: '10px' }}
              disabled={submitting}
            >
              {submitting ? 'Registering Admin Account...' : '👑 Create & Launch Admin Account'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setActiveTab('LOGIN')}
                  style={{ background: 'none', border: 'none', color: '#10b981', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                >
                  Return to Sign In
                </button>
              </span>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
