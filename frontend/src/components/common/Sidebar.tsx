import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Sprout,
  ShieldAlert,
  Dna,
  ClipboardList,
  Users,
  MessageSquareShare,
  BarChart3,
  Microscope,
  Leaf,
  Layers,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  isOpen?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen = true }) => {
  const { user, logout } = useAuth();
  const rawRole = (user?.role || '').toLowerCase();

  const getNavItems = () => {
    if (rawRole === 'farmer') {
      return [
        { to: '/dashboard/farmer', label: 'Farmer Portal', icon: LayoutDashboard, badge: 'My Farm' },
        { to: '/diseases', label: 'Disease Outbreak Radar', icon: ShieldAlert, badge: 'Live GIS' },
        { to: '/recommendations', label: 'Biotech Solutions', icon: Dna, badge: 'Solutions' },
        { to: '/advisories', label: 'Farmer Advisories', icon: MessageSquareShare, badge: 'Direct' },
      ];
    }

    if (rawRole === 'biotech_expert') {
      return [
        { to: '/dashboard/biotech', label: 'Biotech Dashboard', icon: LayoutDashboard, badge: 'Genomics' },
        { to: '/varieties', label: 'Crop Varieties', icon: Sprout, badge: 'Genomics' },
        { to: '/recommendations', label: 'Biotech Advisory', icon: Dna, badge: 'AI Engine' },
        { to: '/diseases', label: 'Disease Surveillance', icon: ShieldAlert, badge: 'Pathogens' },
        { to: '/reports', label: 'Reports & Analytics', icon: BarChart3, badge: 'PDF / CSV' },
      ];
    }

    if (rawRole === 'agronomist') {
      return [
        { to: '/dashboard/agronomist', label: 'Agronomist Dashboard', icon: LayoutDashboard, badge: 'Field Ops' },
        { to: '/farmers', label: 'Farmers & Farms', icon: Users, badge: 'Manage' },
        { to: '/observations', label: 'Field Observations', icon: ClipboardList, badge: 'Visits' },
        { to: '/diseases', label: 'Disease Surveillance', icon: ShieldAlert, badge: 'Live GIS' },
        { to: '/advisories', label: 'Farmer Advisories', icon: MessageSquareShare, badge: 'Outreach' },
        { to: '/varieties', label: 'Crop Varieties', icon: Sprout, badge: 'Catalog' },
        { to: '/recommendations', label: 'Biotech Advisory', icon: Dna, badge: 'Protocols' },
        { to: '/reports', label: 'Reports & Analytics', icon: BarChart3, badge: 'PDF / CSV' },
      ];
    }

    // Default: Admin
    return [
      { to: '/dashboard/admin', label: 'Admin Dashboard', icon: LayoutDashboard, badge: 'Full Access' },
      { to: '/varieties', label: 'Crop Varieties', icon: Sprout, badge: 'Biotech' },
      { to: '/diseases', label: 'Disease Surveillance', icon: ShieldAlert, badge: 'Live GIS' },
      { to: '/recommendations', label: 'Biotech Advisory', icon: Dna, badge: 'AI Engine' },
      { to: '/observations', label: 'Field Observations', icon: ClipboardList, badge: null },
      { to: '/farmers', label: 'Farmers & Farms', icon: Users, badge: null },
      { to: '/advisories', label: 'Farmer Advisories', icon: MessageSquareShare, badge: '2-Way' },
      { to: '/reports', label: 'Reports & Analytics', icon: BarChart3, badge: 'PDF / CSV' },
    ];
  };

  const navItems = getNavItems();

  return (
    <aside style={{
      width: isOpen ? '260px' : '0px',
      background: 'var(--bg-sidebar)',
      borderRight: isOpen ? '1px solid var(--border-subtle)' : 'none',
      height: 'calc(100vh - 70px)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: isOpen ? '20px 14px' : '0px',
      transition: 'all 0.25s ease',
      overflow: 'hidden',
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{
          padding: '8px 12px 14px',
          fontSize: '0.72rem',
          fontWeight: 700,
          color: 'var(--text-dim)',
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Layers size={14} color="#10b981" /> Navigation Portal
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                color: isActive ? '#ffffff' : 'var(--text-muted)',
                background: isActive ? 'linear-gradient(90deg, rgba(16, 185, 129, 0.15) 0%, rgba(6, 182, 212, 0.08) 100%)' : 'transparent',
                borderLeft: isActive ? '3px solid #10b981' : '3px solid transparent',
                textDecoration: 'none',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.88rem',
                transition: 'all 0.15s ease',
              })}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Icon size={18} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span style={{
                  fontSize: '0.65rem',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background: 'rgba(255,255,255,0.06)',
                  color: '#06b6d4',
                  fontWeight: 700,
                  border: '1px solid rgba(6, 182, 212, 0.25)',
                }}>
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Bottom Agri-Biotech Info Card */}
      <div style={{
        background: 'rgba(15, 23, 42, 0.7)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '14px',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontSize: '0.8rem', fontWeight: 700 }}>
          <Leaf size={16} /> AgriBio Intelligence
        </div>
        <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', lineHeight: 1.4 }}>
          Surveillance Engine connected with GIS GPS mapping & dual biotech recommendation rules.
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '0.7rem',
          color: '#06b6d4',
          marginTop: '2px'
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#06b6d4' }}></span>
          Database: MongoDB Active
        </div>

        <button
          onClick={logout}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '8px',
            marginTop: '6px',
            borderRadius: '6px',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            background: 'rgba(239, 68, 68, 0.08)',
            color: '#f87171',
            fontSize: '0.78rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          <LogOut size={14} /> End Session (Logout)
        </button>
      </div>
    </aside>
  );
};
