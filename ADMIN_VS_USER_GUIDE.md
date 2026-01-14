# Admin vs Regular User Views - Complete Guide

## Overview

Ologywood supports two distinct user types with different permissions and capabilities: **Admin users** have full platform access for testing and management, while **Regular users** (artists and venues) have role-specific access. This guide explains the differences and how to test both views.

## User Roles & Permissions

### Admin User
An admin user has complete access to all platform features and management capabilities. Currently, **Gary Chisolm** (garychisolm30@gmail.com) is configured as an admin.

**Admin Capabilities:**
- Create and manage both artist and venue profiles
- View all bookings across the platform
- Access analytics and reporting dashboard
- Manage user accounts and roles
- View all contracts and signatures
- Process refunds and payment adjustments
- Access system settings and configuration
- View user activity logs
- Manage subscription plans

**Admin Dashboard Access:**
- Analytics dashboard with platform-wide metrics
- User management panel
- Booking management interface
- Payment and transaction history
- System health monitoring

### Regular User - Artist
Artists create profiles to showcase their talent and receive booking requests from venues.

**Artist Capabilities:**
- Create and manage artist profile
- Set availability calendar
- Create and manage rider requirements
- View and accept booking requests
- Sign digital contracts
- Receive payments for completed bookings
- Leave reviews for venues
- Manage subscription and billing
- View booking history and analytics

**Artist Dashboard Access:**
- Artist profile management
- Availability calendar
- Booking requests and history
- Rider management
- Reviews and ratings
- Subscription settings

### Regular User - Venue
Venues search for artists and send booking requests to secure talent for their events.

**Venue Capabilities:**
- Create and manage venue profile
- Search and browse available artists
- Send booking requests with custom terms
- Sign digital contracts
- Process payments for artist bookings
- Leave reviews for artists
- Manage subscription and billing
- View booking history and analytics

**Venue Dashboard Access:**
- Venue profile management
- Artist search and discovery
- Booking requests and history
- Contract management
- Reviews and ratings
- Subscription settings

## Key Differences Between Views

| Feature | Admin | Artist | Venue |
|---------|-------|--------|-------|
| **Artist Search** | View all | N/A | Full access |
| **Booking Requests** | View all | Receive only | Send & receive |
| **Contract Management** | View all | Manage own | Manage own |
| **Analytics** | Platform-wide | Personal only | Personal only |
| **User Management** | Full access | N/A | N/A |
| **Payment Processing** | View all | Receive payments | Make payments |
| **Subscription Management** | Override access | Self-service | Self-service |
| **System Settings** | Full access | N/A | N/A |

## How to Switch Between Views

### Current Setup
You are currently logged in as **Gary Chisolm** with **admin role**. To test different user views, you have several options:

### Option 1: Create Test Accounts (Recommended for Beta)
The most realistic way to test different user views is to create separate test accounts:

**Step 1: Create Artist Test Account**
1. Log out from admin account
2. Click "Sign In" or "Get Started"
3. Create new account with email: `artist.test@example.com`
4. Select "Artist" role during onboarding
5. Complete artist profile with sample data
6. Log out

**Step 2: Create Venue Test Account**
1. Click "Sign In" or "Get Started"
2. Create new account with email: `venue.test@example.com`
3. Select "Venue" role during onboarding
4. Complete venue profile with sample data
5. Log out

**Step 3: Test Booking Flow**
1. Log in as venue account
2. Search for and find the artist you created
3. Send booking request
4. Log out
5. Log in as artist account
6. View and accept booking request
7. Complete booking flow

### Option 2: Role Switching Feature (For Testing)
An admin can temporarily switch to view the platform as a regular user without creating separate accounts.

**To Use Role Switching:**
1. Log in as admin (Gary Chisolm)
2. Go to Dashboard
3. Look for "Developer Tools" or "Admin Settings" section
4. Select "Switch User Role"
5. Choose "Artist" or "Venue" role
6. The interface will update to show the regular user view
7. Test features as that role
8. Switch back to admin when done

### Option 3: Database User Management (Advanced)
For advanced testing, you can directly manage user roles in the database:

**To Update User Role:**
```sql
UPDATE users 
SET role = 'artist' 
WHERE email = 'garychisolm30@gmail.com';
```

**Available Roles:**
- `admin` - Full platform access
- `artist` - Artist-specific features
- `venue` - Venue-specific features

## Testing Workflows

### Test 1: Complete Booking Flow
**Objective:** Verify the entire booking process from search to payment

**Steps:**
1. Log in as venue user
2. Search for available artists
3. View artist profile and reviews
4. Send booking request with custom terms
5. Log in as artist user
6. Review booking request
7. Accept booking and sign contract
8. Log in as venue user
9. Process payment
10. Verify both users see updated booking status

**Expected Results:**
- Booking appears in both dashboards
- Contract is signed by both parties
- Payment is processed successfully
- Email notifications sent to both users

### Test 2: Referral Program
**Objective:** Verify referral code generation and credit application

**Steps:**
1. Log in as first user (artist or venue)
2. Go to referral dashboard
3. Copy referral code
4. Log out and create new account
5. During signup, enter referral code
6. Complete profile
7. Log in as first user
8. Verify referral appears in stats
9. Complete a booking to trigger referral credit

**Expected Results:**
- Referral code is unique and valid
- New user is linked to referrer
- Credits are awarded on booking completion
- Leaderboard updates correctly

### Test 3: Verification Badges
**Objective:** Verify artist badge progression

**Steps:**
1. Log in as admin
2. View artist profile
3. Check current booking count
4. Complete 5+ bookings to trigger "Verified" badge
5. Verify badge appears on artist profile
6. Continue to 20+ bookings for "Top Rated" badge
7. Verify badge updates

**Expected Results:**
- Badges appear at correct milestones
- Badge displays on artist profile
- Badge visible in search results
- Progress tracking shows next milestone

### Test 4: Booking Templates
**Objective:** Verify template selection and auto-population

**Steps:**
1. Log in as venue user
2. Send booking request to artist
3. Select booking template (e.g., "Wedding Reception")
4. Verify pricing is auto-populated
5. Verify rider requirements are suggested
6. Customize as needed
7. Submit booking request
8. Verify template data is saved

**Expected Results:**
- Templates load correctly
- Pricing and requirements auto-populate
- Customization works properly
- Data persists in booking record

## Admin-Only Features

### User Management Panel
Access the admin panel to manage all users:
1. Go to Dashboard
2. Click "Admin Settings"
3. Select "User Management"
4. View all users with their roles and status
5. Update user roles or subscription levels
6. Suspend or activate accounts

### Analytics Dashboard
View platform-wide analytics:
1. Go to Dashboard
2. Click "Analytics"
3. View metrics: total bookings, revenue, active users
4. Filter by date range or user type
5. Export reports

### Payment Management
Process refunds and adjust payments:
1. Go to Dashboard
2. Click "Payments"
3. View all transactions
4. Process refunds or adjustments
5. View payment history

## Troubleshooting

**Q: I'm logged in as admin but want to see the artist view**
A: Create a separate test account with artist role, or use the role-switching feature if available.

**Q: Can I have multiple roles on one account?**
A: Currently, each account has a single role. To test multiple roles, create separate accounts.

**Q: How do I switch back to admin after testing as a regular user?**
A: Log out and log back in with your admin account (garychisolm30@gmail.com).

**Q: Can I see what a user sees without logging in as them?**
A: As an admin, you can view user activity and bookings in the admin panel, but you'll see the admin interface. For full user perspective, log in as that user.

## Best Practices for Testing

1. **Use Separate Accounts** - Create distinct test accounts for artist and venue roles to get the most realistic testing experience
2. **Document Test Cases** - Keep notes on what you're testing and expected results
3. **Test Edge Cases** - Try unusual scenarios (e.g., canceling bookings, disputing payments)
4. **Check Email Notifications** - Verify all automated emails are sent correctly
5. **Test on Mobile** - Use browser DevTools to test responsive design
6. **Clear Browser Cache** - Clear cookies and cache between account switches to avoid session conflicts

## Next Steps

After testing both admin and regular user views, consider:
1. Inviting beta users to test with their own accounts
2. Gathering feedback on user experience
3. Testing payment flows with test Stripe cards
4. Verifying email delivery for all notification types
5. Testing contract signing with multiple signature methods
