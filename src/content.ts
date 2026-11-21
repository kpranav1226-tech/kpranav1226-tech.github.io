export type Project = {
  id: string
  title: string
  description: string
  category: string
  stack: string[]
  status: string
  github?: string
  live?: string
}

export type Certificate = {
  id: string
  title: string
  issuer: string
  date?: string
  credentialId?: string
  url?: string
  note?: string
}

export type Milestone = {
  id: string
  title: string
  org?: string
  period?: string
  description?: string
}

export type Interest = {
  id: string
  title: string
  description: string
}

export type SkillGroup = {
  category: string
  items: string[]
}

export type Content = {
  name: string
  shortName: string
  initials: string
  headline: string
  tagline: string
  location: string
  about: string
  aboutNote: string
  email: string
  linkedin: string
  github: string
  instagram: string
  skillGroups: SkillGroup[]
  certificates: Certificate[]
  milestones: Milestone[]
  interests: Interest[]
  projects: Project[]
  sourceNote: string
}

export const LINKEDIN_URL = 'https://www.linkedin.com/in/k-pranav-2813043b2'

export const defaultContent: Content = {
  name: 'K Pranav',
  shortName: 'Pranav',
  initials: 'KP',
  headline: 'AIML Student · Builder · Problem Solver',
  tagline: 'I build AI-powered solutions, tools, and real-world projects that create impact.',
  location: 'Chittoor, Andhra Pradesh, India',
  about:
    'I am an AIML student and builder based in Chittoor, Andhra Pradesh, India. My working skills include Python and AI for business, and I am building my foundations in artificial intelligence and machine learning one project at a time.',
  aboutNote:
    'Summary written only from your LinkedIn headline, location and listed skills. Edit it in Customize to use your own words.',
  email: '',
  linkedin: LINKEDIN_URL,
  github: '',
  instagram: '',
  skillGroups: [
    { category: 'Programming', items: ['Python (Programming Language)'] },
    { category: 'Artificial Intelligence', items: ['AI for Business Professional'] },
    {
      category: 'Professional',
      items: ['Communication', 'Business Email', 'Resume Writing and Job Interviewing'],
    },
  ],
  certificates: [
    {
      id: 'cert-nxtwave-mcp',
      title: 'MCP Workshop: Build AI Automations That Work For You',
      issuer: 'NxtWave',
      date: '2026',
      url: 'https://lnkd.in/geZiCedw',
      note: 'Certificate of Excellence · workshop led by Revanth Konakanchi (IIT Guwahati alumnus).',
    },
    {
      id: 'cert-rtih-top-performer',
      title: 'Top Performer — Rashtriya Innovation Challenge 2026',
      issuer: 'Ratan Tata Innovation Hub (RTIH), Tirupati',
      date: '2026',
      note: 'Recognised as a Top Performer from Chittoor, in association with Union Bank Social Foundation.',
    },
    {
      id: 'cert-nxtwave-crack-the-case',
      title: 'Crack The Case – Behind the Snap',
      issuer: 'NxtWave',
      date: '2026',
      note: 'Certificate of Participation · workshop on the technology behind Snapchat, for B.Tech students.',
    },
    {
      id: 'cert-ibm-ai',
      title: 'Getting Started with Artificial Intelligence',
      issuer: 'IBM',
      date: 'Sep 2026',
      url: 'https://www.credly.com/badges/f0c7778f-bc87-4c60-a5b5-c74f598c9425',
    },
    {
      id: 'cert-google-amb',
      title: 'Google Student Ambassador Workshop',
      issuer: 'Google Student Ambassador',
      date: 'Sep 2026',
    },
    {
      id: 'cert-hp-life-1',
      title: 'HP LIFE course certificate',
      issuer: 'HP LIFE',
      date: 'Sep 2026',
      note: 'One of three HP LIFE certificates, each listed separately on LinkedIn.',
    },
    {
      id: 'cert-hp-life-2',
      title: 'HP LIFE course certificate',
      issuer: 'HP LIFE',
      date: 'Sep 2026',
      note: 'One of three HP LIFE certificates, each listed separately on LinkedIn.',
    },
    {
      id: 'cert-hp-life-3',
      title: 'HP LIFE course certificate',
      issuer: 'HP LIFE',
      date: 'Sep 2026',
      note: 'One of three HP LIFE certificates, each listed separately on LinkedIn.',
    },
    { id: 'cert-kaggle', title: 'Kaggle course certificate', issuer: 'Kaggle', date: 'Sep 2026' },
    { id: 'cert-tcs', title: 'TCS iON course certificate', issuer: 'TCS iON', date: 'Sep 2026' },
  ],
  milestones: [
    {
      id: 'ms-aiml',
      title: 'AIML Student',
      org: 'Chittoor, Andhra Pradesh, India',
      period: 'Present',
      description: 'Studying artificial intelligence and machine learning while building real projects.',
    },
    {
      id: 'ms-ibm',
      title: 'Getting Started with Artificial Intelligence',
      org: 'IBM',
      period: 'Sep 2026',
      description: 'Completed IBM’s introductory artificial intelligence certification.',
    },
    {
      id: 'ms-google',
      title: 'Google Student Ambassador Workshop',
      org: 'Google Student Ambassador',
      period: 'Sep 2026',
      description: 'Took part in the Google Student Ambassador workshop.',
    },
    {
      id: 'ms-courses',
      title: 'Course certificates — HP LIFE, Kaggle and TCS iON',
      org: 'HP LIFE · Kaggle · TCS iON',
      period: 'Sep 2026',
      description:
        'Completed five short courses — three with HP LIFE, plus Kaggle and TCS iON — and recorded each certificate on LinkedIn.',
    },
  ],
  interests: [
    {
      id: 'int-ai',
      title: 'Artificial Intelligence',
      description:
        'Applied AI and machine learning — the field named in my AIML studies and IBM certification.',
    },
    {
      id: 'int-python',
      title: 'Python & Building',
      description:
        'Python is my listed skill; I like turning ideas into small, working tools rather than staying in theory.',
    },
    {
      id: 'int-learning',
      title: 'Continuous Learning',
      description:
        'Workshops and short courses across Google, IBM, HP LIFE, Kaggle and TCS iON in the last months.',
    },
  ],
  projects: [],
  sourceNote:
    'Name, location, skills and certificates come from your public LinkedIn profile. LinkedIn does not expose About, education, projects or photos to automated readers — add those in Customize.',
}

const STORAGE_KEY = 'pranav-digital-world-v1'

/** Layer a partial (or published) content object over the built-in defaults. */
export function mergeContent(partial: Partial<Content> | null | undefined): Content {
  if (!partial) return { ...defaultContent }
  const merged = { ...defaultContent, ...partial } as Content
  merged.skillGroups = Array.isArray(partial.skillGroups) ? partial.skillGroups : defaultContent.skillGroups
  merged.certificates = Array.isArray(partial.certificates) ? partial.certificates : defaultContent.certificates
  merged.milestones = Array.isArray(partial.milestones) ? partial.milestones : defaultContent.milestones
  merged.interests = Array.isArray(partial.interests) ? partial.interests : defaultContent.interests
  merged.projects = Array.isArray(partial.projects) ? partial.projects : defaultContent.projects
  return merged
}

export function loadContent(): Content {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...defaultContent }
    const parsed = JSON.parse(raw) as Partial<Content>
    return { ...defaultContent, ...parsed }
  } catch {
    return { ...defaultContent }
  }
}

export function saveContent(content: Content) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(content))
  } catch {
    /* storage may be unavailable — the site still works with in-memory edits */
  }
}

export function resetContent(): Content {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* ignore */
  }
  return { ...defaultContent }
}

export const uid = () => Math.random().toString(36).slice(2, 10)
