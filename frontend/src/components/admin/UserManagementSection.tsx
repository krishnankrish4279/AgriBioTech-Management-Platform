import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../../types';
import { api } from '../../api/client';
import { RoleBadge } from '../common/Badge';
import { Modal } from '../common/Modal';
import { Users, UserPlus, Edit3, Trash2, Search, RefreshCw, Shield, AlertCircle, CheckCircle2, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const UserManagementSection: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<string>('agronomist');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const { user: currentUser } = useAuth();

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.users.getAll();
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const openAddModal = () => {
    setName('');
    setEmail('');
    setPassword('');
    setRole('agronomist');
    setPhone('');
    setFormError('');
    setShowAddModal(true);
  };

  const openEditModal = (u: User) => {
    setEditingUser(u);
    setName(u.name);
    setEmail(u.email);
    setPassword('');
    setRole(u.role ? u.role.toLowerCase() : 'farmer');
    setPhone(u.phone || '');
    setFormError('');
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      setFormError('Please fill in name, email, and password.');
      return;
    }
    if (password.length < 6) {
      setFormError('Password must be at least 6 characters long.');
      return;
    }

    setSubmitting(true);
    setFormError('');
    try {
      await api.users.create({
        name: name.trim(),
        email: email.trim(),
        password: password.trim(),
        role: role.toLowerCase(),
        phone: phone.trim() || undefined,
      });
      setSuccess(`User "${name}" created successfully with role ${role.toUpperCase()}!`);
      setShowAddModal(false);
      loadUsers();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      setFormError(err.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    if (!name.trim() || !email.trim()) {
      setFormError('Name and email are required.');
      return;
    }

    setSubmitting(true);
    setFormError('');
    try {
      await api.users.update(editingUser.id, {
        name: name.trim(),
        email: email.trim(),
        role: role.toLowerCase() as any,
        phone: phone.trim() || undefined,
        password: password.trim() ? password.trim() : undefined,
      });
      setSuccess(`User "${name}" updated successfully.`);
      setEditingUser(null);
      loadUsers();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      setFormError(err.message || 'Failed to update user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (u: User) => {
    if (currentUser?.id === u.id) {
      alert('You cannot delete your own active administrator account.');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete user "${u.name}" (${u.email})?`)) {
      return;
    }

    try {
      await api.users.delete(u.id);
      setSuccess(`User "${u.name}" removed successfully.`);
      loadUsers();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      alert(err.message || 'Failed to delete user');
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesRole = roleFilter === 'ALL' || (u.role && u.role.toLowerCase() === roleFilter.toLowerCase());
    const q = search.trim().toLowerCase();
    const matchesSearch = !q ||
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.phone && u.phone.toLowerCase().includes(q));
    return matchesRole && matchesSearch;
  });

  return (
    <div id="user-management-section" className="card-glass" style={{ marginBottom: '24px' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        marginBottom: '18px',
        paddingBottom: '14px',
        borderBottom: '1px solid var(--border-subtle)',
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#8b5cf6', fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase' }}>
            <Shield size={16} /> System Administration
          </div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', marginTop: '4px' }}>
            User Management & Role Permissions
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Oversee platform operators, assign scientific & field credentials, and maintain system security.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={openAddModal} className="btn btn-primary">
            <UserPlus size={16} /> Add System User
          </button>
          <button onClick={loadUsers} className="btn btn-secondary" title="Refresh Users">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {success && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.15)',
          border: '1px solid rgba(16, 185, 129, 0.4)',
          padding: '10px 14px',
          borderRadius: 'var(--radius-md)',
          color: '#34d399',
          fontSize: '0.84rem',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <CheckCircle2 size={16} /> {success}
        </div>
      )}

      {error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.15)',
          border: '1px solid rgba(239, 68, 68, 0.4)',
          padding: '10px 14px',
          borderRadius: 'var(--radius-md)',
          color: '#f87171',
          fontSize: '0.84rem',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '16px' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="input-field"
            style={{ paddingLeft: '36px' }}
            placeholder="Search users by name, email, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="select-field"
          style={{ width: 'auto' }}
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="ALL">All Roles</option>
          <option value="admin">Administrators</option>
          <option value="agronomist">Agronomists / Field Officers</option>
          <option value="biotech_expert">Biotech Scientists</option>
          <option value="farmer">Registered Farmers</option>
        </select>
      </div>

      {/* User Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          Loading user directory...
        </div>
      ) : filteredUsers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
          No user accounts found matching current filter.
        </div>
      ) : (
        <div className="table-container" style={{ padding: 0 }}>
          <table className="table-modern">
            <thead>
              <tr>
                <th>User Details</th>
                <th>Assigned Role</th>
                <th>Contact</th>
                <th>Joined</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => {
                const isCurrent = currentUser?.id === u.id;
                return (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2), rgba(6, 182, 212, 0.2))',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontWeight: 700,
                          fontSize: '0.85rem',
                          border: '1px solid var(--border-subtle)'
                        }}>
                          {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {u.name}
                            {isCurrent && (
                              <span style={{ fontSize: '0.65rem', background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', padding: '1px 6px', borderRadius: '4px' }}>
                                (You)
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <RoleBadge role={u.role} />
                    </td>
                    <td>
                      <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{u.phone || '—'}</span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'Active'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <button
                          onClick={() => openEditModal(u)}
                          className="btn btn-secondary btn-sm"
                          title="Edit User & Permissions"
                        >
                          <Edit3 size={14} /> Edit
                        </button>
                        {!isCurrent && (
                          <button
                            onClick={() => handleDeleteUser(u)}
                            className="btn btn-danger btn-sm"
                            title="Delete User Account"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Add User */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981' }}>
            <UserPlus size={20} /> Register New Platform User
          </div>
        }
        maxWidth="540px"
      >
        <form onSubmit={handleAddSubmit}>
          {formError && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              color: '#f87171',
              fontSize: '0.84rem',
              marginBottom: '16px',
            }}>
              {formError}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input
              type="text"
              className="input-field"
              placeholder="e.g. Dr. Rajesh Kannan"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address *</label>
            <input
              type="email"
              className="input-field"
              placeholder="e.g. rajesh@agribiotech.demo"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">System Role *</label>
              <select
                className="select-field"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="admin">Admin (Full Access)</option>
                <option value="agronomist">Agronomist (Field & Advisory)</option>
                <option value="biotech_expert">Biotech Scientist (Genomics & R&D)</option>
                <option value="farmer">Farmer (Portal Access)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                className="input-field"
                placeholder="+91-98765-43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Initial Password * (Min 6 chars)</label>
            <input
              type="password"
              className="input-field"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="modal-footer" style={{ padding: '16px 0 0', background: 'transparent' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Creating User...' : 'Create Account'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Edit User */}
      <Modal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#06b6d4' }}>
            <Edit3 size={20} /> Edit User & Role: {editingUser?.name}
          </div>
        }
        maxWidth="540px"
      >
        <form onSubmit={handleEditSubmit}>
          {formError && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              color: '#f87171',
              fontSize: '0.84rem',
              marginBottom: '16px',
            }}>
              {formError}
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Full Name *</label>
            <input
              type="text"
              className="input-field"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email Address *</label>
            <input
              type="email"
              className="input-field"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="grid-2">
            <div className="form-group">
              <label className="form-label">Assign Role *</label>
              <select
                className="select-field"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="admin">Admin (Full Control)</option>
                <option value="agronomist">Agronomist / Field Officer</option>
                <option value="biotech_expert">Biotech Scientist</option>
                <option value="farmer">Farmer</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                className="input-field"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Reset Password (leave empty to keep current password)</label>
            <input
              type="password"
              className="input-field"
              placeholder="Enter new password if changing"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="modal-footer" style={{ padding: '16px 0 0', background: 'transparent' }}>
            <button type="button" className="btn btn-secondary" onClick={() => setEditingUser(null)} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
