# 🚀 How to Create Your Custom Slack

This guide walks you through creating a fully customized Slack environment tailored to your company.

---

## 🎯 Quick Start: One Command

**The easiest way** - just run:

```bash
npm run start
```

This single command will:
1. Install dependencies (if needed)
2. Ask if you want to use the default Mercedes sample OR create a custom setup
3. If custom: Run the setup wizard (7 questions)
4. Generate your custom Slack environment
5. Launch your personalized Slack

**That's it!** Your custom Slack will be ready in ~2 minutes.

---

## 📋 Step-by-Step: Creating Your Custom Slack

### Option 1: One-Command Setup (Recommended)

```bash
npm run start
```

When prompted, choose **"⚙️ Create custom setup (answer 7 questions)"**

### Option 2: Manual Step-by-Step

If you prefer more control, follow these steps:

#### Step 1: Install Dependencies
```bash
npm install
```

#### Step 2: Run Setup Wizard
```bash
npm run setup
```

#### Step 3: Answer 7 Questions

The wizard will ask you:

1. **Company name?**
   - Example: `Acme Corp`
   - Example: `TechStart Inc`

2. **What does your company do?**
   - Example: `We build cloud infrastructure and developer tools`
   - Example: `We provide financial services and trading platforms`
   - Example: `We develop electric vehicles and autonomous driving systems`
   - 💡 **Tip**: Be descriptive! The system uses this to infer channels and topics.

3. **What industry are you in?**
   - Example: `Technology`
   - Example: `Finance` or `Financial Services`
   - Example: `Automotive`
   - Example: `Healthcare`
   - Example: `Retail` or `E-commerce`

4. **What is your company size?**
   - Example: `200 employees`
   - Example: `startup` (infers 1-50)
   - Example: `small` (infers 51-200)
   - Example: `large enterprise` (infers 1000+)
   - 💡 **Tip**: Natural language works! "we're a startup" → Startup size

5. **Where is your company headquarters located?**
   - Example: `San Francisco, CA`
   - Example: `Berlin, Germany`
   - Example: `New York, NY`

6. **Which countries is your company present in?**
   - Example: `US, Germany, India`
   - Example: `United States, France, Japan`
   - Example: `we have offices in Germany and India`
   - 💡 **Tip**: This generates 15 team members with culturally appropriate names from these countries!

7. **What is your name (the logged-in user)?**
   - Example: `John Doe`
   - Example: `Sarah Williams`
   - This becomes "you" in the Slack interface

#### Step 4: Generate Your Custom Slack
```bash
npm run generate
```

This creates:
- `src/company.json` - Your company config, channels, topics
- `src/people.json` - 15 team members + bot + you
- `src/theme.json` - Theme configuration

#### Step 5: Launch Your Slack
```bash
npm run dev
```

Your custom Slack will open at `http://localhost:3000` (or configured port)

---

## ✨ What Gets Auto-Generated?

After answering those 7 questions, here's what the system automatically creates:

### 🏢 Company Setup

**15 Team Members:**
- ✅ Culturally appropriate names based on countries you specified
- ✅ Real photos from randomuser.me API
- ✅ Diverse representation (gender-inclusive, multinational)
- ✅ Your avatar automatically assigned

**Bot Configuration:**
- ✅ Bot type inferred from your description:
  - HR-focused → **HR Bot** (e.g., "Workday Bot")
  - Operations-focused → **Operations Bot** (e.g., "Acme Ops Bot")
  - General/Technology → **AI Assistant** (e.g., "Acme AI")
- ✅ Bot name auto-generated from company initials
- ✅ Bot avatar with colored initials

**Company Branding:**
- ✅ Company logo placeholder (you can add your own later)
- ✅ Default theme set to dark mode

### 💬 Channels & Content

**Industry-Specific Channels:**
The system analyzes your industry and description to create relevant channels:

**If you're in Automotive:**
- `#autonomous-driving`
- `#mbux-development`
- `#battery-tech`
- `#eqe-launch`
- `#vehicle-connectivity`
- `#general`

**If you're in Finance:**
- `#risk-management`
- `#compliance`
- `#trading`
- `#payments`
- `#fraud-detection`
- `#general`

**If you're in Healthcare:**
- `#clinical-trials`
- `#patient-care`
- `#telemedicine`
- `#medical-devices`
- `#research`
- `#general`

**If you're in Technology:**
- `#engineering`
- `#backend`
- `#frontend`
- `#devops`
- `#product`
- `#general`

**Realistic Chat History:**
- ✅ Multiple days of conversation history per channel/DM
- ✅ Industry-specific terminology and topics
- ✅ Contextual messages that make sense for your business
- ✅ Realistic message distribution (more in active channels)

**Topics & Roles:**
- ✅ Relevant topics extracted from your company description
- ✅ Industry-appropriate roles and responsibilities

---

## 🎨 Customization After Generation

After running `npm run generate`, you can customize further:

### Add Your Company Logo

1. **Place your logo** in the `/assets` folder:
   ```
   /assets/my-company-logo.png
   ```

2. **Update `src/company.json`**:
   ```json
   {
     "logo": "/assets/my-company-logo.png"
   }
   ```

3. **Regenerate** (optional):
   ```bash
   npm run generate
   ```
   Or manually edit the JSON files.

### Add Custom Bot Avatar

1. **Place bot avatar** in `/assets` folder:
   ```
   /assets/my-bot-avatar.png
   ```

2. **Update `src/people.json`** - Find your bot entry and update:
   ```json
   {
     "name": "Acme AI",
     "avatar": "/assets/my-bot-avatar.png"
   }
   ```

### Customize Channels

Edit `src/company.json` to:
- Add new channels
- Modify channel names
- Adjust channel descriptions
- Change channel topics

### Customize Team Members

Edit `src/people.json` to:
- Add more team members
- Change names
- Update avatars
- Modify roles

### Change Theme

Edit `src/theme.json` or use the theme switcher in the UI (top-right dropdown).

---

## 🔄 Re-running Setup

Want to change your setup? Just run:

```bash
npm run setup    # Answer questions again
npm run generate # Regenerate with new answers
npm run dev      # Launch updated Slack
```

Your old `setup-data.json` will be overwritten with new answers.

---

## 📁 Understanding the Generated Files

### `setup-data.json`
- Contains your answers from the wizard
- You can edit this manually and re-run `npm run generate`
- Located in project root

### `src/company.json`
- Company information
- Channel names and descriptions
- Topics and roles
- Logo path

### `src/people.json`
- All team members (15+ people)
- Bot configuration
- Your user profile
- Avatars and names

### `src/theme.json`
- Theme configuration
- Default theme selection
- Theme colors

---

## 💡 Tips & Best Practices

### For Best Results:

1. **Be Descriptive**: When answering "What does your company do?", be specific:
   - ✅ Good: "We build cloud infrastructure and developer tools for enterprises"
   - ❌ Less helpful: "We do tech stuff"

2. **Specify Multiple Countries**: This creates more diverse team members:
   - ✅ Good: "US, Germany, India, France"
   - ❌ Less diverse: "US"

3. **Use Natural Language**: The wizard understands natural language:
   - ✅ "we're a startup" → Startup size
   - ✅ "United States, Germany" → Parsed correctly
   - ✅ "we build software" → Infers engineering channels

4. **Industry Matters**: Choose the closest industry match:
   - The system uses this to generate appropriate channels and topics

### Common Customizations:

**Add More Channels:**
Edit `src/company.json` and add to the `channels` array.

**Change Bot Name:**
Edit `src/people.json` and find your bot entry.

**Add Custom Avatars:**
1. Add images to `/assets` folder
2. Update paths in `src/people.json`

**Modify Chat History:**
The chat history is generated dynamically, but you can customize message templates in the codebase.

---

## 🚀 Example: Creating a Fintech Slack

Here's a complete example:

```bash
# Step 1: Run setup
npm run setup

# Answer questions:
# 1. Company name: FinTech Solutions
# 2. What you do: We provide payment processing and financial services
# 3. Industry: Finance
# 4. Company size: 150 employees
# 5. Headquarters: New York, NY
# 6. Countries: US, UK, India
# 7. Your name: Alex Johnson

# Step 2: Generate
npm run generate

# Step 3: Launch
npm run dev
```

**Result:**
- ✅ Channels: `#risk-management`, `#compliance`, `#trading`, `#payments`, `#fraud-detection`
- ✅ 15 team members with American, British, and Indian names
- ✅ Bot: "FinTech Solutions AI" (AI Assistant)
- ✅ Chat history with finance-specific conversations
- ✅ Topics: Risk assessment, regulatory compliance, payment processing

---

## 🆘 Troubleshooting

### Setup Wizard Not Running
```bash
# Make sure dependencies are installed
npm install

# Try running setup directly
npm run setup
```

### Generated Files Look Wrong
```bash
# Regenerate from setup-data.json
npm run generate

# Or start fresh
rm setup-data.json
npm run setup
npm run generate
```

### Want to Start Over
```bash
# Delete setup data
rm setup-data.json

# Run setup again
npm run setup
npm run generate
npm run dev
```

### Port Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or change port in vite.config.ts
```

---

## ✅ Summary

**Creating a custom Slack is simple:**

1. **Run**: `npm run start`
2. **Choose**: Custom setup
3. **Answer**: 7 questions
4. **Done**: Your custom Slack launches automatically!

**Time Required:** ~2 minutes  
**Technical Knowledge:** None required  
**Manual Work:** Zero (everything auto-generated)

---

**Ready to create your custom Slack? Run `npm run start` and get started!** 🎉

