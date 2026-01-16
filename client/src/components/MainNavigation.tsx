import React from 'react';
import { Link } from 'wouter';
import { HelpCircle, MessageSquare, FileText, Home, LogOut } from 'lucide-react';

interface MainNavigationProps {
  userRole?: 'artist' | 'venue' | 'admin';
  userName?: string;
}

export const MainNavigation: React.FC<MainNavigationProps> = ({ userRole, userName }) => {
  return (
    <nav style={{
      background: 'white',
      borderBottom: '1px solid #e5e7eb',
      padding: '0 20px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: '60px',
      }}>
        {/* Logo */}
        <Link href="/">
          <a style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#7c3aed',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span style={{ fontSize: '24px' }}>🎭</span>
            Ologywood
          </a>
        </Link>

        {/* Main Links */}
        <div style={{ display: 'flex', gap: '30px', alignItems: 'center' }}>
          <Link href="/dashboard">
            <a style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#6b7280',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#7c3aed')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#6b7280')}
            >
              <Home size={18} />
              Dashboard
            </a>
          </Link>

          {/* Contract Management */}
          {userRole && (
            <Link href={userRole === 'artist' ? '/artist-dashboard' : '/venue-dashboard'}>
              <a style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: '#6b7280',
                textDecoration: 'none',
                fontSize: '14px',
                fontWeight: '500',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#7c3aed')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#6b7280')}
              >
                <FileText size={18} />
                Contracts
              </a>
            </Link>
          )}

          {/* Help Center */}
          <Link href="/help">
            <a style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#6b7280',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#7c3aed')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#6b7280')}
            >
              <HelpCircle size={18} />
              Help
            </a>
          </Link>

          {/* Support Tickets */}
          <Link href="/support">
            <a style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: '#6b7280',
              textDecoration: 'none',
              fontSize: '14px',
              fontWeight: '500',
              transition: 'color 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#7c3aed')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#6b7280')}
            >
              <MessageSquare size={18} />
              Support
            </a>
          </Link>

          {/* Admin Links */}
          {userRole === 'admin' && (
            <>
              <Link href="/admin/support">
                <a style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#6b7280',
                  textDecoration: 'none',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'color 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#7c3aed')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#6b7280')}
                >
                  Admin
                </a>
              </Link>
            </>
          )}

          {/* User Info */}
          {userName && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              paddingLeft: '20px',
              borderLeft: '1px solid #e5e7eb',
            }}>
              <span style={{ fontSize: '14px', color: '#6b7280' }}>{userName}</span>
              <button style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: '#6b7280',
                padding: '4px',
              }}>
                <LogOut size={18} />
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default MainNavigation;
