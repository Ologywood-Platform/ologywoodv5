import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export const ContractNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav style={{
      background: 'linear-gradient(135deg, #7c3aed 0%, #3b82f6 100%)',
      padding: '0',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        height: '60px',
        paddingLeft: '20px',
        paddingRight: '20px',
      }}>
        <div style={{ display: 'flex', gap: '30px', flex: 1 }}>
          <button
            onClick={() => navigate('/artist-dashboard')}
            style={{
              background: 'transparent',
              border: 'none',
              color: isActive('/artist-dashboard') ? 'white' : 'rgba(255, 255, 255, 0.7)',
              fontSize: '15px',
              fontWeight: isActive('/artist-dashboard') ? '600' : '500',
              cursor: 'pointer',
              padding: '8px 0',
              borderBottom: isActive('/artist-dashboard') ? '3px solid white' : 'none',
              transition: 'all 0.3s',
            }}
            onMouseEnter={(e) => {
              if (!isActive('/artist-dashboard')) {
                (e.target as HTMLButtonElement).style.color = 'white';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive('/artist-dashboard')) {
                (e.target as HTMLButtonElement).style.color = 'rgba(255, 255, 255, 0.7)';
              }
            }}
          >
            🎤 Artist Dashboard
          </button>

          <button
            onClick={() => navigate('/venue-dashboard')}
            style={{
              background: 'transparent',
              border: 'none',
              color: isActive('/venue-dashboard') ? 'white' : 'rgba(255, 255, 255, 0.7)',
              fontSize: '15px',
              fontWeight: isActive('/venue-dashboard') ? '600' : '500',
              cursor: 'pointer',
              padding: '8px 0',
              borderBottom: isActive('/venue-dashboard') ? '3px solid white' : 'none',
              transition: 'all 0.3s',
            }}
            onMouseEnter={(e) => {
              if (!isActive('/venue-dashboard')) {
                (e.target as HTMLButtonElement).style.color = 'white';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive('/venue-dashboard')) {
                (e.target as HTMLButtonElement).style.color = 'rgba(255, 255, 255, 0.7)';
              }
            }}
          >
            🎭 Venue Dashboard
          </button>

          <button
            onClick={() => navigate('/verify-certificate')}
            style={{
              background: 'transparent',
              border: 'none',
              color: isActive('/verify-certificate') ? 'white' : 'rgba(255, 255, 255, 0.7)',
              fontSize: '15px',
              fontWeight: isActive('/verify-certificate') ? '600' : '500',
              cursor: 'pointer',
              padding: '8px 0',
              borderBottom: isActive('/verify-certificate') ? '3px solid white' : 'none',
              transition: 'all 0.3s',
            }}
            onMouseEnter={(e) => {
              if (!isActive('/verify-certificate')) {
                (e.target as HTMLButtonElement).style.color = 'white';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive('/verify-certificate')) {
                (e.target as HTMLButtonElement).style.color = 'rgba(255, 255, 255, 0.7)';
              }
            }}
          >
            🔐 Verify Certificate
          </button>
        </div>
      </div>
    </nav>
  );
};

export default ContractNavigation;
