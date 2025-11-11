# Setup Wizard - Complete!

## ✅ What's Been Created

1. **Setup Script** (`scripts/setup.ts`)
   - Interactive wizard using `inquirer`
   - Asks questions about company, team, channels, bot, and theme
   - Saves answers to `setup-data.json`

2. **Generate Script** (`scripts/generate.ts`)
   - Reads `setup-data.json`
   - Generates `src/company.json`, `src/people.json`, and updates `src/theme.json`
   - Creates a fully configured Slack environment

3. **NPM Scripts** (added to `package.json`)
   - `npm run setup` - Runs the setup wizard
   - `npm run generate` - Generates the Slack environment from setup data

4. **Documentation**
   - `SETUP_WIZARD.md` - Guide for using the setup wizard

## 🚀 Usage

```bash
# Step 1: Run the setup wizard
npm run setup

# Step 2: Generate your Slack environment
npm run generate

# Step 3: Start the app
npm run dev
```

## 📋 Questions Asked in Setup Wizard

1. Company name
2. Company logo path
3. Industry
4. Company size
5. Headquarters location
6. Company description
7. Channel types (engineering, product, operations, etc.)
8. Custom channel names
9. Current user name
10. Current user avatar
11. Team member names
12. Bot name
13. Bot avatar
14. Bot type (HR, AI, Operations, Custom)
15. Default theme

## 📁 Files Generated

- `setup-data.json` - Your answers (gitignored)
- `src/company.json` - Company configuration
- `src/people.json` - People and bot configuration
- `src/theme.json` - Theme configuration (updated)

## 🔧 Dependencies Added

- `inquirer` - Interactive CLI prompts
- `@types/inquirer` - TypeScript types
- `tsx` - TypeScript execution

Everything is ready to use! 🎉


