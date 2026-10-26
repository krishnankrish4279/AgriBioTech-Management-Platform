import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Dna, Lock, AlertCircle, CheckCircle2, ShieldCheck, UserPlus, LogIn, Eye, EyeOff, KeyRound, Sprout, ArrowLeft, Check, X } from 'lucide-react';
import { api } from '../api/client';

export const LoginPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'LOGIN' | 'RESET_PASSWORD' | 'REGISTER_FARMER' | 'REGISTER_ADMIN'>('LOGIN');

  // Login Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Password Recovery States
  const [resetEmail, setResetEmail] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetStep, setResetStep] = useState<1 | 2>(1);

  // Farmer Registration States
  const [farmerName, setFarmerName] = useState('');
  const [farmerEmail, setFarmerEmail] = useState('');
  const [farmerPhone, setFarmerPhone] = useState('');
  const [farmerState, setFarmerState] = useState('Tamil Nadu');
  const [farmerDistrict, setFarmerDistrict] = useState('Kanchipuram');
  const [farmerCrops, setFarmerCrops] = useState('Rice, Chilli');
  const [farmerPassword, setFarmerPassword] = useState('');
  const [farmerConfirmPassword, setFarmerConfirmPassword] = useState('');
  const [showFarmerPassword, setShowFarmerPassword] = useState(false);

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

  // Password strength checklist helper
  const getPasswordCriteria = (pwd: string) => ({
    length: pwd.length >= 8,
    lowercase: /[a-z]/.test(pwd),
    uppercase: /[A-Z]/.test(pwd),
    number: /[0-9]/.test(pwd),
    special: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd),
    notBreached: !['farmer@123', 'admin@123', 'agronomist@123', 'scientist@123', 'password', 'password123', '12345678'].includes(pwd.toLowerCase().trim()),
  });

  // Handle Standard Sign-in
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
      const authenticatedUser = await login(email.trim(), password);
      const targetDashboard = getDashboardRouteForRole(authenticatedUser.role);
      navigate(targetDashboard, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify your email and password.');
      setSubmitting(false);
    }
  };

  // Step 1: Request Password Reset Code
  const handleRequestResetToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (!resetEmail.trim()) {
      setError('Please enter your registered email address.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await api.auth.forgotPassword({ email: resetEmail.trim() });
      if (res.resetToken) {
        setResetToken(res.resetToken);
        setResetStep(2);
        setSuccessMsg('Recovery code generated! Please enter your new unique password below.');
      } else {
        setSuccessMsg(res.message);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initiate password recovery.');
    } finally {
      setSubmitting(false);
    }
  };

  // Step 2: Complete Password Reset with New Unique Password
  const handleCompletePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (!resetToken.trim()) {
      setError('Please provide the recovery verification token.');
      return;
    }

    const criteria = getPasswordCriteria(newPassword);
    if (!criteria.length || !criteria.lowercase || !criteria.uppercase || !criteria.number || !criteria.special) {
      setError('Please choose a password meeting all complexity criteria (min 8 chars, uppercase, lowercase, number, symbol).');
      return;
    }

    if (!criteria.notBreached) {
      setError('This password is a common default found in public data breach databases. Please create a unique password.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError('Passwords do not match. Please re-enter identical passwords.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const res = await api.auth.resetPassword({
        token: resetToken.trim(),
        newPassword: newPassword.trim(),
      });

      setSuccessMsg(res.message || 'Password successfully updated! You can now sign in with your new unique credentials.');
      // Auto-fill login email
      if (resetEmail.trim()) {
        setEmail(resetEmail.trim());
      }
      setPassword(newPassword.trim());
      setTimeout(() => {
        setActiveTab('LOGIN');
        setResetStep(1);
        setResetToken('');
        setNewPassword('');
        setConfirmNewPassword('');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. The recovery code may have expired.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Real Farmer Self-Registration
  const handleFarmerRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    if (!farmerName.trim() || !farmerEmail.trim() || !farmerPassword) {
      setError('Full name, email address, and unique password are required.');
      return;
    }

    const criteria = getPasswordCriteria(farmerPassword);
    if (!criteria.length || !criteria.lowercase || !criteria.uppercase || !criteria.number || !criteria.special) {
      setError('Password must be at least 8 characters and include uppercase, lowercase, numbers, and symbols.');
      return;
    }

    if (!criteria.notBreached) {
      setError('This password is a common default pattern found in public data breaches. Please choose a unique password.');
      return;
    }

    if (farmerPassword !== farmerConfirmPassword) {
      setError('Passwords do not match. Please verify both password entries.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await api.auth.register({
        name: farmerName.trim(),
        email: farmerEmail.trim(),
        password: farmerPassword.trim(),
        phone: farmerPhone.trim() || undefined,
        state: farmerState,
        district: farmerDistrict,
        primaryCrops: farmerCrops,
      });

      localStorage.setItem('agribio_token', res.token);
      setSuccessMsg(`Welcome, ${res.user.name}! Your verified farmer account has been created.`);

      await login(farmerEmail.trim(), farmerPassword.trim());
      navigate('/dashboard/farmer', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check your information and try again.');
      setSubmitting(false);
    }
  };

  // Handle Create Admin Account Registration
  const handleRegisterAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError('');
    setSuccessMsg('');

    if (!regName.trim()) {
      setError('Please enter your full name.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(regEmail.trim())) {
      setError('Please enter a valid email address format.');
      return;
    }

    const criteria = getPasswordCriteria(regPassword);
    if (!criteria.length || !criteria.lowercase || !criteria.uppercase || !criteria.number || !criteria.special) {
      setError('Password must be at least 8 characters with uppercase, lowercase, numbers, and special characters.');
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
        password: regPassword.trim(),
        phone: regPhone.trim() || undefined,
      });

      localStorage.setItem('agribio_token', res.token);
      setSuccessMsg(`Admin account for ${res.user.name} created successfully! Redirecting...`);

      await login(regEmail.trim(), regPassword.trim());
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
      padding: 'clamp(16px, 4vw, 24px)',
      background: 'radial-gradient(circle at 50% 10%, rgba(16, 185, 129, 0.15), transparent 70%), #0a0f1d',
    }}>
      <div className="card-glass" style={{ maxWidth: '500px', width: '100%', padding: 'clamp(24px, 5vw, 36px)', borderRadius: 'var(--radius-lg)' }}>
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
              Currently signed in as <strong>{user.name}</strong> ({user.role}).
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
              }}
            >
              Sign Out
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
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
              setActiveTab('REGISTER_FARMER');
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
              fontWeight: activeTab === 'REGISTER_FARMER' ? 700 : 500,
              background: activeTab === 'REGISTER_FARMER' ? 'rgba(34, 197, 94, 0.18)' : 'transparent',
              color: activeTab === 'REGISTER_FARMER' ? '#4ade80' : 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <Sprout size={15} /> Farmer Sign Up
          </button>
        </div>

        {/* Error Feedback */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            padding: '10px 14px',
            borderRadius: 'var(--radius-md)',
            color: '#f87171',
            fontSize: '0.84rem',
            marginBottom: '18px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <div>{error}</div>
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
            <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
            <div>{successMsg}</div>
          </div>
        )}

        {/* TAB 1: SIGN IN FORM */}
        {activeTab === 'LOGIN' && (
          <>
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
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '6px', fontSize: '0.73rem' }}>
                <div style={{ color: 'var(--text-muted)' }}>👑 Admin: <span style={{ color: '#c4b5fd' }}>admin@agribiotech.demo</span></div>
                <div style={{ color: 'var(--text-muted)' }}>🌾 Agronomist: <span style={{ color: '#6ee7b7' }}>agronomist@agribiotech.demo</span></div>
                <div style={{ color: 'var(--text-muted)' }}>🧬 Scientist: <span style={{ color: '#67e8f9' }}>scientist@agribiotech.demo</span></div>
                <div style={{ color: 'var(--text-muted)' }}>🚜 Farmer: <span style={{ color: '#fde68a' }}>farmer@agribiotech.demo</span></div>
              </div>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: '8px', fontStyle: 'italic' }}>
                Every user must enter their registered email address and password to authenticate.
              </div>
            </div>

            <form onSubmit={handleLoginSubmit}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    className="input-field"
                    placeholder="Enter registered email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={submitting}
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label">Password</label>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('RESET_PASSWORD');
                      setResetEmail(email);
                      setError('');
                      setSuccessMsg('');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#06b6d4',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: 0,
                      marginBottom: '4px',
                    }}
                  >
                    Forgot password?
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="input-field"
                    style={{ paddingRight: '40px' }}
                    placeholder="Enter your password"
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
                {submitting ? 'Authenticating Credentials...' : 'Sign In to Portal'}
              </button>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', textAlign: 'center', marginTop: '16px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                <div>
                  New farmer?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('REGISTER_FARMER');
                      setError('');
                      setSuccessMsg('');
                    }}
                    style={{ background: 'none', border: 'none', color: '#10b981', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Register unique farmer account
                  </button>
                </div>
                <div>
                  Need administrator setup?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('REGISTER_ADMIN');
                      setError('');
                      setSuccessMsg('');
                    }}
                    style={{ background: 'none', border: 'none', color: '#06b6d4', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Create Admin Account
                  </button>
                </div>
              </div>
            </form>
          </>
        )}

        {/* TAB 2: PASSWORD RECOVERY / RESET */}
        {activeTab === 'RESET_PASSWORD' && (
          <div>
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
              <KeyRound size={20} color="#22d3ee" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: 1.35 }}>
                Account Recovery: If your password was flagged as compromised or you forgot it, enter your registered email to set a unique, secure password.
              </div>
            </div>

            {resetStep === 1 ? (
              <form onSubmit={handleRequestResetToken}>
                <div className="form-group">
                  <label className="form-label">Registered Account Email *</label>
                  <input
                    type="email"
                    className="input-field"
                    placeholder="e.g. farmer@agribiotech.demo"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    disabled={submitting}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-biotech"
                  style={{ width: '100%', marginTop: '10px' }}
                  disabled={submitting}
                >
                  {submitting ? 'Generating Recovery Code...' : 'Request Password Recovery'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleCompletePasswordReset}>
                <div className="form-group">
                  <label className="form-label">Recovery Verification Token *</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Paste recovery code"
                    value={resetToken}
                    onChange={(e) => setResetToken(e.target.value)}
                    disabled={submitting}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">New Unique Password *</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      className="input-field"
                      style={{ paddingRight: '40px' }}
                      placeholder="Enter strong, unique password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={submitting}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
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
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Confirm New Password *</label>
                  <input
                    type="password"
                    className="input-field"
                    placeholder="Re-enter new password"
                    value={confirmNewPassword}
                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                    disabled={submitting}
                    required
                  />
                </div>

                {/* Password Criteria Checklist */}
                {newPassword && (
                  <div style={{
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '8px',
                    padding: '10px 12px',
                    marginBottom: '12px',
                    fontSize: '0.73rem',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '4px',
                  }}>
                    {(() => {
                      const c = getPasswordCriteria(newPassword);
                      return (
                        <>
                          <div style={{ color: c.length ? '#34d399' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {c.length ? <Check size={12} /> : <X size={12} />} 8+ Characters
                          </div>
                          <div style={{ color: c.uppercase ? '#34d399' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {c.uppercase ? <Check size={12} /> : <X size={12} />} Uppercase (A-Z)
                          </div>
                          <div style={{ color: c.lowercase ? '#34d399' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {c.lowercase ? <Check size={12} /> : <X size={12} />} Lowercase (a-z)
                          </div>
                          <div style={{ color: c.number ? '#34d399' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {c.number ? <Check size={12} /> : <X size={12} />} Number (0-9)
                          </div>
                          <div style={{ color: c.special ? '#34d399' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {c.special ? <Check size={12} /> : <X size={12} />} Symbol (!@#$)
                          </div>
                          <div style={{ color: c.notBreached ? '#34d399' : '#f87171', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {c.notBreached ? <Check size={12} /> : <X size={12} />} Not in Breaches
                          </div>
                        </>
                      );
                    })()}
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: '8px' }}
                  disabled={submitting}
                >
                  {submitting ? 'Updating Password...' : '🔐 Set New Secure Password'}
                </button>
              </form>
            )}

            <div style={{ textAlign: 'center', marginTop: '14px' }}>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('LOGIN');
                  setError('');
                  setSuccessMsg('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <ArrowLeft size={14} /> Return to Sign In
              </button>
            </div>
          </div>
        )}

        {/* TAB 3: REGISTER REAL FARMER ACCOUNT */}
        {activeTab === 'REGISTER_FARMER' && (
          <form onSubmit={handleFarmerRegisterSubmit}>
            <div style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '12px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}>
              <Sprout size={20} color="#10b981" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: 1.35 }}>
                Farmer Registration: Create your own independent farmer account with a unique, secure password.
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Farmer Full Name *</label>
              <input
                type="text"
                className="input-field"
                placeholder="e.g. Ramesh Kumar"
                value={farmerName}
                onChange={(e) => setFarmerName(e.target.value)}
                disabled={submitting}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Email Address *</label>
              <input
                type="email"
                className="input-field"
                placeholder="e.g. ramesh.kumar@agrofarm.in"
                value={farmerEmail}
                onChange={(e) => setFarmerEmail(e.target.value)}
                disabled={submitting}
                required
              />
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="tel"
                  className="input-field"
                  placeholder="+91-98765-43210"
                  value={farmerPhone}
                  onChange={(e) => setFarmerPhone(e.target.value)}
                  disabled={submitting}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Primary Crops</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Rice, Chilli, Maize"
                  value={farmerCrops}
                  onChange={(e) => setFarmerCrops(e.target.value)}
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Create Unique Password *</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showFarmerPassword ? 'text' : 'password'}
                  className="input-field"
                  style={{ paddingRight: '40px' }}
                  placeholder="Min 8 characters (uppercase, lowercase, number, symbol)"
                  value={farmerPassword}
                  onChange={(e) => setFarmerPassword(e.target.value)}
                  disabled={submitting}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowFarmerPassword(!showFarmerPassword)}
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
                  }}
                >
                  {showFarmerPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Confirm Password *</label>
              <input
                type="password"
                className="input-field"
                placeholder="Re-enter password"
                value={farmerConfirmPassword}
                onChange={(e) => setFarmerConfirmPassword(e.target.value)}
                disabled={submitting}
                required
              />
            </div>

            {/* Password Criteria Checklist */}
            {farmerPassword && (
              <div style={{
                background: 'rgba(15, 23, 42, 0.7)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
                padding: '10px 12px',
                marginBottom: '12px',
                fontSize: '0.73rem',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '4px',
              }}>
                {(() => {
                  const c = getPasswordCriteria(farmerPassword);
                  return (
                    <>
                      <div style={{ color: c.length ? '#34d399' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {c.length ? <Check size={12} /> : <X size={12} />} 8+ Characters
                      </div>
                      <div style={{ color: c.uppercase ? '#34d399' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {c.uppercase ? <Check size={12} /> : <X size={12} />} Uppercase (A-Z)
                      </div>
                      <div style={{ color: c.lowercase ? '#34d399' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {c.lowercase ? <Check size={12} /> : <X size={12} />} Lowercase (a-z)
                      </div>
                      <div style={{ color: c.number ? '#34d399' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {c.number ? <Check size={12} /> : <X size={12} />} Number (0-9)
                      </div>
                      <div style={{ color: c.special ? '#34d399' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {c.special ? <Check size={12} /> : <X size={12} />} Symbol (!@#$)
                      </div>
                      <div style={{ color: c.notBreached ? '#34d399' : '#f87171', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {c.notBreached ? <Check size={12} /> : <X size={12} />} Not in Breaches
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: '8px' }}
              disabled={submitting}
            >
              {submitting ? 'Creating Farmer Account...' : '🌱 Register & Launch Farmer Portal'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '14px' }}>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('LOGIN');
                  setError('');
                  setSuccessMsg('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  fontSize: '0.8rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <ArrowLeft size={14} /> Already registered? Return to Sign In
              </button>
            </div>
          </form>
        )}

        {/* TAB 4: CREATE ADMIN ACCOUNT FORM */}
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

            <div className="form-group">
              <label className="form-label">Administrator Email *</label>
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

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Password *</label>
                <input
                  type="password"
                  className="input-field"
                  placeholder="Min 8 characters"
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
                  onClick={() => {
                    setActiveTab('LOGIN');
                    setError('');
                    setSuccessMsg('');
                  }}
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
