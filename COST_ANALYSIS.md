# Sprite Magic - Cost Analysis & Pricing Strategy

## AI API Cost Breakdown (Per Operation)

### Models Used
- **gemini-2.5-flash**: Text analysis and enhancement
  - Input: $0.30/1M tokens
  - Output: $2.50/1M tokens

- **gemini-3-pro-image-preview**: Image generation and editing
  - Input: $2.00/1M tokens (text/image)
  - Output: $0.134 per 1K/2K image

---

## Primary Operations & Costs

### 1. Full Sprite Sheet Generation
**Workflow:** User creates a new sprite sheet from scratch

**API Calls:**
1. `analyzeCharacter` (gemini-2.5-flash)
   - Input: ~500 tokens (prompt) + image (~1500 tokens)
   - Output: ~200 tokens (character description)
   - **Cost: ~$0.0011**

2. `generateSpriteSheet` (gemini-3-pro-image-preview)
   - Input: ~1500 tokens (comprehensive prompt) + optional reference image (~1500 tokens)
   - Output: 1 sprite sheet image (2K resolution)
   - **Cost: $0.134**

3. `aiAnalyzeSpriteSheet` (gemini-2.5-flash) - Part of auto-alignment
   - Input: ~800 tokens (prompt) + sprite sheet image (~1500 tokens)
   - Output: ~300 tokens (JSON analysis)
   - **Cost: ~$0.0012**

**Total per generation: ~$0.1363** ≈ **$0.14**

---

### 2. Sprite Sheet Editing (Full Sheet)
**Workflow:** User applies AI edits to entire sprite sheet

**API Calls:**
1. `editSpriteSheet` (gemini-3-pro-image-preview)
   - Input: ~800 tokens (edit prompt) + sprite sheet image (~1500 tokens)
   - Output: 1 edited sprite sheet image (2K resolution)
   - **Cost: $0.134**

**Total per edit: ~$0.134** ≈ **$0.13**

---

### 3. Single Frame Edit
**Workflow:** User edits one frame of sprite sheet

**API Calls:**
1. `editSpriteSheet` (gemini-3-pro-image-preview) - Single cropped frame
   - Input: ~500 tokens (edit prompt) + single frame image (~400 tokens)
   - Output: 1 edited frame image
   - **Cost: $0.134**

**Total per frame edit: ~$0.134** ≈ **$0.13**

---

### 4. Insert In-Between Frame
**Workflow:** User adds a new frame between existing frames

**API Calls:**
1. `generateInBetweenFrame` (gemini-3-pro-image-preview)
   - Input: ~700 tokens (prompt) + 2 frame images (~800 tokens)
   - Output: 1 new frame image
   - **Cost: $0.134**

**Total per frame insertion: ~$0.134** ≈ **$0.13**

---

### 5. Prompt Enhancement (Optional)
**Workflow:** User clicks "enhance" on their prompt

**API Calls:**
1. `enhancePrompt` (gemini-2.5-flash)
   - Input: ~100 tokens (user prompt) + ~300 tokens (enhancement instructions)
   - Output: ~150 tokens (enhanced prompt)
   - **Cost: ~$0.0004**

**Total per enhancement: ~$0.0004** ≈ **$0.0004** (negligible)

---

## Usage Cost Scenarios

### Light User (5 generations/month)
- 5 sprite sheet generations
- 10 frame edits
- 2 full sheet edits
- **Cost: $0.70 + $1.30 + $0.26 = $2.26/month**

### Regular User (20 generations/month)
- 20 sprite sheet generations
- 40 frame edits
- 10 full sheet edits
- **Cost: $2.80 + $5.20 + $1.30 = $9.30/month**

### Power User (50 generations/month)
- 50 sprite sheet generations
- 100 frame edits
- 30 full sheet edits
- **Cost: $7.00 + $13.00 + $3.90 = $23.90/month**

### Professional (200 generations/month)
- 200 sprite sheet generations
- 400 frame edits
- 100 full sheet edits
- **Cost: $28.00 + $52.00 + $13.00 = $93.00/month**

---

## Infrastructure Costs

### Hosting (Static Frontend)
- **Vercel/Netlify Free Tier**: $0/month (hobby projects)
- **Vercel Pro**: $20/month (commercial use, better performance)
- **Custom CDN (Cloudflare)**: $5-20/month

### Database (IndexedDB - Client-side)
- **Current: $0/month** (browser-based storage)
- If moving to cloud storage for sync:
  - **Firebase (Firestore)**: ~$5-25/month for typical usage
  - **Supabase**: ~$25/month (Pro tier with better limits)

### Domain & SSL
- **Domain**: $12/year (~$1/month)
- **SSL**: Free (included with hosting providers)

### Monitoring & Analytics (Optional)
- **Vercel Analytics**: Free tier
- **Sentry (Error tracking)**: Free tier (5K errors/month)
- **PostHog (Product analytics)**: Free tier (1M events/month)

### Email Service (for auth/notifications)
- **Resend/SendGrid**: Free tier (100-100 emails/day)
- **Resend Pro**: $20/month (50K emails)

### Authentication (If implementing user accounts)
- **Clerk**: $25/month (up to 10K MAUs)
- **Supabase Auth**: Free tier (50K MAUs)
- **Firebase Auth**: Free (unlimited)

### Payment Processing
- **Stripe**: 2.9% + $0.30 per transaction
- **Paddle**: 5% + $0.50 per transaction

---

## Estimated Monthly Infrastructure Costs

### Tier 1: Hobby/MVP
- Static hosting: $0 (Vercel free)
- Domain: $1/month
- Analytics: $0 (free tiers)
- **Total: ~$1/month**

### Tier 2: Small Business (100-500 users)
- Hosting: $20 (Vercel Pro)
- Domain: $1
- Database: $25 (Supabase)
- Auth: $0 (Firebase/Supabase free)
- Analytics: $0 (free tiers)
- Email: $0 (free tier sufficient)
- **Total: ~$46/month**

### Tier 3: Growth (500-5000 users)
- Hosting: $20 (Vercel Pro)
- Domain: $1
- Database: $50 (Supabase Pro)
- Auth: $25 (Clerk)
- Analytics: $0-20
- Email: $20 (Resend Pro)
- CDN: $10
- **Total: ~$126-146/month**

### Tier 4: Scale (5000+ users)
- Hosting: $150 (Vercel Enterprise or custom)
- Domain: $1
- Database: $100+ (Supabase Team/Enterprise)
- Auth: $100 (Clerk scale)
- Analytics: $50
- Email: $50
- CDN: $50
- **Total: ~$500+/month**

---

## Pricing Model Recommendations

### Option 1: Credit-Based (Pay-As-You-Go)
**Advantages:**
- Users only pay for what they use
- Lower barrier to entry
- No recurring commitment
- Good for casual users

**Pricing Structure:**
- **1 credit = 1 sprite sheet generation**
- Frame edits = 0.25 credits
- Full sheet edits = 0.5 credits

**Credit Packages:**
- Starter: 10 credits - $5 ($0.50/credit, 3.6x markup)
- Standard: 30 credits - $12 ($0.40/credit, 2.9x markup)
- Pro: 100 credits - $35 ($0.35/credit, 2.5x markup)
- Enterprise: 500 credits - $150 ($0.30/credit, 2.1x markup)

**Target Margin: 150-250%**

**Estimated Monthly Revenue (1000 active users):**
- 40% buy Starter: 400 × $5 = $2,000
- 40% buy Standard: 400 × $12 = $4,800
- 15% buy Pro: 150 × $35 = $5,250
- 5% buy Enterprise: 50 × $150 = $7,500
- **Total: $19,550/month**
- **Estimated AI Costs: ~$6,500** (assuming 50 operations per user/month average)
- **Net Margin: ~$13,000 (67%)**

---

### Option 2: Subscription-Based
**Advantages:**
- Predictable recurring revenue
- Better customer lifetime value
- Encourages regular usage
- Simpler pricing

**Pricing Structure:**

#### Free Tier
- 3 sprite sheet generations/month
- 10 frame edits/month
- Basic export (PNG only)
- **AI Cost: $0.42 + $1.30 = ~$1.72/user**
- **Value Prop:** Try before committing

#### Starter - $9/month
- 20 sprite sheet generations/month
- 50 frame edits/month
- GIF export enabled
- Email support
- **AI Cost: $2.80 + $6.50 = ~$9.30/user**
- **Margin: Break-even tier** (customer acquisition)

#### Professional - $29/month
- 100 sprite sheet generations/month
- 250 frame edits/month
- Priority generation
- Advanced editing tools
- Priority email support
- **AI Cost: $14.00 + $32.50 = ~$46.50/user**
- **Margin: -$17.50/user** (loss leader if all credits used)
- **Typical Usage: ~40 generations** → $5.60 + $16.25 = **~$22/user**
- **Actual Margin: ~$7 (24%)**

#### Team - $99/month
- 500 sprite sheet generations/month
- 1,500 frame edits/month
- Team collaboration (up to 5 users)
- API access
- Priority support
- **AI Cost (full usage): $70 + $195 = ~$265/user**
- **Margin: -$166/user** (loss leader if all credits used)
- **Typical Usage: ~150 generations** → $21 + $97.50 = **~$118.50/user**
- **Margin: Break-even** (designed for multiple users sharing)

#### Enterprise - Custom Pricing
- Unlimited generations
- White-label options
- Dedicated support
- Custom infrastructure
- **Minimum: $500/month**

**Estimated Monthly Revenue (1000 active users):**
- 50% Free: 500 × $0 = $0 (AI cost: $860)
- 30% Starter: 300 × $9 = $2,700 (AI cost: ~$2,790)
- 15% Professional: 150 × $29 = $4,350 (AI cost: ~$3,300)
- 4% Team: 40 × $99 = $3,960 (AI cost: ~$4,740)
- 1% Enterprise: 10 × $500 = $5,000 (AI cost: variable)
- **Total Revenue: $16,010/month**
- **Total AI Costs: ~$11,690/month**
- **Net Margin: ~$4,320 (27%)**

**⚠️ Issue: Margins are too thin with subscription model at current pricing**

---

### Option 3: Hybrid Model (RECOMMENDED)
**Best of both worlds - flexible credits + subscription benefits**

**Pricing Structure:**

#### Free Tier
- 3 free credits on signup
- 1 free credit per month
- Basic features only
- Community support

#### Hobby - $12/month
- **25 credits/month** (~$0.48/credit)
- Rollover unused credits (up to 50)
- GIF export
- Email support
- **Additional credits: $0.60 each**
- **AI Cost (full usage): ~$3.50**
- **Margin: ~$8.50 (71%)**

#### Creator - $39/month
- **120 credits/month** (~$0.33/credit)
- Rollover unused credits (up to 200)
- Priority generation queue
- Advanced editing features
- Priority email support
- **Additional credits: $0.45 each**
- **AI Cost (full usage): ~$16.80**
- **Margin: ~$22.20 (57%)**

#### Professional - $99/month
- **400 credits/month** (~$0.25/credit)
- Unlimited rollover
- Fastest generation queue
- API access
- Team collaboration (3 users)
- Priority support
- **Additional credits: $0.35 each**
- **AI Cost (full usage): ~$56.00**
- **Margin: ~$43.00 (43%)**

#### Studio - $299/month
- **1,500 credits/month** (~$0.20/credit)
- Everything in Professional
- Team collaboration (10 users)
- White-label options
- Dedicated support
- Custom integrations
- **AI Cost (full usage): ~$210.00**
- **Margin: ~$89.00 (30%)**

**Credit Usage:**
- 1 sprite sheet generation = 1 credit
- Full sheet edit = 0.5 credits
- Frame edit = 0.25 credits
- Frame insertion = 0.5 credits

**Estimated Monthly Revenue (1000 active users):**
- 50% Free: 500 × $0 = $0 (AI cost: minimal, ~$300)
- 25% Hobby: 250 × $12 = $3,000 (AI cost: ~$875)
- 15% Creator: 150 × $39 = $5,850 (AI cost: ~$2,520)
- 7% Professional: 70 × $99 = $6,930 (AI cost: ~$3,920)
- 3% Studio: 30 × $299 = $8,970 (AI cost: ~$6,300)
- **Total Revenue: $24,750/month**
- **Total AI Costs: ~$13,915/month**
- **Net Margin: ~$10,835 (44%)**

Plus additional overage revenue from credit purchases.

---

## Competitive Analysis

### Similar Products & Pricing

#### Spritegen.ai (Competitor)
- Unknown pricing (if any)
- Your codebase suggests this was open-source/free

#### Midjourney (AI Art Generator)
- Basic: $10/month (200 images)
- Standard: $30/month (unlimited relaxed)
- Pro: $60/month (unlimited fast, 12 fast hours)
- **Per-image effective cost: $0.05-0.15**

#### DALL-E 3 (OpenAI)
- $0.040 per image (1024×1024)
- $0.080 per image (1024×1792/1792×1024)
- **Volume discounts not available**

#### Replicate (General AI API Platform)
- Stable Diffusion: ~$0.0023 per image
- SDXL: ~$0.0025 per image
- **Much cheaper but lower quality**

#### Scenario.gg (Game Asset Generator)
- Starter: Free (limited)
- Pro: $29/month (unlimited generations)
- **Direct competitor, but less specialized**

### Market Positioning
- **Premium tier**: More expensive than general AI art generators
- **Specialized value**: Sprite sheets are more complex than single images
- **Justified markup**: Your service handles grid layout, frame alignment, animation logic
- **Target market**: Game developers who value time > cost

---

## Recommendations

### Phase 1: MVP Launch (Months 1-3)
**Model: Hybrid (Simplified)**
- Free: 5 credits (one-time)
- Starter: $15/month (30 credits)
- Pro: $49/month (150 credits)
- **Goal: Validate pricing, gather feedback**
- **Target: 100 paying users** → $1,900-4,900/month
- **Estimated costs: ~$800-2,000/month** (AI + infrastructure)

### Phase 2: Growth (Months 4-12)
**Model: Full Hybrid (Recommended)**
- Implement all tiers (Hobby/Creator/Professional/Studio)
- Add credit rollover and overage purchases
- Launch API access for Professional tier
- **Goal: Scale to 500-1000 paying users**
- **Target revenue: $10,000-25,000/month**
- **Estimated costs: ~$5,000-14,000/month**

### Phase 3: Scale (Year 2+)
- Enterprise custom plans
- Team/agency packages
- White-label options
- API-first revenue stream
- **Goal: $100,000+/month revenue**

---

## Key Metrics to Track

### Financial Metrics
- **Customer Acquisition Cost (CAC)**
- **Customer Lifetime Value (LTV)**
- **LTV:CAC Ratio** (target: 3:1 or higher)
- **Monthly Recurring Revenue (MRR)**
- **Churn Rate** (target: <5% monthly)
- **Average Revenue Per User (ARPU)**

### Usage Metrics
- **Credits used per user per month**
- **Conversion rate: Free → Paid**
- **Upgrade rate: Lower tier → Higher tier**
- **API cost per user**
- **Infrastructure cost per user**

### Product Metrics
- **Generation success rate**
- **Average generation time**
- **Edit operations per generation**
- **Feature usage breakdown**

---

## Risk Mitigation

### Cost Overruns
- **Rate limiting**: Prevent abuse with reasonable daily/hourly limits
- **Usage caps**: Soft caps with overage alerts before hard limits
- **Quality checks**: Reject malformed prompts early to save API calls
- **Caching**: Cache character analyses and enhanced prompts

### Pricing Failures
- **A/B testing**: Test different price points with different user segments
- **Annual discounts**: Offer 20% discount for annual plans to improve cash flow
- **Grandfathering**: Keep early adopters on favorable pricing
- **Price anchoring**: Always show higher tier options to anchor value

### Competition
- **Feature differentiation**: Advanced frame editing, animation tools
- **Quality focus**: Better sprite consistency than general AI art tools
- **Speed optimization**: Faster generation times
- **Workflow integration**: Export formats for popular game engines

---

## Next Steps

1. **Implement basic paywall** using the token system already in your code
2. **Add Stripe integration** for payment processing
3. **Set up user authentication** (Firebase Auth or Clerk)
4. **Launch with simplified pricing** (3 tiers max initially)
5. **Track metrics religiously** from day 1
6. **Gather user feedback** on pricing and features
7. **Iterate pricing** based on actual usage patterns
8. **Scale infrastructure** as user base grows

---

## Conclusion

**Recommended Strategy: Hybrid Model**

**Target Pricing:**
- Hobby: $12/month (25 credits)
- Creator: $39/month (120 credits)
- Professional: $99/month (400 credits)

**Projected First Year:**
- Month 1-3: 50-100 paying users → $1,000-3,000/month
- Month 4-6: 200-400 paying users → $5,000-12,000/month
- Month 7-12: 500-1000 paying users → $15,000-30,000/month

**Why This Works:**
- ✅ Healthy margins (40-70% depending on tier and usage)
- ✅ Predictable recurring revenue
- ✅ Flexibility for different user types
- ✅ Room for upsells and overages
- ✅ Scales with infrastructure costs
- ✅ Competitive but premium positioning

**Break-even Point:** ~100 paying users at average $25/month ARPU
**Profitable at:** 200+ paying users

---

**Document Version:** 1.0
**Last Updated:** December 2025
**Next Review:** After reaching 100 paying users or 3 months, whichever comes first
