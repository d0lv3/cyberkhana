export enum ChallengeCategory {
  WEB = 'Web Exploitation',
  REVERSING = 'Reverse Engineering',
  CRYPTO = 'Cryptography',
  PWN = 'Pwn',
  MISC = 'Miscellaneous',
  FORENSICS = 'Forensics',
  OSINT = 'OSINT',
  NETWORK = 'Network',
  FULL_PWN = 'Full Pwn'
}

export interface Hint {
  text: string;
  cost: number;
}

export interface ChallengeFile {
  name: string;
  url: string;
}

export interface IJWTPayload {
  userId: string;
  username: string;
  role: 'user' | 'admin' | 'super-admin';
  universityCode: string;
  unlockedHints?: string[];
}
