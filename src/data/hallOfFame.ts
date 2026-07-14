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

export const hallOfFameData: HallOfFameEntry[] = [];
