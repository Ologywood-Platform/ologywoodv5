# Ologywood Platform - Comprehensive Testing Guide

**Version:** 1.0  
**Last Updated:** January 14, 2026  
**Author:** Manus AI

## Table of Contents

1. [Overview](#overview)
2. [Testing Infrastructure](#testing-infrastructure)
3. [Admin Testing Dashboard](#admin-testing-dashboard)
4. [Test Data Generation](#test-data-generation)
5. [Test Scenarios](#test-scenarios)
6. [User Impersonation](#user-impersonation)
7. [End-to-End Workflow Tests](#end-to-end-workflow-tests)
8. [Testing Best Practices](#testing-best-practices)
9. [Troubleshooting](#troubleshooting)

---

## Overview

The Ologywood platform includes comprehensive testing infrastructure designed to validate complete booking workflows, payment processing, contract signing, and role-based access control. This guide provides step-by-step instructions for using the advanced testing tools available in the admin dashboard.

### Key Testing Components

The testing infrastructure consists of four main components:

| Component | Purpose | Access Level |
|-----------|---------|--------------|
| **Data Generator** | Creates realistic test data (artists, venues, bookings) | Admin Only |
| **Data Seeder** | Inserts generated data into the database | Admin Only |
| **Scenario Runner** | Executes pre-configured workflow scenarios | Admin Only |
| **User Impersonation** | Allows admins to test as different user roles | Admin Only |

---

## Testing Infrastructure

### Architecture Overview

The testing infrastructure is built on three layers:

**Backend Layer** - TRPC routers that handle test data generation, seeding, and workflow execution:
- `testdata.ts` - Data generation endpoints
- `testdata-seeding.ts` - Database insertion endpoints
- `test-workflows.ts` - Automated scenario workflows
- `impersonation.ts` - User impersonation tokens

**Frontend Layer** - React components that provide user interfaces:
- `TestDataGenerator.tsx` - Generate test data with controls
- `TestDataSeeder.tsx` - Seed data into database
- `TestScenarioRunner.tsx` - Execute workflow scenarios
- `UserImpersonation.tsx` - Impersonate test users
- `AdminDashboard.tsx` - Unified testing interface

**Testing Layer** - Vitest test suites:
- `test-workflows.test.ts` - 34 end-to-end tests covering all workflows

### Security & Access Control

All testing tools are protected by role-based access control. Only users with the `admin` role can access these features. The system enforces the following security measures:

- Admin-only access verification on all endpoints
- Temporary impersonation tokens with 60-minute expiration
- Prevention of self-impersonation
- Audit logging of all admin actions (recommended for production)
- Development-only warnings in the UI

---

## Admin Testing Dashboard

### Accessing the Testing Dashboard

1. Log in to Ologywood as an admin user
2. Navigate to the Dashboard
3. Look for the "Admin Testing Dashboard" section (visible only to admins)
4. The dashboard provides five tabs: Overview, Data Generator, Data Seeder, Scenarios, and Impersonation

### Dashboard Features

**Overview Tab**
- Quick start guide with step-by-step instructions
- Available tools summary
- Recommended testing workflows
- Test data requirements
- Security notes and best practices

**Data Generator Tab**
- Generate realistic test data for artists, venues, and bookings
- Customize quantity of each data type
- Copy generated data to clipboard
- View detailed data structure

**Data Seeder Tab**
- Insert generated data into the database
- Seed individual data types or complete scenarios
- View seeding results and confirmation
- Track inserted records

**Scenarios Tab**
- Execute pre-configured test workflows
- Select from four workflow scenarios
- View step-by-step execution details
- Monitor workflow completion status

**Impersonation Tab**
- Generate test users with different roles
- Switch between test users instantly
- View current impersonation status
- Access role-specific features

---

## Test Data Generation

### Generating Realistic Test Data

The Data Generator creates realistic test data using predefined templates and random values. This ensures test data closely resembles production data.

### Step-by-Step: Generate Test Data

1. **Navigate to Data Generator Tab**
   - Click the "Data Generator" tab in the Admin Dashboard

2. **Configure Data Quantities**
   - Set number of artists to generate (default: 3)
   - Set number of venues to generate (default: 3)
   - Set number of bookings to generate (default: 5)

3. **Generate Data**
   - Click "Generate Artists", "Generate Venues", or "Generate Bookings"
   - Or click "Generate Complete Scenario" to generate all at once

4. **Review Generated Data**
   - View generated data in the results panel
   - Copy JSON to clipboard for reference
   - Note the data structure for seeding

### Generated Data Examples

**Artist Profile Example:**
```json
{
  "artistName": "The Echoes",
  "genre": "Rock",
  "location": "New York, NY",
  "bio": "Energetic rock band performing original compositions",
  "feeRangeMin": 1500,
  "feeRangeMax": 3500,
  "touringPartySize": 5
}
```

**Venue Profile Example:**
```json
{
  "organizationName": "The Grand Hall",
  "contactName": "Sarah Johnson",
  "contactPhone": "555-0123",
  "address": "123 Main Street",
  "city": "New York",
  "state": "NY",
  "zipCode": "10001"
}
```

**Booking Example:**
```json
{
  "eventDate": "2026-02-14T19:00:00Z",
  "eventLocation": "Downtown Theater",
  "eventType": "Concert",
  "estimatedAttendees": 250,
  "quotedFee": 2500
}
```

---

## Test Scenarios

### Available Workflow Scenarios

The Scenario Runner provides four pre-configured test workflows that validate different aspects of the platform:

#### 1. Complete Booking Flow

**Purpose:** Validates the complete booking creation and acceptance workflow

**Steps:**
1. Create artist user and profile
2. Create venue user and profile
3. Send booking request from venue to artist
4. Artist accepts booking
5. Booking status confirmed

**Expected Outcome:** Booking created, accepted, and confirmed with all required fields populated

**Duration:** 5-10 minutes

#### 2. Payment Processing

**Purpose:** Tests Stripe integration for deposit and full payment processing

**Steps:**
1. Process deposit payment (50% of fee)
2. Verify deposit recorded in booking
3. Process full payment (remaining balance)
4. Verify full payment recorded
5. Test refund functionality (optional)

**Test Cards:**
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Requires Auth: `4000 0025 0000 3155`

**Expected Outcome:** All payments processed successfully with Stripe payment intent IDs recorded

**Duration:** 10-15 minutes

#### 3. Contract Signing

**Purpose:** Validates digital signature capture and PDF generation

**Steps:**
1. Generate Ryder contract
2. Artist reviews contract
3. Artist signs contract (canvas or typed signature)
4. Venue reviews signed contract
5. Venue signs contract
6. Download signed PDF

**Signature Methods:**
- Canvas: Draw signature on canvas
- Typed: Type name as signature
- Upload: Upload signature image

**Expected Outcome:** Fully signed contract with both signatures and downloadable PDF

**Duration:** 15-20 minutes

#### 4. Full Lifecycle

**Purpose:** Executes complete workflow from booking through contract to payment

**Phases:**
1. Booking Creation (5-10 minutes)
2. Payment Processing (10-15 minutes)
3. Contract Signing (15-20 minutes)
4. Post-Event Reviews (5 minutes)

**Expected Outcome:** Complete booking lifecycle with all phases completed successfully

**Duration:** 45-60 minutes

### Running a Test Scenario

1. **Navigate to Scenarios Tab**
   - Click the "Scenarios" tab in the Admin Dashboard

2. **Select Scenario**
   - Click on the desired scenario card to select it
   - Review the scenario description

3. **Run Scenario**
   - Click "Run Selected Scenario" button
   - Monitor execution progress

4. **Review Results**
   - View step-by-step execution details
   - Check expected outcomes
   - Note any errors or issues

5. **Next Steps**
   - Follow recommended next steps for the scenario
   - Proceed to manual testing if needed

---

## User Impersonation

### Purpose of User Impersonation

User impersonation allows admins to test the platform as different user roles without creating separate accounts. This enables comprehensive role-based testing and workflow validation.

### Step-by-Step: Impersonate a User

1. **Navigate to Impersonation Tab**
   - Click the "Impersonation" tab in the Admin Dashboard

2. **Generate Test Users**
   - Click "Generate 5 Test Users" button
   - Wait for users to be created
   - Review generated test users

3. **Select User to Impersonate**
   - Review available test users
   - Note the user's role (artist, venue, admin)
   - Click "Impersonate" button for desired user

4. **Verify Impersonation Status**
   - Yellow banner appears indicating active impersonation
   - Banner shows user ID, role, and token expiration
   - All actions are performed as the impersonated user

5. **Test Role-Specific Features**
   - Navigate the platform as the impersonated user
   - Test features specific to that role
   - Verify access controls work correctly

6. **Stop Impersonation**
   - Click "Stop Impersonation" button
   - Return to admin account
   - Yellow banner disappears

### Recommended Impersonation Scenarios

| User Role | Test Scenarios |
|-----------|----------------|
| **Artist** | Create profile, upload photos, set availability, respond to booking requests, sign contracts |
| **Venue** | Create profile, search artists, send booking requests, process payments, sign contracts |
| **Admin** | Access admin dashboard, view analytics, manage users, seed test data |

### Testing Complete Workflow with Impersonation

1. **Impersonate Venue User**
   - Search for artists
   - Send booking request to artist

2. **Stop Impersonation, Return to Admin**
   - Verify booking request appears in system

3. **Impersonate Artist User**
   - View booking request
   - Accept booking
   - Sign contract

4. **Stop Impersonation, Return to Admin**
   - Verify booking status updated
   - Verify contract signed

---

## End-to-End Workflow Tests

### Test Suite Overview

The platform includes 86 comprehensive unit tests organized into 5 test files:

| Test File | Tests | Coverage |
|-----------|-------|----------|
| `critical-fixes.test.ts` | 10 | Calendar timezone, onboarding, OAuth |
| `contracts.test.ts` | 22 | Contract creation, signatures, PDF generation |
| `test-workflows.test.ts` | 34 | Complete booking, payments, contracts, lifecycle |
| `analytics.test.ts` | 19 | Profile views, booking metrics, revenue tracking |
| `auth.logout.test.ts` | 1 | Authentication logout flow |

### Running Tests

**Run All Tests:**
```bash
pnpm test
```

**Run Specific Test File:**
```bash
pnpm test test-workflows.test.ts
```

**Run Tests in Watch Mode:**
```bash
pnpm test --watch
```

### Test Coverage by Workflow

**Complete Booking Workflow Tests:**
- Artist and venue user creation
- Artist profile creation with required fields
- Venue profile creation with required fields
- Booking request creation
- Booking acceptance
- Booking confirmation

**Payment Processing Tests:**
- Deposit payment processing
- Deposit verification in booking
- Full payment processing
- Full payment verification
- Refund handling

**Contract Signing Tests:**
- Contract generation
- Artist signature capture
- Contract status update after signature
- Venue signature capture
- Contract finalization
- PDF generation

**Full Lifecycle Tests:**
- Booking creation phase completion
- Payment processing phase completion
- Contract signing phase completion
- Post-event phase completion
- Workflow duration validation

**Error Handling Tests:**
- Invalid booking data handling
- Payment failure scenarios
- Contract signature rejection
- Self-impersonation prevention

**Data Validation Tests:**
- Artist profile field validation
- Venue profile field validation
- Booking date validation
- Payment amount validation

**Role-Based Access Control Tests:**
- Artist profile access
- Venue booking request capability
- Admin impersonation capability
- Non-admin test tool access prevention

### Test Results

All 86 tests pass successfully:
```
✓ critical-fixes.test.ts (10 tests)
✓ contracts.test.ts (22 tests)
✓ test-workflows.test.ts (34 tests)
✓ analytics.test.ts (19 tests)
✓ auth.logout.test.ts (1 test)

Test Files  5 passed (5)
Tests  86 passed (86)
```

---

## Testing Best Practices

### General Testing Guidelines

1. **Test in Isolation**
   - Use fresh test data for each scenario
   - Clear database between major test runs
   - Avoid dependencies between test cases

2. **Verify All Phases**
   - Don't skip steps in workflows
   - Verify data at each phase
   - Check email notifications are sent

3. **Test Error Scenarios**
   - Try invalid data
   - Test payment failures
   - Attempt unauthorized access

4. **Document Results**
   - Take screenshots of key steps
   - Note any issues or unexpected behavior
   - Record timing information

### Pre-Launch Testing Checklist

- [ ] Generate test data for all user types
- [ ] Complete booking workflow end-to-end
- [ ] Process test payments with Stripe
- [ ] Sign contracts with both parties
- [ ] Verify email notifications
- [ ] Test role-based access control
- [ ] Verify calendar functionality
- [ ] Test messaging system
- [ ] Validate review system
- [ ] Check subscription features

### Common Testing Workflows

**Workflow 1: Quick Smoke Test (15 minutes)**
1. Generate test data
2. Seed into database
3. Impersonate artist user
4. Impersonate venue user
5. Send booking request
6. Accept booking

**Workflow 2: Complete Payment Test (30 minutes)**
1. Complete booking workflow
2. Process deposit payment
3. Process full payment
4. Verify payment status
5. Test refund

**Workflow 3: Contract Signing Test (20 minutes)**
1. Create booking
2. Generate contract
3. Sign as artist
4. Sign as venue
5. Download PDF

**Workflow 4: Full Lifecycle Test (60 minutes)**
1. Run "Full Lifecycle" scenario
2. Verify all phases complete
3. Check notifications
4. Validate final state

---

## Troubleshooting

### Common Issues and Solutions

**Issue: "Admin access required" error**
- **Cause:** User does not have admin role
- **Solution:** Log in as admin user or request admin privileges

**Issue: Test data not appearing in database**
- **Cause:** Data seeder not executed after generation
- **Solution:** Use Data Seeder tab to insert generated data into database

**Issue: Impersonation token expired**
- **Cause:** Token valid for 60 minutes only
- **Solution:** Generate new impersonation token

**Issue: Payment test fails with "card_declined"**
- **Cause:** Using wrong test card number
- **Solution:** Use `4242 4242 4242 4242` for successful payments

**Issue: Contract signature not captured**
- **Cause:** Canvas not drawn or typed name not entered
- **Solution:** Ensure signature data is provided before submitting

**Issue: Tests fail with database errors**
- **Cause:** Database not properly initialized
- **Solution:** Run `pnpm db:push` to migrate schema

### Debugging Tips

1. **Check Browser Console**
   - Open DevTools (F12)
   - Look for error messages
   - Check network requests

2. **Review Server Logs**
   - Check terminal where dev server is running
   - Look for API errors
   - Verify database connections

3. **Verify Test Data**
   - Use Data Generator to review data structure
   - Check database directly for inserted records
   - Validate data matches expected format

4. **Test Incrementally**
   - Test one step at a time
   - Verify each step completes
   - Identify where failures occur

### Getting Help

If issues persist:

1. Review this guide for relevant sections
2. Check the project README for setup instructions
3. Review test files for expected behavior
4. Contact the development team with:
   - Specific error message
   - Steps to reproduce
   - Screenshots or logs

---

## Advanced Testing Topics

### Custom Test Data

To create custom test data beyond the standard generators:

1. Use Data Generator to create base data
2. Manually edit generated data as needed
3. Use Data Seeder to insert custom data
4. Verify data in database

### Performance Testing

To test platform performance:

1. Generate large dataset (100+ records)
2. Seed into database
3. Monitor response times
4. Check database query performance
5. Identify bottlenecks

### Load Testing

To test platform under load:

1. Generate multiple concurrent users
2. Execute workflows in parallel
3. Monitor system resources
4. Check for race conditions
5. Verify data integrity

### Regression Testing

To verify fixes don't break existing functionality:

1. Run complete test suite
2. Verify all 86 tests pass
3. Execute manual workflow tests
4. Check critical features
5. Document any regressions

---

## Conclusion

The Ologywood testing infrastructure provides comprehensive tools for validating the platform's core functionality. By following this guide and using the testing components effectively, you can ensure the platform works correctly across all user roles and workflows.

### Key Takeaways

- Use the Admin Dashboard for centralized testing access
- Generate realistic test data with the Data Generator
- Execute pre-configured scenarios with the Scenario Runner
- Impersonate different user roles to validate role-based features
- Run the comprehensive test suite to verify functionality
- Follow best practices for consistent and reliable testing

### Next Steps

1. Access the Admin Dashboard
2. Generate test data
3. Run a test scenario
4. Impersonate a user
5. Execute the test suite
6. Document results
7. Report any issues

For questions or issues, refer to the troubleshooting section or contact the development team.

---

**Document Version:** 1.0  
**Last Updated:** January 14, 2026  
**Status:** Ready for Beta Launch Testing
