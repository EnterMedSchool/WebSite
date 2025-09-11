export type Milestone = {
  id: string;
  title: string;
  subtitle: string;
  metric?: { label: string; value: number; prefix?: string; suffix?: string };
  year?: string;
  accent: string; // tailwind color token or hex
  link?: string;
  image?: { src: string; alt: string };
};

export const MILESTONES: Milestone[] = [
  {
    id: 'live-classes',
    title: 'Free Live Classes and Lessons',
    subtitle:
      "We provided free live classes and coaching to help students succeed in admission exams.",
    metric: { label: 'Students supported', value: 700, suffix: '+' },
    year: '2020–2024',
    accent: '#6366F1', // indigo-500
    link: '/classes',
    image: { src: '/milestones/live-classes.svg', alt: 'Students in a live online class, abstract' },
  },
  {
    id: 'past-papers',
    title: 'Past Admission Tests Solutions',
    subtitle:
      'Hundreds of solved past paper questions, free and open for everyone to practice.',
    metric: { label: 'Solutions published', value: 400, suffix: '+' },
    year: 'Ongoing',
    accent: '#4F46E5', // indigo-600
    link: '/practice',
    image: { src: '/milestones/past-papers.svg', alt: 'Past papers and solutions, abstract' },
  },
  {
    id: 'coaching',
    title: 'Personal Coaching and Applications Help',
    subtitle:
      '1:1 guidance on choosing the right medical school and preparing strong applications.',
    metric: { label: 'Coaching sessions', value: 1200, suffix: '+' },
    year: 'Ongoing',
    accent: '#3B82F6', // blue-500
    link: '/coaching',
    image: { src: '/milestones/coaching.svg', alt: 'Coaching support, abstract' },
  },
  {
    id: 'materials',
    title: 'Study Materials and Productivity Tools',
    subtitle:
      'Notes, question banks, and tools used by tens of thousands of learners worldwide.',
    metric: { label: 'Learners reached', value: 50000, suffix: '+' },
    year: 'Ongoing',
    accent: '#22D3EE', // cyan-400
    link: '/resources',
    image: { src: '/milestones/materials.svg', alt: 'Study materials and tools, abstract' },
  },
  {
    id: 'community',
    title: 'The Biggest Premed Communities',
    subtitle:
      'Active WhatsApp and forum communities where students get help from peers and mentors.',
    metric: { label: 'Members', value: 10000, suffix: '+' },
    year: 'Ongoing',
    accent: '#06B6D4', // cyan-500
    link: '/community',
    image: { src: '/milestones/community.svg', alt: 'Community of learners, abstract' },
  },
  {
    id: 'impact',
    title: 'Real Outcomes, Real Impact',
    subtitle:
      'From first lesson to acceptance letters — a mission powered by kindness and grit.',
    metric: { label: 'Admissions supported', value: 1000, suffix: '+' },
    year: 'Every year',
    accent: '#60A5FA', // blue-400
    link: '/impact',
    image: { src: '/milestones/impact.svg', alt: 'Impact celebration, abstract' },
  },
];
