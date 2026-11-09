

### Safe exception-log sweep

A follow-up scan of modular routers found raw exception interpolation in venue operations, admin role-change email delivery, and fire-and-forget event fan notifications. These paths now log only the exception type through local error-kind helpers; no response behavior or business workflow changed. Focused venue/admin/event/email-preference regressions pass 18/18, TypeScript passes, and the production build passes with existing chunk-size warnings. No notifications, emails, profiles, events, payments, or records changed during validation.
