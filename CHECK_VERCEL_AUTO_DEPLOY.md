# How to Check if Vercel Auto-Deploy is Enabled

## Quick Check Methods

### Method 1: Vercel Dashboard (Easiest)

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/dashboard
   - Find your project: **woujamind**
   - Project ID: `prj_DU9uxQLq3aCKHOuht2V3TpKb3Qb2`

2. **Check Git Integration:**
   - Go to: **Settings** → **Git**
   - Look for:
     - ✅ **"Production Branch"** - Shows which branch auto-deploys
     - ✅ **"Automatic deployments from Git"** - Toggle that enables/disables auto-deploy
     - ✅ **"Deploy Hooks"** - Shows any webhook URLs that trigger deployments

3. **Check Deployment Settings:**
   - Go to: **Settings** → **Deployments**
   - Look for:
     - **"Automatic deployments"** - Should show enabled/disabled
     - **"Production deployments"** - Which branches trigger production
     - **"Preview deployments"** - Which branches trigger previews

### Method 2: Vercel CLI (If Installed)

```bash
# Check project settings
vercel inspect

# List deployments
vercel ls

# Check git integration
vercel git
```

### Method 3: Check Recent Deployments

1. Go to Vercel Dashboard → Your Project → **Deployments** tab
2. Look at recent deployments:
   - If you see deployments right after git pushes → **Auto-deploy is ON**
   - If deployments only happen manually → **Auto-deploy is OFF**

### Method 4: Test It

1. Make a small change (add a comment to a file)
2. Commit and push:
   ```bash
   git add .
   git commit -m "test: check auto-deploy"
   git push
   ```
3. Watch Vercel Dashboard:
   - If a new deployment starts automatically → **Auto-deploy is ON**
   - If nothing happens → **Auto-deploy is OFF**

## What to Look For

### ✅ Auto-Deploy is ENABLED if you see:
- "Automatic deployments from Git" toggle is **ON** (green/enabled)
- Production branch is set (usually `main` or `master`)
- Recent deployments show "Triggered by Git push"

### ❌ Auto-Deploy is DISABLED if you see:
- "Automatic deployments from Git" toggle is **OFF** (gray/disabled)
- Only manual deployments in history
- No production branch configured

## Your Project Info

- **Project Name:** woujamind
- **Project ID:** prj_DU9uxQLq3aCKHOuht2V3TpKb3Qb2
- **Git Repository:** https://github.com/edmill/sprite-magic.git
- **Framework:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

## How to Disable Auto-Deploy

If you want to disable automatic deployments:

1. Go to Vercel Dashboard → Your Project → **Settings** → **Git**
2. Toggle **"Automatic deployments from Git"** to **OFF**
3. Or unlink the repository temporarily

## How to Enable Manual Deployments Only

1. Go to **Settings** → **Deployments**
2. Set deployment settings to:
   - **Production:** Manual only
   - **Preview:** Manual only (or disable)

---

**Note:** The `.vercel` folder in your project just contains the project link configuration. It doesn't control auto-deploy settings - those are managed in the Vercel dashboard.

