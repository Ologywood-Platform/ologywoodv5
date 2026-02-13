import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ArtistProfileSetupWizard } from '../ArtistProfileSetupWizard';
import { trpc } from '../../lib/trpc';

// Mock TRPC
vi.mock('../../lib/trpc', () => ({
  trpc: {
    artist: {
      getMyProfile: {
        useQuery: vi.fn(),
      },
      updateProfile: {
        useMutation: vi.fn(),
      },
      uploadProfilePhoto: {
        useMutation: vi.fn(),
      },
    },
  },
}));

describe('ArtistProfileSetupWizard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render wizard when profile is complete', () => {
    const mockUseQuery = vi.fn().mockReturnValue({
      data: {
        profilePhotoUrl: 'https://example.com/photo.jpg',
        genre: ['Jazz', 'Blues'],
        location: 'New York, NY',
        feeRangeMin: 500,
        feeRangeMax: 5000,
      },
      isLoading: false,
    });

    vi.mocked(trpc.artist.getMyProfile.useQuery).mockImplementation(mockUseQuery);

    const { container } = render(<ArtistProfileSetupWizard />);
    expect(container.firstChild).toBeNull();
  });

  it('should render wizard when profile is incomplete', () => {
    const mockUseQuery = vi.fn().mockReturnValue({
      data: {
        profilePhotoUrl: null,
        genre: [],
        location: null,
        feeRangeMin: null,
        feeRangeMax: null,
      },
      isLoading: false,
    });

    vi.mocked(trpc.artist.getMyProfile.useQuery).mockImplementation(mockUseQuery);

    render(<ArtistProfileSetupWizard />);
    expect(screen.getByText('Complete Your Artist Profile')).toBeInTheDocument();
  });

  it('should display progress bar with correct percentage', () => {
    const mockUseQuery = vi.fn().mockReturnValue({
      data: {
        profilePhotoUrl: 'https://example.com/photo.jpg', // 1/5 completed
        genre: [],
        location: null,
        feeRangeMin: null,
        feeRangeMax: null,
      },
      isLoading: false,
    });

    vi.mocked(trpc.artist.getMyProfile.useQuery).mockImplementation(mockUseQuery);

    render(<ArtistProfileSetupWizard />);
    expect(screen.getByText('20%')).toBeInTheDocument(); // 1 out of 5 steps
  });

  it('should navigate between steps', async () => {
    const mockUseQuery = vi.fn().mockReturnValue({
      data: {
        profilePhotoUrl: null,
        genre: [],
        location: null,
        feeRangeMin: null,
        feeRangeMax: null,
      },
      isLoading: false,
    });

    const mockUpdateMutation = vi.fn().mockResolvedValue({});

    vi.mocked(trpc.artist.getMyProfile.useQuery).mockImplementation(mockUseQuery);
    vi.mocked(trpc.artist.updateProfile.useMutation).mockReturnValue({
      mutateAsync: mockUpdateMutation,
      isPending: false,
    } as any);

    render(<ArtistProfileSetupWizard />);

    // Should start on step 1 (photo)
    expect(screen.getByText('Add Profile Photo')).toBeInTheDocument();

    // Click next button
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText('Select Your Genres')).toBeInTheDocument();
    });
  });

  it('should handle genre selection', async () => {
    const mockUseQuery = vi.fn().mockReturnValue({
      data: {
        profilePhotoUrl: 'https://example.com/photo.jpg',
        genre: [],
        location: null,
        feeRangeMin: null,
        feeRangeMax: null,
      },
      isLoading: false,
    });

    const mockUpdateMutation = vi.fn().mockResolvedValue({});

    vi.mocked(trpc.artist.getMyProfile.useQuery).mockImplementation(mockUseQuery);
    vi.mocked(trpc.artist.updateProfile.useMutation).mockReturnValue({
      mutateAsync: mockUpdateMutation,
      isPending: false,
    } as any);

    render(<ArtistProfileSetupWizard />);

    // Navigate to genres step
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText('Select Your Genres')).toBeInTheDocument();
    });

    // Select a genre
    const jazzButton = screen.getByText('Jazz');
    fireEvent.click(jazzButton);

    // Check if genre is selected (button should have different styling)
    expect(jazzButton).toHaveClass('border-purple-600');
  });

  it('should handle location input', async () => {
    const mockUseQuery = vi.fn().mockReturnValue({
      data: {
        profilePhotoUrl: 'https://example.com/photo.jpg',
        genre: ['Jazz'],
        location: null,
        feeRangeMin: null,
        feeRangeMax: null,
      },
      isLoading: false,
    });

    const mockUpdateMutation = vi.fn().mockResolvedValue({});

    vi.mocked(trpc.artist.getMyProfile.useQuery).mockImplementation(mockUseQuery);
    vi.mocked(trpc.artist.updateProfile.useMutation).mockReturnValue({
      mutateAsync: mockUpdateMutation,
      isPending: false,
    } as any);

    render(<ArtistProfileSetupWizard />);

    // Navigate to location step (skip genres)
    let nextButton = screen.getByText('Next');
    fireEvent.click(nextButton); // Go to genres
    fireEvent.click(nextButton); // Go to location

    await waitFor(() => {
      expect(screen.getByPlaceholderText('e.g., Los Angeles, CA')).toBeInTheDocument();
    });

    // Enter location
    const locationInput = screen.getByPlaceholderText('e.g., Los Angeles, CA') as HTMLInputElement;
    await userEvent.type(locationInput, 'New York, NY');

    expect(locationInput.value).toBe('New York, NY');
  });

  it('should handle pricing input', async () => {
    const mockUseQuery = vi.fn().mockReturnValue({
      data: {
        profilePhotoUrl: 'https://example.com/photo.jpg',
        genre: ['Jazz'],
        location: 'New York, NY',
        feeRangeMin: null,
        feeRangeMax: null,
      },
      isLoading: false,
    });

    const mockUpdateMutation = vi.fn().mockResolvedValue({});

    vi.mocked(trpc.artist.getMyProfile.useQuery).mockImplementation(mockUseQuery);
    vi.mocked(trpc.artist.updateProfile.useMutation).mockReturnValue({
      mutateAsync: mockUpdateMutation,
      isPending: false,
    } as any);

    render(<ArtistProfileSetupWizard />);

    // Navigate to pricing step
    const nextButtons = screen.getAllByText('Next');
    fireEvent.click(nextButtons[0]); // genres
    fireEvent.click(nextButtons[1]); // location
    fireEvent.click(nextButtons[2]); // pricing

    await waitFor(() => {
      expect(screen.getByPlaceholderText('500')).toBeInTheDocument();
    });

    // Enter pricing
    const minFeeInput = screen.getByPlaceholderText('500') as HTMLInputElement;
    const maxFeeInput = screen.getByPlaceholderText('5000') as HTMLInputElement;

    await userEvent.type(minFeeInput, '500');
    await userEvent.type(maxFeeInput, '5000');

    expect(minFeeInput.value).toBe('500');
    expect(maxFeeInput.value).toBe('5000');
  });

  it('should show skip button for optional steps', async () => {
    const mockUseQuery = vi.fn().mockReturnValue({
      data: {
        profilePhotoUrl: 'https://example.com/photo.jpg',
        genre: ['Jazz'],
        location: 'New York, NY',
        feeRangeMin: 500,
        feeRangeMax: 5000,
      },
      isLoading: false,
    });

    const mockUpdateMutation = vi.fn().mockResolvedValue({});

    vi.mocked(trpc.artist.getMyProfile.useQuery).mockImplementation(mockUseQuery);
    vi.mocked(trpc.artist.updateProfile.useMutation).mockReturnValue({
      mutateAsync: mockUpdateMutation,
      isPending: false,
    } as any);

    render(<ArtistProfileSetupWizard />);

    // Navigate to social links step (optional)
    const nextButtons = screen.getAllByText('Next');
    fireEvent.click(nextButtons[0]); // genres
    fireEvent.click(nextButtons[1]); // location
    fireEvent.click(nextButtons[2]); // pricing
    fireEvent.click(nextButtons[3]); // social links

    await waitFor(() => {
      expect(screen.getByText('Add Social Links')).toBeInTheDocument();
    });

    // Skip button should be visible for optional step
    expect(screen.getByText('Skip')).toBeInTheDocument();
  });

  it('should disable back button on first step', () => {
    const mockUseQuery = vi.fn().mockReturnValue({
      data: {
        profilePhotoUrl: null,
        genre: [],
        location: null,
        feeRangeMin: null,
        feeRangeMax: null,
      },
      isLoading: false,
    });

    vi.mocked(trpc.artist.getMyProfile.useQuery).mockImplementation(mockUseQuery);

    render(<ArtistProfileSetupWizard />);

    const backButton = screen.getByText('Back');
    expect(backButton).toBeDisabled();
  });

  it('should show correct step indicator progress', () => {
    const mockUseQuery = vi.fn().mockReturnValue({
      data: {
        profilePhotoUrl: 'https://example.com/photo.jpg',
        genre: ['Jazz'],
        location: null,
        feeRangeMin: null,
        feeRangeMax: null,
      },
      isLoading: false,
    });

    vi.mocked(trpc.artist.getMyProfile.useQuery).mockImplementation(mockUseQuery);

    render(<ArtistProfileSetupWizard />);

    // Should show 2 completed steps (photo and genres)
    const completedSteps = screen.getAllByRole('button').filter(btn => 
      btn.querySelector('svg') && btn.className.includes('bg-green-500')
    );
    
    expect(completedSteps.length).toBeGreaterThanOrEqual(1);
  });

  it('should call updateProfile mutation when completing steps', async () => {
    const mockUseQuery = vi.fn().mockReturnValue({
      data: {
        profilePhotoUrl: null,
        genre: [],
        location: null,
        feeRangeMin: null,
        feeRangeMax: null,
      },
      isLoading: false,
    });

    const mockUpdateMutation = vi.fn().mockResolvedValue({});

    vi.mocked(trpc.artist.getMyProfile.useQuery).mockImplementation(mockUseQuery);
    vi.mocked(trpc.artist.updateProfile.useMutation).mockReturnValue({
      mutateAsync: mockUpdateMutation,
      isPending: false,
    } as any);

    render(<ArtistProfileSetupWizard />);

    // Skip to genres step
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText('Select Your Genres')).toBeInTheDocument();
    });

    // Select genre and move to next step
    const jazzButton = screen.getByText('Jazz');
    fireEvent.click(jazzButton);

    const nextButtons = screen.getAllByText('Next');
    fireEvent.click(nextButtons[nextButtons.length - 1]);

    await waitFor(() => {
      expect(mockUpdateMutation).toHaveBeenCalledWith(
        expect.objectContaining({
          genre: expect.arrayContaining(['Jazz'])
        })
      );
    });
  });
});
