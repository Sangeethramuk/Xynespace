#!/usr/bin/env node
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import inquirer from 'inquirer'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const rootDir = path.join(__dirname, '..')

function runCommand(command: string, description: string) {
  console.log(`\n🔄 ${description}...`)
  try {
    execSync(command, { 
      cwd: rootDir, 
      stdio: 'inherit'
    })
    console.log(`✅ ${description} completed`)
  } catch (error) {
    console.error(`❌ Error during ${description}:`, error)
    process.exit(1)
  }
}

function checkNodeModules() {
  const nodeModulesPath = path.join(rootDir, 'node_modules')
  return fs.existsSync(nodeModulesPath)
}

function checkSetupData() {
  const setupDataPath = path.join(rootDir, 'setup-data.json')
  return fs.existsSync(setupDataPath)
}

async function main() {
  console.log('\n🚀 Vibe Slack - One-Command Setup\n')

  // Step 1: Check and install dependencies
  if (!checkNodeModules()) {
    console.log('📦 Installing dependencies...\n')
    runCommand('npm install', 'Installing dependencies')
  } else {
    console.log('✅ Dependencies already installed\n')
  }

  // Step 2: Check for custom setup and ask user preference
  const hasCustomSetup = checkSetupData()
  
  if (!hasCustomSetup) {
    // Ask user if they want default Mercedes setup or custom setup
    const { setupChoice } = await inquirer.prompt([
      {
        type: 'list',
        name: 'setupChoice',
        message: 'What would you like to do?',
        choices: [
          {
            name: '🚗 Use default Mercedes-Benz sample (instant launch)',
            value: 'default'
          },
          {
            name: '⚙️  Create custom setup (answer a few simple questions)',
            value: 'custom'
          }
        ],
        default: 'default'
      }
    ])

    if (setupChoice === 'custom') {
      console.log('\n📝 Running setup wizard...\n')
      runCommand('npm run setup', 'Running setup wizard')
    } else {
      console.log('\n🚗 Using default Mercedes-Benz sample setup...\n')
      console.log('   (Run "npm run setup" anytime to create a custom setup)\n')
    }
  } else {
    console.log('✅ Custom setup found. Using your configuration.\n')
    console.log('   (Run "npm run setup" to reconfigure)\n')
  }

  // Step 3: Generate configuration
  console.log('🔄 Generating Slack environment...\n')
  runCommand('npm run generate', 'Generating configuration')

  // Step 4: Show customization tips
  console.log('\n🎨 Customization Tips:')
  console.log('   • Add your company logo: Place it in /assets folder and update')
  console.log('     "logo" field in src/company.json to point to it')
  console.log('   • Add custom bot avatar: Place bot logo in /assets folder and')
  console.log('     update "avatar" field in src/people.json for your bot')
  console.log('   • Example: /assets/my-company-logo.png')
  console.log('   • Example: /assets/my-bot-avatar.png')
  console.log('\n💡 Tip: After adding logos, run "npm run generate" again to')
  console.log('   regenerate with your custom assets, or manually edit the JSON files.\n')

  // Step 5: Start dev server
  console.log('🚀 Starting Slack...\n')
  console.log('💡 Your Slack will open at http://localhost:5180\n')
  
  runCommand('npm run dev', 'Starting development server')
}

main().catch(console.error)

