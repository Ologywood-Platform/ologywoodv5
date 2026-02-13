import { describe, it, expect } from 'vitest';
import { contractsRouter } from './contracts';

describe('Contracts Router - Access Control', () => {
  it('should allow artists to access getArtistContracts', async () => {
    const artistContext = {
      user: {
        id: 1,
        email: 'artist@example.com',
        role: 'artist',
        name: 'Test Artist',
      },
    };

    const caller = contractsRouter.createCaller(artistContext as any);
    
    try {
      const contracts = await caller.getArtistContracts();
      expect(Array.isArray(contracts)).toBe(true);
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }
  });

  it('should allow venues to access getArtistContracts', async () => {
    const venueContext = {
      user: {
        id: 450137,
        email: 'ologywood5@gmail.com',
        role: 'venue',
        name: 'Gary Chisolm',
      },
    };

    const caller = contractsRouter.createCaller(venueContext as any);
    
    try {
      const contracts = await caller.getArtistContracts();
      expect(Array.isArray(contracts)).toBe(true);
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }
  });

  it('should allow admins to access getArtistContracts', async () => {
    const adminContext = {
      user: {
        id: 2,
        email: 'admin@example.com',
        role: 'admin',
        name: 'Test Admin',
      },
    };

    const caller = contractsRouter.createCaller(adminContext as any);
    
    try {
      const contracts = await caller.getArtistContracts();
      expect(Array.isArray(contracts)).toBe(true);
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }
  });

  it('should deny other roles access to getArtistContracts', async () => {
    const otherContext = {
      user: {
        id: 3,
        email: 'other@example.com',
        role: 'user',
        name: 'Test User',
      },
    };

    const caller = contractsRouter.createCaller(otherContext as any);
    
    try {
      await caller.getArtistContracts();
      expect.fail('Should have thrown an error');
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect((error as any).message).toContain('Artist or venue access required');
    }
  });
});
