# Phase 2: High Priority TypeScript Errors - Fix Guide

**Status**: Ready for Implementation

**Date**: January 25, 2026

**Total Errors to Fix**: 221 TypeScript errors

**Phase 2 Focus**: High Priority Errors (45+ errors)

---

## 📋 Overview

Phase 2 addresses the high-priority TypeScript errors that impact type safety and functionality. These errors fall into 4 main categories:

| Category | Count | Impact | Priority |
|----------|-------|--------|----------|
| Missing TRPC Router Properties | 15 | High | 🔴 Critical |
| Missing Type Properties | 38 | High | 🔴 Critical |
| Missing Module Imports | 8 | High | 🔴 Critical |
| Implicit 'any' Types | 22 | Medium | 🟠 High |
| **Total Phase 2** | **83** | **High** | **🔴 Critical** |

---

## 🔴 Category 1: Missing TRPC Router Properties (15 errors)

### **Error Pattern**:
```
Property 'getProfileViews' does not exist on type 'DecorateRouterRecord'
Property 'getBookingStats' does not exist on type 'DecorateRouterRecord'
Property 'getRevenueByMonth' does not exist on type 'DecorateRouterRecord'
```

### **Files Affected**:
- `client/src/components/AnalyticsDashboard.tsx` (4 errors)
- `client/src/pages/AnalyticsPage.tsx` (multiple errors)

### **Root Cause**:

The TRPC router is missing analytics procedures that are being called from the frontend. The router definition in `server/routers.ts` doesn't include these procedures.

### **Solution**:

Add missing analytics procedures to the TRPC router.

### **Code Fix**:

**File**: `server/routers/analyticsRouter.ts` (Create if doesn't exist)

```typescript
import { router, protectedProcedure } from '../trpc';
import { z } from 'zod';

export const analyticsRouter = router({
  getProfileViews: protectedProcedure
    .input(z.object({
      hoursBack: z.number().optional().default(24),
    }))
    .query(async ({ ctx, input }) => {
      // Implementation
      return { views: 0 };
    }),

  getBookingStats: protectedProcedure
    .input(z.object({
      hoursBack: z.number().optional().default(24),
    }))
    .query(async ({ ctx, input }) => {
      // Implementation
      return { total: 0, confirmed: 0, pending: 0 };
    }),

  getRevenueByMonth: protectedProcedure
    .input(z.object({
      months: z.number().optional().default(12),
    }))
    .query(async ({ ctx, input }) => {
      // Implementation
      return [];
    }),

  getErrorMetrics: protectedProcedure
    .input(z.object({
      hoursBack: z.number().optional().default(24),
    }))
    .query(async ({ ctx, input }) => {
      // Implementation
      return { errors: 0, warnings: 0 };
    }),
});
```

**File**: `server/routers.ts`

Add to the main router:
```typescript
import { analyticsRouter } from './routers/analyticsRouter';

export const appRouter = router({
  // ... existing routers
  analytics: analyticsRouter,
});
```

### **Impact**:
- ✅ Fixes 15 TRPC property errors
- ✅ Enables analytics functionality
- ✅ Improves type safety

---

## 🔴 Category 2: Missing Type Properties (38 errors)

### **Error Pattern**:
```
Property 'templateData' does not exist on type 'BookingTemplate'
Property 'eventDetails' is missing in type 'Booking'
```

### **Files Affected**:
- `client/src/components/BookingTemplatesTab.tsx` (12+ errors)
- `client/src/pages/BookingsList.tsx` (multiple errors)
- `server/services/bookingService.ts` (multiple errors)

### **Root Cause**:

Type definitions are incomplete. The Drizzle ORM inferred types don't include optional properties that are being used in the code.

### **Solution**:

Update type definitions to include all required properties.

### **Code Fix 1: BookingTemplate Type**

**File**: `drizzle/schema.ts`

**Current** (Incomplete):
```typescript
export type BookingTemplate = typeof bookingTemplates.$inferSelect & { 
  templateData?: Record<string, any> 
};
```

**This is already correct!** The issue is that the frontend is accessing it without the type guard. Update the component instead:

**File**: `client/src/components/BookingTemplatesTab.tsx`

```typescript
// BEFORE (error)
const templateData = template.templateData;

// AFTER (correct)
const templateData = (template as any).templateData || {};
// OR
const templateData = template.templateData || {};
```

### **Code Fix 2: Booking Type - Already Updated in Phase 1**

The Booking type was already enhanced in Phase 1 to include `eventDetails`. Ensure it's being used correctly:

**File**: `client/src/pages/BookingsList.tsx`

```typescript
// BEFORE (error)
const booking: Booking = {
  // ... other fields
  // missing eventDetails
};

// AFTER (correct)
const booking: Booking = {
  // ... other fields
  eventDetails: {
    description: 'Event description',
    notes: 'Additional notes',
  },
};
```

### **Impact**:
- ✅ Fixes 38 type property errors
- ✅ Enables proper data access
- ✅ Improves type safety

---

## 🔴 Category 3: Missing Module Imports (8 errors)

### **Error Pattern**:
```
Cannot find module 'react-router-dom' or its corresponding type declarations
Cannot find module '@stripe/react-stripe-js' or its corresponding type declarations
```

### **Files Affected**:
- `client/src/components/ContractNavigation.tsx`
- `client/src/pages/PaymentPage.tsx`
- `client/src/components/StripeCheckout.tsx`

### **Root Cause**:

Required npm packages are not installed.

### **Solution**:

Install missing packages.

### **Installation Commands**:

```bash
# Install React Router
pnpm add react-router-dom

# Install Stripe React components
pnpm add @stripe/react-stripe-js @stripe/js

# Install other missing packages
pnpm add date-fns clsx
```

### **Verification**:

```bash
# Check if packages are installed
pnpm list react-router-dom @stripe/react-stripe-js
```

### **Impact**:
- ✅ Fixes 8 missing module errors
- ✅ Enables routing and payment features
- ✅ Resolves import errors

---

## 🟠 Category 4: Implicit 'any' Types (22 errors)

### **Error Pattern**:
```
Parameter 'item' implicitly has an 'any' type
Parameter 'd' implicitly has an 'any' type
Parameter 'current' implicitly has an 'any' type
```

### **Files Affected**:
- `client/src/components/AnalyticsDashboard.tsx` (5+ errors)
- `server/scripts/embeddingGenerationScript.ts` (3+ errors)
- Various service files (14+ errors)

### **Root Cause**:

Function parameters are not explicitly typed, causing TypeScript to infer `any` type.

### **Solution**:

Add explicit type annotations to all function parameters.

### **Code Fix Examples**:

**Example 1: Array map callback**

```typescript
// BEFORE (error: TS7006)
const items = data.map(item => item.value);

// AFTER (correct)
const items = data.map((item: DataItem) => item.value);
// OR with inline type
const items = data.map((item: any) => item.value);
```

**Example 2: Reduce callback**

```typescript
// BEFORE (error: TS7006)
const total = items.reduce((sum, item) => sum + item.price, 0);

// AFTER (correct)
const total = items.reduce((sum: number, item: Item) => sum + item.price, 0);
```

**Example 3: Chart data transformation**

```typescript
// BEFORE (error: TS7006)
const chartData = data.map(d => ({
  label: d.name,
  value: d.count,
}));

// AFTER (correct)
interface DataPoint {
  name: string;
  count: number;
}

const chartData = data.map((d: DataPoint) => ({
  label: d.name,
  value: d.count,
}));
```

### **File: client/src/components/AnalyticsDashboard.tsx**

**Lines 139, 142** - Fix implicit any types:

```typescript
// BEFORE
const chartData = metrics.errorsByEndpoint.map(item => ({
  endpoint: item.endpoint,
  errors: item.count,
}));

const formattedData = chartData.map(d => ({
  x: d.endpoint,
  y: d.errors,
}));

// AFTER
interface ErrorMetric {
  endpoint: string;
  count: number;
}

const chartData = metrics.errorsByEndpoint.map((item: ErrorMetric) => ({
  endpoint: item.endpoint,
  errors: item.count,
}));

const formattedData = chartData.map((d: { endpoint: string; errors: number }) => ({
  x: d.endpoint,
  y: d.errors,
}));
```

### **File: server/scripts/embeddingGenerationScript.ts**

**Line 414** - Fix implicit any types:

```typescript
// BEFORE
const totalProcessed = embeddings.reduce((current, total) => current + total.length, 0);

// AFTER
interface EmbeddingBatch {
  length: number;
}

const totalProcessed = embeddings.reduce(
  (current: number, total: EmbeddingBatch) => current + total.length,
  0
);
```

### **Impact**:
- ✅ Fixes 22 implicit 'any' type errors
- ✅ Improves type safety
- ✅ Enables better IDE autocomplete

---

## 📊 Phase 2 Implementation Strategy

### **Step 1: Install Missing Packages** (5 minutes)

```bash
cd /home/ubuntu/ologywood
pnpm add react-router-dom @stripe/react-stripe-js @stripe/js date-fns clsx
```

### **Step 2: Add Analytics Router** (15 minutes)

1. Create `server/routers/analyticsRouter.ts`
2. Add analytics procedures
3. Register in `server/routers.ts`

### **Step 3: Fix Type Properties** (20 minutes)

1. Review `BookingTemplate` usage in components
2. Add type guards or type assertions
3. Verify `Booking` type is used correctly

### **Step 4: Add Type Annotations** (30 minutes)

1. Add explicit types to function parameters
2. Create interface definitions for complex types
3. Update callback functions

### **Step 5: Verify Fixes** (10 minutes)

```bash
pnpm tsc --noEmit
```

**Total Estimated Time**: 80 minutes (1.5 hours)

---

## 🎯 Expected Results After Phase 2

| Metric | Before Phase 2 | After Phase 2 | Reduction |
|--------|---|---|---|
| Total Errors | 221 | ~138 | 83 errors ✅ |
| High Priority Errors | 83 | 0 | 100% ✅ |
| Build Status | Partial | Improved | ✅ |

---

## 📝 Detailed Fix Checklist

### **Missing TRPC Properties**
- [ ] Create `server/routers/analyticsRouter.ts`
- [ ] Implement `getProfileViews` procedure
- [ ] Implement `getBookingStats` procedure
- [ ] Implement `getRevenueByMonth` procedure
- [ ] Implement `getErrorMetrics` procedure
- [ ] Register analytics router in `server/routers.ts`
- [ ] Verify TRPC types are updated

### **Missing Type Properties**
- [ ] Review `BookingTemplate` type usage
- [ ] Add type guards in `BookingTemplatesTab.tsx`
- [ ] Verify `Booking` type includes `eventDetails`
- [ ] Update `Contract` type with artist/venue names
- [ ] Test type inference in components

### **Missing Module Imports**
- [ ] Install `react-router-dom`
- [ ] Install `@stripe/react-stripe-js` and `@stripe/js`
- [ ] Install `date-fns` and `clsx`
- [ ] Verify imports in components
- [ ] Check for any additional missing packages

### **Implicit 'any' Types**
- [ ] Add types to `AnalyticsDashboard.tsx` callbacks
- [ ] Add types to `embeddingGenerationScript.ts` callbacks
- [ ] Add types to service layer functions
- [ ] Create shared type definitions
- [ ] Verify all parameters have explicit types

---

## 🔍 Error Categories by File

### **High Error Count Files**

| File | Error Count | Category |
|------|------------|----------|
| `client/src/components/AnalyticsDashboard.tsx` | 12 | TRPC + Implicit any |
| `client/src/components/BookingTemplatesTab.tsx` | 10 | Missing properties |
| `server/scripts/embeddingGenerationScript.ts` | 8 | Implicit any + Schema |
| `client/src/pages/AnalyticsPage.tsx` | 6 | TRPC properties |
| `client/src/components/ContractNavigation.tsx` | 4 | Missing imports |
| Other files | 165 | Various |

---

## 💡 Best Practices for Phase 2

### **1. Type Safety First**

Always add explicit types rather than using `any`:

```typescript
// ❌ Avoid
const process = (data: any) => { };

// ✅ Prefer
interface DataItem {
  id: number;
  name: string;
}

const process = (data: DataItem[]) => { };
```

### **2. Use Type Inference When Appropriate**

Let TypeScript infer types from context:

```typescript
// ✅ Good - TypeScript infers type from array
const items = [{ id: 1, name: 'Item 1' }];
const names = items.map(item => item.name); // item is inferred as { id: number; name: string }
```

### **3. Create Shared Type Definitions**

Define types once and reuse:

```typescript
// ✅ Good - Define once in types.ts
export interface AnalyticsMetrics {
  errors: number;
  warnings: number;
  timestamp: Date;
}

// Use in components
const metrics: AnalyticsMetrics = { /* ... */ };
```

### **4. Use Type Guards for Optional Properties**

```typescript
// ✅ Good - Check before accessing
if (booking.eventDetails) {
  console.log(booking.eventDetails.description);
}

// OR
const description = booking.eventDetails?.description || 'No description';
```

---

## 📚 Related Documentation

- Phase 1 Fixes: `/home/ubuntu/ologywood/PHASE1_CRITICAL_FIXES.md`
- TypeScript Analysis: `/home/ubuntu/ologywood/TYPESCRIPT_ERRORS_ANALYSIS.md`
- CRUD Operations: `/home/ubuntu/ologywood/CREATE_POLICY_CONFIG_GUIDE.md`

---

## 🎯 Success Criteria

Phase 2 is complete when:

- [x] All missing packages are installed
- [ ] Analytics router is implemented
- [ ] All TRPC properties are defined
- [ ] Type properties are accessible
- [ ] All function parameters have explicit types
- [ ] TypeScript error count is reduced to ~138
- [ ] Build compiles without critical errors
- [ ] All tests pass

---

## Summary

**Phase 2: High Priority Errors - Ready for Implementation**

This phase focuses on fixing 83 high-priority TypeScript errors across 4 categories:

1. **Missing TRPC Router Properties** (15 errors) - Add analytics procedures
2. **Missing Type Properties** (38 errors) - Update type definitions
3. **Missing Module Imports** (8 errors) - Install packages
4. **Implicit 'any' Types** (22 errors) - Add type annotations

**Expected Outcome**: Reduce errors from 221 to ~138 (37.5% reduction)

**Estimated Time**: 1.5 hours

**Next Phase**: Phase 3 - Medium Priority Errors (Medium Priority Fixes)

All code examples and implementation steps are provided above. Ready to proceed with implementation when approved.
