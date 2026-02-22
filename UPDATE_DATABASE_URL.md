# How to Update DATABASE_URL in Manus Management UI

## Quick Steps

1. **Open Manus Management UI** for your Ologywood project
2. Go to **Settings** (bottom left sidebar)
3. Click **Secrets** tab
4. Find **DATABASE_URL** in the list
5. Click on it to edit
6. **Replace the value** with:

```
mysql://2uXaD1wbYUFqiqF.root:cwRgelpxV28lX0k5@gateway01.us-east-1.prod.aws.tidbcloud.com:4000/test
```

7. Click **Save** or **Update**
8. Wait for the change to apply (usually instant)

---

## What Happens Next

Once you update DATABASE_URL:

1. ✅ Dev server will automatically reconnect to TiDB
2. ✅ Database queries will start working
3. ✅ Artists will display on homepage
4. ✅ Images will show for artists/venues
5. ✅ All booking features will work

---

## Verification

After updating, you should see:

- ✅ No more "Failed query" errors in console
- ✅ Artists appearing on the homepage
- ✅ Artist search working
- ✅ Venue browse working
- ✅ Images displaying

---

## If You Don't See the Change

1. **Restart the dev server:**
   - Go to Management UI → Click the restart icon
   - Or wait 30 seconds for auto-reload

2. **Refresh the browser:**
   - Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
   - Or clear browser cache

3. **Check the Secrets panel:**
   - Make sure DATABASE_URL shows your new connection string
   - Make sure it was saved (look for a checkmark or confirmation)

