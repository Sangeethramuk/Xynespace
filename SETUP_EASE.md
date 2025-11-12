# ⚡ Setup Guide - How Easy Is It?

## 🎯 Setup Time: **~2 Minutes**

Setting up a custom Slack instance is incredibly easy - just **3 commands** and **7 simple questions**!

---

## 📋 Step-by-Step Process

### Step 1: Install Dependencies (30 seconds)
```bash
npm install
```

### Step 2: Run Setup Wizard (1 minute)
```bash
npm run setup
```

**You'll answer 7 questions:**

1. **Company name?** → `Acme Corp`
2. **What does your company do?** → `We build cloud infrastructure and developer tools`
3. **What industry?** → `Technology`
4. **Company size?** → `200 employees` (or "startup", "large", etc.)
5. **Headquarters location?** → `San Francisco, CA`
6. **Which countries?** → `US, Germany, India` (natural language!)
7. **Your name?** → `John Doe`

**That's it!** The wizard handles everything else automatically.

### Step 3: Generate & Launch (30 seconds)
```bash
npm run generate  # Creates your custom Slack environment
npm run dev       # Launches your personalized Slack
```

---

## ✨ What Gets Auto-Generated?

After answering those 7 questions, the system automatically creates:

### 🏢 Company Setup
- ✅ **15 team members** with culturally appropriate names
- ✅ **Professional avatars** from internet photos
- ✅ **Your avatar** automatically assigned
- ✅ **Company logo** placeholder

### 💬 Channels & Content
- ✅ **Channel names** contextual to your industry
  - Automotive → `#autonomous-driving`, `#electric-vehicles`
  - Finance → `#risk-management`, `#compliance`
  - Healthcare → `#clinical-trials`, `#telemedicine`
- ✅ **Chat history** with industry-specific conversations
- ✅ **Topics** relevant to your business

### 🤖 Bot Configuration
- ✅ **Bot type** inferred from your description
  - HR-focused → HR Bot
  - Operations-focused → Operations Bot
  - General → AI Assistant
- ✅ **Bot name** auto-generated (e.g., "Acme HR Bot")
- ✅ **Bot avatar** with initials in colored box

### 🎨 Theme & Styling
- ✅ **Default theme** set to dark mode
- ✅ **All 4 themes** ready to use

---

## 💡 Natural Language Examples

The wizard accepts natural language - you don't need to be precise!

### Company Size
- ✅ `"startup"` → Small company
- ✅ `"200 employees"` → Medium company
- ✅ `"large enterprise"` → Large company
- ✅ `"we're small"` → Small company

### Countries
- ✅ `"US, Germany, India"` → Parsed correctly
- ✅ `"United States, France"` → Parsed correctly
- ✅ `"we have offices in Germany and India"` → Parsed correctly

### Company Description
- ✅ `"We build software"` → Infers engineering channels
- ✅ `"We sell products online"` → Infers e-commerce channels
- ✅ `"We provide healthcare services"` → Infers healthcare channels

---

## 🎬 Example Session

Here's what a real setup session looks like:

```bash
$ npm run setup

🚀 Welcome to the Vibe Slack Setup Wizard!

This wizard will help you configure your Slack environment.

We'll ask just a few high-level questions and generate everything else for you.

💡 Tip: You can answer naturally!

? What is your company name? Acme Corp
? What does your company do? We build cloud infrastructure and developer tools
? What industry are you in? Technology
? What is your company size? 200 employees
? Where is your company headquarters located? San Francisco, CA
? Which countries is your company present in? US, Germany, India
? What is your name (the logged-in user)? John Doe

✅ Setup data saved successfully!

📊 Auto-generated:
   • Bot name: Acme AI (AI Assistant)
   • Bot avatar: Initials "AA"
   • User avatar: Internet photo
   • Company logo: Placeholder
   • Theme: Dark

📊 Inferred from your answers:
   • Channel types: general, engineering
   • Generated 15 team members
   • Nationalities: American, German, Indian

📝 Next steps:
   1. Review the setup data in setup-data.json
   2. Run: npm run generate
   3. This will create your Slack environment based on your answers
```

---

## 🚀 Single Command Setup - YOUR Custom Company

**Yes!** Set up YOUR custom company with just **one command**:

```bash
npm run start
```

or

```bash
npm run init
```

### What Happens:

**First Time (No Custom Setup):**
1. ✅ Installs dependencies (if needed)
2. ✅ **Runs setup wizard** - You'll answer 7 questions about YOUR company:
   - Your company name
   - What your company does
   - Your industry
   - Company size
   - Headquarters location
   - Countries (generates 15 team members)
   - Your name
3. ✅ Generates YOUR custom configuration:
   - Channels specific to your industry
   - 15 team members with appropriate names
   - Bot configured for your company
   - Chat history contextual to your business
4. ✅ Launches YOUR personalized Slack

**Subsequent Runs (Custom Setup Exists):**
1. ✅ Uses your existing custom setup
2. ✅ Regenerates configuration
3. ✅ Launches your Slack

**That's it!** Just answer 7 questions when prompted, and YOUR custom Slack will launch automatically with YOUR company, YOUR team, and YOUR channels!

### Alternative: Default Setup (No Questions)

Want it even faster? You can skip the wizard and use the default Mercedes setup:

```bash
npm install && npm run dev
```

That's it! Opens immediately with a pre-configured automotive company setup.

---

## 📊 Comparison: Manual vs Wizard

### ❌ Manual Setup (Old Way)
- Define 15+ team member names manually
- Create 20+ channel names manually
- Write channel descriptions
- Configure bot names and avatars
- Set up company branding
- Write chat history templates
- **Time: ~30-60 minutes**

### ✅ Wizard Setup (New Way)
- Answer 7 high-level questions
- Everything else auto-generated
- **Time: ~2 minutes**

**That's 15-30x faster!** 🚀

---

## 🎯 What Makes It So Easy?

1. **Intelligent Inference** - We analyze your industry and description
2. **Natural Language** - Answer questions conversationally
3. **Smart Defaults** - Sensible defaults for everything
4. **Zero Configuration** - No config files to edit manually
5. **One Command** - `npm run setup` does it all

---

## 🔄 Re-running Setup

Want to change your setup? Just run the wizard again:

```bash
npm run setup    # Answer questions again
npm run generate # Regenerate with new answers
npm run dev      # Launch updated Slack
```

Your old `setup-data.json` will be overwritten with new answers.

---

## ✅ Summary

**Setup Difficulty: ⭐ Very Easy**

- **Time Required:** ~2 minutes
- **Commands:** 3 (`install`, `setup`, `generate`)
- **Questions:** 7 simple questions
- **Technical Knowledge:** None required
- **Manual Work:** Zero

**Perfect for:**
- ✅ Quick demos
- ✅ Prototyping
- ✅ Custom presentations
- ✅ Testing different industries
- ✅ Client showcases

---

**Ready to try it? Run `npm run setup` and see how easy it is!** 🎉

