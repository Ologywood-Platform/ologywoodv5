import { beforeEach, describe, expect, it, vi } from 'vitest';

const service = vi.hoisted(() => ({
  getRiderDocumentLibraryContext: vi.fn(),
  getRiderDocumentLibrary: vi.fn(),
  uploadRiderDocument: vi.fn(),
  replaceRiderDocument: vi.fn(),
  setDefaultRiderDocument: vi.fn(),
  clearDefaultRiderDocument: vi.fn(),
  archiveRiderDocument: vi.fn(),
}));

vi.mock('./services/riderDocumentService', () => service);

import { __resetRiderDocumentAttemptRateLimitForTests, riderDocumentsRouter } from './routers/riderDocuments';

const context = (id: number) => ({ user: { id } }) as any;
const input = {
  title: 'Tour Rider',
  fileName: 'rider.pdf',
  pdfBase64: Buffer.from('%PDF-1.4 fake').toString('base64'),
};

describe('rider document expensive mutation rate limit', () => {
  beforeEach(() => {
    __resetRiderDocumentAttemptRateLimitForTests();
    vi.clearAllMocks();
    // This models a manager context where the service resolves their selected
    // talent library to owner 77, even though the actor is another user.
    service.getRiderDocumentLibraryContext.mockResolvedValue({ ownerUserId: 77, canManage: true, planAllowed: true });
    service.uploadRiderDocument.mockResolvedValue({ id: 1 });
  });

  it('charges the actual resolved owner budget across different managers', async () => {
    const firstManager = riderDocumentsRouter.createCaller(context(31));
    for (let attempt = 0; attempt < 4; attempt += 1) await firstManager.upload(input);
    const secondManager = riderDocumentsRouter.createCaller(context(32));
    await expect(secondManager.upload(input)).rejects.toMatchObject({ code: 'TOO_MANY_REQUESTS' });
    expect(service.uploadRiderDocument).toHaveBeenCalledTimes(4);
    expect(service.uploadRiderDocument).toHaveBeenLastCalledWith(31, expect.objectContaining({ ownerUserId: 77 }));
  });
});
