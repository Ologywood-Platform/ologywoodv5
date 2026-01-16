/**
 * Help Center Articles Data
 * Structured data for searchable help center articles
 */

export interface HelpArticle {
  id: string;
  title: string;
  category: 'getting-started' | 'contracts' | 'signing' | 'certificates' | 'troubleshooting' | 'best-practices' | 'billing' | 'account';
  subcategory?: string;
  content: string;
  summary: string;
  keywords: string[];
  relatedArticles: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  lastUpdated: string;
  views: number;
  helpful: number;
  unhelpful: number;
  videoUrl?: string;
  estimatedReadTime: number; // in minutes
}

export const helpArticles: HelpArticle[] = [
  {
    id: 'getting-started-contracts',
    title: 'Getting Started with Contracts',
    category: 'getting-started',
    summary: 'Learn what contracts are and how to get started with the contract management system.',
    content: `
# Getting Started with Contracts

## What are Contracts?

Contracts in Ologywood are digital agreements between artists and venues for performance bookings. They outline the terms, conditions, and requirements for each performance.

## Key Benefits

### For Artists
- Review performance requirements before accepting
- Sign contracts securely with digital signatures
- Receive reminders about upcoming performances
- Verify contract authenticity with digital certificates
- Download copies of signed contracts

### For Venues
- Send professional contracts to artists
- Track who has signed and when
- Send automated reminders to signers
- Maintain legal compliance with audit trails
- Export contracts for record-keeping

## Getting Started

1. Log in to your Ologywood account
2. Navigate to your dashboard (Artist Dashboard or Venue Dashboard)
3. Click the "Contracts" tab to view your contracts
4. Review pending contracts or create new ones
5. Sign or send contracts as needed

## Next Steps

- Learn how to sign a contract
- Understand digital certificates
- Set up reminder preferences
    `,
    keywords: ['contract', 'getting started', 'overview', 'benefits', 'introduction'],
    relatedArticles: ['how-to-sign-contract', 'how-to-send-contract', 'understanding-certificates'],
    difficulty: 'beginner',
    lastUpdated: '2026-01-15',
    views: 0,
    helpful: 0,
    unhelpful: 0,
    estimatedReadTime: 5,
  },
  {
    id: 'how-to-sign-contract',
    title: 'How to Sign a Contract',
    category: 'signing',
    summary: 'Step-by-step guide to signing contracts with digital signatures.',
    content: `
# How to Sign a Contract

## Step 1: Access the Contract

1. Log in to your Ologywood account
2. Go to your Artist Dashboard
3. Click the "Contracts" tab
4. Find the contract you need to sign
5. Click "View Contract" to open it

## Step 2: Review the Contract

1. Read through the entire contract carefully
2. Pay special attention to:
   - Event date and time
   - Performance requirements
   - Payment terms
   - Cancellation policies
   - Technical requirements
3. Note any questions or concerns
4. Contact the venue if you need clarification

## Step 3: Sign the Contract

1. Scroll to the bottom of the contract
2. Click the "Sign Contract" button
3. A signature canvas will appear
4. Use your mouse or stylus to sign your name
5. Try to sign naturally and clearly
6. Click "Clear" if you want to start over
7. Click "Confirm Signature" when satisfied

## Step 4: Submit Your Signature

1. Click "Submit Signature" to finalize
2. You'll receive a confirmation message
3. The venue will be notified that you've signed
4. Your contract status changes to "Signed"

## Tips for Better Signatures

- Use a stylus if available for better control
- Sign clearly - avoid signatures that are too small or faint
- Use natural motion - don't try to be too precise
- Take your time - rushing can result in unclear signatures
- Practice on paper first if you're unsure

## Troubleshooting

**My signature won't appear on the canvas**
Try refreshing the page or using a different browser. Ensure JavaScript is enabled.

**The signature was rejected**
Try signing again with a clearer, more distinct signature.

**I signed by mistake**
Contact the venue to cancel the contract and create a new one.
    `,
    keywords: ['sign', 'signature', 'digital signature', 'how to', 'tutorial'],
    relatedArticles: ['getting-started-contracts', 'understanding-certificates', 'troubleshooting-signature'],
    difficulty: 'beginner',
    lastUpdated: '2026-01-15',
    views: 0,
    helpful: 0,
    unhelpful: 0,
    estimatedReadTime: 8,
  },
  {
    id: 'how-to-send-contract',
    title: 'How to Send a Contract',
    category: 'contracts',
    subcategory: 'venue-guide',
    summary: 'Guide for venue managers on sending contracts to artists.',
    content: `
# How to Send a Contract

## For Venue Managers

### Step 1: Create or Select a Contract

1. Log in to your Ologywood account
2. Go to your Venue Dashboard
3. Click the "Contracts" tab
4. Click "Create New Contract" or select an existing booking
5. The contract template will load with pre-filled event details

### Step 2: Review and Customize

1. Review the pre-filled information:
   - Event date and time
   - Artist name
   - Venue name
   - Performance requirements
2. Make any necessary edits to:
   - Contract terms
   - Technical requirements
   - Payment terms
   - Cancellation policies
3. Add any additional requirements specific to your venue

### Step 3: Send the Contract

1. Click "Send for Signature"
2. Verify the artist's email address
3. Optionally add a personal message
4. Click "Send Contract"
5. You'll receive a confirmation that the contract was sent

### Step 4: Track Signing Progress

1. Return to your Contracts dashboard
2. The contract will show "Awaiting Signature" status
3. You'll see when the artist opens the contract
4. You'll be notified when the artist signs
5. Once both parties sign, the contract is "Confirmed"

## Best Practices

- Send early - Give artists time to review before the event
- Be clear - Use specific language for requirements
- Be fair - Ensure terms are reasonable for both parties
- Follow up - Send reminders if the artist hasn't signed
- Keep records - Save copies of all signed contracts
    `,
    keywords: ['send', 'contract', 'venue', 'artist', 'how to'],
    relatedArticles: ['getting-started-contracts', 'best-practices-contracts', 'understanding-certificates'],
    difficulty: 'beginner',
    lastUpdated: '2026-01-15',
    views: 0,
    helpful: 0,
    unhelpful: 0,
    estimatedReadTime: 7,
  },
  {
    id: 'understanding-certificates',
    title: 'Understanding Digital Certificates',
    category: 'certificates',
    summary: 'Learn what digital certificates are and how they verify signatures.',
    content: `
# Understanding Digital Certificates

## What is a Digital Certificate?

A digital certificate is a unique identifier that proves a signature is authentic and hasn't been tampered with. When you sign a contract, a digital certificate is automatically generated and attached to your signature.

## Certificate Information

Each certificate includes:

- **Certificate Number** - Unique identifier (e.g., SIG-2026-ABC123)
- **Signer Name** - Name of the person who signed
- **Signer Email** - Email address of the signer
- **Signed Date** - Exact date and time of signing
- **Expiration Date** - When the certificate expires (365 days)
- **Verification Hash** - Cryptographic proof of authenticity
- **Audit Trail** - Record of all verification events

## How Certificates Work

1. Signature Capture - Your signature is recorded digitally
2. Cryptographic Hashing - Your signature is converted to a unique hash
3. Certificate Generation - A digital certificate is created with your signature hash
4. Timestamp - The exact date and time is recorded
5. Audit Trail - All verification events are logged

## Why Certificates Matter

- **Legal Proof** - Proves you actually signed the contract
- **Authenticity** - Verifies the signature hasn't been altered
- **Compliance** - Meets legal requirements for digital signatures
- **Dispute Resolution** - Provides evidence in case of disagreements
- **Record Keeping** - Creates a permanent audit trail

## Certificate Validity

- Certificates are valid for 365 days from the signing date
- After expiration, the certificate can still be verified but is marked as expired
- If you need to re-verify an expired certificate, contact support
    `,
    keywords: ['certificate', 'digital certificate', 'verification', 'signature', 'authenticity'],
    relatedArticles: ['how-to-sign-contract', 'verifying-certificate', 'troubleshooting-certificate'],
    difficulty: 'intermediate',
    lastUpdated: '2026-01-15',
    views: 0,
    helpful: 0,
    unhelpful: 0,
    estimatedReadTime: 6,
  },
  {
    id: 'verifying-certificate',
    title: 'Verifying Contract Authenticity',
    category: 'certificates',
    summary: 'How to verify that a signature on a contract is authentic.',
    content: `
# Verifying Contract Authenticity

## How to Verify a Certificate

### Step 1: Access the Verification Page

1. Go to the Ologywood website
2. Click "Verify Certificate" in the main menu
3. Or navigate directly to the verification page

### Step 2: Enter the Certificate Number

1. Find the certificate number on your signed contract
2. Copy the certificate number exactly (including any dashes)
3. Paste it into the verification field
4. Click "Verify Certificate"

### Step 3: Review the Results

The verification results will show:

- **Status** - Valid, Invalid, or Expired
- **Signer Information** - Name and email of the signer
- **Signature Date** - When the contract was signed
- **Expiration Date** - When the certificate expires
- **Verification Count** - How many times it's been verified
- **Audit Trail** - Complete history of verification events

### Step 4: Check the Audit Trail

The audit trail shows:

- **Action** - What happened (created, verified, etc.)
- **Timestamp** - When it happened
- **Performed By** - Who performed the action
- **IP Address** - Where the action came from

## Interpreting Results

**Valid Certificate:**
- Signature is authentic
- No tampering detected
- Certificate is current and valid
- Safe to rely on for legal purposes

**Invalid Certificate:**
- Signature may be fraudulent
- Tampering has been detected
- Certificate is not recognized
- Do not rely on this signature

**Expired Certificate:**
- Certificate is older than 365 days
- Signature may still be authentic
- May need to be renewed
- Contact support if verification is needed

## When to Verify

- Before accepting a contract
- When disputing a contract
- For legal compliance
- When sharing contracts with third parties
- Periodically for important contracts
    `,
    keywords: ['verify', 'certificate', 'verification', 'authenticity', 'signature'],
    relatedArticles: ['understanding-certificates', 'troubleshooting-certificate'],
    difficulty: 'intermediate',
    lastUpdated: '2026-01-15',
    views: 0,
    helpful: 0,
    unhelpful: 0,
    estimatedReadTime: 7,
  },
  {
    id: 'troubleshooting-signature',
    title: 'Troubleshooting Signature Issues',
    category: 'troubleshooting',
    summary: 'Solutions for common signature and signing problems.',
    content: `
# Troubleshooting Signature Issues

## Signature Won't Appear on Canvas

**Problem:** The signature canvas isn't working or the signature won't appear.

**Solutions:**
1. Check your internet connection
2. Refresh the page (F5 or Cmd+R)
3. Ensure JavaScript is enabled in your browser
4. Try using a different browser
5. Clear your browser cache
6. Disable browser extensions that might interfere

## Signature Was Rejected

**Problem:** The signature was rejected after submission.

**Solutions:**
1. Ensure signature is clearly visible and distinct
2. Avoid signatures that are too small or faint
3. Try signing again with a clearer motion
4. Use a mouse or stylus for better control
5. Try on a different device
6. Contact support if issues persist

## Can't Submit Signature

**Problem:** The submit button isn't working or the signature won't submit.

**Solutions:**
1. Ensure the signature canvas has content
2. Try refreshing the page
3. Clear browser cache and cookies
4. Disable browser extensions
5. Try a different browser
6. Contact support if the issue continues

## Signature Looks Unclear

**Problem:** The signature appears unclear or distorted.

**Solutions:**
1. Use a stylus for better precision
2. Sign more slowly and deliberately
3. Ensure good lighting on your screen
4. Try on a larger device (tablet or desktop)
5. Adjust your browser zoom level
6. Practice on paper first

## Other Signature Issues

If you're experiencing a different signature issue:

1. Take a screenshot of the problem
2. Note the time when it occurred
3. Describe what you were doing
4. Contact support with this information
    `,
    keywords: ['troubleshooting', 'signature', 'problem', 'issue', 'help'],
    relatedArticles: ['how-to-sign-contract', 'getting-started-contracts'],
    difficulty: 'beginner',
    lastUpdated: '2026-01-15',
    views: 0,
    helpful: 0,
    unhelpful: 0,
    estimatedReadTime: 5,
  },
  {
    id: 'best-practices-contracts',
    title: 'Best Practices for Contract Management',
    category: 'best-practices',
    summary: 'Tips and best practices for managing contracts effectively.',
    content: `
# Best Practices for Contract Management

## For Artists

### Before Signing
- Read the entire contract carefully
- Understand all terms and conditions
- Note any requirements or restrictions
- Ask questions if anything is unclear
- Don't rush - take your time to review

### When Signing
- Use a clear, distinct signature
- Sign in a quiet, comfortable location
- Ensure good lighting for clarity
- Keep a copy of the signed contract
- Note the certificate number

### After Signing
- Confirm you received the signed copy
- Save the contract for your records
- Mark the event date in your calendar
- Prepare for any specific requirements
- Contact the venue if you have questions

## For Venues

### Before Sending
- Ensure all contract details are correct
- Review the terms and conditions
- Customize as needed for your venue
- Proofread for any errors
- Test the contract before sending

### When Sending
- Send contracts well in advance of the event
- Include a personal message if appropriate
- Provide contact information for questions
- Follow up if not signed within a week
- Be responsive to artist questions

### After Signing
- Confirm receipt of both signatures
- Send a final copy to the artist
- File the contract for your records
- Add the event to your calendar
- Prepare for the performance

## Contract Management Tips

- Organize by date - Keep contracts organized by event date
- Use templates - Standardize your contracts with templates
- Keep backups - Maintain copies of all signed contracts
- Track status - Monitor which contracts are signed
- Follow up - Send reminders to signers
- Document changes - Keep records of any modifications
- Archive old contracts - Move past contracts to archive
- Review regularly - Periodically review your contracts

## Legal Considerations

- Consult a lawyer - Have a lawyer review your contract templates
- Know your laws - Understand digital signature laws in your jurisdiction
- Be fair - Ensure contract terms are reasonable for both parties
- Document everything - Keep records of all communications
- Respect privacy - Protect personal information in contracts
- Update regularly - Review and update contracts annually
    `,
    keywords: ['best practices', 'tips', 'contract', 'management', 'guidelines'],
    relatedArticles: ['getting-started-contracts', 'how-to-sign-contract', 'how-to-send-contract'],
    difficulty: 'intermediate',
    lastUpdated: '2026-01-15',
    views: 0,
    helpful: 0,
    unhelpful: 0,
    estimatedReadTime: 10,
  },
];

// Helper function to search articles
export function searchArticles(query: string): HelpArticle[] {
  const lowerQuery = query.toLowerCase();
  return helpArticles.filter((article) => {
    const titleMatch = article.title.toLowerCase().includes(lowerQuery);
    const summaryMatch = article.summary.toLowerCase().includes(lowerQuery);
    const keywordMatch = article.keywords.some((keyword) =>
      keyword.toLowerCase().includes(lowerQuery)
    );
    const contentMatch = article.content.toLowerCase().includes(lowerQuery);
    return titleMatch || summaryMatch || keywordMatch || contentMatch;
  });
}

// Helper function to get articles by category
export function getArticlesByCategory(
  category: HelpArticle['category']
): HelpArticle[] {
  return helpArticles.filter((article) => article.category === category);
}

// Helper function to get related articles
export function getRelatedArticles(articleId: string): HelpArticle[] {
  const article = helpArticles.find((a) => a.id === articleId);
  if (!article) return [];
  return article.relatedArticles
    .map((id) => helpArticles.find((a) => a.id === id))
    .filter((a) => a !== undefined) as HelpArticle[];
}

// Get all unique categories
export function getAllCategories(): HelpArticle['category'][] {
  const categories = new Set(helpArticles.map((a) => a.category));
  return Array.from(categories);
}

// Get articles by difficulty level
export function getArticlesByDifficulty(
  difficulty: HelpArticle['difficulty']
): HelpArticle[] {
  return helpArticles.filter((article) => article.difficulty === difficulty);
}

// Get popular articles by views
export function getPopularArticles(limit: number = 5): HelpArticle[] {
  return [...helpArticles]
    .sort((a, b) => b.views - a.views)
    .slice(0, limit);
}

// Get most helpful articles
export function getMostHelpfulArticles(limit: number = 5): HelpArticle[] {
  return [...helpArticles]
    .sort((a, b) => {
      const aRatio = a.helpful / (a.helpful + a.unhelpful || 1);
      const bRatio = b.helpful / (b.helpful + b.unhelpful || 1);
      return bRatio - aRatio;
    })
    .slice(0, limit);
}
