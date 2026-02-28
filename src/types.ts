export interface UserProfile {
  tokens: number;
  badges: string[]; // List of badge IDs or milestone IDs completed
}

export interface User {
  id: number;
  username: string;
  name: string;
  role: 'user' | 'admin';
  profile?: UserProfile;
}

export interface TimelineEvent {
  id: number;
  year: number;
  endYear?: number; // For continuous periods
  status?: 'active' | 'coming-soon'; // 'active' = playable, 'coming-soon' = locked
  title: string;
  description: string;
  detail: string;
  imageUrl?: string;
  color?: string;
  position?: "top" | "bottom";
  icon?: "star" | "clock" | "people" | "gear" | "globe";
  chapters?: Chapter[];
  questions?: Question[]; // Legacy fallback
  knowledgeSections?: KnowledgeSection[]; // Legacy fallback
  interactionId?: string | number; // Legacy Character Guess
}

export interface Chapter {
  id: string;
  title: string;
  icon: string;
  description?: string[];
  pages: ChapterPage[];
}

export interface ChapterPage {
  id: string;
  type: 'knowledge' | 'quiz' | 'character' | 'video';
  title?: string;
  content?: string;
  media?: {
    url: string;
    type: 'image' | 'video';
    position: 'left' | 'right' | 'center';
    caption?: string;
  }[];
  interactionId?: string | number; // ID of the quiz/character to show
  interactionData?: any; // Embedded quiz questions or character data
}

export interface KnowledgeSection {
  id: string;
  title: string;
  icon: string;
  pages: string[];
  description?: string[];
}

export interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  hint?: string;
}
