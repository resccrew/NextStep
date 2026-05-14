/* global window */
// Mock job and user data

const SKILL_GROUPS = [
  {
    name: 'Development',
    skills: ['React', 'Vue', 'TypeScript', 'JavaScript', 'Node.js', 'Python', 'Go', 'Java', 'PHP', 'SQL', 'GraphQL', 'Next.js']
  },
  {
    name: 'Design',
    skills: ['Figma', 'UI/UX', 'Prototyping', 'Illustration', 'Motion', 'Adobe XD']
  },
  {
    name: 'Marketing',
    skills: ['SEO', 'Content', 'Email campaigns', 'Analytics', 'Performance', 'Brand']
  },
  {
    name: 'Analytics',
    skills: ['SQL', 'Power BI', 'Tableau', 'Excel', 'Python', 'A/B tests']
  },
  {
    name: 'Management',
    skills: ['Agile', 'Scrum', 'Product', 'Team management', 'OKR']
  }
];

const JOBS = [
  {
    id: 1,
    title: 'Frontend Developer (React)',
    company: 'Lunary',
    logo: 'L',
    location: 'Moscow · Remote',
    salary: '$3,000 – $4,000',
    type: 'Full-time',
    posted: '2 hours ago',
    match: 94,
    tags: ['React', 'TypeScript', 'Next.js'],
    why: '5 of 6 your skills match · experience matches',
    featured: true,
    description: 'Building a next-generation financial service. Looking for a frontend engineer who loves clean code and smooth animations.'
  },
  {
    id: 2,
    title: 'Product Designer',
    company: 'Forma',
    logo: 'F',
    location: 'St. Petersburg · Hybrid',
    salary: '$2,500 – $3,500',
    type: 'Full-time',
    posted: '5 hours ago',
    match: 88,
    tags: ['Figma', 'UI/UX', 'Prototyping'],
    why: 'Semantically close to your experience',
    description: 'Working on B2B tools for logistics. Great freedom in product decisions.'
  },
  {
    id: 3,
    title: 'Fullstack Engineer',
    company: 'Northpath',
    logo: 'N',
    location: 'Remote · Russia',
    salary: '$3,500 – $4,500',
    type: 'Full-time',
    posted: 'Yesterday',
    match: 86,
    tags: ['React', 'Node.js', 'PostgreSQL'],
    why: 'Matches 3+ years experience',
    description: 'Educational platform for schools. Small team, direct contact with users.'
  },
  {
    id: 4,
    title: 'Senior React Engineer',
    company: 'Atlas Health',
    logo: 'A',
    location: 'Tbilisi · Relocation',
    salary: '$4,500 – $5,500',
    type: 'Full-time',
    posted: '1 day ago',
    match: 82,
    tags: ['React', 'TypeScript', 'Redux'],
    why: 'Matches by stack and seniority',
    description: 'Medtech — an app for doctors. ESOP, relocation package, English B2+.'
  },
  {
    id: 5,
    title: 'Data Analyst',
    company: 'Briefly',
    logo: 'B',
    location: 'Remote · Russia/CIS',
    salary: '$2,000 – $3,000',
    type: 'Full-time',
    posted: '2 days ago',
    match: 71,
    tags: ['SQL', 'Python', 'A/B tests'],
    why: 'Partial match on analytical skills',
    description: 'Marketing agency looking for an analyst who can turn data into insights.'
  },
  {
    id: 6,
    title: 'Frontend Developer (Vue)',
    company: 'Pebble',
    logo: 'P',
    location: 'Moscow · Office',
    salary: '$2,500 – $3,200',
    type: 'Full-time',
    posted: '3 days ago',
    match: 78,
    tags: ['Vue', 'JavaScript', 'CSS'],
    why: 'Similar technology (Vue ↔ React)',
    description: 'Internal tools for the content team. Stable product, relaxed pace.'
  },
  {
    id: 7,
    title: 'Product Manager (B2B)',
    company: 'Cargo Loop',
    logo: 'C',
    location: 'Remote',
    salary: '$3,000 – $4,000',
    type: 'Full-time',
    posted: '4 days ago',
    match: 65,
    tags: ['Product', 'B2B', 'Agile'],
    why: 'Matches on management skills',
    description: 'Freight platform. Need experience taking a product from idea to release.'
  },
  {
    id: 8,
    title: 'Junior Frontend Developer',
    company: 'Veridian',
    logo: 'V',
    location: 'Kazan · Hybrid',
    salary: '$1,000 – $1,800',
    type: 'Full-time',
    posted: '5 days ago',
    match: 60,
    tags: ['JavaScript', 'HTML', 'CSS'],
    why: 'Good career stepping stone',
    description: 'Team of 6, mentor during probation, training is paid.'
  }
];

Object.assign(window, { SKILL_GROUPS, JOBS });
