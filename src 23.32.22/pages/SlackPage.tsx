import React, { useState, useRef, useEffect, useLayoutEffect } from 'react'
import peopleData from '../people.json'
import themeData from '../theme.json'
import companyData from '../company.json'
import { LinkEmbed } from '../components/LinkEmbed'
import { detectEmbedLinks } from '../utils/embedDetector'

type MessageAction = {
  id: string
  label: string
  type: 'primary' | 'secondary'
  emoji?: string
  confirmationText: string
}

type SlackMsg = { 
  id: string
  who: string
  text: string
  when: string
  reactions?: Record<string, number>
  actions?: MessageAction[]
}
type ChatItem = { id: string; name: string; unread?: number; type: 'starred' | 'dm' | 'channel'; avatar?: string; statusEmoji?: string; isOnline?: boolean; isPrivate?: boolean }
type Person = { name: string; avatar: string; gender?: string; country?: string; me?: boolean; "emoji-heavy"?: boolean; verbose?: boolean }
type ThemeColors = {
  leftmostPanel: string
  mainBackground: string
  sidebarBackground: string
  chatBackground: string
  iconContainer: string
  separator: string
  border: string
  borderLight: string
  borderFocus: string
  textPrimary: string
  textSecondary: string
  textTertiary: string
  hoverBackground: string
  activeBackground: string
  composeBackground: string
  composeBorder: string
  composeBorderFocus: string
  unreadPill: string
  unreadPillText: string
  buttonPrimary: string
  buttonPrimaryHover: string
  buttonPrimaryText: string
  onlineStatus: string
  offlineStatus: string
  avatarBorder: string
  tabActiveBorder: string
  tabInactive: string
  tabHover: string
  sectionHeader: string
}
type Theme = {
  name: string
  type: 'dark' | 'light'
  colors: ThemeColors
}

export default function SlackPage() {
  const [selectedChat, setSelectedChat] = useState<string>('hyperswitch-core')
  const [chatMessages, setChatMessages] = useState<Record<string, SlackMsg[]>>({})
  const slackRootRef = useRef<HTMLDivElement | null>(null)
  const prevSelectedChatRef = useRef<string>(selectedChat)
  const scrollAnchorRef = useRef<{ scrollHeight: number; scrollTop: number; clientHeight: number } | null>(null)
  const composeContainerRef = useRef<HTMLDivElement | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const [messageInput, setMessageInput] = useState('')
  const [isComposeFocused, setIsComposeFocused] = useState(false)
  const [activeTab, setActiveTab] = useState<'messages' | 'add-canvas' | 'files'>('messages')
  const [selectedLeftIcon, setSelectedLeftIcon] = useState<string>('home')
  const [hoveredMessageId, setHoveredMessageId] = useState<string | null>(null)
  const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null)
  const [userReactions, setUserReactions] = useState<Record<string, Set<string>>>({}) // messageId -> Set of emojis user has reacted with
  const [completedActions, setCompletedActions] = useState<Record<string, string>>({}) // messageId -> actionId that was completed
  
  // Common emojis for quick reaction
  const commonEmojis = ['👍', '❤️', '😄', '🎉', '🔥', '👏', '😮', '😢', '🙏', '✅']
  
  // State for sidebar width and resizing
  const [sidebarWidth, setSidebarWidth] = useState<number>(338)
  const [isResizing, setIsResizing] = useState<boolean>(false)
  const resizeRef = useRef<HTMLDivElement | null>(null)
  
  // State for unread counts - will be initialized from static arrays
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({})
  
  // State for online status - tracks which users are online/offline
  const [onlineStatus, setOnlineStatus] = useState<Record<string, boolean>>({
    'juspay-ai': true,
    'ankur': true,
    'sudhirr-nanda': true,
    'akhil': false,
    'sakshi-gupta': true,
    'drishtant-kaushal': false,
    'mudit-bhutani': true,
    'pranav-jang-bahadur': true,
    'meghana-kankara': false,
    'harshita': true,
    'rishabh-pandey': false,
  })
  
  // Theme state - load from theme.json
  const [currentThemeId, setCurrentThemeId] = useState<string>((themeData as any).defaultTheme || 'midnight-express')
  
  // Get current theme
  const currentTheme = React.useMemo(() => {
    const themes = (themeData as any).themes || {}
    return themes[currentThemeId] || themes['midnight-express']
  }, [currentThemeId]) as Theme
  
  // Get neutral text colors based on theme type (not themed colors)
  const getTextColor = {
    primary: currentTheme.type === 'dark' ? '#ffffff' : '#1d1c1d',
    secondary: currentTheme.type === 'dark' ? '#d1d2d3' : '#616061',
    tertiary: currentTheme.type === 'dark' ? '#9ca3af' : '#868686',
    sectionHeader: currentTheme.type === 'dark' ? '#9ca3af' : '#868686',
    tabInactive: currentTheme.type === 'dark' ? '#9ca3af' : '#868686',
    tabHover: currentTheme.type === 'dark' ? '#d1d2d3' : '#616061',
  }

  // Update document title with company name
  useEffect(() => {
    document.title = `${companyData.name} - Slack`
  }, [])

  // Update body/html background to match theme
  useEffect(() => {
    const backgroundColor = currentTheme.colors.leftmostPanel
    document.body.style.backgroundColor = backgroundColor
    document.body.style.color = currentTheme.type === 'dark' ? '#ffffff' : '#1d1c1d'
    document.documentElement.style.backgroundColor = backgroundColor
    
    return () => {
      // Cleanup on unmount
      document.body.style.backgroundColor = ''
      document.body.style.color = ''
      document.documentElement.style.backgroundColor = ''
    }
  }, [currentTheme])

  // Get all available themes
  const availableThemes = React.useMemo(() => {
    const themes = (themeData as any).themes || {}
    return Object.keys(themes).map(id => ({
      id,
      ...themes[id]
    }))
  }, [])

  const people = React.useMemo(() => {
    return (peopleData as Person[]).map(p => ({ n: p.name, a: p.avatar }))
  }, [])

  // Current user - get from JSON
  const currentUserName = React.useMemo(() => {
    const currentUser = (peopleData as Person[]).find(p => p.me === true)
    return currentUser?.name || 'James McGill'
  }, [])

  // Helper to get person from people data
  const getPerson = (name: string): Person | undefined => {
    return (peopleData as Person[]).find(p => p.name === name)
  }

  // Helper to get avatar from people data
  const getAvatar = (name: string): string => {
    const person = getPerson(name)
    return person?.avatar || '/assets/avatar.jpeg'
  }

  // Helper to get current user (James McGill)
  const getCurrentUser = React.useMemo(() => {
    return (peopleData as Person[]).find(p => p.me === true)?.name || 'James McGill'
  }, [])

  // Helper to get people excluding current user
  const getOtherPeople = React.useMemo(() => {
    return people.filter(p => p.n !== getCurrentUser)
  }, [people, getCurrentUser])

  // Helper to get first name from full name
  const getFirstName = (fullName: string): string => {
    return fullName.split(' ')[0]
  }

  // Helper to get person name from chat ID
  const getPersonNameFromChatId = (chatId: string): string | null => {
    const chatMap: Record<string, string> = {
      'juspay-ai': 'Juspay AI',
      'ankur': 'Ankur',
      'sudhirr-nanda': 'Sudhirr Nanda',
      'akhil': 'Akhil',
      'sakshi-gupta': 'Sakshi Gupta',
      'drishtant-kaushal': 'Drishtant Kaushal',
      'mudit-bhutani': 'Mudit Bhutani',
      'pranav-jang-bahadur': 'Pranav Jang Bahadur',
      'meghana-kankara': 'Meghana Kankara',
      'harshita': 'Harshita',
      'rishabh-pandey': 'Rishabh Pandey',
    }
    return chatMap[chatId] || null
  }

  // Helper to get group members from group chat name
  const getGroupMembers = (groupName: string): string[] => {
    return groupName.split(', ').map(name => name.trim()).filter(name => name !== getCurrentUser)
  }

  // Handle sidebar resize
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return
      const newWidth = e.clientX - 60 // Subtract leftmost panel width
      if (newWidth >= 200 && newWidth <= 500) {
        setSidebarWidth(newWidth)
      }
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizing])

  // Helper to add emojis to a message
  const addEmojis = (text: string, pickFn: <T,>(arr: T[]) => T): string => {
    const emojis = ['😊', '👍', '🎉', '🚀', '✨', '💯', '🔥', '⭐', '💪', '🙌', '👏', '🎯', '💡', '🌟', '😎', '🤩', '💫', '🎊', '🏆', '✅']
    const numEmojis = Math.floor(Math.random() * 4) + 2 // 2-5 emojis
    const selectedEmojis = []
    for (let i = 0; i < numEmojis; i++) {
      selectedEmojis.push(pickFn(emojis))
    }
    // Add emojis at the end, sometimes in the middle
    if (Math.random() > 0.5) {
      return `${text} ${selectedEmojis.join(' ')}`
    } else {
      const words = text.split(' ')
      const insertPos = Math.floor(words.length / 2)
      words.splice(insertPos, 0, selectedEmojis[0])
      return `${words.join(' ')} ${selectedEmojis.slice(1).join(' ')}`
    }
  }

  // Helper to generate verbose message
  const generateVerboseMessage = (baseText: string, pickFn: <T,>(arr: T[]) => T): string => {
    const verboseAdditions = [
      ' Let me provide some additional context here.',
      ' I wanted to make sure we\'re all on the same page.',
      ' This is important for our overall strategy.',
      ' I think it\'s worth discussing in more detail.',
      ' There are a few nuances we should consider.',
      ' Let me break this down for clarity.',
      ' I\'ve been thinking about this quite a bit.',
      ' This aligns with our broader objectives.',
      ' We should definitely keep this in mind going forward.',
      ' I\'d love to hear your thoughts on this as well.',
    ]
    const additions = []
    const numAdditions = Math.floor(Math.random() * 3) + 1 // 1-3 additions
    for (let i = 0; i < numAdditions; i++) {
      additions.push(pickFn(verboseAdditions))
    }
    return baseText + additions.join('')
  }

  // Helper to get reactions for important/celebratory messages (realistic, sparse)
  const getReactionsForMessage = (text: string, chatId: string, chatName: string, pickFn: <T,>(arr: T[]) => T): Record<string, number> | undefined => {
    // Strip HTML tags for keyword detection
    const textWithoutHtml = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ')
    const lowerText = textWithoutHtml.toLowerCase()
    const isGeneral = chatId === 'general'
    
    // Get company context for industry-aware reactions
    const companyIndustry = ((companyData as any).industry || '').toLowerCase()
    
    // Realistic reaction logic: Only truly noteworthy messages get reactions
    // Base probability is low - most messages don't get reactions
    const baseChance = isGeneral ? 0.20 : 0.10 // 20% for general, 10% for other channels
    if (Math.random() > baseChance) return undefined
    
    // Major announcements and milestones
    const majorAnnouncements = ['announce', 'milestone', 'achievement', 'breakthrough', 'major', 'strategic initiative', 'company-wide', 'exciting news', 'thrilled to', 'proud to']
    const hasMajorAnnouncement = majorAnnouncements.some(keyword => lowerText.includes(keyword))
    
    // Celebratory messages
    const celebratoryPhrases = ['congratulations', 'congrats', 'celebrate', 'amazing work', 'incredible', 'fantastic', 'outstanding', 'well done']
    const hasCelebratory = celebratoryPhrases.some(phrase => lowerText.includes(phrase))
    
    // Launch/product releases
    const launchKeywords = ['launch', 'released', 'shipping', 'available now', 'go live']
    const hasLaunch = launchKeywords.some(keyword => lowerText.includes(keyword))
    
    // Messages with celebratory emojis already
    const hasEmoji = text.includes('🚀') || text.includes('🎉') || text.includes('🏆') || text.includes('💡') || text.includes('📢') || text.includes('✅')
    
    // Long-form formatted announcements
    const isFormattedAnnouncement = text.includes('<strong>') || text.includes('<br><br>')
    
    // Only proceed if message is genuinely noteworthy
    if (!hasMajorAnnouncement && !hasCelebratory && !hasLaunch && !hasEmoji && !isFormattedAnnouncement) {
      return undefined
    }
    
    // Additional probability check based on message type
    let finalChance = 0.5
    if (hasMajorAnnouncement || isFormattedAnnouncement) finalChance = 0.85
    else if (hasCelebratory) finalChance = 0.60
    else if (hasLaunch) finalChance = 0.50
    else if (hasEmoji) finalChance = 0.40
    
    if (Math.random() > finalChance) return undefined
    
    const reactions: Record<string, number> = {}
    const reactionEmojis: string[] = []
    
    // Context-appropriate emojis
    if (hasMajorAnnouncement || isGeneral) {
      reactionEmojis.push('👍', '❤️', '🎉', '🔥', '👏', '🚀', '💯', '🙌')
    } else if (hasLaunch) {
      reactionEmojis.push('🚀', '🎉', '🔥', '👏', '💯')
    } else if (hasCelebratory) {
      reactionEmojis.push('🎉', '👏', '🙌', '❤️', '🔥')
    } else {
      reactionEmojis.push('👍', '🔥', '👏', '💯')
    }
    
    // Realistic reaction counts: 1-3 for most, 2-4 for major announcements
    const isMajor = hasMajorAnnouncement || isFormattedAnnouncement
    const numReactions = isMajor ? Math.floor(Math.random() * 3) + 2 : Math.floor(Math.random() * 2) + 1
    
    for (let i = 0; i < numReactions; i++) {
      const availableEmojis = reactionEmojis.filter(e => !reactions[e])
      if (availableEmojis.length === 0) break
      const emoji = pickFn(availableEmojis)
      reactions[emoji] = isMajor ? Math.floor(Math.random() * 4) + 2 : Math.floor(Math.random() * 3) + 1
    }
    
    return Object.keys(reactions).length > 0 ? reactions : undefined
  }

  // Helper to add italics and URLs to messages
  const addFormattingAndLinks = (text: string, pickFn: <T,>(arr: T[]) => T): string => {
    // Skip formatting for HTML messages (rich text announcements)
    if (text.includes('<strong>') || text.includes('<br>') || text.includes('<ul>') || text.includes('<li>')) {
      return text
    }
    
    let formatted = text
    
    // Add occasional italics (20% chance)
    if (Math.random() < 0.2) {
      const italicPhrases = [
        'really important',
        'super critical',
        'just a heads up',
        'FYI',
        'quick note',
        'important',
        'critical',
        'urgent',
        'just so you know',
        'by the way',
        'fyi',
        'heads up',
        'quick update',
        'side note',
        'btw'
      ]
      const phrase = pickFn(italicPhrases)
      if (formatted.toLowerCase().includes(phrase.toLowerCase())) {
        formatted = formatted.replace(new RegExp(`(${phrase})`, 'gi'), '<em>$1</em>')
      }
    }
    
    // Add occasional URLs (15% chance)
    if (Math.random() < 0.15) {
      const urlTemplates = [
        { url: 'https://wiki.company.com/postmortems/{id}', text: 'post-mortem doc', bold: false },
        { url: 'https://github.com/company/repo/pull/{id}', text: 'PR #{id}', bold: false },
        { url: 'https://docs.company.com/api/v2', text: 'API docs', bold: false },
        { url: 'https://dashboard.company.com/incidents/{id}', text: 'incident dashboard', bold: false },
        { url: 'https://monitoring.company.com/metrics/payment-api', text: 'monitoring dashboard', bold: false },
        { url: 'https://jira.company.com/browse/ENG-{id}', text: 'JIRA ticket', bold: false },
        { url: 'https://confluence.company.com/engineering/playbooks', text: 'playbook', bold: false },
        { url: 'https://grafana.company.com/d/{id}', text: 'Grafana dashboard', bold: false },
        { url: 'https://datadog.company.com/apm/trace/{id}', text: 'Datadog trace', bold: false },
        { url: 'https://slack.company.com/archives/{channel}', text: 'Slack thread', bold: false },
        { url: 'https://wiki.company.com/runbooks/db-scaling', text: '<strong>runbook</strong>', bold: true },
        { url: 'https://docs.company.com/deployment-guide', text: '<strong>deployment guide</strong>', bold: true },
      ]
      
      const template = pickFn(urlTemplates)
      const id = Math.floor(Math.random() * 5000) + 1000
      const url = template.url.replace('{id}', id.toString()).replace('{channel}', pickFn(['C12345', 'C67890', 'C11111']))
      let linkText = template.text.replace('{id}', id.toString())
      
      // Insert URL in the message - append at the end or replace placeholder text
      const linkHtml = template.bold 
        ? `<a href="${url}" style="color: #1D9BD1; text-decoration: underline;"><strong>${linkText.replace(/<strong>|<\/strong>/g, '')}</strong></a>`
        : `<a href="${url}" style="color: #1D9BD1; text-decoration: underline;">${linkText}</a>`
      
      // Try to find a placeholder or append at the end
      if (formatted.includes('post-mortem doc') || formatted.includes('postmortem')) {
        formatted = formatted.replace(/post-mortem doc|postmortem/gi, linkHtml)
      } else if (formatted.includes('PR') || formatted.includes('pull request')) {
        formatted = formatted.replace(/PR #?\d+|pull request/gi, linkHtml)
      } else if (formatted.includes('dashboard')) {
        formatted = formatted.replace(/dashboard/gi, linkHtml)
      } else {
        // Append at the end
        formatted = formatted + ' - ' + linkHtml
      }
    }
    
    return formatted
  }

  // Helper to enhance message based on person traits
  const enhanceMessage = (text: string, person: Person, pickFn: <T,>(arr: T[]) => T): string => {
    // Skip enhancement for HTML messages (rich text announcements)
    if (text.includes('<strong>') || text.includes('<br>') || text.includes('<ul>') || text.includes('<li>')) {
      return text
    }
    
    let enhanced = text
    
    // Add formatting (italics and URLs)
    enhanced = addFormattingAndLinks(enhanced, pickFn)
    
    // Occasionally make messages longer for everyone
    if (Math.random() < 0.15) { // 15% chance
      enhanced = generateVerboseMessage(enhanced, pickFn)
    }
    
    // Add emojis for emoji-heavy people
    if (person['emoji-heavy']) {
      enhanced = addEmojis(enhanced, pickFn)
    }
    
    // Make verbose people's messages longer
    if (person.verbose) {
      if (Math.random() < 0.7) { // 70% chance for verbose people
        enhanced = generateVerboseMessage(enhanced, pickFn)
      }
    }
    
    return enhanced
  }

  // Initialize unread counts from static data
  useEffect(() => {
    const initialUnreads: Record<string, number> = {
      'hyperswitch-core': 3,
      'hyperswitch-growth': 0,
      'click2pay': 5,
      'ankur': 0,
      'sudhirr-nanda': 2,
      'akhil': 0,
      'sakshi-gupta': 0,
      'drishtant-kaushal': 1,
      'mudit-bhutani': 0,
      'pranav-jang-bahadur': 0,
      'meghana-kankara': 3,
      'harshita': 0,
      'rishabh-pandey': 0,
      'group-1': 0,
      'group-2': 2,
      'group-3': 0,
      'group-5': 0,
      'general': 0,
      'hyperswitch-dashboard': 2,
      'hyperswitch-sdk': 0,
      'ai-powered-dev': 0,
      'hyperswitch-random': 1,
      'juspay-food-and-facilities': 0,
      'lost-and-found': 0,
      'random': 0,
      'payment-security': 4,
      'sales-channels': 0,
      'service-centers': 0,
      'dealer-network': 0,
      'customer-support': 0,
      'warranty-services': 0,
      'parts-logistics': 0,
      'quality-assurance': 0,
      'testing-prototypes': 0,
      'design-studio': 0,
      'marketing-campaigns': 0,
      'product-planning': 0,
      'germany-team': 0,
      'france-team': 0,
      'italy-team': 0,
      'juspay-ai': 0,
    }
    setUnreadCounts(initialUnreads)
  }, [])

  // Chat list items organized by sections (unread counts come from state)
  const starredChats: ChatItem[] = [
    { id: 'hyperswitch-core', name: '#hyperswitch-core', unread: unreadCounts['hyperswitch-core'] || 0, type: 'starred' },
    { id: 'hyperswitch-growth', name: '#hyperswitch-growth', unread: unreadCounts['hyperswitch-growth'] || 0, type: 'starred', isPrivate: true },
    { id: 'click2pay', name: '#click2pay', unread: unreadCounts['click2pay'] || 0, type: 'starred' },
  ]
  
  // Get starred chat IDs to filter them out from other sections
  const starredChatIds = new Set(starredChats.map(c => c.id))
  
  const dmChats: ChatItem[] = [
    { id: 'juspay-ai', name: 'Juspay AI', unread: unreadCounts['juspay-ai'] || 0, type: 'dm', avatar: getAvatar('Juspay AI'), isOnline: onlineStatus['juspay-ai'] ?? true },
    { id: 'ankur', name: 'Ankur', unread: unreadCounts['ankur'] || 0, type: 'dm', avatar: getAvatar('Ankur'), isOnline: onlineStatus['ankur'] ?? true },
    { id: 'sudhirr-nanda', name: 'Sudhirr Nanda', unread: unreadCounts['sudhirr-nanda'] || 0, type: 'dm', avatar: getAvatar('Sudhirr Nanda'), isOnline: onlineStatus['sudhirr-nanda'] ?? true },
    { id: 'akhil', name: 'Akhil', unread: unreadCounts['akhil'] || 0, type: 'dm', avatar: getAvatar('Akhil'), isOnline: onlineStatus['akhil'] ?? false },
    { id: 'sakshi-gupta', name: 'Sakshi Gupta', unread: unreadCounts['sakshi-gupta'] || 0, type: 'dm', avatar: getAvatar('Sakshi Gupta'), isOnline: onlineStatus['sakshi-gupta'] ?? true },
    { id: 'drishtant-kaushal', name: 'Drishtant Kaushal', unread: unreadCounts['drishtant-kaushal'] || 0, type: 'dm', avatar: getAvatar('Drishtant Kaushal'), isOnline: onlineStatus['drishtant-kaushal'] ?? false },
    { id: 'mudit-bhutani', name: 'Mudit Bhutani', unread: unreadCounts['mudit-bhutani'] || 0, type: 'dm', avatar: getAvatar('Mudit Bhutani'), isOnline: onlineStatus['mudit-bhutani'] ?? true },
    { id: 'pranav-jang-bahadur', name: 'Pranav Jang Bahadur', unread: unreadCounts['pranav-jang-bahadur'] || 0, type: 'dm', avatar: getAvatar('Pranav Jang Bahadur'), isOnline: onlineStatus['pranav-jang-bahadur'] ?? true },
    { id: 'meghana-kankara', name: 'Meghana Kankara', unread: unreadCounts['meghana-kankara'] || 0, type: 'dm', avatar: getAvatar('Meghana Kankara'), statusEmoji: '🎉', isOnline: onlineStatus['meghana-kankara'] ?? false },
    { id: 'harshita', name: 'Harshita', unread: unreadCounts['harshita'] || 0, type: 'dm', avatar: getAvatar('Harshita'), statusEmoji: '☕', isOnline: onlineStatus['harshita'] ?? true },
    { id: 'rishabh-pandey', name: 'Rishabh Pandey', unread: unreadCounts['rishabh-pandey'] || 0, type: 'dm', avatar: getAvatar('Rishabh Pandey'), isOnline: onlineStatus['rishabh-pandey'] ?? false },
    { id: 'group-1', name: 'Akhil, Sakshi Gupta', unread: unreadCounts['group-1'] || 0, type: 'dm' },
    { id: 'group-2', name: 'Ankita Saha, Hetvi Kothari, Mudit Bhutani', unread: unreadCounts['group-2'] || 0, type: 'dm' },
    { id: 'group-3', name: 'Arnab, Deepanshu, Harshita', unread: unreadCounts['group-3'] || 0, type: 'dm' },
    { id: 'group-5', name: 'Spoorthi Ramesh, Abhijeet, Shruti Karmarkar', unread: unreadCounts['group-5'] || 0, type: 'dm' },
  ].filter(chat => chat.name !== getCurrentUser)
  
  const channelChats: ChatItem[] = ([
    { id: 'general', name: '#general', unread: unreadCounts['general'] || 0, type: 'channel' as const },
    { id: 'hyperswitch-dashboard', name: '#hyperswitch-dashboard', unread: unreadCounts['hyperswitch-dashboard'] || 0, type: 'channel' as const },
    { id: 'hyperswitch-sdk', name: '#hyperswitch-sdk', unread: unreadCounts['hyperswitch-sdk'] || 0, type: 'channel' as const },
    { id: 'ai-powered-dev', name: '#ai-powered-dev', unread: unreadCounts['ai-powered-dev'] || 0, type: 'channel' as const },
    { id: 'hyperswitch-random', name: '#hyperswitch-random', unread: unreadCounts['hyperswitch-random'] || 0, type: 'channel' as const },
    { id: 'juspay-food-and-facilities', name: '#juspay-food-and-facilities', unread: unreadCounts['juspay-food-and-facilities'] || 0, type: 'channel' as const },
    { id: 'lost-and-found', name: '#lost-and-found', unread: unreadCounts['lost-and-found'] || 0, type: 'channel' as const },
    { id: 'random', name: '#random', unread: unreadCounts['random'] || 0, type: 'channel' as const },
    { id: 'payment-security', name: '#payment-security', unread: unreadCounts['payment-security'] || 0, type: 'channel' as const },
    { id: 'fraud-detection', name: '#fraud-detection', unread: unreadCounts['fraud-detection'] || 0, type: 'channel' as const },
    { id: 'transaction-monitoring', name: '#transaction-monitoring', unread: unreadCounts['transaction-monitoring'] || 0, type: 'channel' as const },
    { id: 'api-development', name: '#api-development', unread: unreadCounts['api-development'] || 0, type: 'channel' as const },
    { id: 'product-planning', name: '#product-planning', unread: unreadCounts['product-planning'] || 0, type: 'channel' as const, isPrivate: true },
    { id: 'engineering', name: '#engineering', unread: unreadCounts['engineering'] || 0, type: 'channel' as const },
    { id: 'backend', name: '#backend', unread: unreadCounts['backend'] || 0, type: 'channel' as const },
    { id: 'frontend', name: '#frontend', unread: unreadCounts['frontend'] || 0, type: 'channel' as const },
    { id: 'devops', name: '#devops', unread: unreadCounts['devops'] || 0, type: 'channel' as const },
    { id: 'incidents', name: '#incidents', unread: unreadCounts['incidents'] || 0, type: 'channel' as const },
    { id: 'on-call', name: '#on-call', unread: unreadCounts['on-call'] || 0, type: 'channel' as const },
  ] as ChatItem[]).filter(chat => !starredChatIds.has(chat.id))

  // Generate realistic DM messages with natural conversation flow
  const generateRealisticDMMessage = (personName: string, currentUserName: string, pick: <T,>(arr: T[]) => T): { who: string, text: string } => {
    const conversationTopics = [
      {
        who: personName,
        text: pick([
          `Hey ${getFirstName(currentUserName)}! Quick question - do you have a minute to look at the PR I just opened? It's related to the connection pool optimization we discussed.`,
          `Morning! I wanted to follow up on yesterday's incident. The <a href="https://wiki.company.com/postmortems/${Math.floor(Math.random() * 5000) + 4000}" style="color: #1D9BD1; text-decoration: underline;">post-mortem doc</a> is ready - mind taking a look when you get a chance?`,
          `Hey! Just wanted to say thanks for helping debug that issue yesterday. Your suggestion about checking the connection pool metrics was <em>spot on</em>.`,
          `Quick heads up - I'm deploying the payment API changes around 2 PM today. Should be low risk, but wanted to give you a heads up in case anything comes up.`,
          `Hey! I saw your message in #engineering about the database performance. I've been seeing similar patterns - want to sync up on this?`,
          `Morning! Quick question about the <a href="https://monitoring.company.com/metrics/payment-api" style="color: #1D9BD1; text-decoration: underline;">monitoring dashboard</a> - are you seeing the same latency spikes I'm noticing in us-east-1?`,
          `Hey! I'm working on the incident response playbook and wanted to get your input on the escalation process. When are you free to chat?`,
          `Thanks for the code review! Your feedback on the error handling was really helpful. I've addressed all the comments.`,
          `Hey! Quick update - the deployment went smoothly. No issues so far, monitoring continues.`,
          `Morning! I'm investigating that alert from last night. Initial analysis suggests it was a false positive, but want to confirm with you before closing it out.`,
          `Hey! I noticed you're working on the API rate limiting changes. I have some context from a similar project last quarter - want to sync up?`,
          `Quick question - are you available for a quick call around 3 PM? I want to discuss the infrastructure scaling plan before the team meeting.`,
          `Hey! Just wanted to check in - how's the migration going? Let me know if you hit any blockers.`,
          `Morning! I saw the metrics improved after your changes yesterday. <em>Nice work!</em> The p95 latency is down significantly.`,
          `Hey! Quick heads up - I'm going to be doing some maintenance on the staging environment around 4 PM. Shouldn't affect anything, but wanted to let you know.`,
          `Hey! Quick question - do you have a minute to look at the <a href="https://github.com/company/repo/pull/${Math.floor(Math.random() * 2000) + 1000}" style="color: #1D9BD1; text-decoration: underline;">PR I just opened</a>? It's related to the connection pool optimization we discussed.`,
        ])
      },
      {
        who: currentUserName,
        text: pick([
          `Sure thing! I'll take a look this afternoon.`,
          `Thanks for the heads up! I'll keep an eye on it.`,
          `No problem at all - happy to help!`,
          `Sounds good, thanks for letting me know.`,
          `Yeah, I've been seeing that too. Let's sync up later today.`,
          `Good catch! I'll investigate on my end as well.`,
          `I'm free around 2 PM if that works for you.`,
          `Glad I could help! Let me know if you need anything else.`,
          `Great to hear it went smoothly!`,
          `Yeah, I agree it looks like a false positive. The metrics are back to normal now.`,
          `That would be helpful! I'm free this afternoon.`,
          `3 PM works for me!`,
          `Going well so far, thanks for checking in!`,
          `Thanks! Yeah, the optimization worked better than expected.`,
          `Got it, thanks for the heads up!`,
        ])
      },
      {
        who: personName,
        text: pick([
          `Perfect, thanks! I'll send you the link.`,
          `Appreciate it! Let me know what you think.`,
          `Awesome, talk to you then!`,
          `Great, catch you later!`,
          `Sounds good! I'll ping you when I'm ready.`,
          `Perfect timing - I'll send over the details.`,
          `Thanks again for your help!`,
          `Cool, I'll keep you posted on how it goes.`,
          `Great! I'll send you the post-mortem link.`,
          `Perfect! I'll follow up after the maintenance window.`,
        ])
      }
    ]
    
    // Alternate between person and current user for natural conversation flow
    const messageIndex = Math.floor(Math.random() * conversationTopics.length)
    return conversationTopics[messageIndex]
  }

  // Sophisticated message generator with realistic variation, length, and channel-specific content
  const generateRealisticMessage = (chatId: string, chatName: string, isChannel: boolean, isGroupDM: boolean, pick: <T,>(arr: T[]) => T): { who: string, text: string } => {
    const channelMessageGenerators: Record<string, () => { who: string, text: string }> = {
      'hyperswitch-core': () => {
        const scenarios = [
          {
            who: pick(['Ankur', 'Sudhirr Nanda', 'Akhil']),
            text: `Hyperswitch core ${pick(['v2.0 release deployed successfully', 'payment processing latency improved by 30%', 'new payment method integrations complete'])}. ${pick(['All tests passing', 'Performance excellent', 'Ready for production'])}.`
          },
          {
            who: pick(['Sakshi Gupta', 'Drishtant Kaushal', 'Mudit Bhutani']),
            text: `Payment gateway uptime: ${pick(['99.99% this month', 'zero downtime incidents', 'all systems stable'])}. ${pick(['Transaction volume up 25%', 'Success rate at 98.5%', 'Great performance'])}.`
          },
          {
            who: pick(['Pranav Jang Bahadur', 'Meghana Kankara', 'Harshita']),
            text: `Core API ${pick(['rate limiting implemented', 'authentication enhanced', 'error handling improved'])}. ${pick(['Security audit passed', 'Performance optimized', 'Ready for scale'])}.`
          },
        ]
        return pick(scenarios)
      },
      'hyperswitch-growth': () => {
        const scenarios = [
          {
            who: pick(['Meghana Kankara', 'Harshita', 'Rishabh Pandey']),
            text: `Q2 growth metrics ${pick(['exceeded by 15%', 'on track', 'ahead of schedule'])}. ${pick(['New merchant onboarding up 40%', 'Transaction volume growth strong', 'Customer satisfaction high'])}.`
          },
          {
            who: pick(['Ankur', 'Sudhirr Nanda', 'Akhil']),
            text: `Growth initiatives: ${pick(['New payment methods added', 'Merchant acquisition up 35% YoY', 'Market expansion successful'])}. ${pick(['Excellent quarter', 'Great results', 'Strong performance'])}.`
          },
        ]
        return pick(scenarios)
      },
      'click2pay': () => {
        const scenarios = [
          {
            who: pick(['Sakshi Gupta', 'Drishtant Kaushal', 'Mudit Bhutani']),
            text: `Click2Pay ${pick(['checkout success rate improved to 95%', 'new features deployed', 'user experience enhanced'])}.`
          },
          {
            who: pick(['Ankur', 'Sudhirr Nanda']),
            text: `Express checkout ${pick(['adoption up 40%', 'conversion rate improved', 'customer feedback positive'])} with new optimizations. ${pick(['Great progress', 'Excellent results', 'On track'])}.`
          },
        ]
        return pick(scenarios)
      },
      'hyperswitch-dashboard': () => {
        const scenarios = [
          {
            who: pick(['Pranav Jang Bahadur', 'Meghana Kankara', 'Harshita']),
            text: `Dashboard ${pick(['v3.0 released', 'new analytics features added', 'performance monitoring enhanced'])}. ${pick(['All features validated', 'Performance excellent', 'Ready for users'])}.`
          },
          {
            who: pick(['Ankur', 'Sudhirr Nanda', 'Akhil']),
            text: `Hey <span style="color: #1D9BD1 !important; font-weight: 600;">@Juspay AI</span>, can you help ${pick(['optimize the dashboard load time', 'analyze transaction metrics', 'review the analytics performance'])}?`
          },
        ]
        return pick(scenarios)
      },
      'ai-powered-dev': () => {
        const scenarios = [
          {
            who: pick(['Sakshi Gupta', 'Drishtant Kaushal', 'Mudit Bhutani']),
            text: `AI fraud detection ${pick(['accuracy improved to 99.2%', 'model retrained successfully', 'false positive rate reduced'])}.`
          },
          {
            who: pick(['Pranav Jang Bahadur', 'Meghana Kankara']),
            text: `<span style="color: #1D9BD1 !important; font-weight: 600;">@Juspay AI</span> what are the ${pick(['key fraud detection metrics', 'performance benchmarks', 'model accuracy targets'])} we should focus on?`
          },
        ]
        return pick(scenarios)
      },
      'battery-tech': () => {
        const scenarios = [
          {
            who: pick(['Alessandro Bianchi', 'Klaus Müller', 'Sophie Dubois']),
            text: `Battery ${pick(['cell chemistry shows 30% energy density improvement', 'charging speed: 0-80% in 18 minutes achieved', 'recycling program: 95% material recovery rate'])}.`
          },
        ]
        return pick(scenarios)
      },
      'engine-development': () => {
        const scenarios = [
          {
            who: pick(['Marco Rossi', 'Priya Patel', 'Michael Johnson']),
            text: `New AMG engine variant: ${Math.floor(Math.random() * 100) + 550}hp with ${pick(['improved fuel efficiency', 'reduced emissions', 'enhanced performance'])}.`
          },
        ]
        return pick(scenarios)
      },
      'safety-systems': () => {
        const scenarios = [
          {
            who: pick(['Emma Schmidt', 'Thomas Weber', 'Ananya Reddy']),
            text: `PRE-SAFE system ${pick(['enhancements: 40% faster activation time', 'testing complete', 'performance exceeding targets'])}.`
          },
        ]
        return pick(scenarios)
      },
      'general': () => {
        // Keep the existing long-form announcements for general channel
        return { who: 'Klaus Müller', text: 'Update on company initiatives' }
      },
      'eq-series': () => {
        const scenarios = [
          {
            who: pick(['Klaus Müller', 'Sophie Dubois', 'Marco Rossi']),
            text: `EQ series ${pick(['production numbers looking strong', 'sales up 35% YoY', 'customer feedback excellent'])}. ${pick(['12,000 units delivered', '4.9/5 rating', 'Strong demand'])}.`
          },
        ]
        return pick(scenarios)
      },
      'new-launches': () => {
        const scenarios = [
          {
            who: pick(['Emma Schmidt', 'Thomas Weber', 'Ananya Reddy']),
            text: `EQE SUV launch event ${pick(['scheduled for Geneva Motor Show', 'in final preparation', 'marketing materials ready'])}.`
          },
        ]
        return pick(scenarios)
      },
      'vehicle-connectivity': () => {
        const scenarios = [
          {
            who: pick(['Ananya Reddy', 'David Chen', 'Sarah Williams']),
            text: `5G connectivity ${pick(['integration complete', 'testing in production vehicles', 'performance excellent'])}. ${pick(['V2I protocols finalized', '99.9% uptime', 'Ready for deployment'])}.`
          },
        ]
        return pick(scenarios)
      },
      'sales-channels': () => {
        const scenarios = [
          {
            who: pick(['David Chen', 'Sarah Williams', 'Alessandro Bianchi']),
            text: `Sales channels: ${pick(['Q2 targets exceeded by 12%', 'Dealer network expanded', 'Customer satisfaction at 4.8/5'])}.`
          },
        ]
        return pick(scenarios)
      },
      'service-centers': () => {
        const scenarios = [
          {
            who: pick(['Klaus Müller', 'Sophie Dubois', 'Marco Rossi']),
            text: `Service centers: ${pick(['15 new locations opening', 'Response time improved by 40%', 'Parts availability at 98%'])}.`
          },
        ]
        return pick(scenarios)
      },
      'dealer-network': () => {
        const scenarios = [
          {
            who: pick(['Priya Patel', 'Michael Johnson', 'Emma Schmidt']),
            text: `Dealer network: ${pick(['Training program completed', 'New partnerships signed', 'Satisfaction survey: 92% positive'])}.`
          },
        ]
        return pick(scenarios)
      },
      'customer-support': () => {
        const scenarios = [
          {
            who: pick(['Thomas Weber', 'Ananya Reddy', 'David Chen']),
            text: `Customer support: ${pick(['Resolution time: 2.5 hours average', 'Satisfaction: 4.7/5', '24/7 coverage in 15 languages'])}.`
          },
        ]
        return pick(scenarios)
      },
      'warranty-services': () => {
        const scenarios = [
          {
            who: pick(['Sarah Williams', 'Alessandro Bianchi', 'Klaus Müller']),
            text: `Warranty services: ${pick(['Processing time reduced by 30%', 'Claim rate: 2.1%', 'Extended warranty program launched'])}.`
          },
        ]
        return pick(scenarios)
      },
      'parts-logistics': () => {
        const scenarios = [
          {
            who: pick(['Sophie Dubois', 'Marco Rossi', 'Priya Patel']),
            text: `Parts logistics: ${pick(['98% availability rate', 'Zero supply disruptions', 'Delivery time: 24 hours average'])}.`
          },
        ]
        return pick(scenarios)
      },
      'quality-assurance': () => {
        const scenarios = [
          {
            who: pick(['Michael Johnson', 'Emma Schmidt', 'Thomas Weber']),
            text: `Quality assurance: ${pick(['99.7% pass rate', 'Zero critical issues', 'Complaint rate down 25%'])}.`
          },
        ]
        return pick(scenarios)
      },
      'testing-prototypes': () => {
        const scenarios = [
          {
            who: pick(['Ananya Reddy', 'David Chen', 'Sarah Williams']),
            text: `Prototype testing: ${pick(['50,000 test kilometers completed', 'Crash tests passed', '200,000km durability testing done'])}.`
          },
        ]
        return pick(scenarios)
      },
      'design-studio': () => {
        const scenarios = [
          {
            who: pick(['Alessandro Bianchi', 'Klaus Müller', 'Sophie Dubois']),
            text: `Design studio: ${pick(['EQE interior design finalized', 'Exterior design approved', '12 new color options added'])}.`
          },
        ]
        return pick(scenarios)
      },
      'marketing-campaigns': () => {
        const scenarios = [
          {
            who: pick(['Marco Rossi', 'Priya Patel', 'Michael Johnson']),
            text: `Marketing campaigns: ${pick(['EQE launch: 50M impressions', 'Social engagement up 45%', '200+ publications featured'])}.`
          },
        ]
        return pick(scenarios)
      },
      'product-planning': () => {
        const scenarios = [
          {
            who: pick(['Emma Schmidt', 'Thomas Weber', 'Ananya Reddy']),
            text: `Product planning: ${pick(['2025 roadmap finalized', '5 new models planned', 'Strong demand for EQE SUV'])}.`
          },
        ]
        return pick(scenarios)
      },
      'germany-team': () => {
        const scenarios = [
          {
            who: pick(['David Chen', 'Sarah Williams', 'Alessandro Bianchi']),
            text: `Germany team: ${pick(['Sindelfingen facility: Record output', 'R&D center expansion', 'Team building event scheduled'])}.`
          },
        ]
        return pick(scenarios)
      },
      'france-team': () => {
        const scenarios = [
          {
            who: pick(['Klaus Müller', 'Sophie Dubois', 'Marco Rossi']),
            text: `France team: ${pick(['Hambach facility: EQA production ramping up', 'French market sales up 20%', '10 new dealer locations'])}.`
          },
        ]
        return pick(scenarios)
      },
      'italy-team': () => {
        const scenarios = [
          {
            who: pick(['Priya Patel', 'Michael Johnson', 'Emma Schmidt']),
            text: `Italy team: ${pick(['Modena AMG facility: New engine line operational', 'Strong luxury segment performance', 'Design collaboration active'])}.`
          },
        ]
        return pick(scenarios)
      },
    }
    
    const generator = channelMessageGenerators[chatId]
    if (generator) {
      return generator()
    }
    
    // Default fallback for channels without specific generators
    if (isChannel) {
      return {
        who: pick(['Klaus Müller', 'Sophie Dubois', 'Marco Rossi', 'Priya Patel', 'Michael Johnson', 'Emma Schmidt', 'Thomas Weber', 'Ananya Reddy', 'David Chen', 'Sarah Williams', 'Alessandro Bianchi']),
        text: `Update on ${chatName}. ${pick(['Looking good', 'Progress is excellent', 'On track', 'Great work'])}.`
      }
    }
    
    // Default fallback
    return {
      who: pick(['Klaus Müller', 'Sophie Dubois']),
      text: `Update on ${chatName}`
    }
  }

  // Generate contextual messages for each chat
  const generateContextualMessages = (chatId: string, chat: ChatItem): SlackMsg[] => {
    const allChats = [...starredChats, ...dmChats, ...channelChats]
    const chatData = allChats.find(c => c.id === chatId) || chat
    const chatName = chatData.name.replace('#', '')
    const isChannel = chatData.type === 'channel' || chatData.type === 'starred'
    const isDM = chatData.type === 'dm'
    const isGroupDM = chatData.id?.startsWith('group-')
    
    const messages: SlackMsg[] = []
    const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]
    
    // Track how many embeds we've added to this chat (target: 2-3 for healthy distribution)
    let embedCount = 0
    // Increase embed count: 4-7 for channels, 2-4 for DMs, 3-5 for group DMs
    const targetEmbedCount = isChannel ? 
      Math.floor(Math.random() * 4) + 4 : // 4-7 for channels
      (isGroupDM ? 
        Math.floor(Math.random() * 3) + 3 : // 3-5 for group DMs
        Math.floor(Math.random() * 3) + 2)   // 2-4 for individual DMs
    // Track which embed types we've used to ensure equal distribution
    const usedEmbedTypes: ('notion' | 'figma' | 'loom' | 'jira' | 'confluence')[] = []
    
    // Helper to check if a date is a weekend
    const isWeekend = (date: Date): boolean => {
      const day = date.getDay()
      return day === 0 || day === 6 // Sunday or Saturday
    }
    
    // Helper to get next weekday (skip weekends)
    const getNextWeekday = (date: Date): Date => {
      const next = new Date(date)
      next.setDate(next.getDate() + 1)
      while (isWeekend(next)) {
        next.setDate(next.getDate() + 1)
      }
      return next
    }
    
    // Generate messages over multiple weeks (2-4 weeks ago)
    const weeksAgo = Math.floor(Math.random() * 3) + 2 // 2-4 weeks
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - (weeksAgo * 7))
    
    // Ensure we start on a weekday
    while (isWeekend(startDate)) {
      startDate.setDate(startDate.getDate() + 1)
    }
    
    let currentDate = new Date(startDate)
    const endDate = new Date()
    endDate.setHours(17, 0, 0, 0) // End of today
    
    // Early return for juspay-ai DM - return AI assistant conversation history
    if (chatId === 'juspay-ai') {
      const historicalMessages: SlackMsg[] = []
      
      // Add conversation history with Juspay AI (helpful AI assistant)
      const conversationTopics = [
        {
          user: currentUserName,
          ai: 'Hello! I\'m Juspay AI, your payment technology AI assistant. I can help with technical questions, payment analytics, fraud detection insights, and provide analysis about our payment systems. How can I assist you today?'
        },
        {
          user: currentUserName,
          ai: 'I can help analyze payment gateway performance metrics, review transaction data, optimize payment processing systems, and provide insights on fraud detection. What would you like to explore?'
        },
        {
          user: currentUserName,
          ai: 'Based on the latest transaction data, our payment gateway is performing at 99.99% uptime. The payment success rate has improved by 2.5% since last quarter. Would you like me to dive deeper into any specific metrics?'
        },
        {
          user: currentUserName,
          ai: 'I\'ve analyzed the fraud detection system results. Detection accuracy is at 99.2%, which exceeds our target of 99%. The system is ready for the next phase of optimization.'
        }
      ]
      
      // Define time offsets for conversation history
      const timeOffsets = [
        { days: 3, hours: 10, minutes: 30 },  // 3 days ago at 10:30 AM
        { days: 2, hours: 14, minutes: 15 },   // 2 days ago at 2:15 PM
        { days: 1, hours: 11, minutes: 45 },  // 1 day ago at 11:45 AM
        { days: 0, hours: 9, minutes: 20 },   // Today at 9:20 AM
      ]
      
      for (let i = 0; i < 4; i++) {
        const offset = timeOffsets[i]
        const msgTime = new Date()
        msgTime.setDate(msgTime.getDate() - offset.days)
        msgTime.setHours(offset.hours, offset.minutes, 0, 0)
        
        const topic = conversationTopics[i % conversationTopics.length]
        
        // User message
        historicalMessages.push({
          id: `juspay-ai-user-${i}`,
          who: topic.user,
          text: i === 0 ? 'Hey Juspay AI, can you help me understand our current payment gateway performance?' : 
                i === 1 ? 'What kind of insights can you provide?' :
                i === 2 ? 'Tell me about payment processing performance' :
                'What about fraud detection systems?',
          when: msgTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
        })
        
        // Juspay AI response (slightly later)
        const responseTime = new Date(msgTime)
        responseTime.setMinutes(responseTime.getMinutes() + 2)
        historicalMessages.push({
          id: `juspay-ai-ai-${i}`,
          who: 'Juspay AI',
          text: topic.ai,
          when: responseTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
        })
      }
      
      return historicalMessages
    }
    
    // Early return for juspay-ai DM - return historical approval messages
    if (chatId === 'juspay-ai') {
      const historicalMessages: SlackMsg[] = []
      
      // Add 4 historical approval messages spaced out over time (oldest to newest)
      const employees = ['Marco Rossi', 'Priya Patel', 'Michael Johnson', 'Emma Schmidt']
      const approvalTypes = [
        { type: 'Leave Request', reason: 'Vacation', duration: '3 days' },
        { type: 'Leave Request', reason: 'Sick leave', duration: '1 day' },
        { type: 'Tool Access', tool: 'Salesforce', reason: 'Sales team access' },
        { type: 'Tool Access', tool: 'Jira', reason: 'Project management access' },
        { type: 'Expense Approval', amount: '€450', reason: 'Team lunch' },
      ]
      
      // Define time offsets: [days ago, hours offset from midnight, minutes offset]
      // This creates messages at different times: 5 days ago morning, 3 days ago afternoon, 1 day ago evening, 6 hours ago morning
      const timeOffsets = [
        { days: 5, hours: 9, minutes: 15 },   // 5 days ago at 9:15 AM
        { days: 3, hours: 14, minutes: 30 },  // 3 days ago at 2:30 PM
        { days: 1, hours: 17, minutes: 45 },  // 1 day ago at 5:45 PM
        { days: 0, hours: 6, minutes: 20 },   // 6 hours ago at 6:20 AM
      ]
      
      for (let i = 0; i < 4; i++) {
        const offset = timeOffsets[i]
        const msgTime = new Date()
        msgTime.setDate(msgTime.getDate() - offset.days)
        msgTime.setHours(offset.hours, offset.minutes, 0, 0)
        
        const employee = employees[i % employees.length]
        const approval = approvalTypes[i % approvalTypes.length]
        
        let messageText = ''
        let actionId = ''
        
        if (approval.type === 'Leave Request') {
          const startDate = new Date(msgTime.getTime() + 3 * 24 * 60 * 60 * 1000)
          const durationDays = parseInt(approval.duration || '1')
          const endDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000)
          const dates = `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
          messageText = `Hi! 👋<br><br>I have a leave request from <strong>${getFirstName(employee)}</strong> that needs your approval.<br><br><strong>Leave Details:</strong><br>• Dates: ${dates}<br>• Type: ${approval.reason}<br>• Duration: ${approval.duration}<br><br>Please review and approve or reject this request.`
          actionId = 'approve-leave-historical'
        } else if (approval.type === 'Tool Access') {
          messageText = `Hi! 👋<br><br>I have a tool access request from <strong>${getFirstName(employee)}</strong> that needs your approval.<br><br><strong>Access Details:</strong><br>• Tool: ${approval.tool}<br>• Reason: ${approval.reason}<br>• Requested: ${msgTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}<br><br>Please review and approve or reject this request.`
          actionId = 'approve-tool-historical'
        } else {
          messageText = `Hi! 👋<br><br>I have an expense approval request from <strong>${getFirstName(employee)}</strong>.<br><br><strong>Expense Details:</strong><br>• Amount: ${approval.amount}<br>• Reason: ${approval.reason}<br>• Date: ${msgTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}<br><br>Please review and approve or reject this request.`
          actionId = 'approve-expense-historical'
        }
        
        historicalMessages.push({
          id: `juspay-ai-historical-${i}-${Date.now()}`,
          who: 'Juspay AI',
          text: messageText,
          when: msgTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
          actions: [
            {
              id: actionId,
              label: 'Approved',
              type: 'primary' as const,
              emoji: '✅',
              confirmationText: `You approved this request on ${msgTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}.`
            }
          ]
        })
      }
      
      return historicalMessages
    }
    
    // Base message templates for different chat types
    const getMessageTemplates = (): (string | MessageAction[])[][] => {
      if (isChannel) {
        // Channel-specific messages - Mercedes-Benz automotive focused
        const channelMessages: Record<string, (string | MessageAction[])[][]> = {
        'eqe-launch': [
          ['Klaus Müller', 'Final production review for the EQE launch is complete. All systems green! 🚗'],
          ['Sophie Dubois', 'Marketing materials are ready. Press event scheduled for next week.'],
          ['Marco Rossi', 'Dealer training sessions completed across all European markets.'],
          ['Priya Patel', 'Quality assurance passed all 47 test scenarios. Ready for customer deliveries.'],
          ['Michael Johnson', 'Customer pre-orders exceeded expectations - 15,000 units in first 48 hours!'],
        ],
        'sales-updates': [
          ['Emma Schmidt', 'Q2 sales targets exceeded by 12%. Strong performance across all regions.'],
          ['Thomas Weber', 'EQ series sales up 35% YoY. Customer satisfaction scores at 4.8/5.'],
          ['Ananya Reddy', 'New dealer partnerships signed in 3 Asian markets.'],
        ],
        'service-network': [
          ['David Chen', 'Service center expansion: 15 new locations opening this quarter.'],
          ['Sarah Williams', 'Customer service response time improved by 40% with new AI tools.'],
          ['Alessandro Bianchi', 'Parts availability at 98% across all service centers.'],
        ],
        'general': [
          ['Klaus Müller', `<strong>🚗 Mercedes-Benz Q2 Strategic Initiatives</strong><br><br>
We're excited to share our strategic roadmap for Q2! This quarter, we're focusing on three key pillars:<br><br>
<strong>1. Electric Vehicle Expansion</strong><br>
• EQE and EQS production ramp-up across all facilities<br>
• New battery technology integration<br>
• Charging infrastructure partnerships<br>
• Customer delivery targets: 50,000+ units<br><br>
<strong>2. Autonomous Driving Innovation</strong><br>
• Level 3 autonomous features rollout<br>
• Advanced driver assistance systems (ADAS) enhancements<br>
• Safety testing and validation programs<br>
• Regulatory approvals in key markets<br><br>
<strong>3. Digital Services & MBUX</strong><br>
• Next-generation MBUX interface launch<br>
• Over-the-air update capabilities<br>
• Connected services expansion<br>
• AI-powered personalization features<br><br>
We'll be hosting an all-hands meeting next Friday at 2 PM to dive deeper into these initiatives. Looking forward to your questions and feedback!`],
          ['Sophie Dubois', `<strong>🏭 Production Milestone: 1 Million Electric Vehicles</strong><br><br>
I'm thrilled to announce that we've reached a historic milestone - 1 million electric vehicles produced! Here's what this achievement represents:<br><br>
<strong>Production Highlights:</strong><br>
• EQ series models: 850,000+ units<br>
• EQC, EQA, EQB, EQS, EQE combined production<br>
• Manufacturing facilities across 3 continents<br>
• 99.7% quality assurance pass rate<br><br>
<strong>Environmental Impact:</strong><br>
• CO2 emissions reduced by 2.5 million tons<br>
• Equivalent to planting 100 million trees<br>
• Zero-emission driving for millions of kilometers<br>
• Sustainable battery recycling program active<br><br>
This milestone positions us as a leader in the electric vehicle revolution. Thank you to all teams for their incredible dedication!`],
          ['Marco Rossi', `<strong>🎉 Welcome to Our New Team Members!</strong><br><br>
We're excited to welcome 25 new team members who joined us this month across various departments:<br><br>
<strong>Engineering & R&D:</strong><br>
• 8 Automotive Software Engineers<br>
• 5 Battery Technology Specialists<br>
• 4 Autonomous Driving Engineers<br>
• 2 MBUX Development Engineers<br><br>
<strong>Production & Quality:</strong><br>
• 3 Production Managers<br>
• 2 Quality Assurance Specialists<br>
• 1 Supply Chain Coordinator<br><br>
<strong>Sales & Service:</strong><br>
• 2 Sales Managers<br>
• 1 Service Network Coordinator<br><br>
Please make them feel welcome! They'll be introducing themselves in their respective team channels. We're also hosting a welcome lunch next Wednesday - details to follow!`],
          ['Priya Patel', `<strong>📅 Upcoming Company Events & Important Dates</strong><br><br>
Mark your calendars for these important dates:<br><br>
<strong>March:</strong><br>
• March 15: Q2 Planning All-Hands (2 PM - 4 PM)<br>
• March 22: Geneva Motor Show - EQE Launch Event<br>
• March 28: Monthly Town Hall<br><br>
<strong>April:</strong><br>
• April 5: Production Facility Tour - Sindelfingen<br>
• April 12: EQE Customer Delivery Event<br>
• April 19: Team Building Day<br>
• April 26: Q1 Retrospective Meeting<br><br>
<strong>May:</strong><br>
• May 3: Company-Wide Training Day<br>
• May 10: Dealer Conference - Munich<br>
• May 17: IAA Mobility Show Preparation<br>
• May 24: Memorial Day (US Office Closed)<br><br>
All events will be hybrid - join in person or remotely. Calendar invites will be sent out separately.`],
          ['Michael Johnson', `<strong>💡 Innovation Spotlight: Next-Gen Battery Technology</strong><br><br>
We're launching groundbreaking battery technology that will transform our electric vehicle capabilities:<br><br>
<strong>New Battery Features:</strong><br>
• 30% increased energy density<br>
• 50% faster charging times<br>
• Extended range: up to 800km per charge<br>
• Improved cold weather performance<br><br>
<strong>Production Improvements:</strong><br>
• Reduced manufacturing costs by 25%<br>
• Sustainable materials sourcing<br>
• Enhanced recycling capabilities<br>
• Improved safety standards<br><br>
<strong>Customer Benefits:</strong><br>
• Longer driving range<br>
• Faster charging at public stations<br>
• Reduced charging frequency<br>
• Better performance in all conditions<br><br>
These improvements represent over 18 months of R&D work from our battery technology team. Early testing shows exceptional results. Full rollout begins with EQE models next quarter!`],
          ['Emma Schmidt', `<strong>🏆 Q1 Results & Recognition</strong><br><br>
What an incredible Q1! Here are some highlights:<br><br>
<strong>Business Metrics:</strong><br>
• Vehicle sales: 580,000 units (up 8% YoY)<br>
• Electric vehicle sales: 75,000 units (up 45% YoY)<br>
• Customer satisfaction: 4.7/5 (up from 4.5)<br>
• Market share: 12.5% in premium segment<br><br>
<strong>Team Achievements:</strong><br>
• Zero critical quality issues this quarter<br>
• 99.7% production quality rate maintained<br>
• 3 new models launched successfully<br>
• 15 patents filed in autonomous driving<br><br>
<strong>Individual Recognition:</strong><br>
• Employee of the Quarter: Klaus Müller (Engineering)<br>
• Innovation Award: Sophie Dubois (R&D)<br>
• Customer Impact Award: Marco Rossi (Sales)<br>
• Team Player Award: Priya Patel (Quality Assurance)<br><br>
Congratulations to everyone for an outstanding quarter! Your hard work and dedication are what make these achievements possible.`],
          ['Thomas Weber', `<strong>🌍 Global Expansion Update: New Markets & Facilities</strong><br><br>
I'm excited to share major updates on our global expansion:<br><br>
<strong>New Production Facilities:</strong><br>
• Beijing: EQE production facility fully operational<br>
• Tuscaloosa: EQS production expansion complete<br>
• Kecskemét: Battery assembly plant opening next month<br>
• Jawor: Engine production facility expansion<br><br>
<strong>Market Expansion:</strong><br>
• Entry into 5 new Asian markets<br>
• Dealer network expansion: 200+ new locations<br>
• Service center network: 150+ new facilities<br>
• Charging infrastructure partnerships in 12 countries<br><br>
<strong>What This Means:</strong><br>
• Faster delivery times for customers globally<br>
• Enhanced local production capabilities<br>
• Improved supply chain resilience<br>
• Better support for international markets<br><br>
This expansion represents a €2B investment and positions Mercedes-Benz as a truly global automotive leader. Thank you to all teams for making this happen!`],
          ['Ananya Reddy', `<strong>📊 Annual Company Survey Results & Action Plan</strong><br><br>
Thank you to all 1,200+ team members who participated in our annual company survey! Here's what we learned:<br><br>
<strong>Key Findings:</strong><br>
• 96% of employees feel proud to work at Mercedes-Benz<br>
• 93% believe in our company mission and values<br>
• 90% feel their work has meaningful impact<br>
• 87% are satisfied with work-life balance<br>
• 85% feel they have opportunities for growth<br><br>
<strong>Areas for Improvement:</strong><br>
• Cross-department collaboration (implementing monthly cross-functional meetings)<br>
• Career development paths (new mentorship program launching next month)<br>
• Innovation time allocation (dedicated R&D time for all engineers)<br>
• Recognition and rewards (expanding our recognition program)<br><br>
<strong>Action Items (Next 90 Days):</strong><br>
• Launch company-wide mentorship program<br>
• Implement enhanced internal communication platform<br>
• Roll out new performance review process<br>
• Increase budget for professional development by 50%<br>
• Establish employee resource groups (ERGs) for diversity and inclusion<br><br>
Your feedback drives our decisions. Keep it coming!`],
          ['David Chen', `<strong>🔒 Quality & Safety: Major Milestones Achieved</strong><br><br>
Our quality and safety teams have been working tirelessly, and I'm thrilled to share some major achievements:<br><br>
<strong>Quality Certifications:</strong><br>
• ISO 9001: Quality management system certified<br>
• IATF 16949: Automotive quality standard achieved<br>
• ISO 14001: Environmental management certified<br>
• ISO 45001: Occupational health and safety certified<br><br>
<strong>Safety Enhancements:</strong><br>
• Zero workplace accidents this quarter<br>
• Advanced safety protocols implemented<br>
• Comprehensive training programs: 100% completion rate<br>
• Safety audits: All facilities passed<br><br>
<strong>Quality Metrics:</strong><br>
• 99.7% production quality rate<br>
• Customer complaint rate: Reduced by 30%<br>
• Warranty claims: Down 25% YoY<br>
• First-time quality: Improved to 98.5%<br><br>
Quality and safety are everyone's responsibility. Thank you for your commitment to excellence!`],
          ['Sarah Williams', `<strong>🌱 Sustainability & Environmental Impact: Our Commitment</strong><br><br>
As we grow, we're committed to being a leader in sustainable mobility:<br><br>
<strong>Environmental Initiatives:</strong><br>
• Carbon neutral production by 2025 (on track)<br>
• 100% renewable energy for all production facilities<br>
• Zero-waste manufacturing initiatives<br>
• Sustainable materials sourcing: 80% of suppliers certified<br><br>
<strong>Electric Vehicle Impact:</strong><br>
• 1 million+ electric vehicles on the road<br>
• 2.5 million tons CO2 emissions avoided<br>
• Battery recycling program: 95% material recovery<br>
• Charging infrastructure: 50,000+ charging points supported<br><br>
<strong>Social Responsibility:</strong><br>
• €5M annual commitment to education and mobility programs<br>
• Apprenticeship program: 500+ students per year<br>
• Community engagement: 10,000+ volunteer hours<br>
• Diversity & inclusion: 40% women in leadership roles<br><br>
Together, we're building not just great cars, but a sustainable future. Thank you for being part of this journey!`],
        ],
        'eq-series': [
          ['Klaus Müller', 'EQE production numbers looking strong this month. 12,000 units delivered.'],
          ['Sophie Dubois', 'Customer feedback on EQS is excellent - 4.9/5 rating.'],
          ['Marco Rossi', 'EQ series sales up 35% YoY across all markets.'],
        ],
        'new-launches': [
          ['Emma Schmidt', 'EQE SUV launch event scheduled for Geneva Motor Show.'],
          ['Thomas Weber', 'Pre-production prototypes completed. Testing phase begins next week.'],
          ['Ananya Reddy', 'Marketing campaign materials ready. Press kit finalized.'],
        ],
        'mbux-development': [
          ['David Chen', 'MBUX 3.0 interface testing complete. All features validated.'],
          ['Sarah Williams', 'Voice recognition accuracy improved to 98.5% in latest build.'],
          ['Alessandro Bianchi', 'Over-the-air update system ready for deployment.'],
          ['Klaus Müller', 'Hey <span style="color: #1D9BD1 !important; font-weight: 600;">@Juspay AI</span>, can you help optimize the MBUX response time?'],
          ['Juspay AI', 'Based on current telemetry data, I recommend optimizing the rendering pipeline. The MBUX interface can achieve 15% faster response times by implementing GPU-accelerated rendering. I\'ve identified 3 specific bottlenecks in the current implementation.'],
        ],
        'autonomous-driving': [
          ['Priya Patel', 'Level 3 autonomous driving tests completed successfully on German highways.'],
          ['Michael Johnson', 'Regulatory approval process initiated in 5 European countries.'],
          ['Emma Schmidt', 'Safety validation: 1 million test kilometers completed without incidents.'],
          ['Thomas Weber', '<span style="color: #1D9BD1 !important; font-weight: 600;">@Juspay AI</span> what are the key safety metrics we should focus on?'],
          ['Juspay AI', 'For Level 3 autonomous systems, critical safety metrics include: sensor fusion accuracy (target: >99.9%), decision-making latency (<100ms), and fail-safe activation time (<50ms). Current system performance shows 99.7% sensor fusion accuracy. Recommendation: enhance LiDAR redundancy for adverse weather conditions.'],
        ],
        'vehicle-connectivity': [
          ['Ananya Reddy', '5G connectivity integration complete. Testing in production vehicles.'],
          ['David Chen', 'Vehicle-to-infrastructure (V2I) communication protocols finalized.'],
          ['Sarah Williams', 'Connected services uptime: 99.9% this quarter.'],
        ],
        'battery-tech': [
          ['Alessandro Bianchi', 'New battery cell chemistry shows 30% energy density improvement.'],
          ['Klaus Müller', 'Charging speed tests: 0-80% in 18 minutes achieved.'],
          ['Sophie Dubois', 'Battery recycling program: 95% material recovery rate.'],
        ],
        'engine-development': [
          ['Marco Rossi', 'New AMG engine variant: 600hp with improved fuel efficiency.'],
          ['Priya Patel', 'Emissions testing passed all EU6d standards.'],
          ['Michael Johnson', 'Production tooling for new engine line completed.'],
        ],
        'safety-systems': [
          ['Emma Schmidt', 'PRE-SAFE system enhancements: 40% faster activation time.'],
          ['Thomas Weber', 'Crash test results: 5-star Euro NCAP rating achieved.'],
          ['Ananya Reddy', 'Active brake assist: 99.8% accuracy in test scenarios.'],
        ],
        'sales-channels': [
          ['David Chen', 'Q2 sales targets exceeded by 12%. Strong performance across all regions.'],
          ['Sarah Williams', 'Dealer network expansion: 50 new locations this quarter.'],
          ['Alessandro Bianchi', 'Customer satisfaction scores: 4.8/5 average.'],
        ],
        'service-centers': [
          ['Klaus Müller', 'Service center expansion: 15 new locations opening this quarter.'],
          ['Sophie Dubois', 'Customer service response time improved by 40% with new AI tools.'],
          ['Marco Rossi', 'Parts availability at 98% across all service centers.'],
        ],
        'dealer-network': [
          ['Priya Patel', 'Dealer training program completed: 200+ sales representatives certified.'],
          ['Michael Johnson', 'New dealer partnerships signed in 3 Asian markets.'],
          ['Emma Schmidt', 'Dealer satisfaction survey: 92% positive feedback.'],
        ],
        'customer-support': [
          ['Thomas Weber', 'Support ticket resolution time: Average 2.5 hours (down from 4 hours).'],
          ['Ananya Reddy', 'Customer satisfaction: 4.7/5 rating this quarter.'],
          ['David Chen', '24/7 support coverage now available in 15 languages.'],
        ],
        'warranty-services': [
          ['Sarah Williams', 'Warranty claim processing time reduced by 30%.'],
          ['Alessandro Bianchi', 'Warranty claim rate: 2.1% (industry average: 3.5%).'],
          ['Klaus Müller', 'Extended warranty program launched for EQ series vehicles.'],
        ],
        'parts-logistics': [
          ['Sophie Dubois', 'Parts inventory optimization: 98% availability rate achieved.'],
          ['Marco Rossi', 'Supply chain resilience: Zero disruptions this quarter.'],
          ['Priya Patel', 'Parts delivery time: Average 24 hours (improved from 48 hours).'],
        ],
        'quality-assurance': [
          ['Michael Johnson', 'Quality inspection pass rate: 99.7% (target: 99.5%).'],
          ['Emma Schmidt', 'Zero critical quality issues reported this quarter.'],
          ['Thomas Weber', 'Customer complaint rate: Reduced by 25% YoY.'],
        ],
        'testing-prototypes': [
          ['Ananya Reddy', 'EQE prototype testing: 50,000 test kilometers completed.'],
          ['David Chen', 'Crash test validation: All safety requirements exceeded.'],
          ['Sarah Williams', 'Durability testing: 200,000km equivalent completed successfully.'],
        ],
        'design-studio': [
          ['Alessandro Bianchi', 'EQE interior design finalized. Customer focus groups: 95% approval.'],
          ['Klaus Müller', 'Exterior design review: All stakeholders approved final concept.'],
          ['Sophie Dubois', 'Color palette selection: 12 new options added for EQ series.'],
        ],
        'marketing-campaigns': [
          ['Marco Rossi', 'EQE launch campaign: 50M impressions across digital channels.'],
          ['Priya Patel', 'Social media engagement: Up 45% compared to last launch.'],
          ['Michael Johnson', 'Press coverage: Featured in 200+ automotive publications.'],
        ],
        'product-planning': [
          ['Emma Schmidt', '2025 product roadmap finalized. 5 new models planned.'],
          ['Thomas Weber', 'Market research: Strong demand for EQE SUV variant.'],
          ['Ananya Reddy', 'Competitive analysis: Mercedes-Benz leads in premium EV segment.'],
        ],
        'germany-team': [
          ['David Chen', 'Sindelfingen production facility: Record output this month.'],
          ['Sarah Williams', 'R&D center expansion: 200 new engineers joining.'],
          ['Alessandro Bianchi', 'Team building event scheduled for next Friday.'],
        ],
        'france-team': [
          ['Klaus Müller', 'Hambach facility: EQA production ramping up successfully.'],
          ['Sophie Dubois', 'French market sales: Up 20% this quarter.'],
          ['Marco Rossi', 'Dealer network expansion: 10 new locations in France.'],
        ],
        'italy-team': [
          ['Priya Patel', 'Modena AMG facility: New engine production line operational.'],
          ['Michael Johnson', 'Italian market: Strong performance in luxury segment.'],
          ['Emma Schmidt', 'Design collaboration: Working with Italian design studios.'],
        ],
      }
      
        return channelMessages[chatId] || channelMessages['general'] || [
          ['Klaus Müller', `Update on ${chatName}`],
          ['Sophie Dubois', `Discussion about ${chatName}`],
          ['Marco Rossi', `New information regarding ${chatName}`],
          ['Priya Patel', `Status update for ${chatName}`],
          ['Michael Johnson', `Reviewing ${chatName} metrics`],
        ]
      } else if (isGroupDM) {
        const groupMembers = chatData.name.split(', ').map(name => name.trim()).filter(name => name !== getCurrentUser)
        return [
          [pick(groupMembers), 'Hey team!'],
          [pick(groupMembers), 'What do you think?'],
          [pick(groupMembers), 'Sounds good to me.'],
          [pick(groupMembers), 'Let\'s sync up.'],
          [pick(groupMembers), 'Thanks everyone!'],
        ]
      } else {
        // Individual DM
        const personName = getPersonNameFromChatId(chatId)
        if (personName) {
          return [
            [personName, 'Hey! How\'s it going?'],
            [currentUserName, 'Pretty good!'],
            [personName, 'Thanks for your help earlier!'],
            [currentUserName, 'No problem!'],
            [personName, 'Let me know if you need anything else.'],
          ]
        }
      }
      return [['Klaus Müller', 'Hey!']]
    }
    
    const templates = getMessageTemplates()
    let templateIndex = 0
    let messageId = 0
    
    // Generate messages across multiple days
    while (currentDate < endDate) {
      if (!isWeekend(currentDate)) {
        // Vary messages per day based on channel type and activity level
        let messagesPerDay: number
        if (chatId === 'general') {
          messagesPerDay = Math.floor(Math.random() * 3) + 1 // 1-3 per day for general (longer messages)
        } else if (isChannel) {
          messagesPerDay = Math.floor(Math.random() * 6) + 3 // 3-8 per day for regular channels
        } else {
          messagesPerDay = Math.floor(Math.random() * 4) + 2 // 2-5 per day for DMs
        }
        
        const startHour = 8 + Math.floor(Math.random() * 2) // 8-9 AM
        const endHour = 17 // 5 PM
        
        for (let i = 0; i < messagesPerDay; i++) {
          const hour = startHour + Math.floor((endHour - startHour) * (i / messagesPerDay))
          const minute = Math.floor(Math.random() * 60)
          
          const msgTime = new Date(currentDate)
          msgTime.setHours(hour, minute, 0, 0)
          
          let who: string
          let text: string
          
          // Use realistic message generator for channels (except general which has special long-form messages)
          if (isChannel && chatId !== 'general') {
            // Occasionally have Juspay AI post proactively (15% chance)
            if (Math.random() < 0.15) {
              const juspayAIPosts: Record<string, string[]> = {
                'mbux-development': [
                  'I\'ve completed an analysis of the MBUX performance metrics. Current system shows 98.5% uptime with voice recognition accuracy at 97.2%. Recommendation: optimize the rendering pipeline for 15% faster response times.',
                  'MBUX telemetry data indicates excellent stability. The neural network model is performing well. I suggest focusing on enhancing natural language understanding for better user experience.',
                  'Based on my analysis, the MBUX interface can achieve improved performance by implementing GPU-accelerated rendering. This would reduce latency by approximately 20%.',
                ],
                'autonomous-driving': [
                  'Autonomous driving system analysis complete. Sensor fusion accuracy at 99.7%, exceeding our target of 99.5%. Decision-making latency is currently at 85ms, well below the 100ms target.',
                  'I\'ve reviewed the latest test data. The Level 3 autonomous system demonstrates excellent performance in edge cases. Recommendation: enhance LiDAR redundancy for adverse weather conditions.',
                  'Safety validation metrics are exceeding targets. The system shows 99.9% accuracy in emergency scenarios. Ready for next phase of testing.',
                ],
                'battery-tech': [
                  'Battery performance analysis: Charging curves are optimal. Current implementation achieves 0-80% charge in 18 minutes with minimal degradation. Energy density improvements on track.',
                  'I\'ve analyzed the battery cell chemistry data. The new formulation shows 30% improvement while maintaining safety standards. Recycling efficiency at 95% material recovery.',
                  'Battery system metrics look excellent. Recommendation: expand recycling infrastructure to support increased production volume.',
                ],
                'vehicle-connectivity': [
                  '5G connectivity integration analysis: Latency reduced to <10ms for vehicle-to-infrastructure communication. Connected services uptime at 99.9%, exceeding targets.',
                  'Over-the-air update system analysis complete. Testing shows successful updates to 10,000+ vehicles without issues. System reliability metrics are optimal.',
                  'Vehicle connectivity metrics are strong. V2I protocols finalized and performing well in production environments.',
                ],
                'safety-systems': [
                  'PRE-SAFE system analysis: Activation time improved by 40%. Current performance exceeds industry standards. Crash test analysis shows 5-star Euro NCAP rating achieved.',
                  'Safety systems validation complete. Active brake assist accuracy at 99.8% in test scenarios. All safety systems performing optimally.',
                  'I\'ve reviewed the safety metrics. The system demonstrates excellent performance across all test scenarios. Ready for production deployment.',
                ],
                'eqe-launch': [
                  'EQE launch analysis: Production numbers on track. Customer feedback metrics show 4.8/5 rating. Quality metrics exceeding targets.',
                  'I\'ve analyzed the EQE launch data. Pre-orders exceeded expectations. Dealer training completion rate at 98%.',
                ],
                'sales-updates': [
                  'Sales analysis: Q2 targets exceeded by 12%. EQ series leading growth with 35% YoY increase. Customer satisfaction at 4.8/5.',
                  'I\'ve reviewed the sales metrics. Strong performance across all regions. Dealer network expansion successful.',
                ],
                'service-network': [
                  'Service network analysis: Response time improved by 40% with new AI tools. Parts availability at 98%. Customer satisfaction up.',
                  'I\'ve analyzed the service center metrics. Expansion plans on track. Efficiency improvements showing positive results.',
                ],
              }
              
              const juspayAIMessages = juspayAIPosts[chatId] || [
                'I\'ve analyzed the data and can provide insights. Based on current metrics, the system is performing well.',
                'Based on my analysis, I recommend focusing on these key areas for improvement.',
                'I\'ve reviewed the latest data. Here are my findings and recommendations.',
              ]
              
              who = 'Juspay AI'
              text = pick(juspayAIMessages)
            } else {
              const msg = generateRealisticMessage(chatId, chatName, isChannel, isGroupDM, pick)
              who = msg.who
              text = msg.text
            }
            
            // Check if message contains @Juspay AI mention and add response (for channels)
            if (text.includes('@Juspay AI') || text.includes('@juspay-ai') || text.toLowerCase().includes('juspay ai')) {
              // Add Juspay AI response after a short delay (simulated by adding it as next message)
              const juspayAIResponses: Record<string, string[]> = {
                'hyperswitch-core': [
                  'Based on current transaction data, I recommend optimizing the payment processing pipeline. The gateway can achieve 15% faster response times by implementing connection pooling.',
                  'I\'ve analyzed the payment gateway performance metrics. The bottleneck is in the payment method routing. Optimizing the routing algorithm can reduce latency by 20%.',
                  'Current payment gateway shows excellent stability. Recommendation: focus on enhancing the fraud detection for better transaction security.',
                ],
                'hyperswitch-dashboard': [
                  'For payment analytics dashboards, critical metrics include: transaction success rate (target: >99%), average processing time (<200ms), and fraud detection accuracy (>99%).',
                  'Based on dashboard analytics, the payment system shows 99.99% uptime. Recommendation: enhance real-time monitoring for better visibility.',
                  'Dashboard performance metrics are exceeding targets. The system demonstrates excellent reliability in high-traffic scenarios.',
                ],
                'payment-security': [
                  'Payment security analysis shows optimal encryption implementation. Current system achieves PCI-DSS compliance with zero security incidents.',
                  'Fraud detection improvements are on track. The new ML model shows 99.2% accuracy while maintaining low false positive rates.',
                  'Security audit efficiency at 100% compliance. Recommendation: expand security monitoring to support increased transaction volume.',
                ],
                'ai-powered-dev': [
                  'AI fraud detection integration shows excellent performance. Detection latency reduced to <50ms for real-time transaction analysis.',
                  'Fraud detection system uptime at 99.9% exceeds targets. Model accuracy metrics are optimal.',
                  'Machine learning model updates ready for deployment. Testing shows successful fraud detection on 1M+ transactions without issues.',
                ],
                'click2pay': [
                  'Click2Pay checkout success rate improved by 5%. Current performance exceeds industry standards.',
                  'Express checkout adoption increased by 40%. User experience metrics show significant improvement.',
                  'Payment conversion rate at 95% in A/B tests. System ready for production deployment.',
                ],
              }
              
              const channelResponses = juspayAIResponses[chatId] || [
                'I\'ve analyzed the data and can provide insights. Based on current metrics, the system is performing well.',
                'Thank you for the mention. I can help optimize this further. Let me analyze the relevant data.',
                'Based on my analysis, I recommend focusing on these key areas for improvement.',
              ]
              
              // Add Merc AI response message
              setTimeout(() => {
                const juspayAIMessage: SlackMsg = {
                  id: `${chatId}-mercai-${Date.now()}`,
                  who: 'Juspay AI',
                  text: pick(channelResponses),
                  when: new Date(msgTime.getTime() + 30000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
                }
                messages.push(juspayAIMessage)
              }, 100)
            }
          } else if (chatId === 'general') {
            // Keep existing long-form announcements for general channel
            // Occasionally have Juspay AI post proactively in general channel (10% chance)
            if (Math.random() < 0.10) {
              const juspayAIGeneralPosts = [
                'I\'ve analyzed company-wide metrics and can provide insights. Overall performance is strong across all departments.',
                'Based on my analysis of our systems and operations, I recommend focusing on these strategic areas.',
                'I\'ve reviewed the latest company data. Here are some insights that might be helpful for our Q2 initiatives.',
                'Company-wide analysis complete. Key metrics are trending positively. I can provide detailed breakdowns if needed.',
              ]
              
              who = 'Juspay AI'
              text = pick(juspayAIGeneralPosts)
            } else {
              const template = templates[templateIndex % templates.length]
              templateIndex++
              who = template[0] as string
              text = template[1] as string
            }
            
            // Check if message contains @Juspay AI mention in general channel and add response
            if (text.includes('@Juspay AI') || text.includes('@juspay-ai') || text.toLowerCase().includes('juspay ai')) {
              const generalChannelResponses = [
                'I\'ve analyzed the company-wide data and can provide insights. Based on current metrics across all departments, here\'s what I recommend.',
                'Thank you for mentioning me. I can help with strategic analysis and provide data-driven recommendations.',
                'Based on my analysis of our systems and operations, I suggest focusing on these key areas for improvement.',
                'I can help with that. Here\'s what I found from analyzing our company-wide data and metrics.',
                'Great question! Based on current performance metrics and industry best practices, here\'s my recommendation.',
              ]
              
              // Add Merc AI response message
              setTimeout(() => {
                const juspayAIMessage: SlackMsg = {
                  id: `${chatId}-mercai-${Date.now()}`,
                  who: 'Juspay AI',
                  text: pick(generalChannelResponses),
                  when: new Date(msgTime.getTime() + 30000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
                }
                messages.push(juspayAIMessage)
              }, 100)
            }
            
            // Handle actions if present (third element) - only for non-Merc AI messages
            if (who !== 'Juspay AI' && templates.length > 0) {
              const template = templates[templateIndex % templates.length]
              templateIndex++
              if (template.length > 2 && template[2]) {
                const actions = template[2] as unknown as MessageAction[]
                const person = people.find(p => p.n === who) || people[0]
                messages.push({
                  id: `${chatId}-${messageId++}`,
                  who: template[0] as string,
                  text: template[1] as string,
                  when: msgTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
                  actions,
                  _timestamp: msgTime.getTime()
                } as SlackMsg & { _timestamp: number })
                continue // Skip the normal message creation below
              }
            }
          } else if (isDM && !isGroupDM) {
            // Skip merc-ai DM - it has its own historical messages
            if (chatId === 'merc-ai') {
              continue
            }
            // Use realistic DM generator for individual DMs
            const personName = getPersonNameFromChatId(chatId)
            if (personName) {
              const msg = generateRealisticDMMessage(personName, currentUserName, pick)
              who = msg.who
              text = msg.text
            } else {
              // Fallback to templates
              const template = templates[templateIndex % templates.length]
              templateIndex++
              who = template[0] as string
              text = template[1] as string
            }
          } else {
            // Use templates for group DMs and fallback
            // Occasionally have Merc AI post proactively in group DMs (10% chance)
            if (isGroupDM && Math.random() < 0.10) {
              const mercAIGroupDMPosts = [
                'I\'ve analyzed the discussion and can provide some insights based on the latest data.',
                'Based on my analysis, I think focusing on these key areas would be beneficial.',
                'I\'ve reviewed the relevant metrics. Here\'s what I found that might be helpful.',
                'Let me share some insights from the data I\'ve been analyzing.',
                'I can provide some recommendations based on current performance metrics.',
              ]
              
              who = 'Juspay AI'
              text = pick(mercAIGroupDMPosts)
            } else {
              const template = templates[templateIndex % templates.length]
              templateIndex++
              who = template[0] as string
              text = template[1] as string
            }
            
            // Check if message contains @Juspay AI mention in group DMs and add response
            if (isGroupDM && (text.includes('@Juspay AI') || text.includes('@juspay-ai') || text.toLowerCase().includes('juspay ai'))) {
              const groupDMResponses = [
                'I\'ve analyzed the discussion and can provide insights. Based on the context, here\'s what I recommend.',
                'Thank you for mentioning me. I can help with that. Let me provide some relevant information.',
                'Based on my analysis of the topic, I suggest focusing on these key areas.',
                'I can help with that. Here\'s what I found from the latest data.',
                'Great question! Based on current metrics and best practices, here\'s my recommendation.',
              ]
              
              // Add Merc AI response message
              setTimeout(() => {
                const juspayAIMessage: SlackMsg = {
                  id: `${chatId}-mercai-${Date.now()}`,
                  who: 'Juspay AI',
                  text: pick(groupDMResponses),
                  when: new Date(msgTime.getTime() + 30000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
                }
                messages.push(juspayAIMessage)
              }, 100)
            }
          }
          
          // Find person object
          const person = people.find(p => p.n === who) || people[0]
          
          // Enhance message based on person traits (skip for HTML/rich text)
          if (!text.includes('<strong>') && !text.includes('<br>')) {
            const personObj = getPerson(who)
            text = enhanceMessage(text, personObj || { name: who, avatar: person.a }, pick)
          }
          
          // Add reactions to genuinely noteworthy messages (realistic, sparse reactions)
          let reactions: Record<string, number> | undefined = undefined
          const textWithoutHtml = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').toLowerCase()
          
          // Get company context for industry-aware reactions
          const companyIndustry = ((companyData as any).industry || '').toLowerCase()
          const isGeneralChannel = chatId === 'general'
          
          // Realistic reaction logic: Only truly noteworthy messages get reactions
          const shouldHaveReactions = (): boolean => {
            // Base probability: Higher for channels, moderate for DMs
            // General channel: 40%, other channels: 30%, group DMs: 20%, individual DMs: 15%
            const baseChance = isGeneralChannel ? 0.40 : (isChannel ? 0.30 : (isGroupDM ? 0.20 : 0.15))
            if (Math.random() > baseChance) return false
            
            // Major announcements and milestones (high probability)
            const majorAnnouncements = ['announce', 'milestone', 'achievement', 'breakthrough', 'major', 'strategic initiative', 'company-wide', 'exciting news', 'thrilled to', 'proud to']
            if (majorAnnouncements.some(keyword => textWithoutHtml.includes(keyword))) {
              return Math.random() < 0.90 // 90% chance for major announcements
            }
            
            // Celebratory messages with strong positive language
            const celebratoryPhrases = ['congratulations', 'congrats', 'celebrate', 'amazing work', 'incredible', 'fantastic', 'outstanding', 'well done', 'great job', 'excellent work', 'awesome', 'nice work', 'good job']
            if (celebratoryPhrases.some(phrase => textWithoutHtml.includes(phrase))) {
              return Math.random() < 0.75 // 75% chance for celebratory messages
            }
            
            // Launch/product release announcements
            const launchKeywords = ['launch', 'released', 'shipping', 'available now', 'go live', 'live now', 'deployed', 'complete', 'finished']
            if (launchKeywords.some(keyword => textWithoutHtml.includes(keyword))) {
              return Math.random() < 0.70 // 70% chance for launches
            }
            
            // Major achievements with numbers/metrics (e.g., "1 million", "exceeded targets")
            if ((textWithoutHtml.includes('million') || textWithoutHtml.includes('exceeded') || 
                 textWithoutHtml.includes('record') || textWithoutHtml.includes('all-time high') ||
                 textWithoutHtml.match(/\d+%/) || textWithoutHtml.match(/\d{4,}/)) && 
                (textWithoutHtml.includes('sales') || textWithoutHtml.includes('revenue') || 
                 textWithoutHtml.includes('users') || textWithoutHtml.includes('customers') ||
                 textWithoutHtml.includes('units') || textWithoutHtml.includes('delivered'))) {
              return Math.random() < 0.75 // 75% chance for major metrics
            }
            
            // Thank you messages (only in channels, not DMs, and only sometimes)
            if (!isDM && (textWithoutHtml.includes('thank you') || textWithoutHtml.includes('thanks everyone') || 
                textWithoutHtml.includes('appreciate') || textWithoutHtml.includes('thanks'))) {
              return Math.random() < 0.50 // 50% chance for thank yous
            }
            
            // Messages that already contain celebratory emojis (people reacted because it's exciting)
            if (text.includes('🚀') || text.includes('🎉') || text.includes('🏆') || 
                text.includes('💡') || text.includes('📢') || text.includes('🔥')) {
              return Math.random() < 0.65 // 65% chance if message already has emojis
            }
            
            // Industry-specific achievements (detected from company data)
            if (companyIndustry.includes('automotive')) {
              if (textWithoutHtml.includes('production') || textWithoutHtml.includes('delivered') ||
                  textWithoutHtml.includes('safety') || textWithoutHtml.includes('test') ||
                  textWithoutHtml.includes('vehicle') || textWithoutHtml.includes('launch')) {
                return Math.random() < 0.60 // 60% chance for automotive achievements
              }
            } else if (companyIndustry.includes('finance') || companyIndustry.includes('banking')) {
              if (textWithoutHtml.includes('compliance') || textWithoutHtml.includes('regulatory') ||
                  textWithoutHtml.includes('approved') || textWithoutHtml.includes('passed')) {
                return Math.random() < 0.55 // 55% chance for finance milestones
              }
            } else if (companyIndustry.includes('healthcare')) {
              if (textWithoutHtml.includes('clinical') || textWithoutHtml.includes('fda') ||
                  textWithoutHtml.includes('patient') || textWithoutHtml.includes('trial')) {
                return Math.random() < 0.60 // 60% chance for healthcare milestones
              }
            }
            
            // Long-form announcements (usually important)
            if (text.includes('<strong>') || text.includes('<br><br>')) {
              return Math.random() < 0.85 // 85% chance for formatted announcements
            }
            
            // Success/completion messages
            if (textWithoutHtml.includes('success') || textWithoutHtml.includes('completed') ||
                textWithoutHtml.includes('resolved') || textWithoutHtml.includes('fixed') ||
                textWithoutHtml.includes('improved') || textWithoutHtml.includes('ready')) {
              return Math.random() < 0.50 // 50% chance for success messages
            }
            
            return true // If we passed the base chance, allow reactions
          }
          
          if (shouldHaveReactions()) {
            reactions = {}
            const reactionEmojis: string[] = []
            
            // Context-appropriate emojis based on message content and industry
            if (textWithoutHtml.includes('announce') || textWithoutHtml.includes('welcome') || isGeneralChannel) {
              reactionEmojis.push('👍', '❤️', '🎉', '🔥', '👏', '🚀', '💯', '🙌')
            } else if (textWithoutHtml.includes('launch') || textWithoutHtml.includes('release')) {
              reactionEmojis.push('🚀', '🎉', '🔥', '👏', '💯')
            } else if (textWithoutHtml.includes('congratulations') || textWithoutHtml.includes('congrats')) {
              reactionEmojis.push('🎉', '👏', '🙌', '❤️', '🔥')
            } else if (textWithoutHtml.includes('thank') || textWithoutHtml.includes('appreciate')) {
              reactionEmojis.push('👍', '❤️', '🙏')
            } else if (textWithoutHtml.includes('milestone') || textWithoutHtml.includes('achievement')) {
              reactionEmojis.push('🏆', '🎉', '🔥', '💯', '👏')
            } else {
              // Default reactions for other noteworthy messages
              reactionEmojis.push('👍', '🔥', '👏', '💯')
            }
            
            // Realistic reaction counts: Most messages get 1-2 reactions, major announcements get more
            const isMajorAnnouncement = textWithoutHtml.includes('announce') || textWithoutHtml.includes('milestone') || 
                                       textWithoutHtml.includes('company-wide') || isGeneralChannel
            
            const numReactions = isMajorAnnouncement ? 
              Math.floor(Math.random() * 3) + 2 : // 2-4 for major announcements
              (isDM && !isGroupDM ? 
                Math.floor(Math.random() * 2) + 1 : // 1-2 for DMs
                Math.floor(Math.random() * 2) + 1)   // 1-2 for regular channels
            
            for (let i = 0; i < numReactions; i++) {
              const availableEmojis = reactionEmojis.filter(e => !reactions![e])
              if (availableEmojis.length === 0) break
              const emoji = pick(availableEmojis)
              
              // Realistic reaction counts based on chat type
              if (isDM && !isGroupDM) {
                // 1:1 DM: Typically count = 1, rarely 2 (if both people reacted)
                // 85% chance of count 1, 15% chance of count 2
                reactions![emoji] = Math.random() < 0.85 ? 1 : 2
              } else if (isMajorAnnouncement) {
                // Major announcements in channels/group DMs: 2-5 reactions
                reactions![emoji] = Math.floor(Math.random() * 4) + 2
              } else {
                // Regular channels/group DMs: 1-3 reactions
                reactions![emoji] = Math.floor(Math.random() * 3) + 1
              }
            }
            
            // Only return reactions if we actually added some
            if (Object.keys(reactions).length === 0) {
              reactions = undefined
            }
          }
          
          // Add link embeds (all 5 types: Notion, Figma, Loom, Jira, Confluence) in equal proportions
          // Add embeds until we reach target count for this chat
          // Higher probability: 50% for channels, 40% for group DMs, 35% for individual DMs
          const embedProbability = isChannel ? 0.50 : (isGroupDM ? 0.40 : 0.35)
          if (embedCount < targetEmbedCount && Math.random() < embedProbability) {
            // All 5 embed types
            const allEmbedTypes: ('notion' | 'figma' | 'loom' | 'jira' | 'confluence')[] = ['notion', 'figma', 'loom', 'jira', 'confluence']
            
            // Prefer types we haven't used yet for equal distribution
            const availableTypes = allEmbedTypes.filter(type => !usedEmbedTypes.includes(type))
            const embedTypesToChooseFrom = availableTypes.length > 0 ? availableTypes : allEmbedTypes
            const embedType = pick(embedTypesToChooseFrom)
            
            let embedUrl = ''
            switch (embedType) {
              case 'notion':
                embedUrl = `https://notion.so/${pick(['product-roadmap-q2', 'engineering-design-doc', 'api-architecture-overview', 'database-migration-plan', 'user-onboarding-flow', 'incident-response-procedures', 'feature-prioritization-framework', 'service-architecture-guide', 'user-behavior-analytics', 'deployment-best-practices'])}`
                break
              case 'figma':
                embedUrl = `https://figma.com/file/${pick(['abc123', 'def456', 'ghi789', 'jkl012', 'mno345'])}/${pick(['design-system-components', 'mobile-app-ui', 'web-dashboard', 'color-palette', 'onboarding-flow', 'button-library', 'icon-set', 'navigation-patterns', 'dashboard-views', 'card-patterns'])}`
                break
              case 'loom':
                embedUrl = `https://loom.com/share/${pick(['a1b2c3d4', 'e5f6g7h8', 'i9j0k1l2', 'm3n4o5p6', 'q7r8s9t0', 'u1v2w3x4', 'y5z6a7b8', 'c9d0e1f2'])}`
                break
              case 'jira':
                embedUrl = `https://jira.company.com/browse/${pick(['ENG', 'PROD', 'DEV', 'OPS', 'SEC'])}-${Math.floor(Math.random() * 5000) + 1000}`
                break
              case 'confluence':
                embedUrl = `https://confluence.company.com/pages/viewpage.action?pageId=${Math.floor(Math.random() * 90000) + 10000}`
                break
            }
            
            // Append embed link to message text as a clickable link
            text = `${text} <a href="${embedUrl}" style="color: #1D9BD1; text-decoration: underline;">${embedUrl}</a>`
            embedCount++
            usedEmbedTypes.push(embedType)
          }
          
          messages.push({
            id: `${chatId}-${messageId++}`,
            who: person.n,
            text,
            when: msgTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
            reactions,
            _timestamp: msgTime.getTime() // Store timestamp for sorting
          } as SlackMsg & { _timestamp: number })
        }
      }
      
      // Move to next weekday
      currentDate = getNextWeekday(currentDate)
    }
    
    // Sort messages by timestamp (oldest first)
    messages.sort((a, b) => {
      const aTime = (a as any)._timestamp || 0
      const bTime = (b as any)._timestamp || 0
      return aTime - bTime
    })
    
    // Remove _timestamp before returning
    return messages.slice(-200).map((msg: any) => {
      const { _timestamp, ...rest } = msg
      return rest as SlackMsg
    }) // Keep last 200 messages
  }

  // Handle chat selection - clear unread count with delay
  const handleChatSelect = (chatId: string) => {
    setSelectedChat(chatId)
    // Delay clearing unread count by 300ms for smooth transition
    setTimeout(() => {
      setUnreadCounts(prev => ({ ...prev, [chatId]: 0 }))
    }, 300)
  }

  // Close reaction picker when clicking outside
  useEffect(() => {
    if (!showReactionPicker) return
    
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      // Check if click is outside the reaction picker and emoji button
      if (!target.closest('[data-reaction-picker]') && !target.closest('[data-emoji-button]')) {
        setShowReactionPicker(null)
        // Also clear hover state when closing picker
        setHoveredMessageId(null)
        // Clear hover background from the message
        const messageElement = document.querySelector(`[data-message-id="${showReactionPicker}"]`) as HTMLElement
        if (messageElement) {
          messageElement.style.background = 'transparent'
        }
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showReactionPicker])

  // Keyboard shortcuts: Press 'P' for leave approval, 'Q' for tool access approval
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only trigger if not typing in an input/textarea
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
      
      if (selectedChat === 'juspay-ai') {
        if (e.key === 'p' || e.key === 'P') {
          // Press 'P' to trigger leave approval request
          const leaveDates = `${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
          const juspayAiMessage: SlackMsg = {
            id: `juspay-ai-leave-${Date.now()}`,
            who: 'Juspay AI',
            text: `Hi! 👋<br><br>I have a leave request from <strong>Sophie</strong> that needs your approval.<br><br><strong>Leave Details:</strong><br>• Dates: ${leaveDates}<br>• Type: Vacation<br>• Duration: 4 days<br>• Reason: Personal time off<br><br>Please review and approve or reject this request.`,
            when: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
            actions: [
              {
                id: 'approve-leave',
                label: 'Approve Leave',
                type: 'primary' as const,
                emoji: '✅',
                confirmationText: 'You have approved the leave request. Sophie has been notified.'
              },
              {
                id: 'reject-leave',
                label: 'Reject',
                type: 'secondary' as const,
                confirmationText: 'You have rejected the leave request. Sophie has been notified.'
              }
            ]
          }
          
          // Add message with a small delay for smooth appearance
          setTimeout(() => {
            setChatMessages(prev => {
              const current = prev['juspay-ai'] || []
              return { ...prev, 'juspay-ai': [...current, juspayAiMessage] }
            })
          }, 200)
        } else if (e.key === 'q' || e.key === 'Q') {
          // Press 'Q' to trigger tool access approval request
          const employees = ['Marco Rossi', 'Priya Patel', 'Michael Johnson', 'Emma Schmidt', 'Thomas Weber']
          const tools = ['Salesforce', 'Jira', 'Confluence', 'GitHub Enterprise', 'Figma', 'Tableau']
          const reasons = ['Project access', 'Team collaboration', 'Data analysis', 'Design work', 'Development access']
          
          const employee = employees[Math.floor(Math.random() * employees.length)]
          const tool = tools[Math.floor(Math.random() * tools.length)]
          const reason = reasons[Math.floor(Math.random() * reasons.length)]
          
          const juspayAiMessage: SlackMsg = {
            id: `juspay-ai-tool-${Date.now()}`,
            who: 'Juspay AI',
            text: `Hi! 👋<br><br>I have a tool access request from <strong>${getFirstName(employee)}</strong> that needs your approval.<br><br><strong>Access Details:</strong><br>• Tool: ${tool}<br>• Reason: ${reason}<br>• Requested: ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}<br><br>Please review and approve or reject this request.`,
            when: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
            actions: [
              {
                id: 'approve-tool',
                label: 'Approve Access',
                type: 'primary' as const,
                emoji: '✅',
                confirmationText: `You have approved the ${tool} access request. ${getFirstName(employee)} has been notified.`
              },
              {
                id: 'reject-tool',
                label: 'Reject',
                type: 'secondary' as const,
                confirmationText: `You have rejected the ${tool} access request. ${getFirstName(employee)} has been notified.`
              }
            ]
          }
          
          // Add message with a small delay for smooth appearance
          setTimeout(() => {
            setChatMessages(prev => {
              const current = prev['juspay-ai'] || []
              return { ...prev, 'juspay-ai': [...current, juspayAiMessage] }
            })
          }, 200)
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [selectedChat, chatMessages, currentUserName])

  // Initialize messages for all chats
  useEffect(() => {
    const allChats = [...starredChats, ...dmChats, ...channelChats]
    const initialMessages: Record<string, SlackMsg[]> = {}
    
    allChats.forEach(chat => {
      initialMessages[chat.id] = generateContextualMessages(chat.id, chat)
    })
    
    setChatMessages(initialMessages)
  }, [])

  // Periodic message system - adds messages to random chats every few seconds
  useEffect(() => {
    const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]
    
    // Get all chat IDs statically (don't depend on unreadCounts)
    // Exclude juspay-ai from periodic messages - it doesn't stream
    const allChatIds = [
      'alice', 'bob', 'carol', 'eve', 'james', 'priya', 'david', 'sarah', 'mike',
      'group-1', 'group-2', 'group-3', 'group-5',
      'eqe-launch', 'sales-updates', 'service-network', 'general', 'eq-series', 'new-launches', 'mbux-development', 'autonomous-driving', 'vehicle-connectivity', 'battery-tech', 'engine-development', 'safety-systems',
      'sales-channels', 'service-centers', 'dealer-network', 'customer-support', 'warranty-services', 'parts-logistics', 'quality-assurance', 'testing-prototypes', 'design-studio', 'marketing-campaigns', 'product-planning', 'germany-team', 'france-team', 'italy-team'
    ]
    
    const generateMessageForChat = (chatId: string): SlackMsg | null => {
      const chatName = chatId.replace('#', '').replace(/-/g, ' ')
      const isChannel = chatId.startsWith('#') || ['eqe-launch', 'sales-updates', 'service-network', 'general', 'eq-series', 'new-launches', 'mbux-development', 'autonomous-driving', 'vehicle-connectivity', 'battery-tech', 'engine-development', 'safety-systems', 'sales-channels', 'service-centers', 'dealer-network', 'customer-support', 'warranty-services', 'parts-logistics', 'quality-assurance', 'testing-prototypes', 'design-studio', 'marketing-campaigns', 'product-planning', 'germany-team', 'france-team', 'italy-team'].includes(chatId)
      const isGroupDM = chatId.startsWith('group-')
      const isDM = !isChannel && !isGroupDM
      
      let p = pick(getOtherPeople)
      let text = ''
      
      if (chatId === 'juspay-ai') {
        // Juspay AI does not stream random messages - skip it
        return null
      } else if (chatId === 'merc-ai') {
        // Merc AI does not stream random messages in its own DM - skip it
        // But Merc AI can post in channels and group DMs (handled below)
        return null
      } else if (isChannel) {
        // Use realistic message generator for channels
        // Occasionally have Merc AI post proactively (15% chance)
        if (Math.random() < 0.15) {
          const juspayAIPosts: Record<string, string[]> = {
            'mbux-development': [
              'I\'ve completed an analysis of the MBUX performance metrics. Current system shows 98.5% uptime with voice recognition accuracy at 97.2%.',
              'MBUX telemetry data indicates excellent stability. Recommendation: optimize the rendering pipeline for 15% faster response times.',
              'Based on my analysis, the MBUX interface can achieve improved performance by implementing GPU-accelerated rendering.',
            ],
            'autonomous-driving': [
              'Autonomous driving system analysis complete. Sensor fusion accuracy at 99.7%, exceeding our target of 99.5%.',
              'I\'ve reviewed the latest test data. The Level 3 autonomous system demonstrates excellent performance in edge cases.',
              'Safety validation metrics are exceeding targets. Ready for next phase of testing.',
            ],
            'battery-tech': [
              'Battery performance analysis: Charging curves are optimal. Current implementation achieves 0-80% charge in 18 minutes.',
              'I\'ve analyzed the battery cell chemistry data. The new formulation shows 30% improvement while maintaining safety standards.',
              'Battery system metrics look excellent. Recycling efficiency at 95% material recovery.',
            ],
            'vehicle-connectivity': [
              '5G connectivity integration analysis: Latency reduced to <10ms for vehicle-to-infrastructure communication.',
              'Over-the-air update system analysis complete. Testing shows successful updates to 10,000+ vehicles without issues.',
              'Vehicle connectivity metrics are strong. Connected services uptime at 99.9%.',
            ],
            'safety-systems': [
              'PRE-SAFE system analysis: Activation time improved by 40%. Current performance exceeds industry standards.',
              'Safety systems validation complete. Active brake assist accuracy at 99.8% in test scenarios.',
              'I\'ve reviewed the safety metrics. The system demonstrates excellent performance across all test scenarios.',
            ],
          }
          
          const juspayAIMessages = juspayAIPosts[chatId] || [
            'I\'ve analyzed the data and can provide insights. Based on current metrics, the system is performing well.',
            'Based on my analysis, I recommend focusing on these key areas for improvement.',
            'I\'ve reviewed the latest data. Here are my findings and recommendations.',
          ]
          
          p = people.find(pp => pp.n === 'Merc AI') || p
          text = pick(juspayAIMessages)
        } else {
          const msg = generateRealisticMessage(chatId, chatName, isChannel, isGroupDM, pick)
          // IMPORTANT: Ensure current user never sends messages automatically in channels
          // If the generated message is from current user, regenerate until we get someone else
          let finalMsg = msg
          let attempts = 0
          while (finalMsg.who === getCurrentUser && attempts < 10) {
            finalMsg = generateRealisticMessage(chatId, chatName, isChannel, isGroupDM, pick)
            attempts++
          }
          // If still current user after attempts, use getOtherPeople
          if (finalMsg.who === getCurrentUser) {
            p = pick(getOtherPeople)
            text = `Update on ${chatName}.`
          } else {
            p = people.find(pp => pp.n === finalMsg.who) || p
            // Double-check: if somehow current user got through, use getOtherPeople
            if (p.n === getCurrentUser) {
              p = pick(getOtherPeople)
            }
            text = finalMsg.text
          }
        }
        
        // Check if message contains @Juspay AI mention in channels and add response
        if (text.includes('@Juspay AI') || text.includes('@juspay-ai') || text.toLowerCase().includes('juspay ai')) {
          const mercAIResponses: Record<string, string[]> = {
            'mbux-development': [
              'Based on current telemetry data, I recommend optimizing the rendering pipeline. The MBUX interface can achieve 15% faster response times by implementing GPU-accelerated rendering.',
              'I\'ve analyzed the MBUX performance metrics. The bottleneck is in the voice recognition processing. Optimizing the neural network model can reduce latency by 20%.',
              'Current MBUX system shows excellent stability. Recommendation: focus on enhancing the natural language understanding for better user experience.',
            ],
            'autonomous-driving': [
              'For Level 3 autonomous systems, critical safety metrics include: sensor fusion accuracy (target: >99.9%), decision-making latency (<100ms), and fail-safe activation time (<50ms).',
              'Based on test data analysis, the autonomous driving system shows 99.7% sensor fusion accuracy. Recommendation: enhance LiDAR redundancy for adverse weather conditions.',
              'Safety validation metrics are exceeding targets. The system demonstrates excellent performance in edge cases and emergency scenarios.',
            ],
            'battery-tech': [
              'Battery performance analysis shows optimal charging curves. Current implementation achieves 0-80% charge in 18 minutes with minimal degradation.',
              'Energy density improvements are on track. The new cell chemistry shows 30% improvement while maintaining safety standards.',
              'Battery recycling efficiency at 95% material recovery. Recommendation: expand recycling infrastructure to support increased production volume.',
            ],
            'vehicle-connectivity': [
              '5G connectivity integration shows excellent performance. Latency reduced to <10ms for vehicle-to-infrastructure communication.',
              'Connected services uptime at 99.9% exceeds targets. System reliability metrics are optimal.',
              'Over-the-air update system ready for deployment. Testing shows successful updates to 10,000+ vehicles without issues.',
            ],
            'safety-systems': [
              'PRE-SAFE system activation time improved by 40%. Current performance exceeds industry standards.',
              'Crash test analysis shows 5-star Euro NCAP rating achieved. All safety systems performing optimally.',
              'Active brake assist accuracy at 99.8% in test scenarios. System ready for production deployment.',
            ],
          }
          
          const channelResponses = mercAIResponses[chatId] || [
            'I\'ve analyzed the data and can provide insights. Based on current metrics, the system is performing well.',
            'Thank you for the mention. I can help optimize this further. Let me analyze the relevant data.',
            'Based on my analysis, I recommend focusing on these key areas for improvement.',
          ]
          
          // Add Merc AI response message after a delay
          setTimeout(() => {
            setChatMessages(prev => {
              const current = prev[chatId] || []
              const juspayAIMessage: SlackMsg = {
                id: `${chatId}-mercai-${Date.now()}`,
                who: 'Juspay AI',
                text: pick(channelResponses),
                when: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
              }
              return { ...prev, [chatId]: [...current, juspayAIMessage] }
            })
          }, 2000) // 2 second delay for Merc AI response
        }
      } else if (isGroupDM) {
        // For group DMs, pick someone from the group (not current user)
        // Occasionally have Merc AI post proactively (10% chance)
        if (Math.random() < 0.10) {
          const mercAIGroupDMPosts = [
            'I\'ve analyzed the discussion and can provide some insights based on the latest data.',
            'Based on my analysis, I think focusing on these key areas would be beneficial.',
            'I\'ve reviewed the relevant metrics. Here\'s what I found that might be helpful.',
            'Let me share some insights from the data I\'ve been analyzing.',
            'I can provide some recommendations based on current performance metrics.',
          ]
          
          p = people.find(pp => pp.n === 'Merc AI') || p
          text = pick(mercAIGroupDMPosts)
        } else {
          const allChats = [...starredChats, ...dmChats, ...channelChats]
          const groupChat = allChats.find(c => c.id === chatId)
          if (groupChat) {
            const groupMembers = getGroupMembers(groupChat.name)
            if (groupMembers.length > 0) {
              const memberName = pick(groupMembers)
              p = people.find(pp => pp.n === memberName) || p
              // Ensure it's not current user
              if (p.n === getCurrentUser) {
                const otherGroupMembers = groupMembers.filter(name => name !== getCurrentUser)
                if (otherGroupMembers.length > 0) {
                  p = people.find(pp => pp.n === pick(otherGroupMembers)) || p
                } else {
                  p = pick(getOtherPeople)
                }
              }
            }
          }
          const dmContexts: Record<string, string[]> = {
            'group-1': ['Hey team!', 'What do you think?', 'Sounds good to me.'],
            'group-2': ['Morning everyone!', 'Ready for the meeting?', 'Let\'s sync up.'],
            'group-3': ['Arnab, Deepanshu, Harshita'],
            'group-5': ['Spoorthi Ramesh, Abhijeet, Shruti Karmarkar'],
          }
          const contexts = dmContexts[chatId] || [
            `Hey! Just following up.`,
            `Thanks for the help!`,
            `Let me know when you're free.`,
          ]
          text = pick(contexts)
        }
        
        // Check if message contains @Juspay AI mention in group DMs and add response
        if (text.includes('@Juspay AI') || text.includes('@juspay-ai') || text.toLowerCase().includes('juspay ai')) {
          const groupDMResponses = [
            'I\'ve analyzed the discussion and can provide insights. Based on the context, here\'s what I recommend.',
            'Thank you for mentioning me. I can help with that. Let me provide some relevant information.',
            'Based on my analysis of the topic, I suggest focusing on these key areas.',
            'I can help with that. Here\'s what I found from the latest data.',
            'Great question! Based on current metrics and best practices, here\'s my recommendation.',
          ]
          
          // Add Merc AI response message after a delay
          setTimeout(() => {
            setChatMessages(prev => {
              const current = prev[chatId] || []
              const juspayAIMessage: SlackMsg = {
                id: `${chatId}-mercai-${Date.now()}`,
                who: 'Juspay AI',
                text: pick(groupDMResponses),
                when: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
              }
              return { ...prev, [chatId]: [...current, juspayAIMessage] }
            })
          }, 2000) // 2 second delay for Merc AI response
        }
      } else if (isDM) {
        // For individual DMs, use realistic DM generator
        const personName = getPersonNameFromChatId(chatId)
        if (personName) {
          const msg = generateRealisticDMMessage(personName, getCurrentUser, pick)
          p = people.find(pp => pp.n === msg.who) || p
          text = msg.text
        } else {
          p = pick(getOtherPeople)
          text = `Hey! Just following up.`
        }
      }
      
      // Get person object to check for traits
      const personObj = getPerson(p.n)
      
      // Enhance message based on person traits
      text = enhanceMessage(text, personObj || { name: p.n, avatar: p.a }, pick)
      
      return {
        id: Math.random().toString(36).slice(2),
        who: p.n,
        text,
        when: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
      }
    }
    
    const tick = () => {
      // Check if 40% or more of chats have unread messages - if so, stop generating new messages
      setUnreadCounts(currentUnreadCounts => {
        const totalChats = allChatIds.length
        const chatsWithUnread = allChatIds.filter(id => (currentUnreadCounts[id] || 0) > 0).length
        const unreadPercentage = totalChats > 0 ? (chatsWithUnread / totalChats) : 0
        
        // If 40% or more chats have unread, don't generate new messages
        if (unreadPercentage >= 0.4) {
          return currentUnreadCounts
        }
        
        // Pick a random chat (excluding currently selected one)
        const availableChats = allChatIds.filter(id => {
          if (id === selectedChat) return false
          return true
        })
        if (availableChats.length === 0) return currentUnreadCounts
        
        const randomChatId = pick(availableChats)
        const newMsg = generateMessageForChat(randomChatId)
        
        if (newMsg) {
          // Add message to the chat
          setChatMessages(prev => {
            const current = prev[randomChatId] || []
            const next = current.concat(newMsg)
            const trimmed = next.slice(-40)
            return { ...prev, [randomChatId]: trimmed }
          })
          
          // Increment unread count if chat is not currently selected
          if (randomChatId !== selectedChat) {
            return {
              ...currentUnreadCounts,
              [randomChatId]: (currentUnreadCounts[randomChatId] || 0) + 1
            }
          }
        }
        
        return currentUnreadCounts
      })
    }
    
    // Run every 5-10 seconds
    const id = window.setInterval(tick, 5000 + Math.floor(Math.random() * 5000))
    
    return () => window.clearInterval(id)
  }, [selectedChat, chatMessages, people, getOtherPeople, getCurrentUser, starredChats, dmChats, channelChats])

  // Simulate incoming Slack messages for the selected chat (keep this for when user is viewing a chat)
  useEffect(() => {
    if (!selectedChat || !chatMessages[selectedChat]) return
    
    const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]
    const allChats = [...starredChats, ...dmChats, ...channelChats]
    const chatData = allChats.find(c => c.id === selectedChat)
    if (!chatData) return
    
    const chatName = chatData.name.replace('#', '')
    const isChannel = chatData.type === 'channel' || chatData.type === 'starred'
    const isGroupDM = chatData.id?.startsWith('group-')
    const isDM = chatData.type === 'dm' && !isGroupDM
    
    const mkMsg = (): SlackMsg => {
      let p = pick(getOtherPeople)
      let text = ''
      
      if (selectedChat === 'juspay-ai') {
        // Special handling for Juspay AI - HR-focused messages
        p = people.find(pp => pp.n === 'Juspay AI') || p
        text = pick([
          `You have 2 pending leave requests that need your review.`,
          `Sophie's leave request is still pending approval.`,
          `Your team's time-off calendar has been updated.`,
          `New expense reports submitted by your direct reports.`,
        ])
      } else if (isChannel) {
        // Use realistic message generator for channels
        // IMPORTANT: Ensure current user never sends messages automatically in channels
        let msg = generateRealisticMessage(selectedChat, chatName, isChannel, isGroupDM, pick)
        // If the generated message is from current user, pick a different person
        while (msg.who === getCurrentUser) {
          msg = generateRealisticMessage(selectedChat, chatName, isChannel, isGroupDM, pick)
        }
        p = people.find(pp => pp.n === msg.who) || p
        // Double-check: if somehow current user got through, use getOtherPeople
        if (p.n === getCurrentUser) {
          p = pick(getOtherPeople)
        }
        text = msg.text
      } else if (isGroupDM) {
        // For group DMs, pick someone from the group (not current user)
        const groupMembers = getGroupMembers(chatData.name)
        if (groupMembers.length > 0) {
          const memberName = pick(groupMembers)
          p = people.find(pp => pp.n === memberName) || p
          // Ensure it's not current user
          if (p.n === getCurrentUser) {
            p = pick(getOtherPeople.filter(pp => groupMembers.includes(pp.n)))
          }
        }
        const dmContexts: Record<string, string[]> = {
          'group-1': ['Hey team!', 'What do you think?', 'Sounds good to me.'],
          'group-2': ['Morning everyone!', 'Ready for the meeting?', 'Let\'s sync up.'],
          'group-3': ['Arnab, Deepanshu, Harshita'],
          'group-5': ['Spoorthi Ramesh, Abhijeet, Shruti Karmarkar'],
        }
        const contexts = dmContexts[selectedChat] || [
          `Hey! Just following up.`,
          `Thanks for the help!`,
          `Let me know when you're free.`,
        ]
        text = pick(contexts)
      } else if (isDM) {
        // For individual DMs, use realistic DM generator
        // Note: DMs can include messages from current user (that's normal for 1:1 conversations)
        const personName = getPersonNameFromChatId(selectedChat)
        if (personName) {
          const msg = generateRealisticDMMessage(personName, getCurrentUser, pick)
          p = people.find(pp => pp.n === msg.who) || p
          text = msg.text
        } else {
          p = pick(getOtherPeople)
          text = `Hey! Just following up.`
        }
      }
      
      // Get person object to check for traits
      const personObj = getPerson(p.n)
      
      // Enhance message based on person traits
      text = enhanceMessage(text, personObj || { name: p.n, avatar: p.a }, pick)
      
      return {
        id: Math.random().toString(36).slice(2),
        who: p.n,
        text,
        when: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
      }
    }
    
    const tick = () => {
      setChatMessages(prev => {
        const current = prev[selectedChat] || []
        const next = current.concat(mkMsg())
        const trimmed = next.slice(-40)
        return { ...prev, [selectedChat]: trimmed }
      })
      // Don't scroll here - the useEffect will handle it smoothly
    }
    
    const id = window.setInterval(() => {
      tick()
    }, 8000 + Math.floor(Math.random() * 4000))
    
    return () => window.clearInterval(id)
  }, [selectedChat, chatMessages, people, getOtherPeople, getCurrentUser, starredChats, dmChats, channelChats])

  // Auto-scroll to bottom instantly when switching chats
  useEffect(() => {
    const chatChanged = prevSelectedChatRef.current !== selectedChat
    if (chatChanged && chatMessages[selectedChat] && chatMessages[selectedChat].length > 0) {
      // Instant scroll (no animation) when switching chats
      setTimeout(() => { 
        try { 
          if (slackRootRef.current) {
            slackRootRef.current.scrollTop = slackRootRef.current.scrollHeight
          }
        } catch {} 
      }, 0)
    }
    prevSelectedChatRef.current = selectedChat
  }, [selectedChat, chatMessages])

  // Auto-scroll to bottom smoothly when new messages arrive in the current chat
  useEffect(() => {
    const messageCount = chatMessages[selectedChat]?.length || 0
    const chatChanged = prevSelectedChatRef.current !== selectedChat
    
    // Only scroll if we're still on the same chat (new message, not chat switch)
    if (messageCount > 0 && !chatChanged) {
      setTimeout(() => { 
        try { 
          if (slackRootRef.current) {
            // Always scroll to bottom smoothly when new messages arrive
            slackRootRef.current.scrollTo({ top: slackRootRef.current.scrollHeight, behavior: 'smooth' })
          }
        } catch {} 
      }, 100)
    }
  }, [chatMessages[selectedChat]?.length, selectedChat])

  // Background process: Slowly toggle users between online/offline status
  useEffect(() => {
    const userIds = ['juspay-ai', 'alice', 'bob', 'carol', 'eve', 'james', 'priya', 'david', 'sarah', 'mike']
    
    const toggleOnlineStatus = () => {
      // Randomly select 1-2 users to toggle (slow process)
      const numToToggle = Math.random() < 0.7 ? 1 : 2 // 70% chance of 1, 30% chance of 2
      const shuffled = [...userIds].sort(() => Math.random() - 0.5)
      const usersToToggle = shuffled.slice(0, numToToggle)
      
      setOnlineStatus(prev => {
        const updated = { ...prev }
        usersToToggle.forEach(userId => {
          // Toggle the status
          updated[userId] = !prev[userId]
        })
        return updated
      })
    }
    
    // Initial delay: wait 3-5 minutes before first toggle
    const initialDelay = Math.random() * 120000 + 180000 // 3-5 minutes in milliseconds
    
    let intervalId: NodeJS.Timeout | null = null
    
    const initialTimeout = setTimeout(() => {
      toggleOnlineStatus()
      
      // Then toggle every 4-7 minutes
      intervalId = setInterval(() => {
        toggleOnlineStatus()
      }, Math.random() * 180000 + 240000) // 4-7 minutes in milliseconds
    }, initialDelay)
    
    return () => {
      clearTimeout(initialTimeout)
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, []) // Empty dependency array - only run once on mount

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedChat) return
    const newMsg: SlackMsg = {
      id: Math.random().toString(36).slice(2),
      who: currentUserName,
      text: messageInput,
      when: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    }
    setChatMessages(prev => {
      const current = prev[selectedChat] || []
      return { ...prev, [selectedChat]: current.concat(newMsg) }
    })
    setMessageInput('')
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
    setTimeout(() => { 
      try { 
        if (slackRootRef.current) {
          slackRootRef.current.scrollTo({ top: slackRootRef.current.scrollHeight, behavior: 'smooth' })
        }
      } catch {} 
    }, 100)
  }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessageInput(e.target.value)
    // Auto-resize textarea
    const textarea = e.target
    textarea.style.height = 'auto'
    textarea.style.height = `${textarea.scrollHeight}px`
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // Use layout effect to restore scroll position synchronously before paint
  useLayoutEffect(() => {
    if (scrollAnchorRef.current && slackRootRef.current) {
      const container = slackRootRef.current
      const { scrollHeight: scrollHeightBefore, scrollTop: scrollTopBefore } = scrollAnchorRef.current
      
      const scrollHeightAfter = container.scrollHeight
      const heightDiff = scrollHeightAfter - scrollHeightBefore
      
      if (heightDiff !== 0) {
        // Synchronously adjust scroll position before paint to prevent flicker
        container.scrollTop = scrollTopBefore + heightDiff
        scrollAnchorRef.current = null
      }
    }
  }) // Run on every render, but only acts when scrollAnchorRef is set

  // Helper to capture scroll position before content height changes
  const captureScrollPosition = () => {
    if (!slackRootRef.current) return false
    
    const container = slackRootRef.current
    const scrollHeight = container.scrollHeight
    const scrollTop = container.scrollTop
    const clientHeight = container.clientHeight
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight
    
    // If we were near the bottom (within 50px), capture position
    const wasNearBottom = distanceFromBottom < 50
    
    if (wasNearBottom) {
      scrollAnchorRef.current = { scrollHeight, scrollTop, clientHeight }
      return true
    }
    
    scrollAnchorRef.current = null
    return false
  }
  
  // Helper to restore scroll position after content height changes
  const restoreScrollPosition = () => {
    if (!slackRootRef.current || !scrollAnchorRef.current) return
    
    const container = slackRootRef.current
    const { scrollHeight: scrollHeightBefore, scrollTop: scrollTopBefore } = scrollAnchorRef.current
    
    // Try immediate synchronous restoration first
    const scrollHeightAfter = container.scrollHeight
    const heightDiff = scrollHeightAfter - scrollHeightBefore
    
    if (heightDiff !== 0) {
      // Immediately adjust scroll position to prevent flicker
      container.scrollTop = scrollTopBefore + heightDiff
      scrollAnchorRef.current = null
    } else {
      // If height hasn't changed yet, wait for DOM update
      requestAnimationFrame(() => {
        if (container && scrollAnchorRef.current) {
          const scrollHeightAfter = container.scrollHeight
          const heightDiff = scrollHeightAfter - scrollHeightBefore
          if (heightDiff !== 0) {
            container.scrollTop = scrollTopBefore + heightDiff
            scrollAnchorRef.current = null
          }
        }
      })
    }
  }

  const handleReaction = (messageId: string, emoji: string) => {
    // Capture scroll position before state update
    const shouldMaintainAnchor = captureScrollPosition()
    
    setChatMessages(prev => {
      const chatMessages = prev[selectedChat] || []
      const messageIndex = chatMessages.findIndex(m => m.id === messageId)
      if (messageIndex === -1) return prev
      
      const message = chatMessages[messageIndex]
      const reactions = message.reactions || {}
      const currentCount = reactions[emoji] || 0
      
      // Check if user has already reacted to this emoji
      const userReactedSet = userReactions[messageId] || new Set<string>()
      const hasUserReacted = userReactedSet.has(emoji)
      
      const newReactions = { ...reactions }
      
      if (hasUserReacted) {
        // User is removing their reaction
        if (currentCount > 1) {
          // If count is greater than 1, just decrement
          newReactions[emoji] = currentCount - 1
        } else {
          // If count is 1 and it's the user's reaction, remove it entirely
          delete newReactions[emoji]
        }
      } else {
        // User is adding their reaction
        newReactions[emoji] = currentCount + 1
      }
      
      // Update user reactions tracking
      setUserReactions(prevReactions => {
        const newUserReactions = { ...prevReactions }
        if (!newUserReactions[messageId]) {
          newUserReactions[messageId] = new Set<string>()
        } else {
          newUserReactions[messageId] = new Set(newUserReactions[messageId])
        }
        
        if (hasUserReacted) {
          newUserReactions[messageId].delete(emoji)
        } else {
          newUserReactions[messageId].add(emoji)
        }
        
        return newUserReactions
      })
      
      const updatedMessage = { ...message, reactions: Object.keys(newReactions).length > 0 ? newReactions : undefined }
      const newChatMessages = [...chatMessages]
      newChatMessages[messageIndex] = updatedMessage
      
      return { ...prev, [selectedChat]: newChatMessages }
    })
    
    // Restore scroll position after state update - useEffect will handle it synchronously
    // No need to call restoreScrollPosition here, useEffect will handle it
  }

  const handleAction = (messageId: string, actionId: string) => {
    setCompletedActions(prev => ({
      ...prev,
      [messageId]: actionId
    }))
    
    // If "Approve Leave" is clicked in juspay-ai DM, add thank you message from employee
    if (selectedChat === 'juspay-ai' && actionId === 'approve-leave') {
      // Find Sophie Dubois's chat ID (alice)
      const sophieChatId = 'alice'
      const thankYouMessage: SlackMsg = {
        id: `sophie-thank-you-${Date.now()}`,
        who: 'Sophie Dubois',
        text: `Thank you so much for the prompt approval! 🙏 Really appreciate it! 🎉`,
        when: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
      }
      
      // Add thank you message to Sophie's DM with a delay
      setTimeout(() => {
        setChatMessages(prev => {
          const current = prev[sophieChatId] || []
          return { ...prev, [sophieChatId]: [...current, thankYouMessage] }
        })
        // Increment unread count for Sophie's chat
        setUnreadCounts(prev => ({
          ...prev,
          [sophieChatId]: (prev[sophieChatId] || 0) + 1
        }))
      }, 1500)
    }
    
    // If "Approve Tool Access" is clicked in juspay-ai DM, no thank you message (as requested)
    // The action is just marked as completed above
  }

  const handleAddReaction = (messageId: string, emoji: string) => {
    // Capture scroll position before state update
    const shouldMaintainAnchor = captureScrollPosition()
    
    setChatMessages(prev => {
      const chatMessages = prev[selectedChat] || []
      const messageIndex = chatMessages.findIndex(m => m.id === messageId)
      if (messageIndex === -1) return prev
      
      const message = chatMessages[messageIndex]
      const reactions = message.reactions || {}
      const currentCount = reactions[emoji] || 0
      
      // Check if user has already reacted to this emoji
      const userReactedSet = userReactions[messageId] || new Set<string>()
      const hasUserReacted = userReactedSet.has(emoji)
      
      // If user already reacted, don't add again
      if (hasUserReacted) return prev
      
      const newReactions = { ...reactions, [emoji]: currentCount + 1 }
      const updatedMessage = { ...message, reactions: newReactions }
      const newChatMessages = [...chatMessages]
      newChatMessages[messageIndex] = updatedMessage
      
      // Update user reactions tracking
      setUserReactions(prevReactions => {
        const newUserReactions = { ...prevReactions }
        if (!newUserReactions[messageId]) {
          newUserReactions[messageId] = new Set<string>()
        } else {
          newUserReactions[messageId] = new Set(newUserReactions[messageId])
        }
        newUserReactions[messageId].add(emoji)
        return newUserReactions
      })
      
      return { ...prev, [selectedChat]: newChatMessages }
    })
    
    // Restore scroll position after state update
    if (shouldMaintainAnchor) {
      restoreScrollPosition()
    }
  }

  // Fixed member counts for each chat (consistent across renders)
  const memberCounts = React.useMemo(() => {
    const counts: Record<string, number> = {}
    
    // General channel has the highest count (triple digits)
    counts['general'] = 750
    
    // Mercedes-Benz channels - realistic member counts
    counts['eqe-launch'] = 45
    counts['eq-series'] = 68
    counts['new-launches'] = 52
    counts['mbux-development'] = 38
    counts['autonomous-driving'] = 42
    counts['vehicle-connectivity'] = 35
    counts['battery-tech'] = 28
    counts['engine-development'] = 32
    counts['safety-systems'] = 40
    counts['sales-channels'] = 55
    counts['service-centers'] = 48
    counts['dealer-network'] = 62
    counts['customer-support'] = 35
    counts['warranty-services'] = 28
    counts['parts-logistics'] = 22
    counts['quality-assurance'] = 30
    counts['testing-prototypes'] = 25
    counts['design-studio'] = 20
    counts['marketing-campaigns'] = 32
    counts['product-planning'] = 18
    counts['germany-team'] = 85
    counts['france-team'] = 72
    counts['italy-team'] = 65
    counts['sales-updates'] = 45
    counts['service-network'] = 38
    
    // Other channels (legacy/example channels)
    counts['itom-4412'] = 85
    counts['incidents'] = 72
    counts['alerts'] = 68
    counts['chg-review'] = 55
    counts['CHG-189'] = 26
    counts['dev-ops'] = 48
    counts['engineering'] = 92
    counts['backend'] = 45
    counts['frontend'] = 42
    counts['infrastructure'] = 38
    counts['security'] = 35
    counts['sre'] = 32
    counts['oncall'] = 28
    counts['deployments'] = 26
    counts['monitoring'] = 24
    counts['ci-cd'] = 22
    counts['kubernetes'] = 20
    counts['aws'] = 18
    counts['database'] = 16
    counts['api'] = 15
    counts['mobile'] = 14
    counts['qa'] = 12
    counts['design'] = 10
    counts['product'] = 25
    counts['sales'] = 30
    counts['support'] = 35
    counts['marketing'] = 28
    
    // Group DMs - count based on actual number of people in the group
    counts['group-1'] = 3 // Sophie Dubois, Marco Rossi, Priya Patel
    counts['group-2'] = 3 // Emma Schmidt, Thomas Weber, Ananya Reddy
    counts['group-3'] = 3 // David Chen, Sarah Williams, Alessandro Bianchi
    counts['group-5'] = 3 // Emma Wilson, Alex Thompson, Lisa Anderson
    
    return counts
  }, [])

  const currentChat = [...starredChats, ...dmChats, ...channelChats].find(c => c.id === selectedChat)

  return (
    <div style={{ 
      height: '100vh', 
      width: '100vw', 
      display: 'flex', 
      overflow: 'hidden', 
      background: currentTheme.colors.leftmostPanel,
      fontFamily: 'Lato, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
    }}>
      {/* Leftmost Panel - Icon Bar */}
      <div style={{ 
        width: 60, 
        background: '#000000', 
        display: 'flex', 
        flexDirection: 'column',
        flexShrink: 0,
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 12,
        paddingBottom: 12,
        gap: 8
      }}>
        {/* Company Logo */}
        <div style={{ marginBottom: 8 }}>
          <img 
            src={companyData.logo} 
            alt={companyData.name} 
            width={40} 
            height={40} 
            style={{ 
              display: 'block',
              borderRadius: 8,
              objectFit: 'contain'
            }} 
          />
        </div>
        
        {/* Vertical Square Icon Containers */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%', alignItems: 'center', flex: 1 }}>
          {/* Home */}
          <div 
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}
          >
            <div style={{ 
              width: 40, 
              height: 40, 
              background: 'rgba(255, 255, 255, 0.18)', 
              borderRadius: 8, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#ffffff' }}>
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
            </div>
            <span style={{ fontSize: 11, color: '#ffffff', fontFamily: 'Lato, sans-serif', fontWeight: 400 }}>Home</span>
          </div>
          
          {/* DMs */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
            <div style={{ 
              width: 40, 
              height: 40, 
              background: 'transparent', 
              borderRadius: 4, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#9ca3af' }}>
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            </div>
            <span style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'Lato, sans-serif', fontWeight: 400 }}>DMs</span>
          </div>
          
          {/* Activity */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
            <div style={{ 
              width: 40, 
              height: 40, 
              background: 'transparent', 
              borderRadius: 4, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#9ca3af' }}>
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
              </svg>
            </div>
            <span style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'Lato, sans-serif', fontWeight: 400 }}>Activity</span>
          </div>
          
          {/* Files */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
            <div style={{ 
              width: 40, 
              height: 40, 
              background: 'transparent', 
              borderRadius: 4, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#9ca3af' }}>
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
            </div>
            <span style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'Lato, sans-serif', fontWeight: 400 }}>Files</span>
          </div>
          
          {/* Later */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
            <div style={{ 
              width: 40, 
              height: 40, 
              background: 'transparent', 
              borderRadius: 4, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#9ca3af' }}>
                <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
              </svg>
            </div>
            <span style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'Lato, sans-serif', fontWeight: 400 }}>Later</span>
          </div>
          
          {/* More */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>
            <div style={{ 
              width: 40, 
              height: 40, 
              background: 'transparent', 
              borderRadius: 4, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#9ca3af' }}>
                <circle cx="12" cy="12" r="1"></circle>
                <circle cx="19" cy="12" r="1"></circle>
                <circle cx="5" cy="12" r="1"></circle>
              </svg>
            </div>
            <span style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'Lato, sans-serif', fontWeight: 400 }}>More</span>
          </div>
        </div>

        {/* User Avatar */}
        <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
          {/* Theme Selector */}
          <select
            value={currentThemeId}
            onChange={(e) => setCurrentThemeId(e.target.value)}
            style={{
              height: 24,
              width: 24,
              padding: 0,
              fontSize: 0,
              background: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: 4,
              color: 'transparent',
              cursor: 'pointer',
              outline: 'none',
              fontFamily: 'Lato, sans-serif',
              appearance: 'none',
              WebkitAppearance: 'none',
              MozAppearance: 'none',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23ffffff' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center',
              backgroundSize: '10px',
            }}
          >
            {availableThemes.map(theme => (
              <option key={theme.id} value={theme.id}>{theme.name}</option>
            ))}
          </select>
          <div style={{ position: 'relative' }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, overflow: 'hidden' }}>
              <img src={getAvatar('James McGill')} alt={currentUserName} width={40} height={40} style={{ borderRadius: 8, objectFit: 'cover', display: 'block' }} />
            </div>
            {/* Online status dot */}
            <>
              {/* Background mask - creates space between avatar and dot */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: -3,
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: '#1a1d21',
                  border: '1.5px solid #1a1d21',
                  zIndex: 1,
                }}
              />
              {/* Status dot */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  right: 0,
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  background: '#2eb886',
                  zIndex: 2,
                }}
              />
            </>
          </div>
        </div>
      </div>

      {/* Left Panel - Chat List */}
      <div style={{ 
        width: sidebarWidth, 
        background: currentTheme.colors.sidebarBackground, 
        display: 'flex', 
        flexDirection: 'column',
        flexShrink: 0,
        overflow: 'hidden',
      }}>
        {/* Chat List Header - Sticky */}
        <div style={{ 
          padding: '23px 16px 16px 16px', 
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          background: currentTheme.colors.sidebarBackground,
          zIndex: 10,
        }}>
          <div style={{ fontWeight: 900, fontSize: 18, color: getTextColor.primary, fontFamily: 'Lato, sans-serif', lineHeight: 1, display: 'flex', alignItems: 'center', height: 18 }}>{companyData.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {/* Settings Icon */}
            <button
              style={{
                width: 20,
                height: 20,
                border: 'none',
                outline: 'none',
                background: 'transparent',
                color: getTextColor.secondary,
                cursor: 'pointer',
                fontSize: 18,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                borderRadius: 2,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = currentTheme.colors.hoverBackground
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
              onClick={() => {}}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"></circle>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
              </svg>
            </button>
            {/* New Message Icon */}
            <button
              style={{
                width: 20,
                height: 20,
                border: 'none',
                outline: 'none',
                background: 'transparent',
                color: getTextColor.secondary,
                cursor: 'pointer',
                fontSize: 18,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                borderRadius: 2,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = currentTheme.colors.hoverBackground
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
              onClick={() => {}}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
          </div>
        </div>

        {/* Chat List Items - Scrollable */}
        <div 
          className="no-scrollbars"
          style={{ 
            flex: 1, 
            overflowY: 'auto', 
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          } as React.CSSProperties & { scrollbarWidth: string; msOverflowStyle: string }}
        >
          {/* Navigation Items */}
          <div style={{ padding: '8px 0', borderBottom: `1px solid ${currentTheme.colors.separator}` }}>
            {[
              { 
                id: 'threads', 
                label: 'Threads', 
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    <path d="M13 7H7"></path>
                    <path d="M17 11H7"></path>
                  </svg>
                )
              },
              { 
                id: 'huddles', 
                label: 'Huddles', 
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3" />
                  </svg>
                )
              },
              { 
                id: 'drafts', 
                label: 'Drafts & sent', 
                icon: (
                  <img 
                    src="/assets/send-horizontal.svg" 
                    alt="drafts & sent" 
                    width={20} 
                    height={20} 
                    style={{ 
                      display: 'block',
                      filter: currentTheme.type === 'dark' ? 'brightness(0) invert(1)' : 'brightness(0)',
                      opacity: 0.82
                    }} 
                  />
                )
              },
              { 
                id: 'directories', 
                label: 'Directories', 
                icon: (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                  </svg>
                )
              },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => {}}
                style={{
                  width: 'calc(100% - 8px)',
                  margin: '0 4px',
                  padding: '5px 12px',
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  color: getTextColor.secondary,
                  textAlign: 'left',
                  cursor: 'pointer',
                  fontSize: 15,
                  fontWeight: 400,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  borderRadius: 6,
                  fontFamily: 'Lato, sans-serif',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  const highlight = e.currentTarget.querySelector('.highlight-bg') as HTMLElement
                  if (highlight) highlight.style.background = currentTheme.colors.hoverBackground
                }}
                onMouseLeave={(e) => {
                  const highlight = e.currentTarget.querySelector('.highlight-bg') as HTMLElement
                  if (highlight) highlight.style.background = 'transparent'
                }}
              >
                <div className="highlight-bg" style={{
                  position: 'absolute',
                  left: 4,
                  right: 4,
                  top: 0,
                  bottom: 0,
                  borderRadius: 6,
                  background: 'transparent',
                  pointerEvents: 'none',
                  zIndex: 0,
                }} />
                <div style={{ 
                  position: 'relative',
                  zIndex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  width: '100%',
                }}>
                  <div style={{ 
                    width: 20, 
                    height: 20, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    flexShrink: 0,
                    color: getTextColor.secondary
                  }}>
                    {item.icon}
                  </div>
                  <span>{item.label}</span>
                </div>
              </button>
            ))}
          </div>
          {/* Starred Section */}
          <div style={{ marginTop: 20, marginBottom: 8 }}>
            <div style={{ padding: '4px 16px', fontSize: 13, fontWeight: 600, color: getTextColor.sectionHeader, textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: 'Lato, sans-serif' }}>
              Starred
            </div>
            {starredChats.map((chat) => {
              const isActive = selectedChat === chat.id
              const channelName = chat.name.startsWith('#') ? chat.name.slice(1) : chat.name
              return (
                <button
                  key={chat.id}
                  onClick={() => handleChatSelect(chat.id)}
                  style={{
                    width: 'calc(100% - 8px)',
                    margin: '0 4px',
                    padding: '5px 12px',
                    border: 'none',
                    outline: 'none',
                    boxShadow: 'none',
                  background: 'transparent',
                  color: isActive ? getTextColor.primary : ((chat.unread !== undefined && chat.unread > 0) ? (currentTheme.type === 'light' ? '#1d1c1d' : '#ffffff') : getTextColor.secondary),
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: 15,
                    fontWeight: (chat.unread !== undefined && chat.unread > 0) ? 900 : 400,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderRadius: 6,
                    fontFamily: 'Lato, sans-serif',
                    gap: 12,
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      const highlight = e.currentTarget.querySelector('.highlight-bg') as HTMLElement
                      if (highlight) highlight.style.background = currentTheme.colors.hoverBackground
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      const highlight = e.currentTarget.querySelector('.highlight-bg') as HTMLElement
                      if (highlight) highlight.style.background = 'transparent'
                    }
                  }}
                >
                  <div className="highlight-bg" style={{
                    position: 'absolute',
                    left: 4,
                    right: 4,
                    top: 0,
                    bottom: 0,
                    borderRadius: 6,
                    background: isActive ? currentTheme.colors.activeBackground : 'transparent',
                    pointerEvents: 'none',
                    zIndex: 0,
                  }} />
                  <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                    <div style={{ width: 20, height: 20, borderRadius: 5, background: currentTheme.colors.border, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {chat.isPrivate ? (
                        <img 
                          src="/assets/lock.svg" 
                          alt="lock" 
                          width={14} 
                          height={14} 
                          style={{ 
                            display: 'block',
                            filter: currentTheme.type === 'dark' ? 'brightness(0) invert(1)' : 'brightness(0)',
                            opacity: 0.6
                          }} 
                        />
                      ) : (
                        <span style={{ fontSize: 14, color: getTextColor.tertiary, fontWeight: 400 }}>#</span>
                      )}
                    </div>
                    <span style={{ fontWeight: 'inherit', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{channelName}</span>
                  </div>
                  {chat.unread !== undefined && chat.unread > 0 && (
                    <span
                      style={{
                        position: 'relative',
                        zIndex: 1,
                        minWidth: 18,
                        height: 18,
                        padding: '0 6px',
                        borderRadius: 12,
                        background: currentTheme.colors.unreadPill,
                        color: currentTheme.colors.unreadPillText,
                        fontSize: 11,
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {chat.unread}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Direct Messages Section */}
          <div style={{ marginTop: 20, marginBottom: 8 }}>
            <div style={{ padding: '4px 16px', fontSize: 13, fontWeight: 600, color: getTextColor.sectionHeader, textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: 'Lato, sans-serif' }}>
              Direct Messages
            </div>
            {dmChats.map((chat) => {
              const isActive = selectedChat === chat.id
              const isGroup = chat.id.startsWith('group-')
              // For group DMs, show first two avatars or a group icon
              const getGroupAvatars = () => {
                if (!isGroup) return []
                const names = chat.name.split(', ').slice(0, 2)
                return names.map(name => {
                  const person = people.find(p => p.n === name.trim())
                  return person?.a || '/assets/avatar.jpeg'
                })
              }
              return (
                <button
                  key={chat.id}
                  onClick={() => handleChatSelect(chat.id)}
                  style={{
                    width: 'calc(100% - 8px)',
                    margin: '0 4px',
                    padding: '5px 12px',
                    border: 'none',
                    outline: 'none',
                    boxShadow: 'none',
                  background: 'transparent',
                  color: isActive ? getTextColor.primary : ((chat.unread !== undefined && chat.unread > 0) ? (currentTheme.type === 'light' ? '#1d1c1d' : '#ffffff') : getTextColor.secondary),
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: 15,
                    fontWeight: (chat.unread !== undefined && chat.unread > 0) ? 900 : 400,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderRadius: 6,
                    fontFamily: 'Lato, sans-serif',
                    gap: 12,
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => {
                    const highlight = e.currentTarget.querySelector('.highlight-bg') as HTMLElement
                    if (highlight) {
                      highlight.style.background = isActive ? currentTheme.colors.activeBackground : currentTheme.colors.hoverBackground
                    }
                    // Update grey dot colors on hover
                    const greyDotMask = e.currentTarget.querySelector('.grey-dot-mask') as HTMLElement
                    const greyDotInner = e.currentTarget.querySelector('.grey-dot-inner') as HTMLElement
                    if (greyDotMask) {
                      greyDotMask.style.background = isActive ? currentTheme.colors.activeBackground : currentTheme.colors.hoverBackground
                      greyDotMask.style.borderColor = isActive ? currentTheme.colors.activeBackground : currentTheme.colors.hoverBackground
                    }
                    if (greyDotInner) {
                      greyDotInner.style.background = isActive ? currentTheme.colors.activeBackground : currentTheme.colors.hoverBackground
                    }
                    // Update green dot border color on hover
                    const greenDot = e.currentTarget.querySelector('.green-dot') as HTMLElement
                    if (greenDot) {
                      greenDot.style.borderColor = isActive ? currentTheme.colors.activeBackground : currentTheme.colors.hoverBackground
                    }
                    // Update group avatar image border color on hover
                    const groupAvatarImgs = e.currentTarget.querySelectorAll('[data-group-avatar="true"]')
                    groupAvatarImgs.forEach((img) => {
                      const imgEl = img as HTMLElement
                      const borderColor = isActive ? currentTheme.colors.activeBackground : currentTheme.colors.hoverBackground
                      imgEl.style.setProperty('border', `1px solid ${borderColor}`, 'important')
                    })
                  }}
                  onMouseLeave={(e) => {
                    const highlight = e.currentTarget.querySelector('.highlight-bg') as HTMLElement
                    if (highlight) {
                      highlight.style.background = isActive ? currentTheme.colors.activeBackground : 'transparent'
                    }
                    // Reset grey dot colors on hover leave
                    const greyDotMask = e.currentTarget.querySelector('.grey-dot-mask') as HTMLElement
                    const greyDotInner = e.currentTarget.querySelector('.grey-dot-inner') as HTMLElement
                    if (greyDotMask) {
                      greyDotMask.style.background = isActive ? currentTheme.colors.activeBackground : currentTheme.colors.sidebarBackground
                      greyDotMask.style.borderColor = isActive ? currentTheme.colors.activeBackground : currentTheme.colors.sidebarBackground
                    }
                    if (greyDotInner) {
                      greyDotInner.style.background = isActive ? currentTheme.colors.activeBackground : currentTheme.colors.sidebarBackground
                    }
                    // Reset green dot border color on hover leave
                    const greenDot = e.currentTarget.querySelector('.green-dot') as HTMLElement
                    if (greenDot) {
                      greenDot.style.borderColor = isActive ? currentTheme.colors.activeBackground : currentTheme.colors.sidebarBackground
                    }
                    // Reset group avatar image border color on hover leave
                    const groupAvatarImgs = e.currentTarget.querySelectorAll('[data-group-avatar="true"]')
                    groupAvatarImgs.forEach((img) => {
                      const imgEl = img as HTMLElement
                      const borderColor = isActive ? currentTheme.colors.activeBackground : currentTheme.colors.avatarBorder
                      imgEl.style.setProperty('border', `1px solid ${borderColor}`, 'important')
                    })
                  }}
                >
                  <div className="highlight-bg" style={{
                    position: 'absolute',
                    left: 4,
                    right: 4,
                    top: 0,
                    bottom: 0,
                    borderRadius: 6,
                    background: isActive ? currentTheme.colors.activeBackground : 'transparent',
                    pointerEvents: 'none',
                    zIndex: 0,
                  }} />
                  <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                    {isGroup ? (
                      <div style={{ width: 20, height: 20, position: 'relative', flexShrink: 0 }}>
                        {getGroupAvatars().map((avatar, idx) => {
                          const isLastAvatar = idx === getGroupAvatars().length - 1
                          const avatarWidth = idx === 0 ? 14 : 12
                          const avatarHeight = idx === 0 ? 14 : 12
                          const avatarLeft = idx === 0 ? 0 : 8
                          const avatarTop = idx === 0 ? 0 : 6
                          return (
                            <React.Fragment key={idx}>
                              <img
                                src={avatar}
                                alt=""
                                width={avatarWidth}
                                height={avatarHeight}
                                className={isLastAvatar ? "group-avatar-img" : undefined}
                                data-group-avatar={isLastAvatar ? "true" : undefined}
                                style={{
                                  position: 'absolute',
                                  left: avatarLeft,
                                  top: avatarTop,
                                  borderRadius: 5,
                                  objectFit: 'cover',
                                  border: `2px solid ${isActive ? currentTheme.colors.activeBackground : currentTheme.colors.avatarBorder}`,
                                  zIndex: 1,
                                }}
                              />
                            </React.Fragment>
                          )
                        })}
                      </div>
                    ) : (
                      <div style={{ width: 20, height: 20, flexShrink: 0, position: 'relative' }}>
                        <div style={{ width: 20, height: 20, borderRadius: 5, overflow: 'hidden' }}>
                          {chat.avatar ? (
                            <img src={chat.avatar} alt={chat.name} width={20} height={20} style={{ display: 'block', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: 20, height: 20, background: currentTheme.colors.border }} />
                          )}
                        </div>
                        {/* Status circle - green for online, grey for offline */}
                        {(chat.isOnline !== undefined && !chat.isOnline) ? (
                          <>
                            {/* Outer circle - mask/background */}
                            <div
                              className="grey-dot-mask"
                              style={{
                                position: 'absolute',
                                bottom: -1,
                                right: 0,
                                width: 10,
                                height: 10,
                                borderRadius: '50%',
                                background: isActive ? currentTheme.colors.activeBackground : currentTheme.colors.sidebarBackground,
                                border: `2px solid ${isActive ? currentTheme.colors.activeBackground : currentTheme.colors.sidebarBackground}`,
                                transform: 'translateX(2px)',
                                zIndex: 1,
                                boxSizing: 'border-box',
                              }}
                            >
                              {/* Inner circle - grey border (same size as green dot) */}
                              <div
                                className="grey-dot-inner"
                                style={{
                                  position: 'absolute',
                                  top: '50%',
                                  left: '50%',
                                  width: 6,
                                  height: 6,
                                  borderRadius: '50%',
                                  background: isActive ? currentTheme.colors.activeBackground : currentTheme.colors.sidebarBackground,
                                  border: `1.5px solid ${currentTheme.colors.offlineStatus}`,
                                  transform: 'translate(-50%, -50%)',
                                  zIndex: 2,
                                  boxSizing: 'border-box',
                                }}
                              />
                            </div>
                          </>
                        ) : (
                          <div
                            className="green-dot"
                            style={{
                              position: 'absolute',
                              bottom: -1,
                              right: 0,
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              background: currentTheme.colors.onlineStatus,
                              border: `2px solid ${isActive ? currentTheme.colors.activeBackground : currentTheme.colors.sidebarBackground}`,
                              transform: 'translateX(2px)',
                              zIndex: 2,
                            }}
                          />
                        )}
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
                      <span style={{ fontWeight: 'inherit', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{chat.name}</span>
                      {!isGroup && chat.statusEmoji && (
                        <span style={{ fontSize: 14, flexShrink: 0 }}>{chat.statusEmoji}</span>
                      )}
                    </div>
                  </div>
                  {chat.unread !== undefined && chat.unread > 0 && (
                    <span
                      style={{
                        position: 'relative',
                        zIndex: 1,
                        minWidth: 18,
                        height: 18,
                        padding: '0 6px',
                        borderRadius: 12,
                        background: currentTheme.colors.unreadPill,
                        color: currentTheme.colors.unreadPillText,
                        fontSize: 11,
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {chat.unread}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Channels Section */}
          <div style={{ marginTop: 20, marginBottom: 8 }}>
            <div style={{ padding: '4px 16px', fontSize: 13, fontWeight: 600, color: getTextColor.sectionHeader, textTransform: 'uppercase', letterSpacing: '0.5px', fontFamily: 'Lato, sans-serif' }}>
              Channels
            </div>
            {channelChats.map((chat) => {
              const isActive = selectedChat === chat.id
              const channelName = chat.name.startsWith('#') ? chat.name.slice(1) : chat.name
              return (
                <button
                  key={chat.id}
                  onClick={() => handleChatSelect(chat.id)}
                  style={{
                    width: 'calc(100% - 8px)',
                    margin: '0 4px',
                    padding: '5px 12px',
                    border: 'none',
                    outline: 'none',
                    boxShadow: 'none',
                  background: 'transparent',
                  color: isActive ? getTextColor.primary : ((chat.unread !== undefined && chat.unread > 0) ? (currentTheme.type === 'light' ? '#1d1c1d' : '#ffffff') : getTextColor.secondary),
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: 15,
                    fontWeight: (chat.unread !== undefined && chat.unread > 0) ? 900 : 400,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderRadius: 6,
                    fontFamily: 'Lato, sans-serif',
                    gap: 12,
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      const highlight = e.currentTarget.querySelector('.highlight-bg') as HTMLElement
                      if (highlight) highlight.style.background = currentTheme.colors.hoverBackground
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      const highlight = e.currentTarget.querySelector('.highlight-bg') as HTMLElement
                      if (highlight) highlight.style.background = 'transparent'
                    }
                  }}
                >
                  <div className="highlight-bg" style={{
                    position: 'absolute',
                    left: 4,
                    right: 4,
                    top: 0,
                    bottom: 0,
                    borderRadius: 6,
                    background: isActive ? currentTheme.colors.activeBackground : 'transparent',
                    pointerEvents: 'none',
                    zIndex: 0,
                  }} />
                  <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
                    <div style={{ width: 20, height: 20, borderRadius: 5, background: currentTheme.colors.border, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {chat.isPrivate ? (
                        <img 
                          src="/assets/lock.svg" 
                          alt="lock" 
                          width={14} 
                          height={14} 
                          style={{ 
                            display: 'block',
                            filter: currentTheme.type === 'dark' ? 'brightness(0) invert(1)' : 'brightness(0)',
                            opacity: 0.6
                          }} 
                        />
                      ) : (
                        <span style={{ fontSize: 14, color: getTextColor.tertiary, fontWeight: 400 }}>#</span>
                      )}
                    </div>
                    <span style={{ fontWeight: 'inherit', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{channelName}</span>
                  </div>
                  {chat.unread !== undefined && chat.unread > 0 && (
                    <span
                      style={{
                        position: 'relative',
                        zIndex: 1,
                        minWidth: 18,
                        height: 18,
                        padding: '0 6px',
                        borderRadius: 12,
                        background: currentTheme.colors.unreadPill,
                        color: currentTheme.colors.unreadPillText,
                        fontSize: 11,
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {chat.unread}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Resizable Separator - Single 1px Line */}
      <div 
        ref={resizeRef}
        onMouseDown={(e) => {
          e.preventDefault()
          setIsResizing(true)
        }}
        style={{ 
          width: '1px',
          minWidth: '1px',
          maxWidth: '1px',
          background: currentTheme.colors.separator,
          flexShrink: 0,
          cursor: 'col-resize',
          position: 'relative',
          zIndex: 10,
        }}
      />

      {/* Right Panel - Chat Interface */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        background: currentTheme.colors.sidebarBackground,
        minWidth: 0
      }}>
        {/* Header Text */}
        <div style={{ 
          padding: '23px 20px 16px 20px', 
          background: currentTheme.colors.chatBackground,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
        }}>
          {(() => {
            const isGroupDM = currentChat?.id?.startsWith('group-')
            const isChannel = currentChat?.type === 'channel' || currentChat?.type === 'starred'
            const isOneOnOneDM = currentChat?.type === 'dm' && !isGroupDM
            
            return (
              <div style={{ fontWeight: 700, fontSize: 18, color: getTextColor.primary, fontFamily: 'Lato, sans-serif', lineHeight: 1, display: 'flex', alignItems: 'center', height: 20, gap: 8 }}>
                {/* Show avatars for DMs */}
                {(isOneOnOneDM || isGroupDM) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: isGroupDM ? -4 : 0 }}>
                {isOneOnOneDM ? (
                  // Single avatar for 1:1 DM
                  <div style={{ position: 'relative', width: 24, height: 24, flexShrink: 0 }}>
                    <img 
                      src={currentChat?.avatar || getAvatar(getPersonNameFromChatId(currentChat?.id || '') || '')} 
                      alt={currentChat?.name} 
                      width={24} 
                      height={24} 
                      style={{ 
                        borderRadius: 6, 
                        objectFit: 'cover', 
                        flexShrink: 0,
                        border: `1px solid ${currentTheme.colors.avatarBorder}`,
                        display: 'block'
                      }} 
                    />
                    {/* Status circle - green for online, grey for offline */}
                    {(currentChat?.isOnline !== undefined && !currentChat.isOnline) ? (
                      <>
                        {/* Outer circle - mask/background */}
                        <div
                          style={{
                            position: 'absolute',
                            bottom: -3,
                            right: 0,
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            background: currentTheme.colors.chatBackground,
                            border: `2px solid ${currentTheme.colors.chatBackground}`,
                            transform: 'translateX(4px)',
                            zIndex: 1,
                            boxSizing: 'border-box',
                          }}
                        >
                          {/* Inner circle - grey border (same size as green dot) */}
                          <div
                            style={{
                              position: 'absolute',
                              top: '50%',
                              left: '50%',
                              width: 7,
                              height: 7,
                              borderRadius: '50%',
                              background: currentTheme.colors.chatBackground,
                              border: `2px solid ${currentTheme.colors.offlineStatus}`,
                              transform: 'translate(-50%, -50%)',
                              zIndex: 2,
                              boxSizing: 'border-box',
                            }}
                          />
                        </div>
                      </>
                    ) : (
                      <div
                        style={{
                          position: 'absolute',
                          bottom: -3,
                          right: 0,
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          background: currentTheme.colors.onlineStatus,
                          border: `2px solid ${currentTheme.colors.chatBackground}`,
                          transform: 'translateX(4px)',
                          zIndex: 2,
                          boxSizing: 'border-box',
                        }}
                      />
                    )}
                  </div>
                ) : isGroupDM ? (
                  // Multiple avatars for group DM (show first 3, overlapping)
                  (() => {
                    const groupMemberNames = getGroupMembers(currentChat?.name || '')
                    const groupAvatars = groupMemberNames.slice(0, 3).map(name => {
                      const person = people.find(p => p.n === name.trim())
                      const chatItem = dmChats.find(c => c.name === name.trim())
                      return { 
                        name, 
                        avatar: person?.a || '/assets/avatar.jpeg',
                        isOnline: chatItem?.isOnline
                      }
                    })
                    return groupAvatars.map((member, idx) => (
                      <div
                        key={member.name}
                        style={{
                          position: 'relative',
                          marginLeft: idx > 0 ? -4 : 0,
                          zIndex: 3 - idx,
                        }}
                      >
                        <img
                          src={member.avatar}
                          alt={member.name}
                          width={24}
                          height={24}
                          style={{
                            borderRadius: 6,
                            objectFit: 'cover',
                            flexShrink: 0,
                            border: `2px solid ${currentTheme.colors.avatarBorder}`,
                            display: 'block'
                          }}
                        />
                        {/* Status circle - green for online, grey for offline */}
                        {(member.isOnline !== undefined && !member.isOnline) ? (
                          <>
                            {/* Outer circle - mask/background */}
                            <div
                              style={{
                                position: 'absolute',
                                bottom: -3,
                                right: 0,
                                width: 12,
                                height: 12,
                                borderRadius: '50%',
                                background: currentTheme.colors.chatBackground,
                                border: `2px solid ${currentTheme.colors.chatBackground}`,
                                transform: 'translateX(4px)',
                                zIndex: 1,
                                boxSizing: 'border-box',
                              }}
                            >
                              {/* Inner circle - grey border (same size as green dot) */}
                              <div
                                style={{
                                  position: 'absolute',
                                  top: '50%',
                                  left: '50%',
                                  width: 7,
                                  height: 7,
                                  borderRadius: '50%',
                                  background: currentTheme.colors.chatBackground,
                                  border: `2px solid ${currentTheme.colors.offlineStatus}`,
                                  transform: 'translate(-50%, -50%)',
                                  zIndex: 2,
                                  boxSizing: 'border-box',
                                }}
                              />
                            </div>
                          </>
                        ) : (
                          <div
                            style={{
                              position: 'absolute',
                              bottom: -3,
                              right: 0,
                              width: 12,
                              height: 12,
                              borderRadius: '50%',
                              background: currentTheme.colors.onlineStatus,
                              border: `2px solid ${currentTheme.colors.chatBackground}`,
                              transform: 'translateX(4px)',
                              zIndex: 2,
                              boxSizing: 'border-box',
                            }}
                          />
                        )}
                      </div>
                    ))
                  })()
                ) : null}
              </div>
            )}
            <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {(() => {
                const isChannel = currentChat?.type === 'channel' || currentChat?.type === 'starred'
                const isPrivate = currentChat?.isPrivate
                const channelName = isChannel && currentChat?.name 
                  ? currentChat.name.replace(/^#/, '')
                  : (currentChat?.name || '#itom-4412')
                
                return (
                  <>
                    {isChannel && (
                      <div style={{ 
                        width: 32, 
                        height: 32, 
                        borderRadius: 8, 
                        background: 'transparent',
                        border: `1px solid ${currentTheme.colors.separator}`,
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        flexShrink: 0,
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = currentTheme.colors.hoverBackground
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent'
                      }}
                      >
                        {isPrivate ? (
                          <img 
                            src="/assets/lock.svg" 
                            alt="lock" 
                            width={18} 
                            height={18} 
                            style={{ 
                              display: 'block',
                              filter: currentTheme.type === 'dark' ? 'brightness(0) invert(1)' : 'brightness(0)',
                              opacity: 0.8
                            }} 
                          />
                        ) : (
                          <span style={{ fontSize: 18, color: getTextColor.secondary, fontWeight: 400 }}>#</span>
                        )}
                      </div>
                    )}
                    {channelName}
                    {currentChat?.statusEmoji && (
                      <span style={{ fontSize: 18, flexShrink: 0 }}>{currentChat.statusEmoji}</span>
                    )}
                  </>
                )
              })()}
            </span>
          </div>
            )
          })()}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, height: 20 }}>
            {[1, 2, 3, 4, 5].map((i) => {
              // Calculate member count for group DMs and channels
              const isGroupDM = currentChat?.id?.startsWith('group-')
              const isChannel = currentChat?.type === 'channel' || currentChat?.type === 'starred'
              const isOneOnOneDM = currentChat?.type === 'dm' && !isGroupDM
              
              // Hide pill 1 (user count) for 1:1 DMs
              if (i === 1 && isOneOnOneDM) {
                return null
              }
              
              // Get fixed member count from the memoized counts
              let memberCount = 0
              if (isGroupDM && currentChat?.id) {
                memberCount = memberCounts[currentChat.id] || 0
              } else if (isChannel && currentChat?.id) {
                memberCount = memberCounts[currentChat.id] || 0
              }
              
              // Show users icon for pill 1 when it's a group DM or channel (not 1:1 DM)
              // Always show icon for pill 1 if it's a channel or group DM
              const showUsersIcon = i === 1 && (isGroupDM || isChannel) && !isOneOnOneDM && currentChat
              // Only show count text for pill 1 when we have a member count
              const showCount = i === 1 && memberCount > 0
              
              // All pills use the same user count pill styling
              // Height: 32px, Padding: 8px top/bottom, 10px left/right
              
              return (
                <div 
                  key={i}
                  style={{ 
                    ...(i === 1 ? { minWidth: '50px' } : { width: '32px' }),
                    boxSizing: 'border-box',
                    height: '32px',
                    paddingTop: '8px',
                    paddingBottom: '8px',
                    paddingLeft: i === 1 ? '10px' : '4px',
                    paddingRight: i === 1 ? '10px' : '4px',
                    background: 'transparent',
                    border: `1px solid ${currentTheme.colors.separator}`,
                    borderRadius: '8px', 
                    flexShrink: 0,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    fontSize: '9px',
                    color: getTextColor.secondary,
                    fontFamily: 'Lato, sans-serif',
                    fontWeight: 400,
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = currentTheme.colors.hoverBackground
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent'
                  }}
                >
                  {i === 1 && showUsersIcon && (
                    <>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="9" cy="7" r="4"></circle>
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                        <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                      </svg>
                      {showCount && (
                        <span style={{ fontSize: 13, lineHeight: 1, fontWeight: 600, flexShrink: 0 }}>{memberCount}</span>
                      )}
                    </>
                  )}
                  {i === 2 && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <path d="M3 18v-6a9 9 0 0 1 18 0v6"></path>
                      <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path>
                    </svg>
                  )}
                  {i === 3 && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                      <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                    </svg>
                  )}
                  {i === 4 && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <circle cx="11" cy="11" r="8"></circle>
                      <path d="m21 21-4.35-4.35"></path>
                    </svg>
                  )}
                  {i === 5 && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <circle cx="12" cy="12" r="1"></circle>
                      <circle cx="19" cy="12" r="1"></circle>
                      <circle cx="5" cy="12" r="1"></circle>
                    </svg>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Horizontal Tabs */}
        <div style={{ 
          display: 'flex', 
          borderBottom: `1px solid ${currentTheme.colors.separator}`,
          background: currentTheme.colors.chatBackground,
          padding: '0 20px'
        }}>
          {([
            { id: 'messages' as const, label: 'Messages', icon: (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            )},
            { id: 'add-canvas' as const, label: 'Add canvas', icon: (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <line x1="12" y1="8" x2="12" y2="16"></line>
                <line x1="8" y1="12" x2="16" y2="12"></line>
              </svg>
            )},
            { id: 'files' as const, label: 'Files', icon: (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10 9 9 9 8 9"></polyline>
              </svg>
            )}
          ]).map((tab, index) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '12px 0',
                border: 'none',
                outline: 'none',
                background: 'transparent',
                color: activeTab === tab.id ? getTextColor.primary : getTextColor.tabInactive,
                fontSize: 14,
                fontWeight: 400,
                cursor: 'pointer',
                borderBottom: activeTab === tab.id ? `2px solid ${currentTheme.colors.tabActiveBorder}` : '2px solid transparent',
                fontFamily: 'Lato, sans-serif',
                borderRadius: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginLeft: index === 0 ? 0 : 24,
              }}
              onMouseEnter={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.color = getTextColor.tabHover
                }
              }}
              onMouseLeave={(e) => {
                if (activeTab !== tab.id) {
                  e.currentTarget.style.color = getTextColor.tabInactive
                }
              }}
            >
              <div style={{ 
                width: 16, 
                height: 16, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                flexShrink: 0,
                color: 'inherit'
              }}>
                {tab.icon}
              </div>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Messages Area */}
        <div
          ref={slackRootRef}
          style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            overflowAnchor: 'none', // Prevent browser's automatic scroll anchoring
            padding: '20px 20px 10px 20px',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
          }}
        >
          {(!chatMessages[selectedChat] || chatMessages[selectedChat].length === 0) ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: getTextColor.tertiary, marginTop: 'auto' }}>
              <div style={{ fontSize: 15, marginBottom: 8 }}>No messages yet</div>
              <div style={{ fontSize: 13 }}>Start the conversation!</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', marginTop: 'auto' }}>
              {chatMessages[selectedChat].map((m, idx) => {
                const prevMsg = idx > 0 ? chatMessages[selectedChat][idx - 1] : null
                
                // Helper to parse time string and get hours difference
                const parseTimeDiff = (timeStr1: string, timeStr2: string): number => {
                  if (!timeStr1 || !timeStr2) return 0
                  try {
                    const parseTime = (str: string): number => {
                      const [time, period] = str.split(' ')
                      const [hours, minutes] = time.split(':').map(Number)
                      let hour24 = hours
                      if (period === 'PM' && hours !== 12) hour24 += 12
                      if (period === 'AM' && hours === 12) hour24 = 0
                      return hour24 * 60 + minutes
                    }
                    const diff = Math.abs(parseTime(timeStr2) - parseTime(timeStr1))
                    // Handle day boundaries (if diff is large, it might be next day)
                    return Math.min(diff, 1440 - diff) / 60 // Return hours
                  } catch {
                    return 0
                  }
                }
                
                // Show avatar if:
                // 1. First message (no previous message)
                // 2. Different sender than previous message
                // 3. Same sender but significant time gap (2+ hours) or different day period (AM/PM)
                // 4. Message has actions (actionable messages)
                const showAvatar = !prevMsg || 
                  prevMsg.who !== m.who || 
                  (m.actions && m.actions.length > 0) ||
                  (prevMsg.who === m.who && prevMsg.when && m.when && (
                    parseTimeDiff(prevMsg.when, m.when) >= 2 || 
                    (prevMsg.when.includes('AM') && m.when.includes('PM')) ||
                    (prevMsg.when.includes('PM') && m.when.includes('AM'))
                  ))
                
                // Show timestamp when avatar is shown (sender change, time gap, or actionable message)
                const showTimestamp = showAvatar
                
                const p = people.find(pp => pp.n === m.who)
                const isLastMessage = idx === chatMessages[selectedChat].length - 1
                return (
                  <div 
                    key={m.id}
                    data-message-id={m.id}
                    style={{ 
                      display: 'grid', 
                      gridTemplateColumns: '38px 1fr', 
                      columnGap: 10, 
                      marginBottom: isLastMessage ? 0 : 0, 
                      alignItems: 'start',
                      marginLeft: -20,
                      marginRight: -20,
                      paddingLeft: 20,
                      paddingRight: 20,
                      paddingTop: 8,
                      paddingBottom: 8,
                      borderRadius: 0,
                      position: 'relative',
                      background: showReactionPicker === m.id ? (currentTheme.type === 'light' ? currentTheme.colors.activeBackground : currentTheme.colors.hoverBackground) : 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      // Use lighter hover color for light mode
                      const hoverColor = currentTheme.type === 'light' 
                        ? currentTheme.colors.activeBackground // Lighter hover for light mode (#f5f3ed vs #f0ede5)
                        : currentTheme.colors.hoverBackground
                      e.currentTarget.style.background = hoverColor
                      setHoveredMessageId(m.id)
                    }}
                    onMouseLeave={(e) => {
                      // Only clear hover if reaction picker is not open for this message
                      if (showReactionPicker !== m.id) {
                        e.currentTarget.style.background = 'transparent'
                        setHoveredMessageId(null)
                      } else {
                        // Keep hover background and hoveredMessageId when picker is open
                        const hoverColor = currentTheme.type === 'light' 
                          ? currentTheme.colors.activeBackground
                          : currentTheme.colors.hoverBackground
                        e.currentTarget.style.background = hoverColor
                        setHoveredMessageId(m.id) // Keep menu bar visible
                      }
                    }}
                  >
                    {/* Menu Bar - appears on hover or when picker is open */}
                    {(hoveredMessageId === m.id || showReactionPicker === m.id) && (
                      <div style={{
                        position: 'absolute',
                        top: -16,
                        right: 16,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        zIndex: 10,
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          background: currentTheme.colors.sidebarBackground,
                          border: `1px solid ${currentTheme.colors.border}`,
                          borderRadius: 10,
                          padding: '6px 6px',
                        }}>
                          {/* Emoji button */}
                          <button
                            data-emoji-button="true"
                            onClick={(e) => {
                              e.stopPropagation()
                              setShowReactionPicker(showReactionPicker === m.id ? null : m.id)
                            }}
                            style={{
                              width: 28,
                              height: 28,
                              padding: 0,
                              borderRadius: 4,
                              border: 'none',
                              outline: 'none',
                              background: showReactionPicker === m.id ? currentTheme.colors.activeBackground : 'transparent',
                              color: getTextColor.secondary,
                              fontSize: 14,
                              fontFamily: 'Lato, sans-serif',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            onMouseEnter={(e) => {
                              if (showReactionPicker !== m.id) {
                                e.currentTarget.style.background = currentTheme.colors.hoverBackground
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (showReactionPicker !== m.id) {
                                e.currentTarget.style.background = 'transparent'
                              }
                            }}
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="10"></circle>
                              <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                              <line x1="9" y1="9" x2="9.01" y2="9"></line>
                              <line x1="15" y1="9" x2="15.01" y2="9"></line>
                            </svg>
                          </button>
                          {/* Forward button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              // TODO: Handle forward
                            }}
                            style={{
                              width: 28,
                              height: 28,
                              padding: 0,
                              borderRadius: 4,
                              border: 'none',
                              outline: 'none',
                              background: 'transparent',
                              color: getTextColor.secondary,
                              fontSize: 12,
                              fontFamily: 'Lato, sans-serif',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = currentTheme.colors.hoverBackground
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent'
                            }}
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="15 17 20 12 15 7"></polyline>
                              <path d="M4 18v-2a4 4 0 0 1 4-4h12"></path>
                            </svg>
                          </button>
                          {/* Bookmark button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              // TODO: Handle bookmark
                            }}
                            style={{
                              width: 28,
                              height: 28,
                              padding: 0,
                              borderRadius: 4,
                              border: 'none',
                              outline: 'none',
                              background: 'transparent',
                              color: getTextColor.secondary,
                              fontSize: 12,
                              fontFamily: 'Lato, sans-serif',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = currentTheme.colors.hoverBackground
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent'
                            }}
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"></path>
                            </svg>
                          </button>
                          {/* More options button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              // TODO: Handle more options
                            }}
                            style={{
                              width: 28,
                              height: 28,
                              padding: 0,
                              borderRadius: 4,
                              border: 'none',
                              outline: 'none',
                              background: 'transparent',
                              color: getTextColor.secondary,
                              fontSize: 12,
                              fontFamily: 'Lato, sans-serif',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = currentTheme.colors.hoverBackground
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = 'transparent'
                            }}
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <circle cx="12" cy="12" r="1"></circle>
                              <circle cx="19" cy="12" r="1"></circle>
                              <circle cx="5" cy="12" r="1"></circle>
                            </svg>
                          </button>
                        </div>
                        {/* Reaction Picker - appears when emoji button is clicked */}
                        {showReactionPicker === m.id && (
                          <div 
                            data-reaction-picker="true"
                            onMouseEnter={(e) => {
                              // Keep picker open when hovering over it
                              e.stopPropagation()
                              // Ensure hover state is maintained
                              setHoveredMessageId(m.id)
                            }}
                            onMouseLeave={(e) => {
                              // Keep picker open even when mouse leaves - only close on click outside or emoji selection
                              e.stopPropagation()
                              // Don't clear hover state - picker should stay open
                            }}
                            style={{
                              position: 'absolute',
                              bottom: '100%',
                              right: 0,
                              marginBottom: 8,
                              background: currentTheme.colors.sidebarBackground,
                              border: `1px solid ${currentTheme.colors.border}`,
                              borderRadius: 8,
                              padding: '8px 4px 8px 8px',
                              display: 'grid',
                              gridTemplateColumns: 'repeat(5, 32px)',
                              gridTemplateRows: 'repeat(2, 32px)',
                              gap: 4,
                              width: 'fit-content',
                              zIndex: 100,
                              boxShadow: currentTheme.type === 'dark' 
                                ? '0 4px 12px rgba(0, 0, 0, 0.3)' 
                                : '0 4px 12px rgba(0, 0, 0, 0.1)',
                            }}
                          >
                            {commonEmojis.map(emoji => (
                              <button
                                key={emoji}
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleAddReaction(m.id, emoji)
                                  setShowReactionPicker(null)
                                }}
                                style={{
                                  width: 32,
                                  height: 32,
                                  padding: 0,
                                  borderRadius: 4,
                                  border: 'none',
                                  outline: 'none',
                                  background: 'transparent',
                                  fontSize: 18,
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  lineHeight: 1,
                                  textAlign: 'center',
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.background = currentTheme.colors.hoverBackground
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.background = 'transparent'
                                }}
                              >
                                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>{emoji}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    {showAvatar ? (
                      <div 
                        style={{ cursor: 'pointer' }}
                        onClick={() => {}}
                      >
                        <img src={p?.a || '/assets/avatar.jpeg'} alt={m.who} width={38} height={38} style={{ borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                      </div>
                    ) : (
                      <div style={{ width: 38 }} />
                    )}
                    <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
                      {showAvatar && (
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, lineHeight: 1.1, marginBottom: 3 }}>
                          <span 
                            style={{ 
                              fontWeight: 900, 
                              color: currentTheme.type === 'light' ? '#1d1c1d' : '#ffffff', 
                              fontSize: 15, 
                              fontFamily: 'Lato, sans-serif', 
                              lineHeight: 1.1,
                              cursor: 'pointer',
                              textDecoration: 'none',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.textDecoration = 'underline'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.textDecoration = 'none'
                            }}
                            onClick={() => {}}
                          >
                            {m.who}
                          </span>
                          {showTimestamp && m.when && (
                            <span style={{ fontSize: 12, color: currentTheme.type === 'dark' ? '#9ca3af' : '#616061', lineHeight: 1.1 }}>{m.when}</span>
                          )}
                        </div>
                      )}
                      <div 
                        className="message-content"
                        style={{ 
                          lineHeight: 1.45, 
                          fontSize: 15, 
                          color: currentTheme.type === 'light' ? '#3d3c3d' : '#d5d5d5', 
                          fontFamily: 'Lato, sans-serif', 
                          marginTop: showAvatar ? 0 : 0, 
                          paddingRight: 60 
                        }} 
                        dangerouslySetInnerHTML={{ __html: m.text }}
                      />
                      {/* Link Embeds */}
                      {(() => {
                        const embedLinks = detectEmbedLinks(m.text)
                        if (embedLinks.length === 0) return null
                        
                        return (
                          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {embedLinks.map((embed, idx) => (
                              <LinkEmbed
                                key={idx}
                                embed={embed}
                                theme={currentTheme}
                                textColors={getTextColor}
                              />
                            ))}
                          </div>
                        )
                      })()}
                      {/* Message Actions */}
                      {m.actions && m.actions.length > 0 && !completedActions[m.id] && (
                        <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                          {m.actions.map((action) => {
                            const isPrimary = action.type === 'primary'
                            const greenColor = '#00553D' // Green color for primary buttons
                            return (
                              <button
                                key={action.id}
                                onClick={() => handleAction(m.id, action.id)}
                                style={{
                                  padding: '6px 12px',
                                  borderRadius: 6,
                                  border: isPrimary ? 'none' : `1px solid ${currentTheme.colors.borderLight}`,
                                  outline: 'none',
                                  background: isPrimary ? greenColor : currentTheme.colors.chatBackground,
                                  color: isPrimary ? '#ffffff' : getTextColor.primary,
                                  fontSize: 14,
                                  fontWeight: 700,
                                  fontFamily: 'Lato, sans-serif',
                                  cursor: 'pointer',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  userSelect: 'none',
                                  WebkitUserSelect: 'none',
                                  WebkitTapHighlightColor: 'transparent',
                                }}
                                onMouseEnter={(e) => {
                                  if (isPrimary) {
                                    e.currentTarget.style.background = '#004030' // Darker green on hover (#00553D -> #004030)
                                  } else {
                                    e.currentTarget.style.background = currentTheme.colors.hoverBackground
                                  }
                                }}
                                onMouseLeave={(e) => {
                                  if (isPrimary) {
                                    e.currentTarget.style.background = greenColor
                                  } else {
                                    e.currentTarget.style.background = currentTheme.colors.chatBackground
                                  }
                                }}
                                onMouseDown={(e) => {
                                  e.preventDefault()
                                }}
                              >
                                {action.emoji && <span style={{ fontSize: 14 }}>{action.emoji}</span>}
                                <span>{action.label}</span>
                              </button>
                            )
                          })}
                        </div>
                      )}
                      {/* Action Confirmation Text */}
                      {completedActions[m.id] && m.actions && (() => {
                        const completedAction = m.actions.find(a => a.id === completedActions[m.id])
                        if (!completedAction) return null
                        // Replace placeholder with actual actor name if needed
                        const confirmationText = completedAction.confirmationText.replace('{actor}', currentUserName)
                        return (
                          <div style={{ 
                            marginTop: 12,
                            fontSize: 14,
                            fontStyle: 'italic',
                            color: currentTheme.type === 'light' ? '#868686' : '#9ca3af',
                            fontFamily: 'Lato, sans-serif',
                            lineHeight: 1.4,
                          }}>
                            {confirmationText}
                          </div>
                        )
                      })()}
                      {m.reactions && Object.keys(m.reactions).length > 0 && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                            {Object.entries(m.reactions).map(([emoji, count]) => {
                              const userReactedSet = userReactions[m.id] || new Set<string>()
                              const hasUserReacted = userReactedSet.has(emoji)
                              // Use very subtle lighter background for dark mode, very subtle darker background for light mode
                              // This ensures reacted emojis stand out just barely even when message is hovered
                              // Apply special color to ALL pills with reactions (not just user reactions)
                              const reactedBackground = currentTheme.type === 'dark' 
                                ? 'rgba(255, 255, 255, 0.04)' // Very subtle white overlay - barely lighter than hoverBackground
                                : 'rgba(0, 0, 0, 0.05)' // Very subtle black overlay - barely darker than hoverBackground
                              const defaultBackground = currentTheme.colors.hoverBackground
                              // All pills with reactions get the special background color
                              const pillBackground = count > 0 ? reactedBackground : defaultBackground
                              
                              // For selected emoji pills (user has reacted), use light accent fill and inset border
                              const accentColor = currentTheme.colors.buttonPrimary
                              // Convert hex to rgba for opacity
                              const hexToRgba = (hex: string, alpha: number) => {
                                const r = parseInt(hex.slice(1, 3), 16)
                                const g = parseInt(hex.slice(3, 5), 16)
                                const b = parseInt(hex.slice(5, 7), 16)
                                return `rgba(${r}, ${g}, ${b}, ${alpha})`
                              }
                              const selectedBackground = currentTheme.type === 'dark'
                                ? hexToRgba(accentColor, 0.4) // More saturated accent color for dark mode
                                : hexToRgba(accentColor, 0.3) // More saturated accent color for light mode
                              
                              return (
                                <button
                                  key={emoji}
                                  onClick={() => handleReaction(m.id, emoji)}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    padding: '8px 10px',
                                    borderRadius: 999,
                                    border: 'none',
                                    outline: 'none',
                                    background: hasUserReacted ? selectedBackground : pillBackground,
                                    color: getTextColor.secondary,
                                    fontSize: 13,
                                    fontFamily: 'Lato, sans-serif',
                                    cursor: 'pointer',
                                    lineHeight: 1,
                                    userSelect: 'none',
                                    WebkitUserSelect: 'none',
                                    WebkitTapHighlightColor: 'transparent',
                                  }}
                                  onMouseDown={(e) => {
                                    e.preventDefault()
                                  }}
                                  onMouseEnter={(e) => {
                                    if (hasUserReacted) {
                                      // Keep selected styling on hover, just slightly brighter
                                      const hexToRgba = (hex: string, alpha: number) => {
                                        const r = parseInt(hex.slice(1, 3), 16)
                                        const g = parseInt(hex.slice(3, 5), 16)
                                        const b = parseInt(hex.slice(5, 7), 16)
                                        return `rgba(${r}, ${g}, ${b}, ${alpha})`
                                      }
                                      const hoverBackground = currentTheme.type === 'dark'
                                        ? hexToRgba(accentColor, 0.45)
                                        : hexToRgba(accentColor, 0.35)
                                      e.currentTarget.style.background = hoverBackground
                                    } else {
                                      // Use very subtle contrast on hover for non-selected reacted emojis
                                      e.currentTarget.style.background = count > 0
                                        ? (currentTheme.type === 'dark' 
                                            ? 'rgba(255, 255, 255, 0.06)' // Very subtle lighter for dark mode hover
                                            : 'rgba(0, 0, 0, 0.05)') // Very subtle darker for light mode hover
                                        : currentTheme.colors.activeBackground
                                    }
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.background = hasUserReacted ? selectedBackground : pillBackground
                                  }}
                                >
                                  <span>{emoji}</span>
                                  <span style={{ fontWeight: 400, color: currentTheme.type === 'light' ? '#1d1c1d' : '#ffffff' }}>{count}</span>
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Message Composer */}
        <div style={{ padding: '12px 20px 20px 20px' }}>
          <div 
            ref={composeContainerRef}
            style={{ 
              border: `1px solid ${currentTheme.colors.composeBorder}`,
              borderRadius: 10,
              background: currentTheme.colors.composeBackground,
              display: 'flex',
              flexDirection: 'column',
              transition: 'border-color 0.2s ease',
            }}
          >
              {/* Top Row of Action Icons */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 0, 
                padding: '4px',
                minHeight: 32,
              }}>
                {[
                  { icon: 'bold', title: 'Bold' },
                  { icon: 'italic', title: 'Italic' },
                  { icon: 'underline', title: 'Underline' },
                  { icon: 'link', title: 'Link' },
                  { icon: 'list', title: 'Bullet List' },
                  { icon: 'numbered-list', title: 'Numbered List' },
                  { icon: 'code', title: 'Code' },
                  { icon: 'quote', title: 'Quote' },
                ].map((action, idx) => (
                  <button
                    key={idx}
                    title={action.title}
                    style={{
                      width: 32,
                      height: 32,
                      padding: 0,
                      border: 'none',
                      outline: 'none',
                      background: 'transparent',
                      borderRadius: 8,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isComposeFocused ? getTextColor.secondary : getTextColor.tertiary,
                      transition: 'background-color 0.15s ease, color 0.15s ease, opacity 0.15s ease',
                      opacity: isComposeFocused ? 1 : 0.6,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = currentTheme.colors.activeBackground
                      e.currentTarget.style.color = getTextColor.primary
                      e.currentTarget.style.opacity = '1'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = isComposeFocused ? getTextColor.secondary : getTextColor.tertiary
                      e.currentTarget.style.opacity = isComposeFocused ? '1' : '0.6'
                    }}
                  >
                    {action.icon === 'bold' && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
                        <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"></path>
                      </svg>
                    )}
                    {action.icon === 'italic' && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="19" y1="4" x2="10" y2="4"></line>
                        <line x1="14" y1="20" x2="5" y2="20"></line>
                        <line x1="15" y1="4" x2="9" y2="20"></line>
                      </svg>
                    )}
                    {action.icon === 'underline' && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"></path>
                        <line x1="4" y1="21" x2="20" y2="21"></line>
                      </svg>
                    )}
                    {action.icon === 'strikethrough' && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 4h2a2 2 0 0 1 2 2v2M8 20H6a2 2 0 0 1-2-2v-2"></path>
                        <line x1="7" y1="12" x2="17" y2="12"></line>
                      </svg>
                    )}
                    {action.icon === 'code' && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="16 18 22 12 16 6"></polyline>
                        <polyline points="8 6 2 12 8 18"></polyline>
                      </svg>
                    )}
                    {action.icon === 'link' && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
                        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
                      </svg>
                    )}
                    {action.icon === 'list' && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="8" y1="6" x2="21" y2="6"></line>
                        <line x1="8" y1="12" x2="21" y2="12"></line>
                        <line x1="8" y1="18" x2="21" y2="18"></line>
                        <line x1="3" y1="6" x2="3.01" y2="6"></line>
                        <line x1="3" y1="12" x2="3.01" y2="12"></line>
                        <line x1="3" y1="18" x2="3.01" y2="18"></line>
                      </svg>
                    )}
                    {action.icon === 'numbered-list' && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="10" y1="6" x2="21" y2="6"></line>
                        <line x1="10" y1="12" x2="21" y2="12"></line>
                        <line x1="10" y1="18" x2="21" y2="18"></line>
                        <line x1="4" y1="6" x2="4.01" y2="6"></line>
                        <line x1="4" y1="12" x2="4.01" y2="12"></line>
                        <line x1="4" y1="18" x2="4.01" y2="18"></line>
                      </svg>
                    )}
                    {action.icon === 'quote' && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"></path>
                        <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"></path>
                      </svg>
                    )}
                    {action.icon === 'mention' && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                        <circle cx="8.5" cy="7" r="4"></circle>
                        <line x1="20" y1="8" x2="20" y2="14"></line>
                        <line x1="23" y1="11" x2="17" y2="11"></line>
                      </svg>
                    )}
                  </button>
                ))}
              </div>

              {/* Typing Area */}
              <textarea
                ref={textareaRef}
                value={messageInput}
                onChange={handleTextareaChange}
                onKeyPress={handleKeyPress}
                onFocus={() => {
                  setIsComposeFocused(true)
                  if (composeContainerRef.current) {
                    composeContainerRef.current.style.borderColor = currentTheme.colors.composeBorderFocus
                  }
                }}
                onBlur={() => {
                  setIsComposeFocused(false)
                  if (composeContainerRef.current) {
                    composeContainerRef.current.style.borderColor = currentTheme.colors.composeBorder
                  }
                }}
                placeholder={`Message ${(() => {
                  const isChannel = currentChat?.type === 'channel' || currentChat?.type === 'starred'
                  if (isChannel && currentChat?.name) {
                    return currentChat.name.replace(/^#/, '')
                  }
                  return currentChat?.name || '#itom-4412'
                })()}`}
                style={{
                  border: 'none',
                  borderRadius: 0,
                  padding: '10px 12px',
                  fontSize: 15,
                  outline: 'none',
                  background: 'transparent',
                  color: getTextColor.primary,
                  fontFamily: 'Lato, sans-serif',
                  resize: 'none',
                  overflow: 'hidden',
                  lineHeight: '20px',
                  minHeight: '20px',
                  maxHeight: '200px',
                  height: 'auto',
                }}
                rows={1}
              />

              {/* Bottom Row of Action Icons */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 0, 
                padding: '4px',
                minHeight: 32,
              }}>
                {[
                  { icon: 'plus', title: 'Add' },
                  { icon: 'emoji', title: 'Emoji' },
                  { icon: 'file', title: 'File' },
                  { icon: 'image', title: 'Image' },
                  { icon: 'video', title: 'Video' },
                  { icon: 'record', title: 'Record' },
                  { icon: 'more', title: 'More' },
                ].map((action, idx) => (
                  <button
                    key={idx}
                    title={action.title}
                    style={{
                      width: 32,
                      height: 32,
                      padding: 0,
                      border: 'none',
                      outline: 'none',
                      background: 'transparent',
                      borderRadius: 8,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isComposeFocused ? getTextColor.secondary : getTextColor.tertiary,
                      transition: 'background-color 0.15s ease, color 0.15s ease, opacity 0.15s ease',
                      opacity: isComposeFocused ? 1 : 0.6,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = currentTheme.colors.activeBackground
                      e.currentTarget.style.color = getTextColor.primary
                      e.currentTarget.style.opacity = '1'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'transparent'
                      e.currentTarget.style.color = isComposeFocused ? getTextColor.secondary : getTextColor.tertiary
                      e.currentTarget.style.opacity = isComposeFocused ? '1' : '0.6'
                    }}
                  >
                    {action.icon === 'plus' && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                      </svg>
                    )}
                    {action.icon === 'emoji' && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
                        <line x1="9" y1="9" x2="9.01" y2="9"></line>
                        <line x1="15" y1="9" x2="15.01" y2="9"></line>
                      </svg>
                    )}
                    {action.icon === 'file' && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                        <polyline points="14 2 14 8 20 8"></polyline>
                        <line x1="16" y1="13" x2="8" y2="13"></line>
                        <line x1="16" y1="17" x2="8" y2="17"></line>
                        <polyline points="10 9 9 9 8 9"></polyline>
                      </svg>
                    )}
                    {action.icon === 'image' && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                        <polyline points="21 15 16 10 5 21"></polyline>
                      </svg>
                    )}
                    {action.icon === 'video' && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="23 7 16 12 23 17 23 7"></polygon>
                        <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                      </svg>
                    )}
                    {action.icon === 'record' && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <circle cx="12" cy="12" r="3"></circle>
                      </svg>
                    )}
                    {action.icon === 'more' && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="1"></circle>
                        <circle cx="19" cy="12" r="1"></circle>
                        <circle cx="5" cy="12" r="1"></circle>
                      </svg>
                    )}
                  </button>
                ))}
                {/* Send Button - Extreme Right */}
                <button
                  title="Send"
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim()}
                  style={{
                    width: 32,
                    height: 32,
                    padding: 0,
                    border: 'none',
                    outline: 'none',
                    background: isComposeFocused 
                      ? currentTheme.colors.buttonPrimaryHover 
                      : currentTheme.colors.hoverBackground,
                    borderRadius: 8,
                    cursor: !messageInput.trim() ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isComposeFocused 
                      ? getTextColor.primary
                      : getTextColor.tertiary,
                    transition: 'background-color 0.08s ease, color 0.08s ease, opacity 0.08s ease',
                    opacity: isComposeFocused ? 1 : 0.8,
                    marginLeft: 'auto',
                  }}
                  onMouseEnter={(e) => {
                    if (isComposeFocused) {
                      e.currentTarget.style.background = currentTheme.colors.buttonPrimaryHover
                      e.currentTarget.style.opacity = '0.9'
                      e.currentTarget.style.color = getTextColor.primary
                      const icon = e.currentTarget.querySelector('img')
                      if (icon) icon.style.opacity = '1'
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = isComposeFocused 
                      ? currentTheme.colors.buttonPrimaryHover
                      : currentTheme.colors.hoverBackground
                    e.currentTarget.style.color = isComposeFocused 
                      ? getTextColor.primary
                      : getTextColor.tertiary
                    e.currentTarget.style.opacity = isComposeFocused ? '1' : '0.8'
                    const icon = e.currentTarget.querySelector('img')
                    if (icon) icon.style.opacity = isComposeFocused ? '1' : '0.6'
                  }}
                >
                  <img 
                    src="/assets/send-horizontal.svg" 
                    alt="send" 
                    width={16} 
                    height={16} 
                    style={{ 
                      display: 'block',
                      filter: isComposeFocused 
                        ? 'brightness(0) invert(1)' 
                        : (currentTheme.type === 'dark' ? 'brightness(0) invert(1)' : 'brightness(0)'),
                      opacity: isComposeFocused ? 1 : 0.6
                    }} 
                  />
                </button>
              </div>
            </div>
        </div>
      </div>
    </div>
  )
}
