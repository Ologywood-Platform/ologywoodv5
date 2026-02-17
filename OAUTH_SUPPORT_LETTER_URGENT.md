# URGENT: OAuth Redirect URI Configuration Issue - Ologywood Platform

**Subject:** Critical OAuth Configuration Issue - Old Cloud Run URLs Blocking Production Authentication

**Project ID:** mipR53xgcijBgoieXQcPKz  
**Application:** Ologywood - Artist Booking Platform  
**Published Domain:** https://www.ologywood.com  
**Date:** February 17, 2026

---

## Issue Summary

The Ologywood platform has been successfully published to production at **https://www.ologywood.com**, but OAuth authentication is **completely broken** due to misconfigured redirect URIs on the Manus OAuth server.

**Current Status:** Users cannot sign in to the published site because OAuth redirects are pointing to old, decommissioned Cloud Run deployments instead of the current production domain.

---

## Technical Details

### The Problem

When users click "Sign In" on https://www.ologywood.com and attempt to authenticate, the OAuth flow redirects to an **old Google Cloud Run URL** instead of the production domain:

**Current (Broken) Redirect:**
```
https://www.tdtcwcmeuz-x4f247qytq-uk.a.run.app/api/oauth/callback
```

**Expected (Correct) Redirect:**
```
https://www.ologywood.com/api/oauth/callback
```

### Root Cause

The Manus OAuth application configuration (on manus.im servers) still has old Cloud Run URLs registered as allowed redirect URIs. These old deployments no longer exist, causing authentication to fail.

**Evidence of Multiple Old Deployments:**
- First old URL: `www.z2xk55clkl-yq2crjohja-uk.a.run.app`
- Second old URL: `www.nvnk64ygtc-u6zfr5vl4a-uk.a.run.app`
- Third old URL: `www.tdtcwcmeuz-x4f247qytq-uk.a.run.app` (current issue)

All of these are decommissioned Google Cloud Run deployments that should no longer be used.

### What We've Already Done

✅ Updated the application code to use correct redirect URIs  
✅ Configured `VITE_OAUTH_REDIRECT_BASE_URL` environment variable  
✅ Deployed to production domain (https://www.ologywood.com)  
✅ Verified frontend OAuth configuration is correct  

**What's Missing:**
❌ Manus OAuth server still redirects to old Cloud Run URLs  
❌ Need to update allowed redirect URIs in Manus OAuth application settings  

---

## Required Actions

**Please update the OAuth application configuration for Ologywood (App ID: mP6FLm6cHUyVdEMNViNuZS) to:**

1. **Add** `https://www.ologywood.com/api/oauth/callback` as an allowed redirect URI
2. **Remove or disable** these old Cloud Run URLs:
   - `www.z2xk55clkl-yq2crjohja-uk.a.run.app`
   - `www.nvnk64ygtc-u6zfr5vl4a-uk.a.run.app`
   - `www.tdtcwcmeuz-x4f247qytq-uk.a.run.app`
3. **Verify** that the OAuth configuration is updated and active

---

## Impact

**Severity:** CRITICAL - Blocks all user authentication  
**Affected Users:** All users attempting to sign in to https://www.ologywood.com  
**Business Impact:** Platform is live but non-functional due to authentication failure  

---

## Testing After Fix

Once the OAuth configuration is updated, we will:
1. Test Sign In on https://www.ologywood.com
2. Verify OAuth redirects to correct domain
3. Confirm artist and venue account creation works
4. Validate complete booking workflow

---

## Contact Information

**Project Owner:** [Your Name]  
**Email:** [Your Email]  
**Project ID:** mipR53xgcijBgoieXQcPKz  
**Application ID:** mP6FLm6cHUyVdEMNViNuZS  

---

## Timeline

- **February 17, 2026:** Platform published to production
- **February 17, 2026:** OAuth configuration issue discovered
- **[Date]:** Awaiting Manus Support resolution

**Urgency:** This is a production-blocking issue. Please prioritize this ticket.

---

## Additional Context

This is a **temporary deployment configuration issue**, not a code defect. The application code is correct and properly configured. The issue is exclusively with the OAuth server's redirect URI whitelist on the Manus infrastructure.

Once the OAuth application settings are updated on Manus.im, authentication will work immediately without any code changes.

---

**Please confirm receipt of this ticket and provide an estimated resolution time.**

Thank you for your urgent attention to this critical issue.
