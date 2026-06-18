export interface MockUser {
  id: string;
  name: string;
  avatar: string;
  totalXP: number;
  weeklyXP: number;
  trainingXP: number;
  nutritionXP: number;
  isCurrentUser?: boolean;
}

const mockNames = [
  "IronMike", "SwoleDog", "GogginsFan", "Zyzz", "David", "Chris Bumstead", 
  "Chad", "SigmaRule", "Arnold", "Ronnie", "TheRock", "BeastMode", 
  "LiftHeavy", "CardioHater", "GainsGoblin", "ProteinPapi", "Natty",
  "Atlas", "Titan", "Spartan", "Gladiator", "Viking", "Samurai",
  "Ninja", "Sensei", "MasterMaster", "Alpha", "Apex", "Predator", "Wolf"
];

const avatars = [
  "https://api.dicebear.com/7.x/avataaars/svg?seed=",
  "https://api.dicebear.com/7.x/bottts/svg?seed=",
  "https://api.dicebear.com/7.x/micah/svg?seed="
];

export const MOCK_USERS: MockUser[] = Array.from({ length: 40 }).map((_, i) => {
  // Generate exponential-like random XP to have high levels and low levels
  const levelBase = Math.random();
  // Map levelBase (0-1) to an XP value. 
  // Let's say XP ranges from 1,000 to 5,000,000
  // totalXP = 1000 * e^(8.5 * levelBase) -> e^8.5 is approx 4914
  const totalXP = Math.floor(1000 * Math.exp(8.5 * levelBase));
  
  const weeklyXP = Math.floor(Math.random() * 1500) + 100; // 100 to 1600
  const trainingXP = Math.floor(weeklyXP * (Math.random() * 0.5 + 0.2)); // 20% to 70%
  const nutritionXP = Math.floor(weeklyXP * (Math.random() * 0.5 + 0.2)); // 20% to 70%

  const name = mockNames[Math.floor(Math.random() * mockNames.length)] + (Math.random() > 0.5 ? Math.floor(Math.random() * 99) : "");
  
  return {
    id: `mock_${i}`,
    name,
    avatar: avatars[Math.floor(Math.random() * avatars.length)] + name,
    totalXP,
    weeklyXP,
    trainingXP,
    nutritionXP
  };
});
