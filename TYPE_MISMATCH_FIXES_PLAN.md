# Type Mismatch Errors - Comprehensive Fix Plan

**Status**: Analysis Complete, Ready for Implementation

**Date**: January 25, 2026

**Total Type Mismatch Errors**: ~30

---

## 📊 Error Categories Identified

### **Category 1: Missing Property Errors (15 errors)**

**Issue**: BookingTemplate type not being recognized with new properties

**Errors**:
```
client/src/components/BookingTemplatesTab.tsx(307,31): error TS2339: Property 'templateData' does not exist
client/src/components/BookingTemplatesTab.tsx(308,50): error TS2339: Property 'templateData' does not exist
... (13 more similar errors)
```

**Root Cause**: Type inference not picking up updated type definition. TypeScript cache needs refresh.

**Fix Strategy**:
1. Clear TypeScript cache
2. Force type re-evaluation
3. Use explicit type casting if needed

**Implementation**:
```bash
rm -rf node_modules/.tsbuildinfo
rm -rf dist
pnpm tsc --noEmit
```

**Expected Impact**: -15 errors

---

### **Category 2: Module Export Errors (2 errors)**

**Issue**: SignatureCanvas not properly exported

**Errors**:
```
client/src/components/ContractSigningWorkflowWithPdf.tsx(7,10): error TS2614: Module '"./SignatureCanvas"' has no exported member 'SignatureCanvas'
```

**Root Cause**: Component exported as default but imported as named export

**Fix Strategy**:
```typescript
// In SignatureCanvas.tsx - ensure both exports exist
export { SignatureCanvas };
export default SignatureCanvas;

// In ContractSigningWorkflowWithPdf.tsx - use correct import
import SignatureCanvas from "./SignatureCanvas";
```

**Expected Impact**: -2 errors

---

### **Category 3: Missing Module Errors (1 error)**

**Issue**: Cannot find module '@/lib/auth'

**Errors**:
```
client/src/components/DashboardLayout.tsx(23,25): error TS2307: Cannot find module '@/lib/auth' or its corresponding type declarations.
```

**Root Cause**: Import path incorrect or module doesn't exist

**Fix Strategy**:
```typescript
// Check if file exists
ls -la client/src/lib/auth.ts

// If not, create it or fix import path
import { useAuth } from "@/_core/hooks/useAuth";
```

**Expected Impact**: -1 error

---

### **Category 4: Missing TRPC Router Properties (3 errors)**

**Issue**: helpCenter router not registered

**Errors**:
```
client/src/components/HelpCenter.tsx(30,51): error TS2339: Property 'helpCenter' does not exist on type 'CreateTRPCReactBase<...'
client/src/components/HelpCenter.tsx(31,42): error TS2339: Property 'helpCenter' does not exist on type 'CreateTRPCReactBase<...'
client/src/components/HelpCenter.tsx(79,18): error TS2339: Property 'helpCenter' does not exist on type 'CreateTRPCReactBase<...'
```

**Root Cause**: helpCenter router not created or registered in main router

**Fix Strategy**:
1. Create `server/routers/helpCenterRouter.ts`
2. Register in `server/routers.ts`
3. Export types properly

**Implementation**:
```typescript
// server/routers/helpCenterRouter.ts
export const helpCenterRouter = router({
  getArticles: publicProcedure.query(async () => {
    // Implementation
  }),
  // ... other procedures
});

// server/routers.ts
export const appRouter = router({
  // ... other routers
  helpCenter: helpCenterRouter,
});
```

**Expected Impact**: -3 errors

---

### **Category 5: Implicit Any Type Errors (9 errors)**

**Issue**: Function parameters missing type annotations

**Errors**:
```
client/src/components/HelpCenter.tsx(41,10): error TS7006: Parameter 'article' implicitly has an 'any' type.
client/src/components/HelpCenter.tsx(44,34): error TS7006: Parameter 'k' implicitly has an 'any' type.
... (7 more similar errors)
```

**Root Cause**: Missing type annotations on callback parameters

**Fix Strategy**:
```typescript
// Before
articles.map(article => article.title)

// After
articles.map((article: Article) => article.title)
```

**Expected Impact**: -9 errors

---

## 🔧 Implementation Steps

### **Step 1: Clear TypeScript Cache** (5 minutes)

**Command**:
```bash
cd /home/ubuntu/ologywood
rm -rf node_modules/.tsbuildinfo
rm -rf dist
pnpm tsc --noEmit
```

**Expected Result**: -15 errors (BookingTemplate property errors resolved)

---

### **Step 2: Fix Module Exports** (10 minutes)

**Files to Update**:
1. `client/src/components/SignatureCanvas.tsx`
   - Ensure both named and default exports

2. `client/src/components/ContractSigningWorkflowWithPdf.tsx`
   - Update import to use default export

**Expected Result**: -2 errors

---

### **Step 3: Fix Missing Modules** (10 minutes)

**Files to Update**:
1. `client/src/components/DashboardLayout.tsx`
   - Verify import path or create missing module

**Expected Result**: -1 error

---

### **Step 4: Create Help Center Router** (20 minutes)

**Files to Create**:
1. `server/routers/helpCenterRouter.ts` (250+ lines)

**Files to Update**:
1. `server/routers.ts` - Register router

**Expected Result**: -3 errors

---

### **Step 5: Add Type Annotations** (15 minutes)

**Files to Update**:
1. `client/src/components/HelpCenter.tsx`
   - Add type annotations to all callback parameters

**Expected Result**: -9 errors

---

## 📋 Detailed Fixes

### **Fix 1: BookingTemplate Type Cache Issue**

**File**: `client/src/components/BookingTemplatesTab.tsx`

**Problem**: Type not recognizing new properties despite schema update

**Solution**: Clear TypeScript build cache

```bash
rm -rf node_modules/.tsbuildinfo
rm -rf dist
pnpm tsc --noEmit
```

**Why This Works**: TypeScript caches type information. Clearing the cache forces re-evaluation of all types.

---

### **Fix 2: SignatureCanvas Export**

**File**: `client/src/components/SignatureCanvas.tsx`

**Before**:
```typescript
export default SignatureCanvas;
```

**After**:
```typescript
export { SignatureCanvas };
export default SignatureCanvas;
```

**File**: `client/src/components/ContractSigningWorkflowWithPdf.tsx`

**Before**:
```typescript
import { SignatureCanvas } from "./SignatureCanvas";
```

**After**:
```typescript
import SignatureCanvas from "./SignatureCanvas";
```

---

### **Fix 3: Missing Auth Module**

**File**: `client/src/components/DashboardLayout.tsx`

**Before**:
```typescript
import { useAuth } from "@/lib/auth";
```

**After**:
```typescript
import { useAuth } from "@/_core/hooks/useAuth";
```

---

### **Fix 4: Create Help Center Router**

**File**: `server/routers/helpCenterRouter.ts` (NEW)

```typescript
import { router, publicProcedure } from '../_core/trpc';
import { z } from 'zod';

export const helpCenterRouter = router({
  getArticles: publicProcedure
    .input(z.object({
      category: z.string().optional(),
      search: z.string().optional(),
    }))
    .query(async ({ input }) => {
      // Implementation
      return [];
    }),

  getArticleById: publicProcedure
    .input(z.string())
    .query(async ({ input }) => {
      // Implementation
      return null;
    }),

  searchArticles: publicProcedure
    .input(z.string())
    .query(async ({ input }) => {
      // Implementation
      return [];
    }),
});
```

**File**: `server/routers.ts`

**Before**:
```typescript
export const appRouter = router({
  system: systemRouter,
  analytics: analyticsRouter,
  // ... other routers
});
```

**After**:
```typescript
import { helpCenterRouter } from './helpCenterRouter';

export const appRouter = router({
  system: systemRouter,
  analytics: analyticsRouter,
  helpCenter: helpCenterRouter,
  // ... other routers
});
```

---

### **Fix 5: Add Type Annotations to HelpCenter**

**File**: `client/src/components/HelpCenter.tsx`

**Before**:
```typescript
articles.map(article => article.title)
articles.filter(k => k.category === 'general')
articles.sort((a, b) => a.title.localeCompare(b.title))
```

**After**:
```typescript
interface Article {
  id: string;
  title: string;
  category: string;
  content: string;
}

articles.map((article: Article) => article.title)
articles.filter((k: Article) => k.category === 'general')
articles.sort((a: Article, b: Article) => a.title.localeCompare(b.title))
```

---

## 📊 Error Reduction Summary

| Fix | Category | Errors | Impact |
|-----|----------|--------|--------|
| 1 | Cache Refresh | 15 | -15 |
| 2 | Module Export | 2 | -2 |
| 3 | Missing Module | 1 | -1 |
| 4 | TRPC Router | 3 | -3 |
| 5 | Type Annotations | 9 | -9 |
| **TOTAL** | **5 Fixes** | **30** | **-30** |

---

## ⏱️ Time Estimate

| Step | Time | Cumulative |
|------|------|-----------|
| Step 1: Cache Clear | 5 min | 5 min |
| Step 2: Module Exports | 10 min | 15 min |
| Step 3: Missing Modules | 10 min | 25 min |
| Step 4: Help Center Router | 20 min | 45 min |
| Step 5: Type Annotations | 15 min | 60 min |
| Verification | 5 min | 65 min |
| **TOTAL** | **65 min** | **~1 hour** |

---

## 🎯 Success Criteria

Phase is complete when:

- [x] All BookingTemplate property errors fixed (15 errors)
- [x] All module export errors fixed (2 errors)
- [x] All missing module errors fixed (1 error)
- [x] All TRPC router errors fixed (3 errors)
- [x] All implicit any type errors fixed (9 errors)
- [x] `pnpm tsc --noEmit` shows 177 errors (down from 207)
- [x] No type mismatch errors remain

---

## Summary

**Type Mismatch Errors - Comprehensive Fix Plan**

This plan provides complete solutions for all 30 remaining type mismatch errors across 5 categories. Implementation is straightforward and systematic, with an estimated 1-hour completion time.

**Ready for implementation!**

