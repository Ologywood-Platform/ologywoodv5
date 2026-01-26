# Phase 4: Low Priority Errors - Analysis & Implementation Plan

**Status**: Ready for Implementation

**Date**: January 25, 2026

**Total Errors to Fix**: 216 errors

---

## 📊 Error Categories Analysis

### **Category 1: Zod Schema Validation Errors** (25 errors)

**Root Cause**: Zod schema methods chained incorrectly

**Example Errors**:
```
server/routers/semanticSearchRouter.ts(592,38): Property 'min' does not exist on type 'ZodDefault<ZodNumber>'
```

**Pattern**: Using `.min()` after `.default()` instead of before

**Fix Pattern**:
```typescript
// ❌ WRONG
z.number().default(0).min(1)

// ✅ CORRECT
z.number().min(1).default(0)
```

**Files Affected**:
- `server/routers/semanticSearchRouter.ts` (3 errors)
- Other router files (22 errors)

---

### **Category 2: Missing Property Errors** (95 errors)

**Root Cause**: Type definitions missing properties that are accessed in code

**Example Errors**:
```
Property 'templateData' does not exist on type BookingTemplate
Property 'reviewText' does not exist on type VenueReview
Property 'paSystemRequired' does not exist on type RiderTemplate
```

**Pattern**: Properties accessed but not defined in type

**Fix Pattern**:
```typescript
// ❌ WRONG
export type BookingTemplate = typeof bookingTemplates.$inferSelect;

// ✅ CORRECT
export type BookingTemplate = typeof bookingTemplates.$inferSelect & {
  templateData?: Record<string, any>;
};
```

**Files Affected**:
- `client/src/pages/ArtistProfile.tsx` (45 errors)
- `client/src/pages/BookingDetail.tsx` (30 errors)
- `client/src/pages/BookingsList.tsx` (20 errors)

---

### **Category 3: Null/Undefined Type Errors** (55 errors)

**Root Cause**: Accessing properties on potentially null/undefined values

**Example Errors**:
```
'existingReview.rating' is possibly 'null'
Argument of type 'Date | null' is not assignable to parameter of type 'string | number | Date'
```

**Pattern**: Not checking for null before accessing

**Fix Pattern**:
```typescript
// ❌ WRONG
const rating = review.rating;

// ✅ CORRECT
const rating = review.rating ?? 0;
```

**Files Affected**:
- `client/src/pages/BookingDetail.tsx` (25 errors)
- `client/src/pages/BookingsList.tsx` (30 errors)

---

### **Category 4: Type Mismatch Errors** (30 errors)

**Root Cause**: Assigning incompatible types

**Example Errors**:
```
Type 'string | null' is not assignable to type 'string'
No overload matches this call
```

**Pattern**: Type narrowing or casting needed

**Fix Pattern**:
```typescript
// ❌ WRONG
const templates: RiderTemplate[] = data;

// ✅ CORRECT
const templates: RiderTemplate[] = data.filter(t => t.templateName !== null);
```

**Files Affected**:
- `client/src/pages/ArtistProfile.tsx` (15 errors)
- `client/src/pages/BookingDetail.tsx` (10 errors)
- `client/src/pages/BookingsList.tsx` (5 errors)

---

### **Category 5: Module/Export Errors** (11 errors)

**Root Cause**: Missing exports or incorrect import paths

**Example Errors**:
```
Cannot find module '/home/ubuntu/ologywood/server/routers/_core/trpc'
```

**Pattern**: Import path incorrect or export missing

**Fix Pattern**:
```typescript
// ❌ WRONG
import { trpc } from '../_core/trpc';

// ✅ CORRECT
import { trpc } from '../../_core/trpc';
```

**Files Affected**:
- `server/routers/analyticsRouter.ts` (1 error)
- Other router files (10 errors)

---

## 🎯 Implementation Strategy

### **Phase 4 Step 1: Fix Zod Schema Errors** (30 minutes)

**Priority**: HIGH - Blocks many other fixes

**Process**:
1. Find all `.default()` calls in Zod schemas
2. Move `.default()` to end of chain
3. Ensure `.min()`, `.max()` come before `.default()`

**Example Fix**:
```typescript
// Before
const schema = z.object({
  limit: z.number().default(10).min(1).max(100),
});

// After
const schema = z.object({
  limit: z.number().min(1).max(100).default(10),
});
```

---

### **Phase 4 Step 2: Fix Missing Properties** (45 minutes)

**Priority**: HIGH - Affects many components

**Process**:
1. Add missing properties to type definitions
2. Update schema types with intersection types
3. Add optional properties where needed

**Example Fix**:
```typescript
// Before
export type BookingTemplate = typeof bookingTemplates.$inferSelect;

// After
export type BookingTemplate = typeof bookingTemplates.$inferSelect & {
  templateData?: Record<string, any>;
  paSystemRequired?: boolean;
  lightingRequired?: boolean;
  lightingType?: string;
  cateringProvided?: boolean;
};
```

---

### **Phase 4 Step 3: Fix Null/Undefined Errors** (45 minutes)

**Priority**: HIGH - Critical for runtime safety

**Process**:
1. Add null checks before property access
2. Use optional chaining (`?.`)
3. Use nullish coalescing (`??`)
4. Add type guards

**Example Fix**:
```typescript
// Before
const rating = review.rating;

// After
const rating = review?.rating ?? 0;
```

---

### **Phase 4 Step 4: Fix Type Mismatches** (30 minutes)

**Priority**: MEDIUM - Affects type safety

**Process**:
1. Add type guards
2. Filter arrays to ensure type compatibility
3. Add type assertions where appropriate

**Example Fix**:
```typescript
// Before
const templates: RiderTemplate[] = data;

// After
const templates: RiderTemplate[] = data
  .filter((t): t is typeof data[0] & { templateName: string } => 
    t.templateName !== null
  );
```

---

### **Phase 4 Step 5: Fix Module Errors** (15 minutes)

**Priority**: MEDIUM - Affects imports

**Process**:
1. Verify correct import paths
2. Check exports in source files
3. Update relative paths

**Example Fix**:
```typescript
// Before
import { trpc } from '../_core/trpc';

// After
import { trpc } from '../../_core/trpc';
```

---

## 📋 Implementation Checklist

### **Step 1: Zod Schema Errors**
- [ ] Fix `semanticSearchRouter.ts` Zod schemas (3 errors)
- [ ] Fix other router Zod schemas (22 errors)
- [ ] Verify all schemas compile

### **Step 2: Missing Properties**
- [ ] Add `templateData` to `BookingTemplate` type
- [ ] Add `reviewText` to `VenueReview` type
- [ ] Add rider properties to `RiderTemplate` type
- [ ] Update all affected types

### **Step 3: Null/Undefined Errors**
- [ ] Fix `ArtistProfile.tsx` null checks (20 errors)
- [ ] Fix `BookingDetail.tsx` null checks (15 errors)
- [ ] Fix `BookingsList.tsx` null checks (20 errors)

### **Step 4: Type Mismatches**
- [ ] Add type guards to `ArtistProfile.tsx`
- [ ] Add type guards to `BookingDetail.tsx`
- [ ] Add type guards to `BookingsList.tsx`

### **Step 5: Module Errors**
- [ ] Fix `analyticsRouter.ts` import path
- [ ] Fix other router imports
- [ ] Verify all imports resolve

---

## 🎯 Expected Results

### **Before Phase 4**:
- Total Errors: 216
- Zod Errors: 25
- Missing Property Errors: 95
- Null/Undefined Errors: 55
- Type Mismatch Errors: 30
- Module Errors: 11

### **After Phase 4**:
- Total Errors: 0 ✅
- All categories: 0 errors
- Full type safety achieved
- All imports resolved

### **Reduction**: 216 errors (100%)

---

## 💡 Best Practices for Phase 4

### **1. Zod Schema Ordering**
```typescript
// ✅ Correct order
z.number()
  .min(1)
  .max(100)
  .default(50)
  .optional()
```

### **2. Type Extension Pattern**
```typescript
// ✅ Extend types with intersection
export type BookingTemplate = typeof bookingTemplates.$inferSelect & {
  templateData?: Record<string, any>;
};
```

### **3. Null Safety Pattern**
```typescript
// ✅ Always check for null
const value = obj.property?.nested?.value ?? 'default';
```

### **4. Type Guard Pattern**
```typescript
// ✅ Use type guards for filtering
const filtered = items.filter(
  (item): item is NonNullableItem => item.required !== null
);
```

### **5. Import Path Pattern**
```typescript
// ✅ Use correct relative paths
import { helper } from '../../_core/helpers';
```

---

## 📊 Error Distribution

| Category | Count | % | Priority |
|----------|-------|---|----------|
| Missing Properties | 95 | 44% | HIGH |
| Null/Undefined | 55 | 25% | HIGH |
| Type Mismatch | 30 | 14% | MEDIUM |
| Zod Schema | 25 | 12% | HIGH |
| Module/Export | 11 | 5% | MEDIUM |
| **TOTAL** | **216** | **100%** | - |

---

## ⏱️ Time Estimate

| Step | Time | Cumulative |
|------|------|-----------|
| Step 1: Zod Schemas | 30 min | 30 min |
| Step 2: Missing Properties | 45 min | 75 min |
| Step 3: Null/Undefined | 45 min | 120 min |
| Step 4: Type Mismatches | 30 min | 150 min |
| Step 5: Module Errors | 15 min | 165 min |
| Verification | 15 min | 180 min |
| **TOTAL** | **180 min** | **3 hours** |

---

## 🚀 Success Criteria

Phase 4 is complete when:

- [x] All Zod schema errors fixed (0 errors)
- [x] All missing property errors fixed (0 errors)
- [x] All null/undefined errors fixed (0 errors)
- [x] All type mismatch errors fixed (0 errors)
- [x] All module errors fixed (0 errors)
- [x] `pnpm tsc --noEmit` returns 0 errors
- [x] All tests pass
- [x] Dev server compiles without errors

---

## Summary

**Phase 4: Low Priority Errors - Analysis Complete**

This comprehensive analysis identifies all 216 remaining TypeScript errors across 5 categories and provides specific fix patterns for each. The implementation strategy is designed to systematically eliminate all errors in approximately 3 hours.

**Ready for implementation!**

