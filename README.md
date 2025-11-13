# 🚀 Vibe Slack

> A pixel-perfect, fully customizable Slack clone that adapts to your company's industry, team, and communication style.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## ⚡ Quick Start

**One command. That's it.**

```bash
npm run start
```

Choose between:
- **Mercedes-Benz sample** (instant demo)
- **Custom setup** (answer 4 simple questions)

Everything else is automatic.

---

## ✨ Features

### 🎨 Pixel-Perfect UI
- Slack-like interface with three-panel layout
- **4 beautiful themes** (Midnight Express, Obsidian Dreams, Solar Flare, Arctic Breeze)
- Theme-aware components that adapt automatically
- Smooth animations and interactions

### 💬 Rich Messaging
- **Reaction pills** with emoji picker
- **Rich link embeds** (Notion, Figma, Loom, Jira, Confluence) with thumbnails
- **Actionable messages** with interactive buttons
- **Message streaming** for realistic activity
- Online/offline statuses with emoji statuses

### 🤖 AI Assistant (Merc AI)
- **1:1 DM conversations** - Dedicated chat with AI assistant
- **Proactive channel posts** - AI posts insights in channels (15% chance)
- **Proactive group DM posts** - AI shares insights in group conversations (10% chance)
- **@mention responses** - Responds contextually when mentioned in channels and group DMs
- **Channel-specific insights** - Provides relevant analysis based on channel context
- **Industry-aware** - Adapts responses to your company's industry and topics

### ⚙️ Intelligent Setup Wizard
- **4 simple questions** - we infer everything else
- **Industry-aware** - automatically creates contextual channels, topics, and roles
- **Auto-generates** 15 team members, bot names, avatars, and more
- **Natural language input** - answer questions conversationally

### 🎯 Industry-Specific Intelligence
The wizard intelligently infers:
- **Channel names** based on your industry (automotive, finance, healthcare, etc.)
- **Chat topics** relevant to your business
- **Bot type** (HR Bot, Operations Bot, or AI Assistant)
- **Team roles** matching your industry
- **Conversation context** for realistic chat history

---

## 🚀 Getting Started

### Single Command Setup

```bash
npm run start
```

**What happens:**
1. ✅ Installs dependencies (if needed)
2. ✅ **Asks you to choose:**
   - 🚗 Use default Mercedes-Benz sample (instant launch)
   - ⚙️ Create custom setup (answer 4 simple questions)
3. ✅ Generates configuration automatically
4. ✅ Launches Slack at `http://localhost:5173`

**Already have a custom setup?** It uses your existing configuration automatically.

### Manual Setup (Alternative)

```bash
npm install
npm run setup    # Answer 4 simple questions
npm run generate # Generate your custom Slack
npm run dev      # Launch
```

---

## 📋 Setup Wizard

The wizard asks just **4 simple questions**:

1. **Company name** - e.g., "Acme Corp"
2. **What your company does** - e.g., "We build cloud infrastructure"
3. **Industry** - e.g., "Technology", "Automotive", "Finance"
4. **Your name** - e.g., "John Doe"

**That's it!** Everything else is automatically inferred and generated.

### What Gets Auto-Generated ✨

- ✅ **15 team members** with culturally appropriate names and photos
- ✅ **Channel names** contextual to your industry
- ✅ **Bot name & avatar** (HR Bot, Operations Bot, or AI Assistant)
- ✅ **Company logo** placeholder
- ✅ **Your avatar** from internet photos
- ✅ **Topics & roles** matching your industry
- ✅ **Chat history** with industry-specific conversations

---

## 🎨 Customization

After generation, you can customize:

### Add Your Company Logo
1. Place your logo in `/assets` folder (e.g., `my-company-logo.png`)
2. Update `src/company.json`:
   ```json
   {
     "logo": "/assets/my-company-logo.png"
   }
   ```

### Add Custom Bot Avatar
1. Place bot logo in `/assets` folder (e.g., `my-bot-avatar.png`)
2. Update `src/people.json` for your bot:
   ```json
   {
     "name": "My Bot",
     "avatar": "/assets/my-bot-avatar.png"
   }
   ```

3. Regenerate: `npm run generate` (or manually edit JSON files)

---

## 🎮 Usage

### Navigation
- Click any chat in the sidebar to view messages
- Type and press Enter to send messages
- Hover over messages to add reactions
- Click action buttons in bot messages to approve requests

### AI Assistant (Merc AI)
- **1:1 DM**: Open Merc AI in DMs for direct conversations
- **Channel participation**: Merc AI posts proactively with insights and analysis
- **@mentions**: Mention `@Merc AI` in any channel or group DM for contextual responses
- **Group DMs**: Merc AI participates in group conversations with relevant insights

### Keyboard Shortcuts (Juspay AI DM)
- Press **`P`** - Trigger a leave approval request
- Press **`Q`** - Trigger a tool access approval request

### Themes
- Click the theme dropdown in the top-right to switch themes
- All components automatically adapt to the selected theme

---

## 🛠️ Tech Stack

- **React 19** with TypeScript
- **Vite** for fast development
- **React Router v7** for navigation
- **Inquirer** for interactive CLI wizard
- **Custom CSS** with theme system

---

## 📁 Project Structure

```
slack-kit/
├── src/
│   ├── pages/
│   │   └── SlackPage.tsx          # Main Slack interface
│   ├── components/
│   │   ├── Layout.tsx              # App layout
│   │   ├── LinkEmbed.tsx          # Rich link embeds
│   │   ├── FileEmbed.tsx           # File previews
│   │   ├── PriorityLozenge.tsx    # Priority badges
│   │   └── CloseIncidentModal.tsx # Modals
│   ├── utils/
│   │   └── embedDetector.ts       # Link detection & parsing
│   ├── people.json                # Team members (auto-generated)
│   ├── company.json               # Company config (auto-generated)
│   └── theme.json                 # Theme config
├── scripts/
│   ├── setup.ts                   # Interactive setup wizard
│   ├── generate.ts                # Generate config files
│   ├── init.ts                    # One-command setup
│   └── check-setup.ts             # Check for custom setup
├── assets/                        # Static assets (logos, icons, fonts)
└── package.json
```

---

## 🎯 Industry Examples

### Automotive (Mercedes-Benz Sample)
- Channels: `#autonomous-driving`, `#mbux-development`, `#battery-tech`, `#eqe-launch`
- Topics: Electric vehicle development, autonomous driving, vehicle connectivity, MBUX systems
- Bots: 
  - **Merc AI** - AI Assistant for technical queries, data analysis, and insights
  - **Juspay AI** - HR bot for leave approvals and tool access requests
- Merc AI posts proactively with MBUX performance metrics, autonomous driving analysis, battery tech insights

### Finance
- Channels: `#risk-management`, `#compliance`, `#trading`, `#payments`
- Topics: Risk management, regulatory compliance, trading operations
- Bot: **AI Assistant** for monitoring, alerts, and financial analysis
- AI posts proactively with risk metrics, compliance insights, trading analysis

### Healthcare
- Channels: `#clinical-trials`, `#patient-care`, `#telemedicine`
- Topics: Patient care, clinical trials, medical research
- Bot: **AI Assistant** for medical queries, clinical data analysis, and research insights
- AI posts proactively with clinical trial metrics, patient care insights, telemedicine analysis

### Retail/E-commerce
- Channels: `#inventory`, `#supply-chain`, `#customer-experience`
- Topics: Inventory management, supply chain optimization
- Bot: **Operations Bot** for logistics, inventory analysis, and supply chain insights
- AI posts proactively with inventory metrics, supply chain analysis, customer experience data

---

## 🔧 Development

### Available Scripts

```bash
npm run start      # One-command setup (recommended)
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Run ESLint
npm run setup      # Run setup wizard
npm run generate   # Generate config files
```

### Development Workflow

1. **First time:**
   ```bash
   npm run start  # Handles everything automatically
   ```

2. **Subsequent runs:**
   ```bash
   npm run dev  # Uses existing setup
   ```

3. **Regenerate config:**
   ```bash
   npm run generate  # Regenerate from setup-data.json
   ```

---

## 📝 Configuration Files

### `setup-data.json` (Generated by wizard)
Contains your answers and inferred data. Created when you run `npm run setup`.

### `src/company.json` (Auto-generated)
Company configuration with channels, roles, topics.

### `src/people.json` (Auto-generated)
Team members with names, avatars, and metadata.

### `src/theme.json` (Auto-generated)
Theme configuration with default theme.

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
lsof -ti:5173 | xargs kill -9
```

### Build Errors
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Setup Not Working
```bash
# Check if setup-data.json exists
ls setup-data.json

# If not, run setup wizard
npm run setup
npm run generate
```

---

## 🚀 Future Enhancements

- [ ] Thread support
- [ ] File uploads
- [ ] Search functionality
- [ ] Real-time synchronization
- [ ] Voice/video calls
- [ ] Screen sharing

---

## 📄 License

MIT License

---

## 🙏 Acknowledgments

- **Slack** for design inspiration
- **React** and **TypeScript** communities
- Built with ❤️ for teams who want customizable communication tools

---

<div align="center">

**Ready to create your custom Slack environment?**

```bash
npm run start
```

</div>

