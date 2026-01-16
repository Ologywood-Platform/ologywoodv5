# Enable GitHub Actions - Step by Step Guide

This guide helps you enable GitHub Actions in your `ologywood-platform` repository.

## Step 1: Go to Your Repository Settings

1. Open your browser and go to [github.com](https://github.com)
2. Sign in to your Ologycrew account
3. Click on your **`ologywood-platform`** repository
4. Click the **"Settings"** tab (top of the page)

## Step 2: Navigate to Actions Settings

1. In the left sidebar, click **"Actions"**
2. Then click **"General"** (should be the first option)

## Step 3: Enable Actions Permissions

1. Under **"Actions permissions"**, you should see options:
   - ⭕ Disable all actions and reusable workflows
   - ⭕ Allow all actions and reusable workflows
   - ⭕ Allow select actions and reusable workflows

2. Select **"Allow all actions and reusable workflows"** (the second option)

3. Click **"Save"** (green button on the right)

## Step 4: Configure Workflow Permissions

1. Scroll down to **"Workflow permissions"**
2. You should see two checkboxes:
   - ☑️ Read and write permissions
   - ☑️ Allow GitHub Actions to create and approve pull requests

3. Make sure BOTH are checked (✓)
4. Click **"Save"** (green button)

## Step 5: Verify Actions is Enabled

1. Click the **"Actions"** tab (top of your repository page)
2. You should see:
   - "No workflows have run yet" or
   - A list of workflow files if you've already pushed code

3. If you see either of these, GitHub Actions is enabled! ✅

## Step 6: (Optional) Add Workflow Files

If you want to set up automatic deployments, you can add workflow files:

1. In your repository, create a folder: `.github/workflows/`
2. Add your workflow files (like `deploy-staging.yml`)
3. Push to GitHub
4. GitHub Actions will automatically run them

## Troubleshooting

**If you don't see "Actions" in Settings:**
- Make sure you're in the correct repository
- Refresh the page (Command ⌘ + R)
- Try logging out and back in

**If Actions is still disabled:**
- Check that you selected "Allow all actions"
- Make sure you clicked "Save"
- Wait a few seconds and refresh

**If you see "Actions are disabled":**
- Go back to Step 3 and select "Allow all actions"
- Click "Save"

## Next Steps

After enabling GitHub Actions:

1. ✅ GitHub Actions enabled
2. Push your Ologywood code to the repository
3. Set up AWS account
4. Add repository secrets (AWS credentials)
5. Deploy to staging environment

---

**Questions?** Let me know what you see on your screen and I can help!
