#!/usr/bin/env node
import inquirer from 'inquirer'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

interface SetupAnswers {
  companyName: string
  companyDescription: string
  industry: string
  currentUserName: string
}

// Generate bot name from company name
function generateBotName(companyName: string, botType: string): string {
  const companyInitials = companyName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  
  if (botType === 'hr') {
    return 'Workday Bot'
  } else if (botType === 'ai') {
    return `${companyInitials} AI` || 'AI Assistant'
  } else if (botType === 'ops') {
    return `${companyInitials} Ops Bot` || 'Ops Bot'
  }
  return `${companyInitials} Bot` || 'AI Assistant'
}

// Generate avatar URL for user (random user photo)
function generateUserAvatar(gender: 'male' | 'female'): string {
  const randomId = Math.floor(Math.random() * 100)
  return `https://randomuser.me/api/portraits/${gender}/${randomId}.jpg`
}

// Generate company logo placeholder or URL
function generateCompanyLogo(_companyName: string): string {
  // Use a placeholder service or default logo
  // For now, use a placeholder that can be replaced later
  return '/assets/logo.png'
}

// Generate bot avatar with initials as SVG data URI
function generateBotAvatar(botName: string): string {
  const initials = botName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  const colors = [
    '#1D9BD1', '#2EB886', '#E01E5A', '#ECB22E', '#36C5F0', '#2C2D30'
  ]
  const colorIndex = botName.length % colors.length
  const bgColor = colors[colorIndex]
  
  // Create SVG with initials
  const svg = `<svg width="38" height="38" xmlns="http://www.w3.org/2000/svg">
    <rect width="38" height="38" fill="${bgColor}" rx="8"/>
    <text x="19" y="26" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="white" text-anchor="middle">${initials}</text>
  </svg>`
  
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
}
function parseCompanySize(input: string): string {
  const normalized = input.toLowerCase().trim()
  if (normalized.includes('startup') || normalized.includes('small') || normalized.match(/\b(1|2|3|4|5)\d?\b/)) {
    return 'Startup (1-50)'
  }
  if (normalized.includes('small') || normalized.match(/\b([5-9]\d|1\d{2}|200)\b/)) {
    return 'Small (51-200)'
  }
  if (normalized.includes('medium') || normalized.match(/\b(2\d{2}|3\d{2}|4\d{2}|5\d{2}|6\d{2}|7\d{2}|8\d{2}|9\d{2}|1000)\b/)) {
    return 'Medium (201-1000)'
  }
  if (normalized.includes('large') || normalized.includes('enterprise') || normalized.match(/\b(1\d{3,}|[2-9]\d{3,})\b/)) {
    return 'Large Enterprise (1000+)'
  }
  return 'Medium (201-1000)' // default
}

// Parse natural language for countries
function parseCountries(input: string): string[] {
  const normalized = input.toLowerCase().trim()
  const countryMap: Record<string, string> = {
    'us': 'American', 'usa': 'American', 'united states': 'American', 'america': 'American',
    'germany': 'German', 'german': 'German', 'de': 'German',
    'france': 'French', 'french': 'French', 'fr': 'French',
    'italy': 'Italian', 'italian': 'Italian', 'it': 'Italian',
    'india': 'Indian', 'indian': 'Indian', 'in': 'Indian',
    'uk': 'British', 'britain': 'British', 'british': 'British', 'united kingdom': 'British',
    'spain': 'Spanish', 'spanish': 'Spanish', 'es': 'Spanish',
    'japan': 'Japanese', 'japanese': 'Japanese', 'jp': 'Japanese',
    'china': 'Chinese', 'chinese': 'Chinese', 'cn': 'Chinese',
    'brazil': 'Brazilian', 'brazilian': 'Brazilian', 'br': 'Brazilian'
  }
  
  const countries: string[] = []
  const parts = normalized.split(/[,\s]+/).map(p => p.trim())
  
  for (const part of parts) {
    const match = countryMap[part]
    if (match && !countries.includes(match)) {
      countries.push(match)
    }
  }
  
  // If no matches, default to American
  return countries.length > 0 ? countries : ['American']
}

// Generate people names based on nationalities
function generateNamesByNationality(nationalities: string[]): Array<{name: string, country: string, gender: string}> {
  const nameDatabase: Record<string, {male: string[], female: string[]}> = {
    'German': {
      male: ['Klaus Müller', 'Hans Fischer', 'Thomas Weber', 'Michael Schmidt', 'Andreas Becker'],
      female: ['Anna Becker', 'Julia Klein', 'Emma Schmidt', 'Sarah Müller', 'Lisa Weber']
    },
    'French': {
      male: ['Pierre Martin', 'François Leclerc', 'Jean Dubois', 'Antoine Bernard', 'Louis Moreau'],
      female: ['Sophie Dubois', 'Marie Laurent', 'Camille Bernard', 'Isabelle Martin', 'Élise Moreau']
    },
    'Italian': {
      male: ['Marco Rossi', 'Alessandro Bianchi', 'Giovanni Conti', 'Luca Ferrari', 'Matteo Romano'],
      female: ['Isabella Romano', 'Elena Moretti', 'Giulia Rossi', 'Francesca Bianchi', 'Chiara Conti']
    },
    'Indian': {
      male: ['Arjun Kumar', 'Rohan Sharma', 'Vikram Singh', 'Raj Mehta', 'Amit Patel'],
      female: ['Ananya Reddy', 'Kavya Nair', 'Priya Patel', 'Meera Shah', 'Divya Kumar']
    },
    'American': {
      male: ['Michael Johnson', 'David Chen', 'Robert Taylor', 'James Anderson', 'Daniel Brown'],
      female: ['Sarah Williams', 'Jennifer Brown', 'Lisa Martinez', 'Emma Wilson', 'Jessica Davis']
    },
    'British': {
      male: ['James Wilson', 'Oliver Smith', 'William Brown', 'Henry Taylor', 'George Johnson'],
      female: ['Emma Smith', 'Olivia Brown', 'Sophia Taylor', 'Isabella Wilson', 'Charlotte Johnson']
    },
    'Spanish': {
      male: ['Carlos Rodriguez', 'Miguel Garcia', 'Javier Martinez', 'Diego Lopez', 'Antonio Sanchez'],
      female: ['Maria Garcia', 'Carmen Rodriguez', 'Isabella Martinez', 'Lucia Lopez', 'Elena Sanchez']
    },
    'Japanese': {
      male: ['Hiroshi Tanaka', 'Kenji Yamamoto', 'Takeshi Suzuki', 'Yuki Nakamura', 'Ryo Watanabe'],
      female: ['Yuki Tanaka', 'Sakura Yamamoto', 'Aiko Suzuki', 'Mei Nakamura', 'Hana Watanabe']
    },
    'Chinese': {
      male: ['Wei Chen', 'Ming Li', 'Jun Wang', 'Hao Zhang', 'Lei Liu'],
      female: ['Mei Chen', 'Li Wang', 'Xia Zhang', 'Ying Liu', 'Fang Li']
    },
    'Brazilian': {
      male: ['Gabriel Silva', 'Lucas Santos', 'Rafael Oliveira', 'Felipe Costa', 'Bruno Ferreira'],
      female: ['Isabella Silva', 'Sofia Santos', 'Julia Oliveira', 'Maria Costa', 'Ana Ferreira']
    }
  }
  
  const people: Array<{name: string, country: string, gender: string}> = []
  let nameIndex = 0
  
  // Generate 15 people total, distributed across nationalities
  for (let i = 0; i < 15; i++) {
    const nationality = nationalities[i % nationalities.length]
    const names = nameDatabase[nationality] || nameDatabase['American']
    const gender = i % 2 === 0 ? 'male' : 'female'
    const nameList = gender === 'male' ? names.male : names.female
    const name = nameList[nameIndex % nameList.length]
    
    people.push({
      name,
      country: nationality,
      gender
    })
    
    if (i % nationalities.length === nationalities.length - 1) {
      nameIndex++
    }
  }
  
  return people
}

// Infer bot type from industry and description
function inferBotType(description: string, industry: string): string {
  const descLower = description.toLowerCase()
  const industryLower = industry.toLowerCase()
  
  // HR/People operations
  if (descLower.includes('hr') || descLower.includes('human resources') || 
      descLower.includes('people') || descLower.includes('employee') ||
      descLower.includes('workforce') || descLower.includes('talent')) {
    return 'hr'
  }
  
  // Operations/DevOps
  if (descLower.includes('operations') || descLower.includes('devops') ||
      descLower.includes('infrastructure') || descLower.includes('incident') ||
      descLower.includes('monitoring') || descLower.includes('sre') ||
      industryLower.includes('technology') || industryLower.includes('software')) {
    return 'ops'
  }
  
  // AI Assistant for everything else
  return 'ai'
}

// Enhanced channel inference with industry-specific channels
function inferChannels(description: string, industry: string): {types: string[], examples: string[], industrySpecific: string[]} {
  const descriptionLower = description.toLowerCase()
  const industryLower = industry.toLowerCase()
  
  const channels: string[] = []
  const examples: string[] = []
  const industrySpecific: string[] = []
  
  // Always include general
  channels.push('general')
  examples.push('general', 'announcements', 'random')
  
  // Engineering/Tech channels
  if (descriptionLower.includes('software') || descriptionLower.includes('tech') || 
      descriptionLower.includes('engineering') || descriptionLower.includes('development') ||
      descriptionLower.includes('code') || descriptionLower.includes('programming') ||
      industryLower.includes('technology') || industryLower.includes('software')) {
    channels.push('engineering')
    examples.push('engineering', 'backend', 'frontend', 'devops', 'mobile', 'api', 'code-review')
  }
  
  // Product channels
  if (descriptionLower.includes('product') || descriptionLower.includes('feature') ||
      descriptionLower.includes('design') || descriptionLower.includes('ux') ||
      descriptionLower.includes('user experience')) {
    channels.push('product')
    examples.push('product', 'design', 'ux', 'roadmap', 'features')
  }
  
  // Sales channels
  if (descriptionLower.includes('sales') || descriptionLower.includes('revenue') ||
      descriptionLower.includes('customer') || descriptionLower.includes('client') ||
      industryLower.includes('retail') || descriptionLower.includes('selling') ||
      industryLower.includes('e-commerce')) {
    channels.push('sales')
    examples.push('sales', 'deals', 'revenue', 'customer-success', 'leads')
  }
  
  // Marketing channels
  if (descriptionLower.includes('marketing') || descriptionLower.includes('brand') ||
      descriptionLower.includes('campaign') || descriptionLower.includes('content') ||
      descriptionLower.includes('advertising') || descriptionLower.includes('social media')) {
    channels.push('marketing')
    examples.push('marketing', 'content', 'campaigns', 'brand', 'social-media')
  }
  
  // Support channels
  if (descriptionLower.includes('support') || descriptionLower.includes('help') ||
      descriptionLower.includes('customer service') || descriptionLower.includes('ticket') ||
      descriptionLower.includes('service') || descriptionLower.includes('help desk')) {
    channels.push('support')
    examples.push('support', 'help-desk', 'customer-support', 'tickets')
  }
  
  // Operations/DevOps channels
  if (descriptionLower.includes('operations') || descriptionLower.includes('infrastructure') ||
      descriptionLower.includes('devops') || descriptionLower.includes('incident') ||
      descriptionLower.includes('monitoring') || descriptionLower.includes('deployment') ||
      descriptionLower.includes('sre')) {
    channels.push('operations')
    examples.push('operations', 'incidents', 'on-call', 'infrastructure', 'monitoring', 'alerts')
  }
  
  // Industry-specific channels
  if (industryLower.includes('automotive') || descriptionLower.includes('car') || 
      descriptionLower.includes('vehicle') || descriptionLower.includes('automotive')) {
    industrySpecific.push('autonomous-driving', 'electric-vehicles', 'vehicle-connectivity', 
                         'battery-tech', 'safety-systems', 'engine-development', 'new-launches')
    examples.push('autonomous-driving', 'electric-vehicles', 'vehicle-connectivity', 'battery-tech')
  }
  
  if (industryLower.includes('finance') || industryLower.includes('banking') ||
      descriptionLower.includes('financial') || descriptionLower.includes('bank') ||
      descriptionLower.includes('payment') || descriptionLower.includes('fintech')) {
    industrySpecific.push('trading', 'risk-management', 'compliance', 'payments', 
                         'fraud-detection', 'regulatory', 'investments')
    examples.push('compliance', 'risk', 'trading', 'payments', 'fraud-detection')
  }
  
  if (industryLower.includes('healthcare') || industryLower.includes('medical') ||
      descriptionLower.includes('health') || descriptionLower.includes('medical') ||
      descriptionLower.includes('hospital') || descriptionLower.includes('clinical')) {
    industrySpecific.push('clinical-trials', 'patient-care', 'research', 'compliance', 
                         'telemedicine', 'medical-devices', 'pharmaceuticals')
    examples.push('clinical', 'research', 'patient-care', 'compliance', 'telemedicine')
  }
  
  if (industryLower.includes('retail') || industryLower.includes('e-commerce') ||
      descriptionLower.includes('retail') || descriptionLower.includes('ecommerce') ||
      descriptionLower.includes('shopping') || descriptionLower.includes('store')) {
    industrySpecific.push('inventory', 'supply-chain', 'merchandising', 'store-operations',
                         'customer-experience', 'logistics')
    examples.push('inventory', 'supply-chain', 'merchandising', 'store-operations')
  }
  
  if (industryLower.includes('manufacturing') || descriptionLower.includes('manufacturing') ||
      descriptionLower.includes('production') || descriptionLower.includes('factory')) {
    industrySpecific.push('production', 'quality-control', 'supply-chain', 'machinery',
                         'assembly', 'warehouse')
    examples.push('production', 'quality-control', 'supply-chain', 'machinery')
  }
  
  if (industryLower.includes('education') || descriptionLower.includes('education') ||
      descriptionLower.includes('learning') || descriptionLower.includes('school') ||
      descriptionLower.includes('university')) {
    industrySpecific.push('curriculum', 'student-support', 'research', 'admissions',
                         'faculty', 'online-learning')
    examples.push('curriculum', 'student-support', 'research', 'admissions')
  }
  
  return { types: channels, examples, industrySpecific }
}

async function setupWizard() {
  console.log('\n🚀 Welcome to the Vibe Slack Setup Wizard!\n')
  console.log('This wizard will help you configure your Slack environment.\n')
  console.log('We\'ll ask just 4 simple questions and generate everything else for you.\n')
  console.log('💡 Tip: You can answer naturally! For example:')
  console.log('   - "We build software" for company description')
  console.log('   - "Technology" or "Automotive" for industry\n')
  
  const answers = await inquirer.prompt<SetupAnswers>([
    {
      type: 'input',
      name: 'companyName',
      message: 'What is your company name?',
      default: 'My Company',
      validate: (input) => input.trim().length > 0 || 'Company name is required'
    },
    {
      type: 'input',
      name: 'companyDescription',
      message: 'What does your company do? (Describe your business, products, or services - be natural!):',
      default: 'We build innovative technology solutions.',
      validate: (input) => input.trim().length > 0 || 'Company description is required'
    },
    {
      type: 'input',
      name: 'industry',
      message: 'What industry are you in? (e.g., Technology, Automotive, Finance, Healthcare):',
      default: 'Technology',
      validate: (input) => input.trim().length > 0 || 'Industry is required'
    },
    {
      type: 'input',
      name: 'currentUserName',
      message: 'What is your name (the logged-in user)?',
      default: 'John Doe',
      validate: (input) => input.trim().length > 0 || 'Name is required'
    }
  ])
  
  // Auto-generate values with smart defaults
  const botType = inferBotType(answers.companyDescription, answers.industry)
  const botName = generateBotName(answers.companyName, botType)
  const companyLogo = generateCompanyLogo(answers.companyName)
  const currentUserAvatar = generateUserAvatar('male') // Default to male, could be made smarter
  const botAvatar = generateBotAvatar(botName)
  const defaultTheme = 'dark'
  
  // Infer channels from company description
  const channelInfo = inferChannels(answers.companyDescription, answers.industry)
  
  // Default to diverse international team (smart defaults)
  const defaultCountries = ['American', 'German', 'Indian', 'British', 'French']
  const generatedPeople = generateNamesByNationality(defaultCountries)
  
  // Add inferred data to answers
  const setupData = {
    companyName: answers.companyName,
    companyLogo: companyLogo,
    companyDescription: answers.companyDescription,
    industry: answers.industry,
    companySize: 'Medium (201-1000)', // Smart default
    headquarters: 'San Francisco, CA', // Smart default
    countries: defaultCountries,
    currentUserName: answers.currentUserName,
    currentUserAvatar: currentUserAvatar,
    botName: botName,
    botAvatar: botAvatar,
    botType: botType,
    defaultTheme: defaultTheme,
    inferredChannels: channelInfo.types,
    inferredChannelExamples: channelInfo.examples,
    inferredIndustrySpecificChannels: channelInfo.industrySpecific,
    generatedPeople: generatedPeople
  }
  
  // Save setup data
  const setupDataPath = path.join(__dirname, '../setup-data.json')
  fs.writeFileSync(setupDataPath, JSON.stringify(setupData, null, 2))
  
  console.log('\n✅ Setup data saved successfully!')
  console.log('\n📊 Auto-generated from your answers:')
  console.log(`   • Bot name: ${botName} (${botType === 'hr' ? 'HR Bot' : botType === 'ops' ? 'Operations Bot' : 'AI Assistant'})`)
  console.log(`   • Bot avatar: Initials "${botName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}"`)
  console.log(`   • User avatar: Internet photo`)
  console.log(`   • Company logo: Placeholder`)
  console.log(`   • Theme: Dark`)
  console.log(`   • Channel types: ${channelInfo.types.join(', ')}`)
  if (channelInfo.industrySpecific.length > 0) {
    console.log(`   • Industry-specific channels: ${channelInfo.industrySpecific.slice(0, 5).join(', ')}${channelInfo.industrySpecific.length > 5 ? '...' : ''}`)
  }
  console.log(`   • Generated ${generatedPeople.length} team members with diverse backgrounds`)
  console.log('\n📝 Next steps:')
  console.log('   1. Review the setup data in setup-data.json')
  console.log('   2. Run: npm run generate')
  console.log('   3. This will create your Slack environment based on your answers\n')
}

setupWizard().catch(console.error)
