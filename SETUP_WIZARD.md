# Setup Wizard Guide

This Slack Kit includes an intelligent setup wizard that asks just a few high-level questions and automatically generates everything else for you.

## Quick Start

1. **Run the setup wizard:**
   ```bash
   npm run setup
   ```

2. **Answer the simple questions** - The wizard will ask you about:
   - Company information (name, logo, what you do, industry, size, headquarters)
   - **Which countries** your company is present in (we'll generate 15 team members automatically!)
   - Your name (the logged-in user)
   - Bot configuration
   - Theme preferences

3. **Generate your Slack environment:**
   ```bash
   npm run generate
   ```

4. **Start the app:**
   ```bash
   npm run dev
   ```

## What Gets Generated Automatically

The wizard intelligently infers and generates:

- **Channel types and names** - Based on what your company does (e.g., if you mention "software", we add engineering channels)
- **15 team members** - Automatically generated with culturally appropriate names based on the countries you select
- **Company topics** - Extracted from your company description
- **Channel examples** - Relevant channel names based on your industry

## Example

If you say:
- "We build software for automotive companies"
- Countries: Germany, France, India

We'll automatically:
- Create engineering channels (#engineering, #backend, #frontend)
- Create automotive-specific channels (#autonomous-driving, #vehicle-connectivity)
- Generate 15 people with German, French, and Indian names
- Set up relevant topics and communication styles

## What Gets Generated

The `generate` script creates/updates:
- `src/company.json` - Company information, channels, roles, topics
- `src/people.json` - 15+ team members, bot, and current user
- `src/theme.json` - Theme configuration

## Setup Data

Your answers are saved to `setup-data.json` in the project root. You can:
- Review and edit this file manually if needed
- Re-run `npm run generate` to regenerate files after editing
- Delete it and run `npm run setup` again to start fresh

## Customization

After running `npm run generate`, you can manually edit the generated JSON files to fine-tune your Slack environment. The setup wizard provides a smart starting point, but you have full control over the final configuration.
