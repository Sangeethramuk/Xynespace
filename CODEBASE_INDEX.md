# Codebase Index - Slack Kit

## Project Overview
A pixel-perfect, fully customizable Slack clone built with React 19, TypeScript, and Vite. The application adapts to your company's industry, team, and communication style with intelligent setup wizards and auto-generated configurations.

## Tech Stack
- **React 19** with TypeScript
- **Vite 7** for build tooling
- **React Router v7** for navigation
- **Framer Motion** for animations
- **ECharts** for data visualization
- **Chart.js** for charts
- **Zustand** for state management
- **Inquirer** for CLI wizard
- **@xyflow/react** for flow diagrams
- **@atlaskit/pragmatic-drag-and-drop** for drag and drop

## Project Structure

### `/src` - Main Source Code

#### Entry Points
- **`main.tsx`** - Application entry point, sets up React Router and renders App
- **`App.tsx`** - Root component with routing configuration
  - Routes: `/` → `/slack`, `/slack` → SlackPage

#### Pages
- **`pages/SlackPage.tsx`** (5000+ lines) - Main Slack interface component
  - Three-panel layout (channels sidebar, chat area, optional right panel)
  - Message rendering with reactions, embeds, actions
  - Theme support (4 themes: Midnight Express, Obsidian Dreams, Solar Flare, Arctic Breeze)
  - Online/offline status tracking
  - Unread message counts
  - Message composition with auto-resize textarea
  - Emoji picker for reactions
  - Rich link embeds (Notion, Figma, Jira, Confluence, Loom)
  - File embeds
  - Actionable messages with buttons
  - Message streaming simulation
  - AI assistant integration (Merc AI)
  - Industry-aware message generation
  - Person-specific message enhancement (emoji-heavy, verbose traits)

#### Components (`/src/components`)

1. **`Layout.tsx`** (900+ lines) - Main application layout
   - Left navigation sidebar with collapsible state
   - Resizable navigation width
   - Navigation sections: For You, Chat, Search, Monitor, Manage, Spaces
   - Juspay AI chat integration
   - OpenAI API integration for streaming responses
   - Investigation stepper workflow
   - Graph pinning functionality
   - Internal navigation bridge for iframes
   - Mini chart component using ECharts
   - Dynatrace integration simulation

2. **`LinkEmbed.tsx`** - Rich link embed component
   - Supports: Notion, Figma, Jira, Confluence, Loom
   - Displays app logo, title, thumbnail, owner
   - Action buttons (Open now, Check later)
   - Theme-aware styling

3. **`FileEmbed.tsx`** - File attachment component
   - Supports multiple file types (PDF, image, document, spreadsheet, etc.)
   - File type icons and colors
   - Open/Download actions
   - Thumbnail support

4. **`PriorityLozenge.tsx`** - Priority badge component
   - P0, P1, P2, P3 priority levels
   - Color-coded badges

5. **`CloseIncidentModal.tsx`** - Modal for closing incidents
   - Animated status cycler
   - Juspay AI verification display
   - Accessibility features (ARIA, keyboard navigation)

#### Utils (`/src/utils`)

- **`embedDetector.ts`** (600+ lines) - Link detection and parsing
  - Detects embed links in message text
  - Industry-aware title generation
  - Supports: Notion, Figma, Jira, Confluence, Loom
  - Deterministic owner assignment from people.json
  - URL-based seed generation for consistent results
  - Industry-specific title pools (Automotive, Finance, Healthcare, Retail, etc.)

#### Types (`/src/types`)

- **`react-beautiful-dnd.d.ts`** - TypeScript declarations for react-beautiful-dnd
- **`react-loading-skeleton.d.ts`** - TypeScript declarations for react-loading-skeleton

#### Configuration Files

- **`company.json`** - Company configuration
  - Name, logo, description, industry
  - Channel types and examples
  - Industry-specific channels
  - Roles and topics

- **`people.json`** - Team members data
  - Name, avatar, gender, country
  - Special flags: `me`, `emoji-heavy`, `verbose`

- **`theme.json`** - Theme configuration
  - 4 themes: midnight-express, obsidian-dreams, solar-flare, arctic-breeze
  - Color schemes for dark/light modes
  - Default theme setting

### `/scripts` - Setup and Generation Scripts

1. **`init.ts`** - One-command setup script
   - Checks dependencies
   - Prompts for default Mercedes setup or custom setup
   - Runs setup wizard if needed
   - Generates configuration
   - Starts dev server

2. **`setup.ts`** - Interactive setup wizard
   - Asks 4 questions: company name, description, industry, user name
   - Auto-generates: bot name, avatar, channels, people, themes
   - Industry-aware inference
   - Saves to `setup-data.json`

3. **`generate.ts`** (400+ lines) - Configuration generator
   - Reads `setup-data.json` or uses default Mercedes setup
   - Generates `company.json`, `people.json`, `theme.json`
   - Industry-specific channel and role generation
   - People generation with culturally appropriate names
   - Bot avatar generation (SVG with initials)

4. **`check-setup.ts`** - Setup validation
   - Checks if custom setup exists
   - Falls back to default Mercedes setup

### Configuration Files (Root)

- **`package.json`** - Dependencies and scripts
  - Scripts: `dev`, `build`, `preview`, `setup`, `generate`, `start`, `init`
  - Pre-hooks: `predev`, `prebuild` (copy assets to public)

- **`vite.config.ts`** - Vite configuration
  - React plugin
  - Server on port 3000
  - Preview on port 5190
  - Public directory: `public`

- **`tsconfig.app.json`** - TypeScript configuration
  - ES2022 target
  - React JSX
  - Strict mode enabled

- **`eslint.config.js`** - ESLint configuration
  - TypeScript ESLint
  - React hooks rules
  - React refresh plugin

### `/assets` - Static Assets

- SVG icons (navigation, UI elements)
- Fonts (Atlassian Sans, Atlassian Mono, Lato)
- Images (logos, avatars, thumbnails)
- Presentation mode assets (audio, video)

### `/public` - Public Assets (Generated)

- Assets copied from `/assets` during build
- Served by Vite

## Key Features

### 1. Intelligent Setup System
- 4-question wizard
- Industry-aware channel and topic inference
- Auto-generated team members with culturally appropriate names
- Bot type inference (HR, Operations, AI Assistant)

### 2. Theme System
- 4 built-in themes (2 dark, 2 light)
- Theme-aware components
- CSS custom properties for theming

### 3. Rich Messaging
- Link embeds (Notion, Figma, Jira, Confluence, Loom)
- File embeds
- Message reactions with emoji picker
- Actionable messages with buttons
- Message streaming simulation
- Rich HTML formatting

### 4. AI Assistant (Merc AI)
- 1:1 DM conversations
- Proactive channel posts (15% chance)
- Proactive group DM posts (10% chance)
- @mention responses
- Industry-aware responses
- OpenAI API integration (optional)

### 5. Juspay AI
- HR-related tasks
- Leave approvals
- Tool access requests
- Investigation workflow
- Status updates
- OpenAI streaming responses

### 6. Industry Awareness
- Automotive: MBUX, autonomous driving, EV, battery tech
- Finance: Trading, risk management, compliance
- Healthcare: Clinical trials, patient care, telemedicine
- Retail: Inventory, supply chain, customer experience
- Technology: Engineering, product, operations

## Data Flow

1. **Setup Flow**: `npm run start` → `init.ts` → `setup.ts` → `generate.ts` → `company.json`, `people.json`, `theme.json`
2. **Runtime Flow**: `main.tsx` → `App.tsx` → `Layout.tsx` → `SlackPage.tsx`
3. **Message Flow**: User input → `SlackPage` → Message generation → Display with embeds/reactions
4. **Theme Flow**: Theme selection → `theme.json` → CSS custom properties → Component styling

## State Management

- React `useState` for local component state
- `localStorage` for persistent settings (nav collapsed state)
- Zustand (available but not heavily used)
- Props drilling for shared state

## Styling Approach

- Inline styles (React style objects)
- CSS custom properties (CSS variables)
- Theme-based color system
- Font loading via `@font-face`
- No CSS-in-JS library

## Build Process

1. **Pre-build**: Copy assets from `/assets` to `/public/assets`
2. **Build**: TypeScript compilation + Vite build
3. **Output**: `/dist` directory with optimized assets

## Development Workflow

1. **First time**: `npm run start` (runs init, setup, generate, dev)
2. **Subsequent**: `npm run dev` (uses existing config)
3. **Regenerate**: `npm run generate` (regenerates from setup-data.json)

## Key Algorithms

### Message Enhancement
- Person traits (`emoji-heavy`, `verbose`) affect message generation
- Industry context influences message content
- Deterministic randomization based on URL hashes

### Embed Detection
- Line-by-line parsing (one embed per line)
- Regex-based URL detection
- Industry-aware title generation
- Deterministic owner assignment

### Reaction Generation
- Low base probability (10-20%)
- Keyword-based detection
- Context-appropriate emojis
- Realistic reaction counts (1-4)

## Dependencies

### Production
- React 19.1.1
- React DOM 19.1.1
- React Router DOM 7.8.2
- Framer Motion 12.23.12
- ECharts 6.0.0
- Chart.js 4.4.5
- Zustand 5.0.8
- @xyflow/react 12.8.5
- @atlaskit/pragmatic-drag-and-drop 1.7.7

### Development
- TypeScript 5.8.3
- Vite 7.1.2
- ESLint 9.33.0
- tsx 4.20.6
- Inquirer 12.11.0

## File Sizes

- `SlackPage.tsx`: ~5000+ lines (main UI component)
- `Layout.tsx`: ~900 lines (navigation and layout)
- `embedDetector.ts`: ~600 lines (link detection logic)
- `generate.ts`: ~400 lines (config generation)
- `setup.ts`: ~400 lines (setup wizard)

## Notable Patterns

1. **Deterministic Randomization**: URL hashes used for consistent results
2. **Industry Awareness**: Context-aware content generation
3. **Person Traits**: Individual characteristics affect message style
4. **Progressive Enhancement**: Graceful fallbacks for missing features
5. **Event-Driven**: Custom events for cross-component communication

## Future Enhancements (from README)

- Thread support
- File uploads
- Search functionality
- Real-time synchronization
- Voice/video calls
- Screen sharing

