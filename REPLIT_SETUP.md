# 🚀 Replit Setup Guide - Chat Ops Slack Prototype

This guide will help you fork and run this Slack prototype on Replit without errors, and customize it for your needs.

---

## 📋 Quick Start (2 Steps - Replit Does the Rest!)

### Step 1: Fork & Import to Replit

1. **Fork this repository** on GitHub
2. **Import to Replit**:
   - Go to [Replit](https://replit.com)
   - Click "Create Repl" → "Import from GitHub"
   - Paste your forked repository URL
   - Select "Node.js" as the language
   - Click "Import"

### Step 2: Run the App

**🎉 Replit Magic**: Replit automatically detects `package.json` and installs dependencies for you!

Simply click the **"Run"** button, or run:

```bash
npm run dev
```

**✅ Success!** 
- Replit auto-installs dependencies (no manual `npm install` needed!)
- The `predev` script automatically copies assets from `assets/` to `public/assets/`
- Vite starts the dev server
- Replit automatically shows you a preview window
- The app runs on port 5180 (or another port if that's busy)

**Note**: No environment variables are required! The app runs out of the box.

**💡 If dependencies don't auto-install**: Run `npm install` manually, then `npm run dev`

---

## ⚠️ Common Errors & Solutions

### Error 1: "Assets not found" or blank page

**Problem**: The `predev` script copies assets from `assets/` to `public/assets/` before starting the dev server. If this doesn't run, assets won't be available.

**Solution**: Manually run the asset copy command:

```bash
rm -rf public/assets && mkdir -p public && cp -R assets public/assets
```

Or ensure the `predev` script runs automatically (it should, but if not, run it manually before `npm run dev`).

### Error 2: Port already in use

**Problem**: Port 5180 (default) might be in use by another Repl.

**Solution**: Vite will automatically use the next available port. Check the Replit console output for the actual port number, or specify one:

```bash
npm run dev -- --port 3000
```

### Error 3: "Cannot find module" errors

**Problem**: Dependencies weren't installed correctly (rare on Replit, but can happen).

**Solution**: 
```bash
# Replit usually auto-installs, but if needed:
npm install

# Or clean install:
rm -rf node_modules package-lock.json
npm install
```

### Error 4: TypeScript errors

**Problem**: TypeScript might complain about missing types.

**Solution**: The project should work out of the box, but if you see TypeScript errors, try:

```bash
npm install --save-dev @types/react @types/react-dom
```

### Error 5: Build fails with "predev" script

**Problem**: The `predev` script uses Unix commands (`rm`, `cp`, `mkdir`) that might not work on Windows-based Replit instances.

**Solution**: If you encounter this, manually create the directory structure:

```bash
mkdir -p public/assets
cp -r assets/* public/assets/
```

Or modify the script in `package.json` to be cross-platform compatible.

---

## 🎨 Customizing for Your Company

The app uses **three JSON files** to make the Slack interface feel contextual to your organization. Here's how to customize them:

### 1. **`src/company.json`** - Company Context

This file defines your company's culture, channels, roles, and communication style.

**Key sections to customize:**

```json
{
  "name": "Your Company Name",           // Change this!
  "logo": "/assets/your-logo.png",       // Add your logo to assets/
  "description": "Your company description...",
  "industry": "Your Industry",
  "companySize": "Small/Medium/Large Enterprise",
  
  "channels": {
    "types": [
      {
        "type": "engineering",
        "description": "Your engineering channel description",
        "examples": ["#your-channels", "#custom-names"]
      }
      // Add your own channel types
    ]
  },
  
  "roles": [
    {
      "title": "Your Role Title",
      "responsibilities": ["Task 1", "Task 2"],
      "commonChannels": ["#channel1", "#channel2"]
    }
    // Add roles specific to your company
  ],
  
  "topics": [
    "Your company-specific topics",
    "What your team discusses"
  ],
  
  "communicationStyle": {
    "tone": "Your company's tone",
    "formality": "Casual/Formal/Semi-formal",
    "commonPatterns": [
      "How your team communicates"
    ]
  }
}
```

**💡 Tips:**
- Replace "Atlassian" with your company name
- Update channel examples to match your actual Slack channels
- Add roles that exist in your organization
- Customize topics to reflect what your team discusses

### 2. **`src/people.json`** - Team Members

This file contains all the people who appear in the Slack interface.

**Structure:**

```json
[
  {
    "name": "Your Name",
    "avatar": "/assets/faces/your-photo.jpg",  // Add photo to assets/faces/
    "gender": "male/female/neutral",
    "country": "Your Country",
    "me": true  // ⚠️ IMPORTANT: Only ONE person should have "me": true
  },
  {
    "name": "Team Member 1",
    "avatar": "/assets/faces/member1.jpg",
    "gender": "female",
    "country": "United States",
    "emoji-heavy": true  // Optional: person uses lots of emojis
  },
  {
    "name": "Team Member 2",
    "avatar": "/assets/faces/member2.jpg",
    "gender": "male",
    "country": "India",
    "verbose": true  // Optional: person writes long messages
  }
]
```

**💡 Tips:**
- **Set `"me": true`** for the person whose perspective you're viewing (only one!)
- Add your team members' names
- Upload avatar images to `assets/faces/` directory
- Use `"emoji-heavy": true` for people who use lots of emojis
- Use `"verbose": true` for people who write longer messages
- You can use external URLs for avatars (like `https://randomuser.me/api/portraits/...`)

**Adding avatars:**
1. Add image files to `assets/faces/` directory
2. Reference them as `/assets/faces/filename.jpg` in the JSON

### 3. **`src/theme.json`** - Visual Theme (Optional)

Customize the color scheme to match your brand.

**Available themes:**
- `midnight-express` (dark) - Default
- `obsidian-dreams` (dark)
- `solar-flare` (light)
- `arctic-breeze` (light)

**To change default theme:**

```json
{
  "themes": { ... },
  "defaultTheme": "your-theme-name"  // Change this
}
```

**To create custom theme:**

Copy an existing theme and modify colors:

```json
{
  "themes": {
    "my-custom-theme": {
      "name": "My Custom Theme",
      "type": "dark",
      "colors": {
        "mainBackground": "#your-color",
        "textPrimary": "#your-color",
        // ... customize all colors
      }
    }
  },
  "defaultTheme": "my-custom-theme"
}
```

---

## 🔧 Replit-Specific Configuration

### Creating a `.replit` file (Optional but Recommended)

Create a `.replit` file in the root directory to configure Replit:

```toml
run = "npm run dev"
entrypoint = "src/main.tsx"
language = "nodejs"

[nix]
channel = "stable-22_11"

[deploy]
run = ["sh", "-c", "npm run build && npm run preview"]
```

### Setting Environment Variables (if needed)

If you add environment variables later, set them in Replit:
1. Click the "Secrets" tab (lock icon) in the left sidebar
2. Add key-value pairs
3. Access them in code via `import.meta.env.VITE_YOUR_VAR`

---

## 📁 File Structure Overview

```
chat-ops-slack/
├── src/
│   ├── pages/
│   │   └── SlackPage.tsx          # Main Slack UI component
│   ├── components/                 # Reusable components
│   ├── company.json               # ⭐ Customize this!
│   ├── people.json                # ⭐ Customize this!
│   └── theme.json                 # ⭐ Optional: customize this!
├── assets/                        # Static assets (images, fonts, etc.)
│   ├── faces/                     # Add team member photos here
│   └── ...                        # Other assets
├── public/                        # Public assets (auto-generated)
├── package.json                   # Dependencies and scripts
└── vite.config.ts                # Vite configuration
```

---

## 🎯 Quick Customization Checklist

After forking, customize these files:

- [ ] **`src/company.json`**
  - [ ] Change company name
  - [ ] Update company description
  - [ ] Customize channel types and examples
  - [ ] Add your company's roles
  - [ ] Update topics and communication style

- [ ] **`src/people.json`**
  - [ ] Add your team members
  - [ ] Set `"me": true` for the current user
  - [ ] Add avatar images to `assets/faces/`
  - [ ] Mark communication styles (`emoji-heavy`, `verbose`)

- [ ] **`assets/` directory**
  - [ ] Add your company logo
  - [ ] Add team member photos
  - [ ] Replace default avatars

- [ ] **`src/theme.json`** (Optional)
  - [ ] Change default theme
  - [ ] Create custom color scheme

---

## 🚀 Running After Customization

1. **Save all your changes**
2. **Run the app**:
   ```bash
   npm run dev
   ```
3. **View in Replit preview** - The app will automatically reload when you save changes

---

## 💡 Pro Tips

1. **Asset Paths**: All asset paths should start with `/assets/` (not `./assets/` or `assets/`)

2. **Avatar Images**: 
   - Recommended size: 200x200px or larger
   - Formats: JPG, PNG, SVG
   - Square images work best

3. **Company Logo**: 
   - Add your logo to `assets/` directory
   - Update the path in `company.json`
   - Recommended: PNG with transparent background

4. **Testing Changes**:
   - The app hot-reloads automatically
   - Check the browser console for errors
   - If something breaks, check that JSON files are valid JSON

5. **Performance**:
   - Don't add too many people (keep under 50 for best performance)
   - Large images will slow down loading - optimize them

---

## 🐛 Troubleshooting

### App won't start
```bash
# Replit usually handles everything, but if needed:

# Check Node.js version (needs 18+)
node -v

# If dependencies didn't auto-install:
npm install

# Run predev manually (if assets are missing)
rm -rf public/assets && mkdir -p public && cp -R assets public/assets

# Start dev server
npm run dev
```

### Assets not loading
- Check that `public/assets/` directory exists
- Verify asset paths in JSON files start with `/assets/`
- Run the predev script manually (see above)

### JSON errors
- Validate your JSON files using a JSON validator
- Check for trailing commas
- Ensure all strings are in quotes

### Port issues
- Default port is 5180, but Vite will automatically use another port if it's busy
- Check the console output for the actual port number
- The preview window should open automatically

---

## 📚 Additional Resources

- **Main README**: See `README.md` for full project documentation
- **Quick Start**: See `QUICKSTART.md` for local development guide
- **Vite Docs**: https://vitejs.dev/
- **React Docs**: https://react.dev/

---

## ✅ Success Checklist

Before sharing your customized prototype:

- [ ] Company name updated in `company.json`
- [ ] Team members added to `people.json`
- [ ] Current user marked with `"me": true`
- [ ] Avatars added and paths correct
- [ ] App runs without errors
- [ ] All assets load correctly
- [ ] Theme matches your brand (optional)

---

**Happy customizing! 🎉**

If you run into issues, check the error messages in the Replit console - they usually point to the problem. Most issues are related to:
1. Missing assets (run predev script)
2. Invalid JSON (check syntax)
3. Wrong file paths (use `/assets/` not `./assets/`)

