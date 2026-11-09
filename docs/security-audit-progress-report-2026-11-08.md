

### eBook multipart body contract

The mounted eBook upload route now rejects unknown multipart fields before database/storage writes; `rightsConfirmed` remains the only accepted text field alongside the uploaded `ebook` file. Existing strict item IDs, MIME/signature checks, ownership, rights confirmation, safe storage keys, paid-access checks, download limits, and redacted errors remain intact. Focused eBook/Express regressions pass 16/16, TypeScript passes, and production build passes with existing chunk-size warnings. No files, storage objects, orders, or records changed during validation.
