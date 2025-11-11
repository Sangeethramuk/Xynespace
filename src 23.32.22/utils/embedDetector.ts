import peopleData from '../people.json'
import companyData from '../company.json'

export type EmbedType = 'notion' | 'figma' | 'jira' | 'confluence' | 'loom'

export interface EmbedConfig {
  type: EmbedType
  url: string
  title: string
  owner: string
}

type Person = { name: string; avatar: string; gender?: string; country?: string; me?: boolean; "emoji-heavy"?: boolean; verbose?: boolean }

// Embed type configuration - easily extensible
// To add a new embed type:
// 1. Add the type to EmbedType union above
// 2. Add configuration here with regex pattern, app info, and title generators
export interface EmbedTypeConfig {
  type: EmbedType
  regex: RegExp
  appInfo: {
    name: string
    icon: string
    color: string
    logoUrl: string
    thumbnailUrl?: string
  }
  titleExtractor: (url: string, seed: number) => string
}

// Generate a deterministic seed from URL hash
const getUrlSeed = (url: string): number => {
  let hash = 0
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash)
}

// Get industry-specific titles based on company data
const getIndustryContext = () => {
  const industry = (companyData as any).industry?.toLowerCase() || ''
  const description = (companyData as any).description?.toLowerCase() || ''
  
  return { industry, description }
}

// Generate industry-specific titles
const getIndustryTitles = (type: 'notion' | 'figma' | 'jira' | 'confluence' | 'loom') => {
  const { industry, description } = getIndustryContext()
  
  // Automotive industry
  if (industry.includes('automotive') || description.includes('vehicle') || description.includes('car') || description.includes('automotive')) {
    return {
      notion: [
        'Product Requirements: MBUX Infotainment System Roadmap',
        'Engineering Design Doc: Autonomous Driving Architecture',
        'Product Strategy: Electric Vehicle Platform Analysis',
        'Technical Specification: Vehicle Connectivity API',
        'Product Brief: MBUX User Experience Flow',
        'Engineering Runbook: Vehicle Telematics Incident Response',
        'Product Planning: Battery Management System Features',
        'Technical Documentation: Over-the-Air Update Architecture',
        'Product Research: EV Charging Infrastructure Analysis',
        'Engineering Guide: Vehicle Safety System Deployment'
      ],
      figma: [
        'MBUX Design System: Infotainment UI Components',
        'Vehicle HMI: Dashboard Interface Mockups',
        'Mobile App UI: Mercedes Me App Design',
        'Design System: EV Charging Station Interface',
        'MBUX Screens: Navigation Flow Designs',
        'Web Components: Vehicle Configuration Portal',
        'Design System: Icon Set for Automotive Apps',
        'Mobile UI: Remote Vehicle Control Patterns',
        'Web Interface: Fleet Management Dashboard',
        'Design Components: Vehicle Status Cards'
      ],
      jira: [
        'MBUX-1234: Fix MBUX navigation route calculation issue',
        'VEH-5678: Implement OTA update rollback mechanism',
        'API-9012: Add error handling for vehicle connectivity failures',
        'BAT-3456: Optimize battery management system performance',
        'SAF-7890: Resolve autonomous driving sensor calibration',
        'CONN-2345: Update vehicle-to-cloud communication library',
        'MBUX-6789: Improve MBUX voice recognition accuracy',
        'EV-4567: Refactor charging station integration code',
        'TELE-8901: Add comprehensive logging for telematics data',
        'SEC-1234: Enhance security measures for vehicle access'
      ],
      confluence: [
        'Engineering Runbook: Vehicle Telematics Incident Response',
        'Technical Documentation: MBUX API Integration Guide',
        'Engineering Playbook: OTA Update Deployment Procedures',
        'Technical Guide: Autonomous Driving System Architecture',
        'Engineering Documentation: EV Charging Infrastructure Setup',
        'Technical Runbook: Vehicle Connectivity Monitoring',
        'Engineering Guide: Battery Management System Troubleshooting',
        'Technical Documentation: Vehicle Security Best Practices',
        'Engineering Playbook: MBUX Performance Optimization',
        'Technical Guide: Vehicle Data Analytics Pipeline'
      ],
      loom: [
        'Product Demo: MBUX Infotainment System Walkthrough',
        'Engineering Tutorial: Vehicle API Integration Guide',
        'Design Review: MBUX UI Component Showcase',
        'Team Update: Electric Vehicle Platform Discussion',
        'Technical Explanation: Autonomous Driving Architecture',
        'User Feedback: MBUX Feature Testing Session',
        'Design Presentation: Vehicle HMI Design System',
        'Engineering Walkthrough: OTA Update Process',
        'Product Overview: EV Charging Feature Announcement',
        'Technical Demo: Battery Management Optimization'
      ]
    }
  }
  
  // Finance industry
  if (industry.includes('finance') || industry.includes('banking') || description.includes('financial') || description.includes('bank') || description.includes('payment')) {
    return {
      notion: [
        'Product Requirements: Payment Processing System Roadmap',
        'Engineering Design Doc: Trading Platform Architecture',
        'Product Strategy: Risk Management Analysis',
        'Technical Specification: Fraud Detection API',
        'Product Brief: Customer Onboarding Flow',
        'Engineering Runbook: Trading System Incident Response',
        'Product Planning: Compliance Monitoring Features',
        'Technical Documentation: Payment Gateway Architecture',
        'Product Research: Market Analysis Report',
        'Engineering Guide: Security Audit Deployment'
      ],
      figma: [
        'Design System: Banking App Component Library',
        'Mobile App UI: Payment Interface Mockups',
        'Web Dashboard: Trading Platform Design',
        'Design System: Financial Dashboard Components',
        'Mobile Screens: Account Management Flow',
        'Web Components: Transaction History Library',
        'Design System: Financial Icon Set',
        'Mobile UI: Payment Authorization Patterns',
        'Web Interface: Risk Analytics Dashboard',
        'Design Components: Transaction Cards'
      ],
      jira: [
        'PAY-1234: Fix payment processing timeout issue',
        'TRD-5678: Implement rate limiting for trading API',
        'FRAUD-9012: Add fraud detection rule engine',
        'COMP-3456: Optimize compliance report generation',
        'SEC-7890: Resolve security vulnerability in auth system',
        'API-2345: Update payment gateway integration',
        'RISK-6789: Improve risk calculation accuracy',
        'TRD-4567: Refactor trading order processing',
        'MON-8901: Add monitoring for transaction failures',
        'SEC-1234: Enhance encryption for sensitive data'
      ],
      confluence: [
        'Engineering Runbook: Trading System Incident Response',
        'Technical Documentation: Payment API Integration',
        'Engineering Playbook: Compliance Audit Procedures',
        'Technical Guide: Risk Management Architecture',
        'Engineering Documentation: Fraud Detection Setup',
        'Technical Runbook: Trading Platform Monitoring',
        'Engineering Guide: Payment Gateway Troubleshooting',
        'Technical Documentation: Financial Security Best Practices',
        'Engineering Playbook: Trading Performance Optimization',
        'Technical Guide: Transaction Processing Pipeline'
      ],
      loom: [
        'Product Demo: Payment System Walkthrough',
        'Engineering Tutorial: Trading API Integration',
        'Design Review: Banking App UI Showcase',
        'Team Update: Risk Management Discussion',
        'Technical Explanation: Fraud Detection Architecture',
        'User Feedback: Payment Feature Testing',
        'Design Presentation: Financial Dashboard System',
        'Engineering Walkthrough: Compliance Process',
        'Product Overview: Trading Feature Announcement',
        'Technical Demo: Payment Processing Optimization'
      ]
    }
  }
  
  // Healthcare industry
  if (industry.includes('healthcare') || industry.includes('medical') || description.includes('health') || description.includes('medical') || description.includes('clinical')) {
    return {
      notion: [
        'Product Requirements: Patient Portal Roadmap',
        'Engineering Design Doc: Telemedicine Architecture',
        'Product Strategy: Clinical Trial Analysis',
        'Technical Specification: HIPAA Compliance API',
        'Product Brief: Patient Onboarding Flow',
        'Engineering Runbook: Medical System Incident Response',
        'Product Planning: Electronic Health Records Features',
        'Technical Documentation: Telemedicine Platform Architecture',
        'Product Research: Patient Satisfaction Analysis',
        'Engineering Guide: Medical Device Integration'
      ],
      figma: [
        'Design System: Healthcare App Components',
        'Mobile App UI: Patient Portal Mockups',
        'Web Dashboard: Clinical Dashboard Design',
        'Design System: Medical UI Components',
        'Mobile Screens: Telemedicine Consultation Flow',
        'Web Components: Patient Record Library',
        'Design System: Medical Icon Set',
        'Mobile UI: Appointment Booking Patterns',
        'Web Interface: Clinical Analytics Dashboard',
        'Design Components: Patient Status Cards'
      ],
      jira: [
        'PAT-1234: Fix patient portal login issue',
        'TELE-5678: Implement video consultation encryption',
        'EHR-9012: Add error handling for record sync',
        'HIPAA-3456: Optimize compliance audit performance',
        'DEVICE-7890: Resolve medical device connectivity',
        'API-2345: Update patient data API',
        'TELE-6789: Improve telemedicine call quality',
        'EHR-4567: Refactor health record storage',
        'MON-8901: Add monitoring for critical alerts',
        'SEC-1234: Enhance HIPAA compliance measures'
      ],
      confluence: [
        'Engineering Runbook: Medical System Incident Response',
        'Technical Documentation: Telemedicine API Integration',
        'Engineering Playbook: HIPAA Compliance Procedures',
        'Technical Guide: Electronic Health Records Architecture',
        'Engineering Documentation: Clinical Trial Setup',
        'Technical Runbook: Patient Portal Monitoring',
        'Engineering Guide: Medical Device Troubleshooting',
        'Technical Documentation: Healthcare Security Best Practices',
        'Engineering Playbook: Telemedicine Optimization',
        'Technical Guide: Patient Data Pipeline'
      ],
      loom: [
        'Product Demo: Patient Portal Walkthrough',
        'Engineering Tutorial: Telemedicine Integration',
        'Design Review: Healthcare App UI Showcase',
        'Team Update: Clinical Trial Discussion',
        'Technical Explanation: EHR Architecture',
        'User Feedback: Telemedicine Feature Testing',
        'Design Presentation: Medical Dashboard System',
        'Engineering Walkthrough: HIPAA Compliance Process',
        'Product Overview: Telemedicine Feature Announcement',
        'Technical Demo: Patient Data Optimization'
      ]
    }
  }
  
  // Retail/E-commerce
  if (industry.includes('retail') || industry.includes('e-commerce') || description.includes('retail') || description.includes('ecommerce') || description.includes('shopping')) {
    return {
      notion: [
        'Product Requirements: E-commerce Platform Roadmap',
        'Engineering Design Doc: Inventory Management Architecture',
        'Product Strategy: Customer Experience Analysis',
        'Technical Specification: Payment Processing API',
        'Product Brief: Shopping Cart Flow',
        'Engineering Runbook: Order Fulfillment Incident Response',
        'Product Planning: Product Recommendation Features',
        'Technical Documentation: Supply Chain Architecture',
        'Product Research: Customer Behavior Analysis',
        'Engineering Guide: Order Processing Deployment'
      ],
      figma: [
        'Design System: E-commerce App Components',
        'Mobile App UI: Shopping Interface Mockups',
        'Web Dashboard: Inventory Management Design',
        'Design System: Product Catalog Components',
        'Mobile Screens: Checkout Flow Designs',
        'Web Components: Product Card Library',
        'Design System: Shopping Icon Set',
        'Mobile UI: Product Search Patterns',
        'Web Interface: Sales Analytics Dashboard',
        'Design Components: Order Status Cards'
      ],
      jira: [
        'ECOMM-1234: Fix shopping cart calculation issue',
        'INV-5678: Implement inventory sync mechanism',
        'PAY-9012: Add error handling for payment failures',
        'ORD-3456: Optimize order processing performance',
        'REC-7890: Resolve recommendation algorithm issue',
        'API-2345: Update product catalog API',
        'ECOMM-6789: Improve checkout flow accuracy',
        'INV-4567: Refactor inventory management code',
        'MON-8901: Add monitoring for order failures',
        'SEC-1234: Enhance payment security measures'
      ],
      confluence: [
        'Engineering Runbook: Order Fulfillment Incident Response',
        'Technical Documentation: E-commerce API Integration',
        'Engineering Playbook: Inventory Management Procedures',
        'Technical Guide: Supply Chain Architecture',
        'Engineering Documentation: Payment Gateway Setup',
        'Technical Runbook: Order Processing Monitoring',
        'Engineering Guide: Inventory Troubleshooting',
        'Technical Documentation: E-commerce Security Best Practices',
        'Engineering Playbook: Order Processing Optimization',
        'Technical Guide: Product Catalog Pipeline'
      ],
      loom: [
        'Product Demo: E-commerce Platform Walkthrough',
        'Engineering Tutorial: Inventory API Integration',
        'Design Review: Shopping App UI Showcase',
        'Team Update: Supply Chain Discussion',
        'Technical Explanation: Order Processing Architecture',
        'User Feedback: Checkout Feature Testing',
        'Design Presentation: Product Catalog System',
        'Engineering Walkthrough: Payment Process',
        'Product Overview: Recommendation Feature Announcement',
        'Technical Demo: Inventory Optimization'
      ]
    }
  }
  
  // Default/Technology (fallback)
  return {
    notion: [
      'Product Requirements Document: Q4 Feature Roadmap',
      'Engineering Design Doc: API Architecture Overview',
      'Product Strategy: Customer Feedback Analysis',
      'Technical Specification: Database Migration Plan',
      'Product Brief: New User Onboarding Flow',
      'Engineering Runbook: Incident Response Procedures',
      'Product Planning: Feature Prioritization Framework',
      'Technical Documentation: Service Architecture Guide',
      'Product Research: User Behavior Analytics Report',
      'Engineering Guide: Deployment Best Practices'
    ],
    figma: [
      'Design System: Component Library and Style Guide',
      'Mobile App UI: User Interface Mockups and Prototypes',
      'Web Dashboard: Admin Panel Design Components',
      'Design System: Color Palette and Typography Scale',
      'Mobile Screens: User Onboarding Flow Designs',
      'Web Components: Button and Form Element Library',
      'Design System: Icon Set and Illustration Guidelines',
      'Mobile UI: Navigation and Layout Patterns',
      'Web Interface: Dashboard and Analytics Views',
      'Design Components: Card and Modal Patterns'
    ],
    jira: [
      'ENG-1234: Fix authentication token expiration issue',
      'PROD-5678: Implement rate limiting for API endpoints',
      'DEV-9012: Add error handling for database connection failures',
      'OPS-3456: Optimize query performance for user dashboard',
      'SEC-7890: Resolve memory leak in background job processor',
      'DEV-2345: Update third-party library dependencies',
      'OPS-6789: Improve logging and monitoring for production',
      'ENG-4567: Refactor legacy code for better maintainability',
      'QA-8901: Add comprehensive test coverage for critical paths',
      'SEC-1234: Enhance security measures for user data access'
    ],
    confluence: [
      'Engineering Runbook: Production Incident Response Guide',
      'Technical Documentation: API Integration Best Practices',
      'Engineering Playbook: Database Migration Procedures',
      'Technical Guide: Microservices Architecture Overview',
      'Engineering Documentation: CI/CD Pipeline Configuration',
      'Technical Runbook: Monitoring and Alerting Setup',
      'Engineering Guide: Code Review and Deployment Process',
      'Technical Documentation: Security Best Practices',
      'Engineering Playbook: Performance Optimization Strategies',
      'Technical Guide: Troubleshooting Common Production Issues'
    ],
    loom: [
      'Product Demo: New Feature Walkthrough',
      'Engineering Tutorial: API Integration Guide',
      'Design Review: UI Component Showcase',
      'Team Update: Sprint Planning Discussion',
      'Technical Explanation: Architecture Deep Dive',
      'User Feedback: Feature Testing Session',
      'Design Presentation: Design System Overview',
      'Engineering Walkthrough: Deployment Process',
      'Product Overview: Feature Announcement',
      'Technical Demo: Performance Optimization'
    ]
  }
}

// Title generators for each embed type - now industry-aware
const titleGenerators = {
  notion: (url: string, seed: number): string => {
    const match = url.match(/notion\.(?:so|site)\/(?:[^\/]+\/)?([^\/\?#]+)/i)
    if (match) {
      const extracted = decodeURIComponent(match[1].replace(/-/g, ' ').replace(/%20/g, ' '))
        .split('?')[0]
        .split('#')[0]
      if (extracted && extracted.length >= 5) {
        return extracted.charAt(0).toUpperCase() + extracted.slice(1)
      }
    }
    const industryTitles = getIndustryTitles('notion')
    return industryTitles.notion[seed % industryTitles.notion.length]
  },
  
  figma: (url: string, seed: number): string => {
    const match = url.match(/figma\.com\/file\/[^\/]+\/([^\/\?#]+)/i)
    if (match) {
      const extracted = decodeURIComponent(match[1].replace(/-/g, ' ').replace(/%20/g, ' '))
        .split('?')[0]
        .split('#')[0]
      if (extracted && extracted.length >= 5) {
        return extracted.charAt(0).toUpperCase() + extracted.slice(1)
      }
    }
    const industryTitles = getIndustryTitles('figma')
    return industryTitles.figma[seed % industryTitles.figma.length]
  },
  
  jira: (url: string, seed: number): string => {
    const match = url.match(/browse\/([A-Z]+-\d+)|selectedIssue=([A-Z]+-\d+)/i)
    const issueId = match ? (match[1] || match[2]) : null
    if (!issueId) {
      const issueMatch = url.match(/([A-Z]+-\d+)/i)
      if (issueMatch) {
        const id = issueMatch[1]
        const industryTitles = getIndustryTitles('jira')
        // Replace placeholder IDs with actual ID
        const title = industryTitles.jira[seed % industryTitles.jira.length]
        return title.replace(/^[A-Z]+-\d+:/, `${id}:`)
      }
    } else {
      const industryTitles = getIndustryTitles('jira')
      const title = industryTitles.jira[seed % industryTitles.jira.length]
      return title.replace(/^[A-Z]+-\d+:/, `${issueId}:`)
    }
    const industryTitles = getIndustryTitles('jira')
    return industryTitles.jira[0].replace(/^[A-Z]+-\d+:/, 'ENG-123:')
  },
  
  confluence: (url: string, seed: number): string => {
    const match = url.match(/pages\/viewpage\.action\?pageId=\d+|spaces\/[^\/]+\/pages\/([^\/\?#]+)/i)
    if (match && match[1]) {
      const extracted = decodeURIComponent(match[1].replace(/-/g, ' ').replace(/%20/g, ' '))
        .split('?')[0]
        .split('#')[0]
      if (extracted && extracted.length >= 5) {
        return extracted.charAt(0).toUpperCase() + extracted.slice(1)
      }
    }
    const industryTitles = getIndustryTitles('confluence')
    return industryTitles.confluence[seed % industryTitles.confluence.length]
  },
  
  loom: (url: string, seed: number): string => {
    const match = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/i)
    const industryTitles = getIndustryTitles('loom')
    return industryTitles.loom[seed % industryTitles.loom.length]
  }
}

// Embed type configurations - add new types here
export const EMBED_CONFIGS: Record<EmbedType, EmbedTypeConfig> = {
  notion: {
    type: 'notion',
    regex: /https?:\/\/(?:www\.)?(?:notion\.so|notion\.site)\/[^\s<>"']+/gi,
    appInfo: {
      name: 'Notion',
      icon: '📝',
      color: '#ffffff',
      logoUrl: '/assets/notion.png'
    },
    titleExtractor: titleGenerators.notion
  },
  
  figma: {
    type: 'figma',
    regex: /https?:\/\/(?:www\.)?figma\.com\/[^\s<>"']+/gi,
    appInfo: {
      name: 'Figma',
      icon: '🎨',
      color: '#0acf83',
      logoUrl: '/assets/figma.png',
      thumbnailUrl: '/assets/figma-thumbnail.jpg'
    },
    titleExtractor: titleGenerators.figma
  },
  
  jira: {
    type: 'jira',
    regex: /https?:\/\/[^\s<>"']*jira[^\s<>"']*\/[^\s<>"']+/gi,
    appInfo: {
      name: 'Jira',
      icon: '🎫',
      color: '#0052cc',
      logoUrl: '/assets/jira.png'
    },
    titleExtractor: titleGenerators.jira
  },
  
  confluence: {
    type: 'confluence',
    regex: /https?:\/\/[^\s<>"']*confluence[^\s<>"']*\/[^\s<>"']+/gi,
    appInfo: {
      name: 'Confluence',
      icon: '📚',
      color: '#172b4d',
      logoUrl: '/assets/confluence.png'
    },
    titleExtractor: titleGenerators.confluence
  },
  
  loom: {
    type: 'loom',
    regex: /https?:\/\/(?:www\.)?loom\.com\/[^\s<>"']+/gi,
    appInfo: {
      name: 'Loom',
      icon: '🎥',
      color: '#625DF5',
      logoUrl: '/assets/loom.svg',
      thumbnailUrl: '/assets/loom-thumbnail.jpg'
    },
    titleExtractor: titleGenerators.loom
  }
}

// Get deterministic owner name from people.json based on URL hash
const getOwnerForUrl = (url: string): string => {
  const allPeople = (peopleData as Person[])
  if (allPeople.length === 0) return 'James McGill'
  
  const seed = getUrlSeed(url)
  const index = seed % allPeople.length
  return allPeople[index]?.name || 'James McGill'
}

/**
 * Detects embed links in message text and returns an array of embed configurations
 * @param text - The message text to scan for embed links
 * @returns Array of embed configurations
 */
export const detectEmbedLinks = (text: string): EmbedConfig[] => {
  const embeds: EmbedConfig[] = []
  
  // Include all embed types
  const displayableTypes: EmbedType[] = ['notion', 'figma', 'loom', 'jira', 'confluence']
  
  // Iterate through all configured embed types
  Object.values(EMBED_CONFIGS).forEach(config => {
    // Only process displayable types
    if (!displayableTypes.includes(config.type)) {
      return
    }
    
    const matches = text.match(config.regex)
    if (matches) {
      matches.forEach(url => {
        const seed = getUrlSeed(url)
        const title = config.titleExtractor(url, seed)
        const owner = getOwnerForUrl(url)
        
        embeds.push({ 
          type: config.type, 
          url, 
          title, 
          owner 
        })
      })
    }
  })
  
  return embeds
}

/**
 * Get app info for a given embed type
 * @param type - The embed type
 * @returns App info configuration
 */
export const getEmbedAppInfo = (type: EmbedType) => {
  return EMBED_CONFIGS[type]?.appInfo || {
    name: 'Link',
    icon: '🔗',
    color: '#cccccc',
    logoUrl: ''
  }
}
