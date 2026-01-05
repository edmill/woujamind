# 🔑 Add Your Replicate API Key

## The Issue

The error shows:
```
Authorization: 'Bearer your_replicate_api_key_here'
401 Unauthorized
```

This means you need to add your actual Replicate API key.

## ✅ Solution: Add API Key via Settings Modal

### Step 1: Get Your API Key

1. Go to https://replicate.com/account/api-tokens
2. Sign in or create an account
3. Click "Create token" or copy your existing token
4. It should look like: `r8_abc123def456...` (starts with `r8_`)

### Step 2: Add to Woujamind

**Option A: Via Settings Modal (Easiest)**

1. Open http://localhost:5175
2. Click the **Settings** icon (⚙️) in the top right
3. Find the **"Replicate API Key"** section
4. Paste your API key: `r8_your_actual_key_here`
5. Click **"Save Settings"**
6. Close the modal

**Option B: Via .env File**

1. Open `.env` file in the project root
2. Replace the placeholder:
   ```bash
   # Before:
   REPLICATE_API_KEY=your_replicate_api_key_here
   
   # After:
   REPLICATE_API_KEY=r8_abc123def456...
   ```
3. **Important:** Restart the proxy server:
   ```bash
   # Stop the servers (Ctrl+C in terminal)
   # Then restart:
   npm run start:all
   ```

### Step 3: Test Generation

1. Upload a reference image (or use text prompt)
2. Click **"Generate"**
3. Watch the backend proxy logs for:
   ```
   [PROXY] [Replicate Proxy] Starting Seedance generation
   [PROXY] [Replicate Proxy] Generation complete
   ```

## 🐛 Troubleshooting

### Still getting 401 Unauthorized?

**Check 1: API Key Format**
- Must start with `r8_`
- Should be 40-50 characters long
- No spaces or quotes

**Check 2: API Key is Active**
- Go to https://replicate.com/account/api-tokens
- Make sure the token is not revoked
- Try creating a new token

**Check 3: Proxy Received the Key**

Look at the proxy logs (terminal) when you generate:
```
[PROXY] [Replicate Proxy] Starting Seedance generation
```

If you see this error immediately:
```
[PROXY] [Replicate Proxy] Error: REPLICATE_API_KEY_MISSING
```

Then the API key is not being passed from frontend. Try:
1. Clear browser cache and localStorage
2. Re-add API key via Settings modal
3. Refresh the page

**Check 4: Restart Proxy After .env Changes**

If you added the key to `.env`, you MUST restart the proxy:
```bash
# Stop servers (Ctrl+C)
npm run start:all
```

### How to Verify API Key is Working

**Test 1: Check localStorage**

Open browser console (F12) and run:
```javascript
localStorage.getItem('woujamind_replicate_api_key')
```

Should return: `"r8_abc123def456..."`

**Test 2: Check Proxy Logs**

When you click Generate, the proxy logs should show:
```
[PROXY] [Replicate Proxy] Starting Seedance generation
[PROXY] [Replicate Proxy] Prompt: A red warrior character...
[PROXY] [Replicate Proxy] Frames: 150
```

NOT:
```
[PROXY] [Replicate Proxy] Error: REPLICATE_API_KEY_MISSING
```

**Test 3: Check Authorization Header**

In the proxy error logs, look for:
```
Authorization: 'Bearer r8_abc123...'  ✅ Good
```

NOT:
```
Authorization: 'Bearer your_replicate_api_key_here'  ❌ Bad (placeholder)
```

## 💡 Pro Tips

1. **Use Settings Modal** - Easiest way, saves to localStorage
2. **Don't commit .env** - It's in .gitignore for security
3. **Keep API key private** - Don't share in screenshots or logs
4. **Check Replicate credits** - Make sure you have credits: https://replicate.com/account/billing

## 🎯 Expected Behavior After Adding Key

**Backend Proxy Logs:**
```
[PROXY] [Replicate Proxy] Starting Seedance generation
[PROXY] [Replicate Proxy] Prompt: A red warrior character...
[PROXY] [Replicate Proxy] Frames: 150
[PROXY] [Replicate Proxy] Generation complete
[PROXY] [Replicate Proxy] Output type: string
```

**Browser Console:**
```
[generateVideoFromImage] Starting Seedance generation
[generateVideoFromImage] Video downloaded, size: 2456789 bytes
[extractFramesFromVideo] Extracting 150 frames
```

**UI:**
- Status: "Generating video with Replicate Seedance..."
- Progress updates every few seconds
- After 60-120 seconds: **"Frame Gallery (150)"** button appears
- Perfectly aligned sprite sheet! ✨

---

**Need Help?**

1. Check you have Replicate credits: https://replicate.com/account/billing
2. Verify API key format: starts with `r8_`, 40-50 chars
3. Try creating a new API token
4. Make sure proxy server is running (check terminal)
5. Check browser console for errors

Once you add your API key, everything should work perfectly! 🚀


