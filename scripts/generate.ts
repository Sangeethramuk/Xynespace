#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

interface SetupData {
  companyName: string
  companyLogo: string
  companyDescription: string
  industry: string
  companySize: string
  headquarters: string
  countries: string[]
  currentUserName: string
  currentUserAvatar: string
  botName: string
  botAvatar: string
  botType: string
  defaultTheme: string
  inferredChannels: string[]
  inferredChannelExamples: string[]
  inferredIndustrySpecificChannels?: string[]
  generatedPeople: Array<{
    name: string
    country: string
    gender: string
  }>
}

function generateCompanyJson(setupData: SetupData) {
  const channelTypeMap: Record<string, any> = {
    engineering: {
      type: 'engineering',
      description: 'Technical discussions, code reviews, and engineering best practices',
      examples: ['#engineering', '#backend', '#frontend', '#api', '#mobile', '#devops']
    },
    product: {
      type: 'product',
      description: 'Product planning, feature discussions, and roadmap updates',
      examples: ['#product', '#design', '#ux-research', '#roadmap', '#features']
    },
    operations: {
      type: 'operations',
      description: 'Incident management, infrastructure updates, and operational excellence',
      examples: ['#incidents', '#on-call', '#infrastructure', '#monitoring', '#alerts']
    },
    sales: {
      type: 'sales',
      description: 'Sales updates, customer discussions, and revenue tracking',
      examples: ['#sales', '#deals', '#customer-success', '#revenue']
    },
    marketing: {
      type: 'marketing',
      description: 'Marketing campaigns, content planning, and brand discussions',
      examples: ['#marketing', '#content', '#campaigns', '#brand']
    },
    support: {
      type: 'support',
      description: 'Customer support, ticket management, and help desk',
      examples: ['#support', '#help-desk', '#customer-support', '#tickets']
    },
    general: {
      type: 'cross-functional',
      description: 'Company-wide announcements and cross-team collaboration',
      examples: ['#general', '#announcements', '#all-hands', '#random']
    }
  }
  
  // Use inferred channels, fallback to defaults if not present
  const channelTypes = (setupData.inferredChannels || ['general', 'engineering']).map(type => {
    if (channelTypeMap[type]) {
      const channelType = { ...channelTypeMap[type] }
      // Add industry-specific examples if available
      if (setupData.inferredIndustrySpecificChannels && setupData.inferredIndustrySpecificChannels.length > 0) {
        channelType.examples = [
          ...channelType.examples,
          ...setupData.inferredIndustrySpecificChannels.filter(ex => 
            !channelType.examples.includes(ex) && ex.includes(type.toLowerCase().slice(0, 3))
          ).slice(0, 3)
        ]
      }
      return channelType
    }
    return {
      type,
      description: `${type} related discussions`,
      examples: setupData.inferredChannelExamples?.filter(ex => ex.includes(type)) || [`#${type}`]
    }
  })
  
  // Add industry-specific channels as separate channel types if they exist
  if (setupData.inferredIndustrySpecificChannels && setupData.inferredIndustrySpecificChannels.length > 0) {
    const industryChannels = setupData.inferredIndustrySpecificChannels.slice(0, 5).map(channel => ({
      type: 'industry-specific',
      description: `${setupData.industry} specific discussions`,
      examples: [channel]
    }))
    channelTypes.push(...industryChannels)
  }
  
  // Enhanced topic extraction based on industry
  const descriptionLower = setupData.companyDescription.toLowerCase()
  const industryLower = setupData.industry.toLowerCase()
  const topics: string[] = []
  
  // Industry-specific topics
  if (industryLower.includes('automotive') || descriptionLower.includes('car') || descriptionLower.includes('vehicle')) {
    topics.push('Electric vehicle development', 'Autonomous driving technology', 'Vehicle connectivity', 
                'Battery technology', 'Safety systems', 'New vehicle launches', 'Dealer network management')
  } else if (industryLower.includes('finance') || industryLower.includes('banking') || descriptionLower.includes('financial')) {
    topics.push('Risk management', 'Regulatory compliance', 'Trading operations', 'Payment processing',
                'Fraud detection', 'Investment strategies', 'Customer financial services')
  } else if (industryLower.includes('healthcare') || industryLower.includes('medical') || descriptionLower.includes('health')) {
    topics.push('Patient care', 'Clinical trials', 'Medical research', 'Healthcare compliance',
                'Telemedicine', 'Medical device development', 'Pharmaceutical research')
  } else if (industryLower.includes('retail') || industryLower.includes('e-commerce') || descriptionLower.includes('retail')) {
    topics.push('Inventory management', 'Supply chain optimization', 'Customer experience',
                'Store operations', 'E-commerce platform', 'Merchandising strategies')
  } else if (industryLower.includes('manufacturing') || descriptionLower.includes('production')) {
    topics.push('Production optimization', 'Quality control', 'Supply chain management',
                'Machinery maintenance', 'Assembly line efficiency', 'Warehouse operations')
  } else if (industryLower.includes('education') || descriptionLower.includes('learning')) {
    topics.push('Curriculum development', 'Student support', 'Educational research',
                'Online learning platforms', 'Faculty collaboration', 'Admissions management')
  }
  
  // General topics from description
  if (descriptionLower.includes('software') || descriptionLower.includes('tech')) {
    topics.push('Software development and engineering', 'System architecture', 'Code quality')
  }
  if (descriptionLower.includes('product') || descriptionLower.includes('feature')) {
    topics.push('Product planning and feature development', 'User experience design')
  }
  if (descriptionLower.includes('customer') || descriptionLower.includes('client')) {
    topics.push('Customer success and support', 'Client relationships')
  }
  if (descriptionLower.includes('sales') || descriptionLower.includes('revenue')) {
    topics.push('Sales strategies', 'Revenue growth', 'Lead generation')
  }
  if (descriptionLower.includes('marketing') || descriptionLower.includes('brand')) {
    topics.push('Marketing campaigns', 'Brand awareness', 'Content strategy')
  }
  if (descriptionLower.includes('team') || descriptionLower.includes('collaboration')) {
    topics.push('Team collaboration', 'Cross-functional projects')
  }
  
  // Add default topics if none inferred
  if (topics.length === 0) {
    topics.push('Team collaboration', 'Project updates', 'Company announcements')
  }
  
  // Use inferred channel examples, including industry-specific ones
  const allChannelExamples = [
    ...(setupData.inferredChannelExamples || []),
    ...(setupData.inferredIndustrySpecificChannels || [])
  ]
  
  // Industry-specific roles
  const roles: any[] = []
  
  if (industryLower.includes('automotive') || descriptionLower.includes('vehicle') || descriptionLower.includes('car')) {
    roles.push(
      {
        title: 'Automotive Software Engineer',
        responsibilities: ['Develop vehicle software', 'Work on autonomous driving systems', 'Integrate vehicle connectivity'],
        commonChannels: allChannelExamples.filter(c => c.includes('autonomous') || c.includes('vehicle') || c.includes('battery')).slice(0, 3)
      },
      {
        title: 'Vehicle Systems Engineer',
        responsibilities: ['Design safety systems', 'Test vehicle components', 'Optimize performance'],
        commonChannels: allChannelExamples.filter(c => c.includes('safety') || c.includes('engine') || c.includes('testing')).slice(0, 3)
      }
    )
  } else if (industryLower.includes('finance') || descriptionLower.includes('financial') || descriptionLower.includes('bank')) {
    roles.push(
      {
        title: 'Financial Analyst',
        responsibilities: ['Analyze market trends', 'Risk assessment', 'Regulatory compliance'],
        commonChannels: allChannelExamples.filter(c => c.includes('risk') || c.includes('compliance') || c.includes('trading')).slice(0, 3)
      },
      {
        title: 'Payment Systems Engineer',
        responsibilities: ['Develop payment platforms', 'Ensure security', 'Monitor transactions'],
        commonChannels: allChannelExamples.filter(c => c.includes('payment') || c.includes('fraud') || c.includes('compliance')).slice(0, 3)
      }
    )
  } else if (industryLower.includes('healthcare') || descriptionLower.includes('medical') || descriptionLower.includes('health')) {
    roles.push(
      {
        title: 'Clinical Research Specialist',
        responsibilities: ['Manage clinical trials', 'Analyze medical data', 'Ensure compliance'],
        commonChannels: allChannelExamples.filter(c => c.includes('clinical') || c.includes('research') || c.includes('compliance')).slice(0, 3)
      },
      {
        title: 'Healthcare Technology Engineer',
        responsibilities: ['Develop medical software', 'Build telemedicine platforms', 'Ensure HIPAA compliance'],
        commonChannels: allChannelExamples.filter(c => c.includes('telemedicine') || c.includes('medical-device') || c.includes('compliance')).slice(0, 3)
      }
    )
  } else if (industryLower.includes('retail') || descriptionLower.includes('e-commerce')) {
    roles.push(
      {
        title: 'E-commerce Engineer',
        responsibilities: ['Develop online platforms', 'Optimize user experience', 'Manage inventory systems'],
        commonChannels: allChannelExamples.filter(c => c.includes('inventory') || c.includes('customer-experience') || c.includes('e-commerce')).slice(0, 3)
      },
      {
        title: 'Supply Chain Manager',
        responsibilities: ['Manage logistics', 'Optimize inventory', 'Coordinate suppliers'],
        commonChannels: allChannelExamples.filter(c => c.includes('supply-chain') || c.includes('logistics') || c.includes('inventory')).slice(0, 3)
      }
    )
  }
  
  // Add general roles if tech/software is mentioned
  if (descriptionLower.includes('software') || descriptionLower.includes('tech') || descriptionLower.includes('engineering')) {
    roles.push({
      title: 'Software Engineer',
      responsibilities: ['Write and review code', 'Design system architecture', 'Participate in technical discussions'],
      commonChannels: allChannelExamples.filter(c => c.includes('engineering') || c.includes('backend') || c.includes('frontend') || c.includes('api')).slice(0, 3)
    })
  }
  
  if (descriptionLower.includes('product') || descriptionLower.includes('feature')) {
    roles.push({
      title: 'Product Manager',
      responsibilities: ['Define product roadmap', 'Gather user requirements', 'Coordinate cross-functional teams'],
      commonChannels: allChannelExamples.filter(c => c.includes('product') || c.includes('roadmap') || c.includes('design')).slice(0, 3)
    })
  }
  
  // Default roles if none added
  if (roles.length === 0) {
    roles.push({
      title: 'Team Member',
      responsibilities: ['Collaborate on projects', 'Participate in team discussions'],
      commonChannels: ['#general']
    })
  }
  
  const companyJson = {
    name: setupData.companyName,
    logo: setupData.companyLogo || '/assets/logo.png', // Use placeholder if not provided
    description: setupData.companyDescription,
    industry: setupData.industry,
    companySize: setupData.companySize,
    headquarters: setupData.headquarters,
    channels: {
      types: channelTypes,
      namingConventions: {
        engineering: 'Lowercase with hyphens (e.g., #backend-api, #frontend-ui)',
        product: 'Lowercase with hyphens (e.g., #product-features, #user-experience)',
        operations: 'Lowercase with hyphens (e.g., #incidents, #on-call-rotation)',
        general: 'Lowercase with hyphens (e.g., #general, #announcements)'
      }
    },
    roles: roles,
    topics: topics,
    communicationStyle: {
      tone: 'Professional yet collaborative',
      formality: 'Casual to semi-formal depending on context',
      commonPatterns: [
        'Quick status updates',
        'Technical discussions',
        'Feature announcements',
        'Team celebrations'
      ]
    },
    nationalities: setupData.countries || ['American']
  }
  
  return companyJson
}

function generatePeopleJson(setupData: SetupData) {
  const people = []
  
  // Add bot with generated avatar (initials in square or custom avatar)
  people.push({
    name: setupData.botName,
    avatar: setupData.botAvatar, // SVG data URI with initials or custom path
    gender: 'neutral'
  })
  
  // Add current user with internet photo
  people.push({
    name: setupData.currentUserName,
    avatar: setupData.currentUserAvatar, // Internet photo URL
    gender: 'male',
    me: true
  })
  
  // Add generated team members with internet photos based on gender
  setupData.generatedPeople.forEach((person, idx) => {
    const genderForPhoto = person.gender === 'male' ? 'men' : 'women'
    const photoId = (idx % 100) + 1 // Use index to get different photos
    people.push({
      name: person.name,
      avatar: `https://randomuser.me/api/portraits/${genderForPhoto}/${photoId}.jpg`,
      gender: person.gender,
      country: person.country
    })
  })
  
  return people
}

function generateThemeJson(setupData: SetupData) {
  // Read existing theme.json and update defaultTheme
  const themePath = path.join(__dirname, '../src/theme.json')
  const existingTheme = JSON.parse(fs.readFileSync(themePath, 'utf-8'))
  
  return {
    ...existingTheme,
    defaultTheme: setupData.defaultTheme
  }
}

function getDefaultMercedesSetup(): SetupData {
  // Default Mercedes-Benz setup
  return {
    companyName: 'Mercedes-Benz',
    companyLogo: '/assets/juspay-logo.svg',
    companyDescription: 'Mercedes-Benz Technology & Digital is the technology and digital arm of Mercedes-Benz, driving innovation in automotive technology, connected vehicles, and digital services. With multinational offices across Europe, North America, and Asia, we develop cutting-edge solutions for autonomous driving, electric vehicles, MBUX infotainment systems, and cloud-based services that power the future of mobility.',
    industry: 'Automotive Technology & Digital Services',
    companySize: 'Large Enterprise',
    headquarters: 'Europe',
    countries: ['German', 'French', 'Italian', 'Indian', 'American'],
    currentUserName: 'Klaus Müller',
    currentUserAvatar: '/assets/avatar.jpeg',
    botName: 'Juspay AI',
    botAvatar: '/assets/merc-ai.png',
    botType: 'ai',
    defaultTheme: 'dark',
    inferredChannels: ['general', 'engineering', 'product', 'operations'],
    inferredChannelExamples: ['general', 'announcements', 'mbux-development', 'backend-services', 'vehicle-connectivity', 'autonomous-driving', 'electric-vehicles', 'battery-tech'],
    inferredIndustrySpecificChannels: ['autonomous-driving', 'electric-vehicles', 'vehicle-connectivity', 'battery-tech', 'safety-systems', 'engine-development', 'new-launches'],
    generatedPeople: [
      { name: 'Klaus Müller', country: 'German', gender: 'male' },
      { name: 'Sophie Dubois', country: 'French', gender: 'female' },
      { name: 'Marco Rossi', country: 'Italian', gender: 'male' },
      { name: 'Priya Patel', country: 'Indian', gender: 'female' },
      { name: 'Michael Johnson', country: 'American', gender: 'male' },
      { name: 'Anna Becker', country: 'German', gender: 'female' },
      { name: 'François Leclerc', country: 'French', gender: 'male' },
      { name: 'Isabella Romano', country: 'Italian', gender: 'female' },
      { name: 'Arjun Kumar', country: 'Indian', gender: 'male' },
      { name: 'Sarah Williams', country: 'American', gender: 'female' },
      { name: 'Thomas Weber', country: 'German', gender: 'male' },
      { name: 'Camille Bernard', country: 'French', gender: 'female' },
      { name: 'Alessandro Bianchi', country: 'Italian', gender: 'male' },
      { name: 'Ananya Reddy', country: 'Indian', gender: 'female' },
      { name: 'David Chen', country: 'American', gender: 'male' }
    ]
  }
}

async function generate() {
  const setupDataPath = path.join(__dirname, '../setup-data.json')
  
  let setupData: SetupData
  
  if (!fs.existsSync(setupDataPath)) {
    console.log('\n📦 No custom setup found. Using default Mercedes-Benz sample setup...\n')
    setupData = getDefaultMercedesSetup()
  } else {
    setupData = JSON.parse(fs.readFileSync(setupDataPath, 'utf-8'))
    console.log('\n🔧 Generating Slack environment from your custom setup...\n')
  }
  
  // Generate company.json
  const companyJson = generateCompanyJson(setupData)
  const companyPath = path.join(__dirname, '../src/company.json')
  fs.writeFileSync(companyPath, JSON.stringify(companyJson, null, 2))
  console.log('✅ Generated src/company.json')
  
  // Generate people.json
  const peopleJson = generatePeopleJson(setupData)
  const peoplePath = path.join(__dirname, '../src/people.json')
  fs.writeFileSync(peoplePath, JSON.stringify(peopleJson, null, 2))
  console.log(`✅ Generated src/people.json (${peopleJson.length} people)`)
  
  // Update theme.json
  const themeJson = generateThemeJson(setupData)
  const themePath = path.join(__dirname, '../src/theme.json')
  fs.writeFileSync(themePath, JSON.stringify(themeJson, null, 2))
  console.log('✅ Updated src/theme.json')
  
  console.log('\n🎉 Slack environment generated successfully!')
  console.log('\n✨ Your Slack workspace is ready!')
  console.log('\n📝 Next steps:')
  console.log('   1. Review the generated files in src/')
  console.log('   2. Run: npm run dev (or npm run start)')
  console.log('   3. Your Slack environment will launch automatically!')
  console.log('\n🎨 Customization Tips:')
  console.log('   • Add your company logo: Place it in /assets folder and update')
  console.log('     "logo" field in src/company.json to point to it')
  console.log('   • Add custom bot avatar: Place bot logo in /assets folder and')
  console.log('     update "avatar" field in src/people.json for your bot')
  console.log('   • Example: /assets/my-company-logo.png')
  console.log('   • Example: /assets/my-bot-avatar.png')
  console.log('\n💡 Tip: After adding logos, run "npm run generate" again to')
  console.log('   regenerate with your custom assets, or manually edit the JSON files.\n')
}

generate().catch(console.error)
