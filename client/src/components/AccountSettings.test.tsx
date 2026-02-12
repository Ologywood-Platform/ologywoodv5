import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AccountSettings } from './AccountSettings';
import * as useAuthModule from '@/_core/hooks/useAuth';
import * as useLocationModule from 'wouter';
import * as trpcModule from '@/lib/trpc';

// Mock modules
vi.mock('@/_core/hooks/useAuth');
vi.mock('wouter');
vi.mock('@/lib/trpc');
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));
vi.mock('./PhotoManagement', () => ({
  PhotoManagement: () => <div>Photo Management</div>,
}));
vi.mock('./MediaGalleryManager', () => ({
  MediaGalleryManager: () => <div>Media Gallery Manager</div>,
}));
vi.mock('./EmailPreferencesCenter', () => ({
  EmailPreferencesCenter: () => <div>Email Preferences Center</div>,
}));

describe('AccountSettings', () => {
  const mockUser = {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    role: 'artist',
    createdAt: new Date('2024-01-01'),
  };

  const mockNavigate = vi.fn();
  const mockLogout = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock useAuth
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      user: mockUser,
      logout: mockLogout,
      isLoading: false,
    } as any);

    // Mock useLocation
    vi.mocked(useLocationModule.useLocation).mockReturnValue([
      '/',
      mockNavigate,
    ] as any);

    // Mock TRPC
    const mockTrpc = {
      subscription: {
        getStatus: {
          useQuery: vi.fn(() => ({
            data: {
              planName: 'Basic',
              status: 'active',
              amount: 29,
              renewalDate: new Date('2026-03-12'),
            },
          })),
        },
      },
      notificationPreference: {
        get: {
          useQuery: vi.fn(() => ({
            data: {
              bookingNotifications: true,
              messageNotifications: true,
            },
          })),
        },
        update: {
          useMutation: vi.fn(() => ({
            mutateAsync: vi.fn().mockResolvedValue({}),
            isPending: false,
          })),
        },
      },
      auth: {
        logout: {
          useMutation: vi.fn(() => ({
            mutateAsync: vi.fn().mockResolvedValue({}),
            isPending: false,
          })),
        },
      },
      user: {
        updateProfile: {
          useMutation: vi.fn(() => ({
            mutateAsync: vi.fn().mockResolvedValue({}),
            isPending: false,
          })),
        },
      },
    };
    vi.mocked(trpcModule.trpc, { partial: true }).mockReturnValue(mockTrpc as any);
  });

  it('should render all tabs', () => {
    render(<AccountSettings />);

    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Subscription')).toBeInTheDocument();
    expect(screen.getByText('Notifications')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    expect(screen.getByText('Support')).toBeInTheDocument();
  });

  it('should display user email and name in profile tab', () => {
    render(<AccountSettings />);

    expect(screen.getByDisplayValue(mockUser.email)).toBeInTheDocument();
    expect(screen.getByDisplayValue(mockUser.name)).toBeInTheDocument();
  });

  it('should allow editing email', async () => {
    const user = userEvent.setup();
    render(<AccountSettings />);

    const changeEmailButton = screen.getAllByText('Change')[0];
    await user.click(changeEmailButton);

    const emailInput = screen.getByDisplayValue(mockUser.email);
    expect(emailInput).not.toHaveAttribute('readonly');
  });

  it('should allow editing name', async () => {
    const user = userEvent.setup();
    render(<AccountSettings />);

    const editButton = screen.getByText('Edit');
    await user.click(editButton);

    const nameInput = screen.getByDisplayValue(mockUser.name);
    expect(nameInput).not.toHaveAttribute('readonly');
  });

  it('should display subscription information', async () => {
    render(<AccountSettings />);

    const subscriptionTab = screen.getByText('Subscription');
    fireEvent.click(subscriptionTab);

    await waitFor(() => {
      expect(screen.getByText(/Basic Plan/i)).toBeInTheDocument();
      expect(screen.getByText('$29')).toBeInTheDocument();
    });
  });

  it('should display notification preferences', async () => {
    render(<AccountSettings />);

    const notificationsTab = screen.getByText('Notifications');
    fireEvent.click(notificationsTab);

    await waitFor(() => {
      expect(screen.getByText('Booking Requests')).toBeInTheDocument();
      expect(screen.getByText('Messages')).toBeInTheDocument();
      expect(screen.getByText('Booking Reminders')).toBeInTheDocument();
      expect(screen.getByText('Marketing & Updates')).toBeInTheDocument();
    });
  });

  it('should display support options', async () => {
    render(<AccountSettings />);

    const supportTab = screen.getByText('Support');
    fireEvent.click(supportTab);

    await waitFor(() => {
      expect(screen.getByText('Help Center')).toBeInTheDocument();
      expect(screen.getByText('Contact Support')).toBeInTheDocument();
      expect(screen.getByText(/Call Us/i)).toBeInTheDocument();
    });
  });

  it('should show logout button in support tab', async () => {
    render(<AccountSettings />);

    const supportTab = screen.getByText('Support');
    fireEvent.click(supportTab);

    await waitFor(() => {
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });
  });

  it('should show delete account confirmation dialog', async () => {
    const user = userEvent.setup();
    render(<AccountSettings />);

    const supportTab = screen.getByText('Support');
    fireEvent.click(supportTab);

    const deleteButton = screen.getByText('Delete Account');
    await user.click(deleteButton);

    await waitFor(() => {
      expect(screen.getByText('Confirm Account Deletion')).toBeInTheDocument();
    });
  });

  it('should display OAuth-only message for password and 2FA', async () => {
    render(<AccountSettings />);

    await waitFor(() => {
      expect(screen.getByText(/OAuth authentication/i)).toBeInTheDocument();
      expect(screen.getByText(/Change Password \(Not Available\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Two-Factor Authentication \(Not Available\)/i)).toBeInTheDocument();
    });
  });

  it('should have disabled password and 2FA buttons', async () => {
    render(<AccountSettings />);

    const passwordButton = screen.getByText(/Change Password/i).closest('button');
    const twoFaButton = screen.getByText(/Two-Factor Authentication/i).closest('button');

    expect(passwordButton).toBeDisabled();
    expect(twoFaButton).toBeDisabled();
  });

  it('should display account creation date', () => {
    render(<AccountSettings />);

    const expectedDate = new Date('2024-01-01').toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    expect(screen.getByText(expectedDate)).toBeInTheDocument();
  });

  it('should display active account status', () => {
    render(<AccountSettings />);

    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('should render photo management component', () => {
    render(<AccountSettings />);

    expect(screen.getByText('Photo Management')).toBeInTheDocument();
  });

  it('should render media gallery manager component', () => {
    render(<AccountSettings />);

    expect(screen.getByText('Media Gallery Manager')).toBeInTheDocument();
  });

  it('should render email preferences center component', async () => {
    render(<AccountSettings />);

    const emailTab = screen.getByText('Email');
    fireEvent.click(emailTab);

    await waitFor(() => {
      expect(screen.getByText('Email Preferences Center')).toBeInTheDocument();
    });
  });

  it('should have save preferences button in notifications tab', async () => {
    render(<AccountSettings />);

    const notificationsTab = screen.getByText('Notifications');
    fireEvent.click(notificationsTab);

    await waitFor(() => {
      expect(screen.getByText('Save Preferences')).toBeInTheDocument();
    });
  });

  it('should have help center navigation button', async () => {
    render(<AccountSettings />);

    const supportTab = screen.getByText('Support');
    fireEvent.click(supportTab);

    const helpButton = screen.getByText('Help Center').closest('button');
    expect(helpButton).toBeInTheDocument();
  });

  it('should have contact support button', async () => {
    render(<AccountSettings />);

    const supportTab = screen.getByText('Support');
    fireEvent.click(supportTab);

    const contactButton = screen.getByText('Contact Support').closest('button');
    expect(contactButton).toBeInTheDocument();
  });
});
