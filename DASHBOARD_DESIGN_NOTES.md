# Dashboard Design Patterns - Ologywood

## Existing Artist Dashboard (ArtistDashboardV3.tsx)

### Layout Structure:
- **Sticky Header**: Navigation with back button, title, settings toggle
- **Container**: Max-width container with padding
- **Background**: Gradient (slate-50 to slate-100)

### Component Patterns:
1. **Profile Card** - Shows artist info, photo, rating, profile completion bar
2. **Quick Actions** - Grid of icon buttons (Bookings, Availability, Riders, Messages)
3. **Upcoming Bookings** - List of next 3 bookings with date and view button
4. **Settings Toggle** - Conditional rendering of AccountSettings component

### Design Language:
- **Cards**: White background with border and shadow
- **Typography**: Bold titles, smaller descriptions
- **Colors**: Primary accent color, slate grays for secondary text
- **Icons**: Lucide React icons (Calendar, Clock, Music, MessageSquare, Star, etc.)
- **Spacing**: Consistent gap-3, gap-4, space-y-6
- **Buttons**: Outline variants for secondary actions, primary for main CTA

### Progressive Disclosure Pattern:
- Settings hidden until toggled
- Only showing next 3 bookings (not all)
- Profile completion bar with action button only if incomplete

## Design for Earnings Dashboard

Should follow same patterns:
- Same header style with back button
- Cards for different sections
- Progressive disclosure for detailed views
- Icon-based quick actions
- Consistent color scheme and typography
