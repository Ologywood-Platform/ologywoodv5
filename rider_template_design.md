# Ologywood Rider Contract Template Design

## Overview

The Ologywood rider template is a professional, customizable document that artists can create and manage to communicate their performance requirements to venues. The template is designed to be simple enough for independent artists while comprehensive enough to cover all essential needs.

## Template Structure

### Section 1: Header & Basic Information

**Purpose:** Establish the document and identify the parties involved.

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| Document Title | Text | "PERFORMANCE RIDER" | Yes |
| Artist/Band Name | Text | Name of the performing artist | Yes |
| Genre | Select | Music genre (Rock, Jazz, Electronic, etc.) | Yes |
| Contact Email | Email | Primary contact for the artist | Yes |
| Contact Phone | Phone | Primary phone number | No |
| Website | URL | Artist website or social media | No |
| Date Prepared | Date | When the rider was created | Auto |

### Section 2: Performance Details

**Purpose:** Define the scope and nature of the performance.

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| Performance Type | Select | Concert, DJ Set, Workshop, Private Event | Yes |
| Typical Performance Duration | Number | Minutes (e.g., 60, 90, 120) | Yes |
| Setup Time Required | Number | Minutes needed before performance | No |
| Soundcheck Time | Number | Minutes needed for soundcheck | No |
| Teardown Time | Number | Minutes needed after performance | No |
| Number of Performers | Number | Band members or solo | Yes |
| Backup Performers | Text | Names of backup musicians | No |

### Section 3: Technical Requirements

**Purpose:** Specify all technical and equipment needs.

#### 3.1 Sound System
| Field | Type | Description | Required |
|-------|------|-------------|----------|
| PA System Required | Boolean | Does venue need to provide PA? | Yes |
| Microphone Type | Select | Handheld, Headset, Lavalier | No |
| Monitor Mix Required | Boolean | Need for stage monitors? | No |
| DI Boxes Needed | Number | Number of DI boxes | No |
| Audio Interface | Text | Specific model if bringing own | No |

#### 3.2 Lighting
| Field | Type | Description | Required |
|-------|------|-------------|----------|
| Lighting Required | Boolean | Does performance need special lighting? | Yes |
| Lighting Type | Select | Basic, Standard, Advanced, Custom | No |
| Special Effects | Text | Lasers, projections, strobes, etc. | No |
| Lighting Operator | Boolean | Does artist provide lighting operator? | No |

#### 3.3 Stage Setup
| Field | Type | Description | Required |
|-------|------|-------------|----------|
| Stage Dimensions | Text | Minimum stage size (e.g., "20x15 ft") | No |
| Stage Height | Number | Preferred stage height in feet | No |
| Backdrop Required | Boolean | Need for backdrop or branding | No |
| Backdrop Details | Text | Description of backdrop needs | No |

#### 3.4 Equipment
| Field | Type | Description | Required |
|-------|------|-------------|----------|
| Bringing Own Equipment | Boolean | Artist bringing equipment? | Yes |
| Equipment List | TextArea | Detailed list of equipment | Conditional |
| Power Requirements | Text | Voltage and amperage needed | No |
| Backup Equipment | Text | Backup gear needed from venue | No |

### Section 4: Hospitality Requirements

**Purpose:** Specify comfort and well-being needs.

#### 4.1 Dressing Room
| Field | Type | Description | Required |
|-------|------|-------------|----------|
| Dressing Room Required | Boolean | Need for private dressing room? | No |
| Room Temperature | Text | Preferred temperature | No |
| Furniture Needed | MultiSelect | Chairs, table, mirrors, couch, etc. | No |
| Amenities | MultiSelect | Towels, water, snacks, etc. | No |

#### 4.2 Catering
| Field | Type | Description | Required |
|-------|------|-------------|----------|
| Catering Provided | Boolean | Does venue provide food/drinks? | No |
| Dietary Restrictions | MultiSelect | Vegetarian, vegan, gluten-free, etc. | No |
| Specific Dietary Needs | TextArea | Detailed dietary information | No |
| Beverages | MultiSelect | Water, coffee, tea, juice, alcohol | No |
| Meal Timing | Text | When meals should be provided | No |

#### 4.3 Parking & Access
| Field | Type | Description | Required |
|-------|------|-------------|----------|
| Parking Required | Boolean | Need for parking? | No |
| Parking Type | Select | General, VIP, Covered, etc. | No |
| Load-in Access | Text | Special access requirements | No |
| Accessible Entrance | Boolean | Need for accessible entrance? | No |

### Section 5: Travel & Accommodation

**Purpose:** Specify travel and lodging requirements.

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| Travel Provided | Boolean | Does venue provide transportation? | No |
| Travel Method | Select | Car, Bus, Flight, Other | No |
| Accommodation Provided | Boolean | Does venue provide hotel? | No |
| Hotel Requirements | Text | Star rating, specific features | No |
| Number of Rooms | Number | Hotel rooms needed | No |
| Check-in/Check-out | Text | Preferred times | No |
| Ground Transportation | Text | Airport pickup, etc. | No |

### Section 6: Merchandise & Promotion

**Purpose:** Define commercial and promotional aspects.

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| Merchandise Sales | Boolean | Artist selling merchandise? | No |
| Merchandise Cut | Percentage | Venue commission percentage | No |
| Photography Allowed | Boolean | Can venue/public take photos? | Yes |
| Video Recording Allowed | Boolean | Can venue record performance? | No |
| Social Media Permission | Boolean | Can venue post on social media? | No |
| Broadcasting Rights | Boolean | Can performance be broadcast? | No |
| Promotional Materials | TextArea | Logos, bios, promotional content | No |

### Section 7: Special Requests & Notes

**Purpose:** Capture any additional requirements or preferences.

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| Special Requests | TextArea | Any additional requirements | No |
| Emergency Contact | Text | Emergency contact name & number | No |
| Additional Notes | TextArea | Any other important information | No |

### Section 8: Compliance & Signature

**Purpose:** Legal acknowledgment and acceptance.

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| Artist Signature | Signature | Digital signature of artist | Yes |
| Date Signed | Date | When rider was signed | Auto |
| Venue Acknowledgment | Boolean | Venue confirms receipt | No |
| Venue Signature | Signature | Venue representative signature | No |
| Venue Confirmation Date | Date | When venue confirmed | No |

## Data Model

```typescript
interface RiderTemplate {
  id: number;
  artistId: number;
  name: string;
  description: string;
  genre: string;
  performanceType: string;
  performanceDuration: number;
  
  // Technical Requirements
  paSystemRequired: boolean;
  microphoneType?: string;
  monitorMixRequired: boolean;
  lightingRequired: boolean;
  lightingType?: string;
  stageDimensions?: string;
  equipmentList?: string;
  powerRequirements?: string;
  
  // Hospitality
  dressingRoomRequired: boolean;
  cateringProvided: boolean;
  dietaryRestrictions?: string[];
  beverages?: string[];
  parkingRequired: boolean;
  
  // Travel & Accommodation
  travelProvided: boolean;
  accommodationProvided: boolean;
  hotelRequirements?: string;
  
  // Merchandise & Promotion
  merchandiseSales: boolean;
  photographyAllowed: boolean;
  videoRecordingAllowed: boolean;
  socialMediaPermission: boolean;
  broadcastingRights: boolean;
  
  // Additional
  specialRequests?: string;
  emergencyContact?: string;
  additionalNotes?: string;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  isPublished: boolean;
  version: number;
}

interface RiderInstance {
  id: number;
  templateId: number;
  bookingId: number;
  venueName: string;
  eventDate: Date;
  status: 'draft' | 'sent' | 'acknowledged' | 'confirmed' | 'completed';
  
  // Customizations for this specific booking
  customizations?: Record<string, any>;
  
  // Signatures
  artistSignature?: string;
  artistSignedAt?: Date;
  venueSignature?: string;
  venueSignedAt?: Date;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  pdfUrl?: string;
}
```

## User Workflows

### Artist Workflow
1. Create new rider template with basic information
2. Fill in technical requirements
3. Add hospitality preferences
4. Save as template
5. For each booking, customize template for that specific venue
6. Generate PDF and send to venue
7. Track venue acknowledgment

### Venue Workflow
1. Receive rider from artist
2. Review requirements
3. Confirm feasibility or request modifications
4. Sign rider to confirm compliance
5. Store rider for reference during event setup

## Integration Points

- **Booking System:** Riders linked to specific bookings
- **PDF Export:** Generate professional PDF documents
- **Email:** Send riders to venues
- **Calendar:** Rider details visible in calendar view
- **Contract Management:** Riders stored as part of contract documentation

## Customization Options

- **Templates:** Artists can save multiple rider templates for different performance types
- **Versioning:** Track changes to riders over time
- **Presets:** Common requirements can be saved as presets
- **Conditional Fields:** Show/hide fields based on performance type
- **Custom Fields:** Artists can add custom requirements

## Validation Rules

- Artist name and contact required
- At least one technical requirement must be specified
- Dietary restrictions must be valid options
- Dates must be in future for bookings
- Percentages must be 0-100
- Phone numbers must be valid format
- Email must be valid format

## Export Formats

- **PDF:** Professional formatted document with branding
- **Word:** Editable document for further customization
- **JSON:** Data export for integration with other systems
- **Email:** Direct email to venue with embedded rider details
