
export enum UserRole {
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT'
}

export interface User {
  id: string;
  name: string;
  email?: string;
  role: UserRole;
  lastLogin?: string;
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correctAnswerIndex: number;
  imageUrl?: string; // Optional image for question
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  createdAt: string;
}

export interface QuizResult {
  id: string;
  quizId: string;
  studentId: string;
  studentName: string;
  score: number;
  totalQuestions: number;
  completedAt: string;
}

export interface StudyMaterial {
  id: string;
  title: string;
  type: 'video' | 'image' | 'pdf' | 'doc';
  url: string; // Base64 or mock URL
  description: string;
  createdAt: string;
}

export interface Message {
  id: string;
  studentId: string;
  studentName: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}
