# Ologywood Rider Contract Template

## Overview

This document provides a comprehensive rider contract template for the Ologywood artist booking platform. The template is designed to be simple, intuitive, and easy to use while covering all essential booking requirements. Artists can create and customize rider templates that venues will review before confirming bookings.

## Template Structure

The rider contract template is organized into five main sections:

### 1. Event Details & Contact Information

This section captures the basic event information and ensures proper communication between artist and venue.

**Essential Fields:**

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| Event Name | Text | Name/title of the performance or event | Yes |
| Event Date | Date | Date of the scheduled performance | Yes |
| Event Time | Time | Start time of the performance | Yes |
| Performance Duration | Duration | Expected length of performance (in minutes) | Yes |
| Venue Name | Text | Name of the venue hosting the event | Yes |
| Venue Address | Text | Full address of the venue | Yes |
| Contact Person | Text | Primary contact at the venue | Yes |
| Contact Phone | Phone | Direct phone number for the contact person | Yes |
| Contact Email | Email | Email address for coordination | Yes |
| Load-in Time | Time | When the artist should arrive for setup | Yes |
| Sound Check Time | Time | Scheduled time for technical sound check | No |

### 2. Technical Requirements

This section outlines all technical specifications and equipment needs for the performance.

**Audio/Sound System:**

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| Sound System Provided | Boolean | Whether venue provides PA system | Yes |
| Sound System Type | Select | Type of system (PA, DJ, Live Band, etc.) | Conditional |
| Mixer Type | Text | Specific mixer model or requirements | No |
| Microphone Count | Number | Number of microphones needed | No |
| Microphone Type | Select | Type (Vocal, Instrument, Wireless, etc.) | No |
| Wireless Mic Frequency | Text | Specific frequency requirements if applicable | No |
| Monitor System | Boolean | Whether monitor speakers are needed | No |
| Monitor Channels | Number | Number of monitor mixes needed | No |
| Lighting System Provided | Boolean | Whether venue provides lighting | No |
| Lighting Requirements | Text | Specific lighting needs (color, intensity, effects) | No |
| Stage Dimensions | Text | Width x Depth x Height of stage | No |
| Stage Surface | Select | Type of surface (wood, concrete, carpet, etc.) | No |
| Power Requirements | Text | Voltage and amperage needed | No |
| Power Outlets Available | Number | Number of accessible outlets on stage | No |
| Internet/WiFi | Boolean | Whether high-speed internet is needed | No |
| Video/Projection | Boolean | Whether video projection is needed | No |
| Recording Permission | Select | Allowed (Audio Only, Video, None) | No |

### 3. Hospitality Requirements

This section covers all hospitality and comfort needs for the artist and their team.

**Accommodations & Meals:**

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| Hotel Accommodation | Boolean | Whether hotel is provided | No |
| Hotel Star Rating | Select | Minimum hotel quality (3-star, 4-star, 5-star) | Conditional |
| Number of Rooms | Number | Number of hotel rooms needed | Conditional |
| Meal Provision | Select | Meals provided (None, Breakfast, Lunch, Dinner, All) | No |
| Dietary Restrictions | Text | Specific dietary needs (vegetarian, vegan, allergies, etc.) | No |
| Beverage Provision | Select | Beverages provided (None, Non-Alcoholic, Full Bar) | No |
| Green Room Access | Boolean | Private green room/backstage area needed | No |
| Green Room Amenities | Text | Specific items needed (seating, tables, mirrors, etc.) | No |
| Parking | Select | Parking arrangement (Complimentary, Paid, Not Available) | No |
| Parking Details | Text | Specific parking instructions or location | No |
| Security | Boolean | Security personnel required | No |
| Security Details | Text | Specific security needs or concerns | No |
| Dressing Room | Boolean | Private dressing room required | No |
| Dressing Room Amenities | Text | Specific amenities (mirrors, lighting, furniture) | No |

### 4. Financial Terms

This section outlines all payment-related information and financial arrangements.

**Payment & Compensation:**

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| Performance Fee | Currency | Total fee for the performance | Yes |
| Fee Type | Select | Fixed Fee or Percentage of Ticket Sales | Yes |
| Payment Method | Select | How payment will be made (Bank Transfer, Check, Cash, PayPal) | Yes |
| Payment Timing | Select | When payment is due (Upon Booking, Before Event, After Event) | Yes |
| Deposit Required | Boolean | Whether a deposit is required | No |
| Deposit Amount | Currency | Amount of deposit (if required) | Conditional |
| Deposit Due Date | Date | When deposit must be received | Conditional |
| Cancellation Fee | Percentage | Percentage of fee charged if cancelled | No |
| Travel Reimbursement | Boolean | Whether travel costs are reimbursed | No |
| Travel Budget | Currency | Maximum travel reimbursement allowed | Conditional |
| Merchandise Rights | Select | Artist can sell merchandise (Yes, No, Percentage Split) | No |
| Merchandise Split | Percentage | Percentage split if applicable | Conditional |

### 5. Special Requests & Notes

This section allows for any additional requirements, preferences, or special instructions.

**Additional Information:**

| Field | Type | Description | Required |
|-------|------|-------------|----------|
| Band/Crew Size | Number | Total number of people in the artist's party | No |
| Crew Meal Provision | Boolean | Whether crew meals are provided | No |
| Parking for Crew | Boolean | Whether crew parking is provided | No |
| Equipment Transport | Text | Any special equipment that needs transportation | No |
| Setup Assistance | Boolean | Whether venue provides setup help | No |
| Breakdown Assistance | Boolean | Whether venue provides breakdown help | No |
| Specific Restrictions | Text | Any performance restrictions or requirements | No |
| Preferred Stage Position | Text | Specific stage setup preferences | No |
| Sound Check Duration | Duration | Time needed for sound check (in minutes) | No |
| Pre-Event Promotion | Text | Expected promotion/marketing by venue | No |
| Photo/Video Policy | Text | Policy for photos and videos during performance | No |
| Additional Notes | Text | Any other important information or requests | No |

## Simple Booking Workflow

### For Artists:

1. **Create Rider Template** - Artists access the "Riders" tab in their dashboard and create a new template
2. **Fill Out Sections** - Complete each section with their typical requirements (can leave fields blank if not applicable)
3. **Save Template** - Template is saved and can be reused for multiple bookings
4. **Edit Anytime** - Artists can update their template at any time
5. **Duplicate** - Artists can duplicate existing templates and modify them for specific venues

### For Venues:

1. **View Rider** - When browsing artists or receiving booking requests, venues can view the artist's rider template
2. **Review Requirements** - Venues review the technical, hospitality, and financial requirements
3. **Confirm Ability** - Venues confirm they can meet the requirements before booking
4. **Acknowledge** - Venues acknowledge the rider terms when confirming a booking
5. **Coordinate** - Venues use the rider as a checklist for event day preparation

## Key Design Principles

**Simplicity First:** The template uses straightforward language and avoids legal jargon. Fields are organized logically with clear labels.

**Flexibility:** Artists can customize templates for different venue types (clubs, festivals, corporate events, etc.) while maintaining consistency.

**Clarity:** Each field has a clear purpose and expected input format. Conditional fields only appear when relevant.

**Completeness:** The template covers all essential aspects of a professional booking while remaining concise and manageable.

**Mobile-Friendly:** All fields are designed to work well on mobile devices, making it easy for artists to create and edit templates on the go.

## Template Customization Examples

### Example 1: DJ/Electronic Artist

- Focus on: Audio system specs, lighting requirements, merchandise rights
- Minimal requirements: Hotel, dressing room, dietary restrictions
- Key field: Recording permission (often important for DJs)

### Example 2: Live Band

- Focus on: Stage dimensions, power requirements, crew accommodations
- Important: Sound check time, green room amenities, parking for equipment
- Key field: Band/crew size, equipment transport

### Example 3: Solo Acoustic Performer

- Focus on: Minimal technical requirements, intimate venue setup
- Important: Green room access, meal provision
- Key field: Specific restrictions, preferred stage position

## Best Practices for Artists

1. **Be Realistic:** Only request what you genuinely need for a quality performance
2. **Prioritize:** Mark truly essential requirements clearly
3. **Be Flexible:** Offer alternatives when possible (e.g., "Prefer wireless mic, but wired is acceptable")
4. **Update Regularly:** Keep your rider current as your needs change
5. **Communicate:** Use the rider as a starting point for conversation, not a rigid contract
6. **Acknowledge Limitations:** Understand that smaller venues may not meet all requirements

## Best Practices for Venues

1. **Review Early:** Check the rider when first considering an artist
2. **Communicate Limitations:** Let artists know what you can't provide
3. **Plan Ahead:** Use the rider to prepare your venue and staff
4. **Confirm Details:** Follow up with the artist to confirm final arrangements
5. **Prepare Checklist:** Create a venue checklist based on the rider for event day
6. **Document Changes:** Keep notes of any modifications agreed upon

## Integration with Booking System

The rider template system integrates seamlessly with Ologywood's booking workflow:

- **Discovery:** Artists' riders are visible when venues browse or search for performers
- **Booking Request:** When venues request a booking, they acknowledge the artist's rider requirements
- **Confirmation:** When artists confirm a booking, both parties have a clear understanding of expectations
- **Reference:** The rider serves as a reference document throughout the booking process
- **Dispute Resolution:** The rider provides clarity if questions arise about what was agreed upon

## Future Enhancements

Potential future improvements to the rider system include:

- **Rider Analytics:** Track which requirements are most commonly met or negotiated
- **Venue Capabilities:** Venues can create a profile of their capabilities, which are automatically matched against artist riders
- **Automated Matching:** System suggests compatible artists based on rider requirements and venue capabilities
- **Rider Versioning:** Track changes to riders over time
- **Industry Templates:** Pre-built templates for common artist types (DJ, Band, Solo, etc.)
- **PDF Export:** Generate professional PDF versions of riders for printing or sharing
- **E-Signature Integration:** Digital signature capability for rider acknowledgment

## Support & Resources

For questions about creating or using rider templates:

- **Help Center:** Access the Help Center in your dashboard for detailed guides
- **Support Tickets:** Submit support tickets for technical issues or questions
- **Community Forum:** Share tips and best practices with other artists and venues
- **Email Support:** Contact support@ologywood.com for assistance

---

**Document Version:** 1.0  
**Last Updated:** January 2026  
**Platform:** Ologywood Artist Booking Platform
