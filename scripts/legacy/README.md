# Legacy Scripts

**Archived:** February 28, 2026

These scripts were created for a previous self-hosted infrastructure setup (Docker, Kubernetes, GitHub Actions CI/CD, cron-based backups). They are **not used** with the current Manus Platform + AWS RDS architecture.

They are retained here for reference only. If self-hosted deployment is ever needed in the future, these scripts would need significant updates to match the current codebase.

| Script | Original Purpose |
|--------|-----------------|
| `backup-database.sh` | MySQL backup with compression and verification |
| `backup-daily.sh` | Daily incremental backup cron job |
| `backup-weekly.sh` | Weekly full backup cron job |
| `backup-monthly.sh` | Monthly archive backup cron job |
| `setup-backup-cron.sh` | Install backup cron schedules |
| `verify-backups.sh` | Verify backup integrity |
| `test-restore.sh` | Test backup restoration in Docker |
| `deploy-github-actions.sh` | GitHub Actions deployment script |
| `deploy-staging.sh` | Staging environment deployment |
| `rollback-staging.sh` | Staging rollback procedure |
| `verify-github-actions-deployment.sh` | Post-deploy verification |
| `deploy-indexes.sql` | Database index creation SQL |
| `seed-support.mjs` | Seed test/support data |

For current deployment and recovery procedures, see:
- [CI_CD_DEPLOYMENT.md](../../docs/CI_CD_DEPLOYMENT.md)
- [DISASTER_RECOVERY.md](../../docs/DISASTER_RECOVERY.md)
