# Ologywood Disaster Recovery Plan

**Last Updated:** March 13, 2026  
**Next Review:** June 2026

---

## Overview

This document outlines the disaster recovery procedures for the Ologywood platform. The platform is hosted on **Manus** with the database on **AWS RDS MySQL**. Both services provide built-in redundancy and backup capabilities that form the foundation of our recovery strategy.

---

## Infrastructure Summary

| Component | Service | Backup Responsibility |
|-----------|---------|----------------------|
| Application code | Manus Platform | Manus checkpoints + GitHub |
| Database (61 tables) | AWS RDS MySQL 8.0 | AWS automated backups |
| File storage | AWS S3 | S3 built-in durability (99.999999999%) |
| Email delivery | SendGrid | No local state to back up |
| Payments | Stripe | Stripe maintains all transaction records |
| Domain / SSL | Manus Platform | Managed automatically |

---

## Backup Strategy

### Application Code

Application code is protected by two independent systems:

**Manus Checkpoints** — Every checkpoint captures the complete project state (code, configuration, dependencies). Checkpoints are created before each deployment and at key milestones. Any checkpoint can be restored via the Management UI.

**GitHub Repository** — The project is synced to a GitHub repository via the `user_github` remote. Every checkpoint save triggers a git push to the `main` branch, providing a second copy of all code.

### Database (AWS RDS)

AWS RDS provides automated backups with the following characteristics:

| Feature | Detail |
|---------|--------|
| Automated backups | Enabled by default, daily snapshots |
| Retention period | Configurable (default 7 days, up to 35 days) |
| Point-in-time recovery | Available within the retention window |
| Multi-AZ | Depends on RDS instance configuration |
| Manual snapshots | Can be created on demand, retained indefinitely |
| Tables | 61 tables including audit logs for accountability |

To check or modify backup settings, access the AWS RDS console or contact the database administrator.

### File Storage (AWS S3)

S3 provides 99.999999999% durability. All uploaded files (profile photos, event photos, gallery images, music releases) are stored in S3 and do not require additional backup procedures. S3 versioning can be enabled for additional protection if needed.

### External Services

Stripe and SendGrid maintain their own records. No local backup is needed for:
- Payment history and transaction records (query via Stripe API)
- Email delivery logs (available in SendGrid dashboard)
- Customer billing information (stored in Stripe)

### Audit Trail

The `role_change_audit_log` table records all role changes with who made the change, who was affected, previous and new roles, and timestamps. This provides accountability and compliance data that is backed up with the database.

---

## Recovery Procedures

### Scenario 1: Application Code Issue (Bad Deployment)

**Symptoms:** Application errors, broken UI, server crashes after deployment

**Recovery:**
1. Open the Manus Management UI
2. Navigate to the **Dashboard** panel
3. Find the last known-good checkpoint
4. Click **Rollback**
5. Verify the application is working

**Recovery Time:** Under 5 minutes

### Scenario 2: Database Schema Error (Bad Migration)

**Symptoms:** Database query errors, missing columns, broken API responses

**Recovery:**
1. Identify the problematic migration in `drizzle/` directory
2. Write a corrective migration to fix the schema
3. Apply with `pnpm db:push`
4. If the schema is severely broken, contact the database administrator to restore from an AWS RDS automated backup or point-in-time recovery

**Recovery Time:** 15-60 minutes depending on severity

### Scenario 3: Accidental Data Deletion

**Symptoms:** Missing records, empty tables, user-reported data loss

**Recovery:**
1. Identify when the deletion occurred
2. Use AWS RDS **point-in-time recovery** to restore the database to a moment before the deletion
3. This creates a new RDS instance with the restored data
4. Compare restored data with current state
5. Selectively merge recovered records back into the production database
6. Update `DATABASE_URL` if switching to the restored instance

**Recovery Time:** 30-60 minutes

**How to initiate point-in-time recovery:**
- AWS Console: RDS > Databases > Select instance > Actions > Restore to point in time
- Specify the target time (must be within the backup retention window)

### Scenario 4: Complete Application Loss

**Symptoms:** Manus platform unavailable, project directory missing

**Recovery:**
1. Clone the repository from GitHub: `git clone <repository-url>`
2. Set up a new Manus project or restore from the latest checkpoint
3. Verify all environment variables are configured in **Settings > Secrets**
4. The database on AWS RDS is independent and unaffected
5. S3 files are independent and unaffected
6. Redeploy via Manus

**Recovery Time:** 1-2 hours

### Scenario 5: Database Instance Failure

**Symptoms:** Database connection errors, timeouts, AWS RDS instance unavailable

**Recovery:**
1. Check AWS RDS console for instance status
2. If Multi-AZ is enabled, automatic failover should occur
3. If not, restore from the latest automated backup:
   - AWS Console: RDS > Automated backups > Select backup > Restore
4. Update `DATABASE_URL` in Manus **Settings > Secrets** to point to the new instance
5. Restart the application

**Recovery Time:** 30 minutes to 2 hours depending on database size

### Scenario 6: Compromised Credentials

**Symptoms:** Unauthorized access, suspicious API activity, unexpected charges

**Recovery:**
1. Immediately rotate all affected credentials:
   - Database password (AWS RDS console)
   - Stripe API keys (Stripe Dashboard > Developers > API keys)
   - SendGrid API key (SendGrid > Settings > API Keys)
   - JWT secret (Manus Settings > Secrets)
2. Update all rotated values in Manus **Settings > Secrets**
3. Review access logs and the role change audit log for unauthorized activity
4. Review Stripe Dashboard for unauthorized transactions
5. Restart the application to pick up new credentials

**Recovery Time:** 30-60 minutes

### Scenario 7: Missing Tables on Production

**Symptoms:** TRPC query failures, "table doesn't exist" errors in server logs

**Recovery:**
1. Compare schema tables against production: query `information_schema.tables`
2. Identify missing tables by comparing with `drizzle/schema.ts` (61 tables expected)
3. Create missing tables manually via SQL or `webdev_execute_sql`
4. Run `pnpm db:push` to sync drizzle migration state
5. Restart the application

**Recovery Time:** 15-30 minutes

---

## Recovery Objectives

| Scenario | RTO (Recovery Time) | RPO (Max Data Loss) |
|----------|--------------------|--------------------|
| Bad deployment | 5 minutes | 0 (checkpoint rollback) |
| Schema error | 15-60 minutes | 0 (corrective migration) |
| Data deletion | 30-60 minutes | Up to 24 hours (RDS backup frequency) |
| Application loss | 1-2 hours | 0 (GitHub + checkpoints) |
| Database failure | 30 min - 2 hours | Up to 5 minutes (RDS continuous backup) |
| Credential compromise | 30-60 minutes | 0 (no data loss, credential rotation) |
| Missing tables | 15-30 minutes | 0 (tables recreated from schema) |

---

## Preventive Measures

### Before Every Deployment

1. Run `pnpm test` — all 1,864+ tests must pass
2. Run `pnpm check` — zero TypeScript errors
3. Save a checkpoint — provides instant rollback capability
4. Review database migrations — ensure they are reversible
5. Verify all 61 tables exist on production after migration

### Database Safety

- Always use `pnpm db:push` for migrations (generates SQL, then applies)
- Never run raw SQL `DROP TABLE` or `DELETE FROM` without a backup
- Test migrations in the development environment first
- Keep the AWS RDS backup retention period at maximum (35 days) for production
- After adding new enum values, verify they were applied on production

### Code Safety

- The GitHub repository provides a second copy of all code
- Checkpoints provide point-in-time snapshots of the full project
- Never force-push to the `main` branch
- The role change audit log provides accountability for admin actions

---

## Key Contacts and Access

| Resource | Access Method |
|----------|-------------|
| Manus Management UI | Project dashboard (checkpoint, rollback, publish) |
| AWS RDS Console | AWS account with RDS access |
| Stripe Dashboard | [dashboard.stripe.com](https://dashboard.stripe.com) |
| SendGrid Dashboard | [app.sendgrid.com](https://app.sendgrid.com) |
| GitHub Repository | Settings > GitHub in Management UI |
| Domain Management | Settings > Domains in Management UI |

---

## Related Documentation

| Document | Description |
|----------|-------------|
| [CI_CD_DEPLOYMENT.md](./CI_CD_DEPLOYMENT.md) | Deployment workflow and environment configuration |
| [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md) | Development setup and coding standards |
| [API.md](./API.md) | API endpoint documentation |
| [ARCHITECTURE.md](../ARCHITECTURE.md) | System architecture and data flow |
| [ROADMAP.md](../ROADMAP.md) | Feature roadmap and completed work |
