export type House = {
  name: string;
  tagline: string;
  short: string;
  element: string;
  points2025: number;
  captain: { name: string; phone: string; year: string };
  vice: { name: string; phone: string; year: string };
  faculty: { name: string; phone: string };
  about: string;
  accent: string; // oklch
  glow: string;
  breakdown: { winners: number; runners: number; participation: number };
};

export const houses: House[] = [
  {
    name: "Agniyas",
    tagline: "The Flame Keepers",
    short: "AGN",
    element: "Fire",
    points2025: 1845,
    captain: { name: "Rohit Bharath", phone: "+91 98765 43219", year: "Final Year" },
    vice: { name: "Niharika V.", phone: "+91 98765 43220", year: "Third Year" },
    faculty: { name: "Dr. P. Lakshmi", phone: "+91 98765 43221" },
    about: "Reigning champions of SIMMAM 2025. Born of fire. Agniyas ignite every stage with passion that refuses to fade.",
    accent: "oklch(0.72 0.19 50)",
    glow: "oklch(0.72 0.19 50 / 0.6)",
    breakdown: { winners: 1000, runners: 500, participation: 345 },
  },
  {
    name: "Dronas",
    tagline: "The Master Strategists",
    short: "DRO",
    element: "Wisdom",
    points2025: 1612,
    captain: { name: "Pranav S.", phone: "+91 98765 43216", year: "Final Year" },
    vice: { name: "Anjali Roshan", phone: "+91 98765 43217", year: "Third Year" },
    faculty: { name: "Dr. K. Vasanthi", phone: "+91 98765 43218" },
    about: "Strategy in every step. Dronas plan, execute, and conquer with calculated precision.",
    accent: "oklch(0.55 0.26 25)",
    glow: "oklch(0.55 0.26 25 / 0.6)",
    breakdown: { winners: 800, runners: 500, participation: 312 },
  },
  {
    name: "Marutas",
    tagline: "The Wind Riders",
    short: "MAR",
    element: "Wind",
    points2025: 1394,
    captain: { name: "Vignesh A.", phone: "+91 98765 43222", year: "Final Year" },
    vice: { name: "Sneha M.", phone: "+91 98765 43223", year: "Third Year" },
    faculty: { name: "Dr. A. Mohan", phone: "+91 98765 43224" },
    about: "Swift as the storm wind. Marutas move where others freeze, dance where others stand.",
    accent: "oklch(0.88 0.18 90)",
    glow: "oklch(0.88 0.18 90 / 0.6)",
    breakdown: { winners: 700, runners: 400, participation: 294 },
  },
  {
    name: "Rudras",
    tagline: "The Storm Bringers",
    short: "RUD",
    element: "Storm",
    points2025: 1488,
    captain: { name: "Arjun Vikram", phone: "+91 98765 43210", year: "Final Year" },
    vice: { name: "Meera Krishnan", phone: "+91 98765 43211", year: "Third Year" },
    faculty: { name: "Dr. R. Sundaram", phone: "+91 98765 43212" },
    about: "Rudras strike with thunder — masters of stage, sport, and spirit.",
    accent: "oklch(0.96 0.00 0)",
    glow: "oklch(0.96 0.00 0 / 0.5)",
    breakdown: { winners: 750, runners: 450, participation: 288 },
  },
  {
    name: "Suryas",
    tagline: "The Solar Vanguard",
    short: "SUR",
    element: "Sun",
    points2025: 1720,
    captain: { name: "Karthik Raja", phone: "+91 98765 43213", year: "Final Year" },
    vice: { name: "Divya Shree", phone: "+91 98765 43214", year: "Third Year" },
    faculty: { name: "Dr. S. Manikandan", phone: "+91 98765 43215" },
    about: "Radiant, relentless, regal. Suryas blaze through every event with golden brilliance.",
    accent: "oklch(0.60 0.24 300)",
    glow: "oklch(0.60 0.24 300 / 0.6)",
    breakdown: { winners: 900, runners: 500, participation: 320 },
  },
  {
    name: "Vajraas",
    tagline: "The Thunderbolts",
    short: "VAJ",
    element: "Thunder",
    points2025: 1245,
    captain: { name: "Yogeshwar K.", phone: "+91 98765 43225", year: "Final Year" },
    vice: { name: "Harini R.", phone: "+91 98765 43226", year: "Third Year" },
    faculty: { name: "Dr. T. Bhaskar", phone: "+91 98765 43227" },
    about: "Unbreakable. Unstoppable. Vajraas hit hard and rise harder — diamonds forged in lightning.",
    accent: "oklch(0.72 0.20 145)",
    glow: "oklch(0.72 0.20 145 / 0.6)",
    breakdown: { winners: 600, runners: 350, participation: 295 },
  },
];
