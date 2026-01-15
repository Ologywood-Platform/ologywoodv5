interface ContractTemplate {
  id: string;
  name: string;
  sections: ContractSection[];
  createdAt: Date;
  updatedAt: Date;
}

interface ContractSection {
  id: string;
  title: string;
  content: string;
  editable: boolean;
  order: number;
}

interface Contract {
  id: number;
  bookingId: number;
  templateId: string;
  artistId: number;
  venueId: number;
  sections: ContractSection[];
  status: 'draft' | 'pending' | 'signed' | 'executed';
  artistSignature?: {
    signatureData: string;
    signedAt: Date;
    ipAddress?: string;
  };
  venueSignature?: {
    signatureData: string;
    signedAt: Date;
    ipAddress?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  executedAt?: Date;
}

// Standard contract templates
const standardTemplates: ContractTemplate[] = [
  {
    id: 'standard-performance',
    name: 'Standard Performance Agreement',
    sections: [
      {
        id: 'parties',
        title: 'Parties',
        content: 'This agreement is entered into between the Artist and the Venue for performance services.',
        editable: false,
        order: 1,
      },
      {
        id: 'performance-details',
        title: 'Performance Details',
        content: 'Performance Date: [DATE]\nVenue: [VENUE_NAME]\nLocation: [LOCATION]\nStart Time: [START_TIME]\nEnd Time: [END_TIME]\nGenre: [GENRE]',
        editable: true,
        order: 2,
      },
      {
        id: 'compensation',
        title: 'Compensation',
        content: 'Total Fee: $[AMOUNT]\nDeposit (due upon signing): $[DEPOSIT]\nBalance (due [DAYS] days before performance): $[BALANCE]',
        editable: true,
        order: 3,
      },
      {
        id: 'technical-requirements',
        title: 'Technical Requirements',
        content: 'The Venue agrees to provide: [TECHNICAL_REQUIREMENTS]\nThe Artist will provide: [ARTIST_EQUIPMENT]',
        editable: true,
        order: 4,
      },
      {
        id: 'cancellation',
        title: 'Cancellation Policy',
        content: 'If cancelled by Venue more than 30 days before: Full refund\nIf cancelled 15-30 days before: 50% refund\nIf cancelled less than 15 days before: No refund',
        editable: true,
        order: 5,
      },
      {
        id: 'liability',
        title: 'Liability & Insurance',
        content: 'The Venue is responsible for liability insurance. The Artist is responsible for personal equipment insurance.',
        editable: false,
        order: 6,
      },
      {
        id: 'signatures',
        title: 'Signatures',
        content: 'By signing below, both parties agree to the terms of this contract.',
        editable: false,
        order: 7,
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// In-memory storage
const contracts: Map<number, Contract> = new Map();
let contractIdCounter = 1000;

export function getContractTemplates(): ContractTemplate[] {
  return standardTemplates;
}

export function getContractTemplate(templateId: string): ContractTemplate | undefined {
  return standardTemplates.find(t => t.id === templateId);
}

export function createContract(
  bookingId: number,
  artistId: number,
  venueId: number,
  templateId: string,
  customizations?: Partial<ContractSection>[]
): Contract {
  const template = getContractTemplate(templateId);
  if (!template) {
    throw new Error(`Template ${templateId} not found`);
  }

  let sections = JSON.parse(JSON.stringify(template.sections));

  if (customizations) {
    customizations.forEach(customization => {
      const section = sections.find((s: ContractSection) => s.id === customization.id);
      if (section && customization.content) {
        section.content = customization.content;
      }
    });
  }

  const contract: Contract = {
    id: contractIdCounter++,
    bookingId,
    templateId,
    artistId,
    venueId,
    sections,
    status: 'draft',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  contracts.set(contract.id, contract);
  console.log(`[Contract] Created contract #${contract.id} for booking #${bookingId}`);

  return contract;
}

export function getContract(contractId: number): Contract | undefined {
  return contracts.get(contractId);
}

export function getContractByBooking(bookingId: number): Contract | undefined {
  return Array.from(contracts.values()).find(c => c.bookingId === bookingId);
}

export function updateContractSection(
  contractId: number,
  sectionId: string,
  newContent: string
): Contract | undefined {
  const contract = contracts.get(contractId);
  if (!contract) return undefined;

  const section = contract.sections.find(s => s.id === sectionId);
  if (section && section.editable) {
    section.content = newContent;
    contract.updatedAt = new Date();
    console.log(`[Contract] Updated section ${sectionId} in contract #${contractId}`);
  }

  return contract;
}

export function signContract(
  contractId: number,
  signerRole: 'artist' | 'venue',
  signatureData: string,
  ipAddress?: string
): Contract | undefined {
  const contract = contracts.get(contractId);
  if (!contract) return undefined;

  if (signerRole === 'artist') {
    contract.artistSignature = {
      signatureData,
      signedAt: new Date(),
      ipAddress,
    };
  } else {
    contract.venueSignature = {
      signatureData,
      signedAt: new Date(),
      ipAddress,
    };
  }

  // Update status based on signatures
  if (contract.artistSignature && contract.venueSignature) {
    contract.status = 'executed';
    contract.executedAt = new Date();
    console.log(`[Contract] Contract #${contractId} fully executed`);
  } else {
    contract.status = 'pending';
    console.log(`[Contract] Contract #${contractId} signed by ${signerRole}`);
  }

  contract.updatedAt = new Date();
  return contract;
}

export function getContractSignatureStatus(contractId: number): {
  artistSigned: boolean;
  venueSigned: boolean;
  fullyExecuted: boolean;
} {
  const contract = contracts.get(contractId);
  if (!contract) {
    return { artistSigned: false, venueSigned: false, fullyExecuted: false };
  }

  return {
    artistSigned: !!contract.artistSignature,
    venueSigned: !!contract.venueSignature,
    fullyExecuted: contract.status === 'executed',
  };
}

export function generateContractPDF(contractId: number): string {
  const contract = contracts.get(contractId);
  if (!contract) throw new Error(`Contract ${contractId} not found`);

  // Generate PDF content
  let pdfContent = `PERFORMANCE AGREEMENT\n\n`;
  pdfContent += `Contract ID: ${contract.id}\n`;
  pdfContent += `Created: ${contract.createdAt.toLocaleDateString()}\n`;
  pdfContent += `Status: ${contract.status.toUpperCase()}\n\n`;

  contract.sections.forEach(section => {
    pdfContent += `${section.title}\n`;
    pdfContent += `${'='.repeat(section.title.length)}\n`;
    pdfContent += `${section.content}\n\n`;
  });

  if (contract.artistSignature) {
    pdfContent += `Artist Signature: [Signed on ${contract.artistSignature.signedAt.toLocaleDateString()}]\n`;
  }

  if (contract.venueSignature) {
    pdfContent += `Venue Signature: [Signed on ${contract.venueSignature.signedAt.toLocaleDateString()}]\n`;
  }

  return pdfContent;
}

export function getContractHistory(userId: number, userRole: 'artist' | 'venue'): Contract[] {
  const field = userRole === 'artist' ? 'artistId' : 'venueId';
  return Array.from(contracts.values()).filter(c => c[field as keyof Contract] === userId);
}

export function getContractStats(): {
  totalContracts: number;
  draftContracts: number;
  pendingContracts: number;
  executedContracts: number;
  averageSigningTime: number;
} {
  const allContracts = Array.from(contracts.values());
  const executedContracts = allContracts.filter(c => c.status === 'executed');

  let totalSigningTime = 0;
  for (const contract of executedContracts) {
    if (contract.executedAt && contract.createdAt) {
      totalSigningTime += contract.executedAt.getTime() - contract.createdAt.getTime();
    }
  }

  const averageSigningTime =
    executedContracts.length > 0 ? totalSigningTime / executedContracts.length / (1000 * 60 * 60) : 0;

  return {
    totalContracts: allContracts.length,
    draftContracts: allContracts.filter(c => c.status === 'draft').length,
    pendingContracts: allContracts.filter(c => c.status === 'pending').length,
    executedContracts: executedContracts.length,
    averageSigningTime: Math.round(averageSigningTime * 10) / 10,
  };
}
