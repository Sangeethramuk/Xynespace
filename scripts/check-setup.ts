#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Check if custom setup exists, if not, use default Mercedes setup
async function checkSetup() {
  const setupDataPath = path.join(__dirname, '../setup-data.json')
  const hasCustomSetup = fs.existsSync(setupDataPath)
  
  if (!hasCustomSetup) {
    console.log('\n📦 No custom setup found. Using default Mercedes-Benz configuration.\n')
    console.log('💡 To create a custom setup:')
    console.log('   1. Run: npm run setup')
    console.log('   2. Then: npm run generate\n')
  } else {
    console.log('\n✅ Custom setup detected. Using your configuration.\n')
  }
  
  return hasCustomSetup
}

checkSetup().catch(console.error)


