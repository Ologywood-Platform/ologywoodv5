# Ologywood Rider Contract Template System

## Overview

The Rider Contract Template system provides professional, customizable rider templates for artists on the Ologywood booking platform. Artists can create, manage, and share detailed technical, hospitality, and financial requirements for their performances.

## Features

### ✅ Three Professional Templates

#### 1. **Standard Artist Rider** (Most Popular)
The comprehensive template for professional artists with full customization options.

**Sections:**
- Artist Information (name, genre, ensemble size, duration)
- Technical Requirements (sound, lighting, stage, equipment)
- Hospitality & Accommodations (green room, meals, beverages, parking)
- Financial Terms (fee, deposit, payment schedule, cancellation policy)
- Special Requests (promotional, merchandise, recording rights)
- Contact Information

**Use Case:** Full-time performers, touring acts, established artists

#### 2. **Minimal Rider** (Solo/Acoustic)
Simplified template for solo performers and acoustic acts.

**Sections:**
- Artist Information
- Technical Setup (microphone, amplification)
- Financial Terms

**Use Case:** Singer-songwriters, acoustic performers, local artists

#### 3. **Band Rider** (Full Ensemble)
Comprehensive template for bands and ensembles with production requirements.

**Sections:**
- Band Information (members, genres, set duration)
- Production Requirements (stage, PA, monitors, lighting, load-in)
- Hospitality
- Financial Terms

**Use Case:** Full bands, orchestras, large ensembles

### 🎯 Tier-Based Access

| Feature | FREE | STARTER | PROFESSIONAL |
|---------|------|---------|--------------|
| Rider Builder | ❌ | ✅ | ✅ |
| Templates | 0 | Unlimited | Unlimited |
| Customization | - | Full | Full |
| HTML Export | - | ✅ | ✅ |
| JSON Export | - | ✅ | ✅ |
| Template Duplication | - | ✅ | ✅ |

## API Endpoints

### Get User's Rider Templates
```typescript
GET /trpc/rider.getMyTemplates
Response: RiderTemplate[]
```

### Get Specific Template
```typescript
GET /trpc/rider.getTemplate
Input: { templateId: number }
Response: RiderTemplate
```

### Create Template from Scratch
```typescript
POST /trpc/rider.createTemplate
Input: {
  templateName: string
  templateData: Record<string, any>
}
Response: RiderTemplate
```

### Create from Default Template
```typescript
POST /trpc/rider.createFromDefault
Input: {
  templateType: "standard" | "minimal" | "band"
  customName?: string
}
Response: RiderTemplate
```

### Update Template
```typescript
PUT /trpc/rider.updateTemplate
Input: {
  templateId: number
  templateName?: string
  templateData?: Record<string, any>
}
Response: RiderTemplate
```

### Delete Template
```typescript
DELETE /trpc/rider.deleteTemplate
Input: { templateId: number }
Response: boolean
```

### Duplicate Template
```typescript
POST /trpc/rider.duplicateTemplate
Input: {
  templateId: number
  newName?: string
}
Response: RiderTemplate
```

### Validate Template Data
```typescript
GET /trpc/rider.validateTemplate
Input: {
  templateType: "standard" | "minimal" | "band"
  data: Record<string, any>
}
Response: { valid: boolean; errors: string[] }
```

### Generate HTML Preview
```typescript
GET /trpc/rider.generatePreview
Input: { templateId: number }
Response: string (HTML)
```

### Export as JSON
```typescript
GET /trpc/rider.exportAsJSON
Input: { templateId: number }
Response: string (JSON)
```

### Get Template Statistics
```typescript
GET /trpc/rider.getStats
Response: {
  totalTemplates: number
  templatesByType: { standard: number; minimal: number; band: number }
  lastUpdated: Date | null
}
```

### Get Default Template Structure
```typescript
GET /trpc/rider.getDefaultTemplate
Input: { templateType: "standard" | "minimal" | "band" }
Response: RiderContractTemplate
```

### List All Default Templates
```typescript
GET /trpc/rider.listDefaultTemplates
Response: {
  standard: RiderContractTemplate
  minimal: RiderContractTemplate
  band: RiderContractTemplate
}
```

## Data Structure

### RiderTemplate
```typescript
interface RiderTemplate {
  id: number
  artistId: number
  templateName: string
  templateData: Record<string, any>
  createdAt: Date
  updatedAt: Date
}
```

### RiderContractTemplate
```typescript
interface RiderContractTemplate {
  id: string
  title: string
  description: string
  sections: RiderSection[]
  editableFields: string[]
  requiredFields: string[]
}
```

### RiderSection
```typescript
interface RiderSection {
  id: string
  title: string
  fields: RiderField[]
}
```

### RiderField
```typescript
interface RiderField {
  id: string
  label: string
  type: 'text' | 'textarea' | 'number' | 'checkbox' | 'select' | 'date'
  placeholder?: string
  defaultValue?: string | number | boolean
  required?: boolean
  options?: string[]
  description?: string
}
```

## Usage Examples

### Create a Standard Rider Template

```typescript
// Create from default template
const response = await trpc.rider.createFromDefault.mutate({
  templateType: 'standard',
  customName: 'My Rock Band Rider 2024'
});

// Update with custom data
await trpc.rider.updateTemplate.mutate({
  templateId: response.id,
  templateData: {
    artist_name: 'The Amazing Band',
    genre: 'Rock',
    ensemble_size: 4,
    performance_duration: 90,
    performance_fee: 2000,
    sound_system: 'Full PA with 2x15" subs',
    lighting: 'Professional stage lighting',
    // ... more fields
  }
});
```

### Validate Rider Data

```typescript
const validation = await trpc.rider.validateTemplate.query({
  templateType: 'standard',
  data: {
    artist_name: 'Test Artist',
    genre: 'Jazz',
    ensemble_size: 3,
    performance_duration: 60,
    performance_fee: 500,
    primary_contact: 'John Doe',
    contact_phone: '555-1234',
    contact_email: 'john@example.com'
  }
});

if (validation.valid) {
  console.log('Rider is valid!');
} else {
  console.log('Errors:', validation.errors);
}
```

### Generate HTML Preview

```typescript
const html = await trpc.rider.generatePreview.query({
  templateId: 123
});

// Display in modal or download as HTML
window.open('data:text/html;charset=utf-8,' + encodeURIComponent(html));
```

### Export Rider as JSON

```typescript
const json = await trpc.rider.exportAsJSON.query({
  templateId: 123
});

// Download as file
const element = document.createElement('a');
element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(json));
element.setAttribute('download', 'rider-template.json');
element.click();
```

### Duplicate a Template

```typescript
const duplicate = await trpc.rider.duplicateTemplate.mutate({
  templateId: 123,
  newName: 'My Rock Band Rider 2024 - Backup'
});
```

## Database Schema

### rider_templates Table
```sql
CREATE TABLE rider_templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  artistId INT NOT NULL,
  templateName VARCHAR(255),
  templateData JSON,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

## Service Layer

### File: `server/services/riderTemplateService.ts`

**Key Functions:**
- `getArtistRiderTemplates(artistId)` - Get all templates for an artist
- `getRiderTemplate(templateId)` - Get a specific template
- `createRiderTemplate(artistId, name, data)` - Create new template
- `updateRiderTemplate(templateId, artistId, name, data)` - Update template
- `deleteRiderTemplate(templateId, artistId)` - Delete template
- `createFromDefaultTemplate(artistId, type, name)` - Create from default
- `validateTemplate(type, data)` - Validate rider data
- `generateRiderPreview(templateId, artistId)` - Generate HTML
- `exportRiderAsJSON(templateId, artistId)` - Export as JSON
- `duplicateRiderTemplate(templateId, artistId, name)` - Duplicate template
- `getRiderTemplateStats(artistId)` - Get statistics

### File: `server/services/riderContractTemplate.ts`

**Key Functions:**
- `getDefaultTemplate(type)` - Get template structure
- `getAllRiderTemplates()` - Get all available templates
- `validateRiderData(templateId, data)` - Validate data
- `generateRiderHTML(templateId, data)` - Generate HTML preview

## TRPC Router

### File: `server/routers/rider.ts`

All endpoints are protected with tier-based access control:
- `FREE` tier: No access to rider builder
- `STARTER` tier: Full access to rider builder
- `PROFESSIONAL` tier: Full access to rider builder

## Testing

### Run Tests
```bash
pnpm vitest run server/services/riderTemplateService.test.ts
```

### Test Coverage
- Template creation and validation
- Field validation
- Default values
- HTML generation
- Template structure verification
- Tier-based access control

**All 21 tests passing ✅**

## Security Considerations

1. **Authorization**: All endpoints verify user ownership of templates
2. **Tier Validation**: Feature access is checked against user's subscription tier
3. **Input Validation**: All inputs are validated with Zod schemas
4. **Data Sanitization**: Template data is properly escaped in HTML output
5. **Error Handling**: Sensitive errors are not exposed to clients

## Best Practices

### For Artists
1. Create a template for each performance type (rock, jazz, classical, etc.)
2. Use the Standard template as a starting point
3. Customize technical requirements based on your setup
4. Keep financial terms consistent with your market rate
5. Duplicate successful templates for similar events

### For Developers
1. Always validate rider data before saving
2. Check tier access before allowing operations
3. Use the TRPC endpoints for all rider operations
4. Generate HTML previews for user review
5. Export templates as JSON for backup/sharing

## Roadmap

### Planned Features
- [ ] PDF export with professional formatting
- [ ] Template sharing between artists
- [ ] Rider history and versioning
- [ ] Integration with booking confirmation emails
- [ ] Analytics on rider acceptance rates
- [ ] AI-powered rider suggestions
- [ ] Rider comparison tools
- [ ] Integration with contract generation

## Support

For issues or questions about the rider template system:
1. Check the API documentation above
2. Review the test cases for usage examples
3. Contact support@ologywood.com

## License

The Rider Template System is part of Ologywood and is subject to the same license terms.
