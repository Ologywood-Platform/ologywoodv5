# Ologywood Platform - Issues to Fix

## Test Failures (42 failed, 374 passed)

### 1. Embedding Service Tests (6 failures)
- [ ] calculateRelevanceScore - View Boost logarithmic scaling test failing
- [ ] calculateRelevanceScore - Real-world examples scoring incorrectly
- [ ] calculateRelevanceScore - Medium-quality FAQ scoring wrong
- [ ] calculateRelevanceScore - Low-quality FAQ scoring wrong
- [ ] Embedding Service Integration - calculateRelevanceScore not defined
- [ ] Embedding Service Integration - combine similarity with relevance scoring

### 2. Subscription Validation Tests (2 failures)
- [ ] Rider Creation Validation - canCreateRider returning false when should be true
- [ ] Error Handling - not returning Infinity on database error

### 3. TypeScript Compilation Errors
- [ ] Drizzle ORM type error with artistId column in bookings table
- [ ] Schema type mismatches

## Feature Testing Checklist

### Artist Profile Features
- [ ] Artist can create profile
- [ ] Artist can upload profile photo
- [ ] Artist can update profile
- [ ] Artist profile displays correctly

### Booking Workflow
- [ ] Venue can create booking request
- [ ] Artist receives booking notification
- [ ] Booking status updates correctly

### Payment System
- [ ] Deposit payment can be processed
- [ ] Payment status updates correctly

### Rider Management
- [ ] Artist can create rider template
- [ ] Venue can acknowledge rider

### Contracts
- [ ] Contract auto-generates for bookings
- [ ] Both parties can sign contract

### Help Center
- [ ] Help articles load
- [ ] Search works

## Critical Issues to Fix First

1. Embedding Service - Fix calculateRelevanceScore function
2. Subscription Validation - Fix canCreateRider logic
3. TypeScript Errors - Fix Drizzle ORM schema issues
4. Help Center - Fix article loading issue
5. Test Suite - Get all tests passing
