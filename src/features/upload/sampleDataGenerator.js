// Sample data generator for LinkedIn Analytics demo
// Generates realistic but fake data for demonstration purposes

const SAMPLE_CONTENT_TEMPLATES = {
  professional: [
    "5 lessons from scaling engineering teams at early-stage startups",
    "Why technical debt isn't always bad debt - a strategic perspective",
    "The hidden cost of context switching in remote work environments",
    "How to run effective 1:1s with senior engineers and tech leads",
    "Building resilient systems: lessons from 3 major outages",
    "The art of code reviews: beyond finding bugs",
    "Microservices vs monolith: when to choose what",
    "Leading without authority: influence techniques for senior engineers",
    "Database optimization strategies that actually work",
    "The psychology of debugging: why fresh eyes matter",
    "API design principles that stand the test of time",
    "Managing technical roadmaps in uncertain times",
    "The real cost of premature optimization",
    "Building engineering culture in distributed teams",
    "Why documentation is a competitive advantage",
    "Security by design: lessons from the trenches",
    "The evolution of software architecture patterns",
    "Mentoring junior developers: what I wish I knew earlier"
  ],
  
  industry: [
    "OpenAI's latest breakthrough shows 40% improvement in reasoning tasks",
    "Microsoft's $2.1B acquisition signals shift in enterprise AI strategy",
    "Remote work productivity: new MIT study challenges common assumptions",
    "The great cloud repatriation: why companies are moving back on-premise",
    "Kubernetes adoption hits 88% among Fortune 500 companies",
    "GitHub Copilot usage statistics reveal surprising developer patterns",
    "Web3 winter continues: VC funding drops 67% year-over-year",
    "Apple's M3 chip architecture: what it means for developers",
    "The rise of edge computing: 5G's killer application emerges",
    "Cybersecurity spending reaches $200B globally - here's where it's going",
    "Low-code platforms now generate 65% of enterprise applications"
  ],
  
  personal: [
    "My biggest career mistake and the $50k lesson I learned",
    "Why I turned down a $300k FAANG offer to stay at a startup",
    "3 years as a remote engineering manager: honest reflections",
    "From burnout to balance: how I restructured my work life",
    "The interview question that changed my perspective on leadership",
    "Moving from IC to management: 6 months in, here's what I've learned",
    "Why I left my comfortable job to join a pre-seed startup",
    "The side project that became my full-time career",
    "Imposter syndrome at 40: it doesn't get easier, but you get stronger"
  ],
  
  jobs: [
    "We're hiring: Senior Full Stack Engineer (Remote, $140k-$180k)",
    "Top 5 interview red flags from a hiring manager's perspective", 
    "The technical interview process needs to change - here's how",
    "Remote-first hiring: lessons from 200+ interviews",
    "Why we removed whiteboard coding from our interview process"
  ],
  
  company: [
    "Excited to announce our Series A: $15M to revolutionize developer tools",
    "Celebrating 2 years since launching our platform - key metrics inside"
  ]
}

const ENGAGEMENT_PATTERNS = {
  professional: { erRange: [0.018, 0.045], impressionRange: [400, 1200] },
  industry: { erRange: [0.015, 0.035], impressionRange: [300, 900] },
  personal: { erRange: [0.025, 0.065], impressionRange: [500, 1400] },
  jobs: { erRange: [0.028, 0.055], impressionRange: [600, 1800] },
  company: { erRange: [0.012, 0.025], impressionRange: [200, 600] }
}

const WEEKDAY_MULTIPLIERS = {
  0: 0.6, // Sunday
  1: 1.0, // Monday
  2: 1.2, // Tuesday (best day)
  3: 0.9, // Wednesday
  4: 1.1, // Thursday
  5: 0.8, // Friday
  6: 0.7  // Saturday
}

function randomBetween(min, max) {
  return Math.random() * (max - min) + min
}

function randomInt(min, max) {
  return Math.floor(randomBetween(min, max + 1))
}

function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)]
}

function generateRandomDate(daysAgo) {
  const now = new Date()
  const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
  // Add some random hours/minutes to make it realistic
  date.setHours(randomInt(8, 20), randomInt(0, 59), randomInt(0, 59))
  return date
}

function generateEngagementMetrics(impressions, engagementRate) {
  const totalEngagement = Math.round(impressions * engagementRate)
  
  // Distribute engagement across likes, comments, reposts
  const likesRatio = randomBetween(0.65, 0.80)
  const commentsRatio = randomBetween(0.15, 0.25)
  const repostsRatio = 1 - likesRatio - commentsRatio
  
  const likes = Math.round(totalEngagement * likesRatio)
  const comments = Math.round(totalEngagement * commentsRatio)
  const reposts = Math.max(0, totalEngagement - likes - comments)
  
  return { likes, comments, reposts }
}

function addContentVariation(title) {
  // Add emojis to some posts
  const emojiChance = 0.6
  if (Math.random() < emojiChance) {
    const emojis = ['🚀', '💡', '🔥', '📈', '💪', '🎯', '⚡', '🌟', '📊', '🛠️', '🔧', '💻']
    const emojiCount = randomInt(1, 3)
    for (let i = 0; i < emojiCount; i++) {
      if (Math.random() < 0.5) {
        title = randomChoice(emojis) + ' ' + title
      } else {
        title = title + ' ' + randomChoice(emojis)
      }
    }
  }
  
  // Add some variation in formatting
  if (Math.random() < 0.3) {
    title = title + '\n\nWhat do you think? Share your experience in the comments!'
  } else if (Math.random() < 0.2) {
    title = title + '\n\n#tech #engineering #leadership'
  }
  
  return title
}

function generatePost(daysAgo, contentType) {
  const templates = SAMPLE_CONTENT_TEMPLATES[contentType]
  const patterns = ENGAGEMENT_PATTERNS[contentType]
  
  const title = addContentVariation(randomChoice(templates))
  const createdAt = generateRandomDate(daysAgo)
  const dayOfWeek = createdAt.getDay()
  const weekdayMultiplier = WEEKDAY_MULTIPLIERS[dayOfWeek]
  
  // Generate performance metrics with day-of-week influence
  const baseImpressions = randomBetween(patterns.impressionRange[0], patterns.impressionRange[1])
  const impressions = Math.round(baseImpressions * weekdayMultiplier)
  
  const baseER = randomBetween(patterns.erRange[0], patterns.erRange[1])
  const engagementRate = baseER * weekdayMultiplier
  
  const { likes, comments, reposts } = generateEngagementMetrics(impressions, engagementRate)
  
  // No links in sample data
  const link = null
  
  return {
    title,
    link,
    createdAt: createdAt.toISOString(),
    impressions,
    engagementRate,
    likes,
    comments,
    reposts
  }
}

function generateDailyMetrics(date, posts) {
  // Find posts for this date
  const dateStr = date.toISOString().split('T')[0]
  const dayPosts = posts.filter(post => post.createdAt.startsWith(dateStr))
  
  if (dayPosts.length === 0) {
    // Days with no posts get baseline impressions from profile views
    const baselineImpressions = randomInt(20, 80)
    const baselineER = randomBetween(0.005, 0.015)
    
    return {
      date: dateStr,
      impressions: baselineImpressions,
      engagementRate: baselineER
    }
  }
  
  // Aggregate metrics for the day
  const totalImpressions = dayPosts.reduce((sum, post) => sum + post.impressions, 0)
  const avgER = dayPosts.reduce((sum, post) => sum + post.engagementRate, 0) / dayPosts.length
  
  // Add baseline profile impressions to posting days
  const baselineViews = randomInt(30, 120)
  const dailyImpressions = totalImpressions + baselineViews
  const dailyER = avgER * randomBetween(0.95, 1.05)
  
  return {
    date: dateStr,
    impressions: dailyImpressions,
    engagementRate: Math.max(0.005, dailyER)
  }
}

function generateFollowersDaily(daysAgo) {
  const date = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
  const dateStr = date.toISOString().split('T')[0]

  // Generate realistic follower growth with some randomness
  // Base growth: 20-50 organic, 0-5 sponsored, 0-3 auto-invited
  const organicBase = randomInt(20, 50)
  const sponsoredBase = randomInt(0, 5)
  const autoInvitedBase = randomInt(0, 3)

  // Add some trend - more followers over time (simulating growth)
  const growthMultiplier = Math.min(1 + (daysAgo / 365), 2) // Up to 2x growth over a year
  const dayOfWeek = date.getDay()
  const weekdayMultiplier = dayOfWeek >= 1 && dayOfWeek <= 5 ? 1.2 : 0.8 // More on weekdays

  const organicFollowers = Math.round(organicBase * growthMultiplier * weekdayMultiplier)
  const sponsoredFollowers = Math.round(sponsoredBase * growthMultiplier)
  const autoInvitedFollowers = Math.round(autoInvitedBase * growthMultiplier)
  const totalFollowers = organicFollowers + sponsoredFollowers + autoInvitedFollowers

  return {
    date: dateStr,
    organicFollowers,
    sponsoredFollowers,
    autoInvitedFollowers,
    totalFollowers
  }
}

function generateFollowersDemographics() {
  const demographics = []

  // Location data (top locations)
  const locations = [
    { location: 'San Francisco Bay Area', count: randomInt(500, 700) },
    { location: 'New York City Metropolitan Area', count: randomInt(250, 350) },
    { location: 'London Area, United Kingdom', count: randomInt(250, 350) },
    { location: 'Los Angeles Metropolitan Area', count: randomInt(130, 180) },
    { location: 'Greater Boston', count: randomInt(90, 130) },
    { location: 'Greater Bengaluru Area, India', count: randomInt(80, 120) },
    { location: 'Moscow Metropolitan Area, Russia', count: randomInt(75, 110) },
    { location: 'Greater Seattle Area', count: randomInt(55, 85) }
  ]

  locations.forEach(loc => {
    demographics.push({
      categoryType: 'location',
      category: loc.location,
      count: loc.count
    })
  })

  // Job function data
  const jobFunctions = [
    { job_function: 'Engineering', count: randomInt(700, 900) },
    { job_function: 'Business Development', count: randomInt(1000, 1300) },
    { job_function: 'Operations', count: randomInt(300, 400) },
    { job_function: 'Sales', count: randomInt(200, 300) },
    { job_function: 'Information Technology', count: randomInt(200, 300) },
    { job_function: 'Research', count: randomInt(180, 250) },
    { job_function: 'Product Management', count: randomInt(160, 220) },
    { job_function: 'Finance', count: randomInt(140, 200) }
  ]

  jobFunctions.forEach(jf => {
    demographics.push({
      categoryType: 'job_function',
      category: jf.job_function,
      count: jf.count
    })
  })

  // Seniority data
  const seniorities = [
    { seniority: 'Senior', count: randomInt(1200, 1500) },
    { seniority: 'Entry', count: randomInt(1100, 1400) },
    { seniority: 'Director', count: randomInt(400, 550) },
    { seniority: 'Owner', count: randomInt(400, 550) },
    { seniority: 'Manager', count: randomInt(250, 350) },
    { seniority: 'CXO', count: randomInt(300, 450) },
    { seniority: 'VP', count: randomInt(180, 250) }
  ]

  seniorities.forEach(s => {
    demographics.push({
      categoryType: 'seniority',
      category: s.seniority,
      count: s.count
    })
  })

  // Industry data
  const industries = [
    { industry: 'Software Development', count: randomInt(400, 600) },
    { industry: 'IT Services and IT Consulting', count: randomInt(300, 450) },
    { industry: 'Technology, Information and Internet', count: randomInt(180, 280) },
    { industry: 'Higher Education', count: randomInt(180, 280) },
    { industry: 'Financial Services', count: randomInt(130, 200) },
    { industry: 'Venture Capital and Private Equity Principals', count: randomInt(160, 240) },
    { industry: 'Business Consulting and Services', count: randomInt(110, 170) },
    { industry: 'Research Services', count: randomInt(110, 170) }
  ]

  industries.forEach(ind => {
    demographics.push({
      categoryType: 'industry',
      category: ind.industry,
      count: ind.count
    })
  })

  // Company size data
  const companySizes = [
    { company_size: '2-10', count: randomInt(700, 1000) },
    { company_size: '11-50', count: randomInt(700, 1000) },
    { company_size: '51-200', count: randomInt(400, 650) },
    { company_size: '1001-5000', count: randomInt(300, 500) },
    { company_size: '201-500', count: randomInt(250, 400) },
    { company_size: '10001+', count: randomInt(600, 900) },
    { company_size: '501-1000', count: randomInt(200, 350) }
  ]

  companySizes.forEach(cs => {
    demographics.push({
      categoryType: 'company_size',
      category: cs.company_size,
      count: cs.count
    })
  })

  return demographics
}

export function generateSampleData() {
  const posts = []
  const contentTypes = Object.keys(SAMPLE_CONTENT_TEMPLATES)

  // Distribution of content types for 120 posts
  const contentDistribution = [
    ...Array(50).fill('professional'),  // 42%
    ...Array(30).fill('industry'),      // 25%
    ...Array(25).fill('personal'),      // 21%
    ...Array(10).fill('jobs'),          // 8%
    ...Array(5).fill('company')         // 4%
  ]

  // Generate posts distributed over 90 days
  const postDates = []

  // Create realistic posting pattern (more posts on weekdays)
  for (let day = 0; day < 90; day++) {
    const date = new Date(Date.now() - day * 24 * 60 * 60 * 1000)
    const dayOfWeek = date.getDay()

    // Probability of posting based on day of week (higher rates to get 120 posts)
    let postProbability = 0.6 // base probability
    if (dayOfWeek >= 1 && dayOfWeek <= 5) postProbability = 1.2 // weekdays
    if (dayOfWeek === 2 || dayOfWeek === 4) postProbability = 1.5 // Tuesday/Thursday

    // Sometimes post multiple times per day
    const maxPosts = Math.random() < 0.3 ? 2 : 1

    for (let i = 0; i < maxPosts; i++) {
      if (Math.random() < postProbability) {
        postDates.push(day)
      }
    }
  }

  // Trim to exactly 120 posts
  postDates.sort((a, b) => b - a) // Most recent first
  const selectedDates = postDates.slice(0, 120)

  // Generate posts
  selectedDates.forEach((daysAgo, index) => {
    const contentType = contentDistribution[index % contentDistribution.length]
    const post = generatePost(daysAgo, contentType)
    posts.push(post)
  })

  // Generate daily metrics for all 90 days
  const daily = []
  for (let day = 0; day < 90; day++) {
    const date = new Date(Date.now() - day * 24 * 60 * 60 * 1000)
    const dayMetrics = generateDailyMetrics(date, posts)
    daily.push(dayMetrics)
  }

  // Generate followers data for 90 days
  const followersDaily = []
  for (let day = 0; day < 90; day++) {
    const followersDay = generateFollowersDaily(day)
    followersDaily.push(followersDay)
  }

  // Generate followers demographics
  const followersDemographics = generateFollowersDemographics()

  // Sort posts by date (newest first)
  posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  // Sort daily metrics by date (newest first)
  daily.sort((a, b) => new Date(b.date) - new Date(a.date))

  // Sort followers daily by date (newest first)
  followersDaily.sort((a, b) => new Date(b.date) - new Date(a.date))

  return {
    posts,
    daily,
    followersDaily,
    followersDemographics,
    metadata: {
      generated: new Date().toISOString(),
      postCount: posts.length,
      dailyCount: daily.length,
      followersDailyCount: followersDaily.length,
      followersDemographicsCount: followersDemographics.length,
      dateRange: {
        start: daily[daily.length - 1]?.date,
        end: daily[0]?.date
      }
    }
  }
}