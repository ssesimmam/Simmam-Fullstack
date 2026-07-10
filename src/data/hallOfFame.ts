import placeholderPoster from '@/assets/hall-of-fame-placeholder.png';

export interface HallOfFameEntry {
  id: string;
  category: string;
  mysteryIcon: string;
  posterSrc: string;
  winnerName: string;
  awardTitle: string;
  department?: string;
  achievement?: string;
}

export const hallOfFameData: HallOfFameEntry[] = [
  {
    id: 'hof-1',
    category: 'Best Overall Performance',
    mysteryIcon: '🏆',
    posterSrc: placeholderPoster,
    winnerName: 'Simmam Team Alpha',
    awardTitle: 'The Golden Lion',
    department: 'Computer Science & Engineering',
    achievement: 'Outstanding contribution to technical events',
  },
  {
    id: 'hof-2',
    category: 'Cultural Icon',
    mysteryIcon: '🎭',
    posterSrc: placeholderPoster,
    winnerName: 'Sarah Jenkins',
    awardTitle: 'Star Performer',
    department: 'Arts & Humanities',
    achievement: 'Mesmerizing solo dance performance',
  },
  {
    id: 'hof-3',
    category: 'Innovation Award',
    mysteryIcon: '💡',
    posterSrc: placeholderPoster,
    winnerName: 'Project Nexus',
    awardTitle: 'Tech Visionary',
    department: 'Information Technology',
    achievement: 'Best hardware hack of the year',
  },
  {
    id: 'hof-4',
    category: 'Sports Champion',
    mysteryIcon: '⚽',
    posterSrc: placeholderPoster,
    winnerName: 'John Doe',
    awardTitle: 'Athlete of the Year',
    department: 'Mechanical Engineering',
    achievement: 'Undefeated in 100m sprint',
  }
];
