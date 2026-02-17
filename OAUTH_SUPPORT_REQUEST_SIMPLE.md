# Manus Support Request - OAuth Redirect URI

**Project ID:** mipR53xgcijBgoieXQcPKz  
**App ID:** mP6FLm6cHUyVdEMNViNuZS  
**Domain:** https://www.ologywood.com

## Issue
OAuth authentication is broken on the published site. Users cannot sign in because the OAuth server is redirecting to old Cloud Run URLs instead of the production domain.

## What We Need
Please update the OAuth application settings to:

1. **Add this redirect URI:**
   - `https://www.ologywood.com/api/oauth/callback`

2. **Remove/disable these old redirect URIs:**
   - `www.z2xk55clkl-yq2crjohja-uk.a.run.app`
   - `www.nvnk64ygtc-u6zfr5vl4a-uk.a.run.app`
   - `www.tdtcwcmeuz-x4f247qytq-uk.a.run.app`

## Result
Once updated, users will be able to sign in at https://www.ologywood.com

Thank you!
