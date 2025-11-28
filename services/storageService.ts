
import { User, UserRole, Quiz, QuizResult, StudyMaterial, Message } from '../types';

// Keys for LocalStorage
const USERS_KEY = 'edunexus_users';
const QUIZZES_KEY = 'edunexus_quizzes';
const RESULTS_KEY = 'edunexus_results';
const MATERIALS_KEY = 'edunexus_materials';
const MESSAGES_KEY = 'edunexus_messages';

// API Configuration
const API_URL = 'http://localhost:5000/api';

// Initial Mock Data (Fallback)
const INITIAL_USERS: User[] = [
  { id: 'u1', name: 'Dr. Smith', role: UserRole.TEACHER, lastLogin: new Date().toISOString() },
  { id: 'u2', name: 'Alice Johnson', role: UserRole.STUDENT, lastLogin: new Date(Date.now() - 86400000).toISOString() },
  { id: 'u3', name: 'Bob Williams', role: UserRole.STUDENT, lastLogin: new Date(Date.now() - 172800000).toISOString() },
];

const INITIAL_QUIZZES: Quiz[] = [
  {
    id: 'q1',
    title: 'Introduction to Physics',
    description: 'Basic concepts of motion and force.',
    createdAt: new Date().toISOString(),
    questions: [
      {
        id: 'qn1',
        text: 'What is the unit of Force?',
        options: ['Joule', 'Newton', 'Watt', 'Pascal'],
        correctAnswerIndex: 1
      },
      {
        id: 'qn2',
        text: 'Speed is a _____ quantity.',
        options: ['Scalar', 'Vector', 'Complex', 'None'],
        correctAnswerIndex: 0
      }
    ]
  }
];

// Helper to get/set LocalStorage
const getLocal = <T>(key: string, defaultVal: T): T => {
  const stored = localStorage.getItem(key);
  if (!stored) return defaultVal;
  try {
    return JSON.parse(stored);
  } catch {
    return defaultVal;
  }
};

const setLocal = <T>(key: string, val: T) => {
  localStorage.setItem(key, JSON.stringify(val));
};

// --- Hybrid Fetch Function ---
// Tries to fetch from API, falls back to LocalStorage on error (e.g., server not running)
async function fetchData<T>(endpoint: string, localKey: string, defaultVal: T): Promise<T> {
  try {
    const response = await fetch(`${API_URL}${endpoint}`);
    if (!response.ok) throw new Error('API Unavailable');
    return await response.json();
  } catch (error) {
    // console.warn(`API (${endpoint}) unavailable, using LocalStorage.`);
    return getLocal(localKey, defaultVal);
  }
}

async function postData<T>(endpoint: string, body: any, localKey: string, updateLocal: (current: any) => any): Promise<T | void> {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!response.ok) throw new Error('API Unavailable');
    return await response.json();
  } catch (error) {
    // console.warn(`API (${endpoint}) unavailable, writing to LocalStorage.`);
    const current = getLocal(localKey, []);
    const updated = updateLocal(current);
    setLocal(localKey, updated);
    return Promise.resolve();
  }
}

// Initialize
export const initStorage = async () => {
  try {
    // Try to seed API
    await fetch(`${API_URL}/init`, { method: 'POST' });
  } catch (e) {
    // Init Local if needed
    if (!localStorage.getItem(USERS_KEY)) setLocal(USERS_KEY, INITIAL_USERS);
    if (!localStorage.getItem(QUIZZES_KEY)) setLocal(QUIZZES_KEY, INITIAL_QUIZZES);
  }
};

// --- Users ---
export const getUsers = (): Promise<User[]> => 
  fetchData('/users', USERS_KEY, INITIAL_USERS);

export const registerUser = async (name: string, email: string, role: UserRole): Promise<User> => {
  const newUser: User = {
    id: `u_${Date.now()}`,
    name,
    email,
    role,
    lastLogin: new Date().toISOString()
  };

  try {
    const response = await fetch(`${API_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser)
    });
    if (!response.ok) throw new Error('API Unavailable');
    return await response.json();
  } catch (error) {
    const users = getLocal(USERS_KEY, INITIAL_USERS);
    users.push(newUser);
    setLocal(USERS_KEY, users);
    return newUser;
  }
};

export const updateUserLogin = async (userId: string) => {
  try {
    await fetch(`${API_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
  } catch {
    const users = getLocal(USERS_KEY, INITIAL_USERS);
    const idx = users.findIndex(u => u.id === userId);
    if (idx !== -1) {
      users[idx].lastLogin = new Date().toISOString();
      setLocal(USERS_KEY, users);
    }
  }
};

export const getStudents = async (): Promise<User[]> => {
  const users = await getUsers();
  return users.filter(u => u.role === UserRole.STUDENT);
};

// --- Quizzes ---
export const getQuizzes = (): Promise<Quiz[]> => 
  fetchData('/quizzes', QUIZZES_KEY, INITIAL_QUIZZES);

export const addQuiz = (quiz: Quiz) => 
  postData('/quizzes', quiz, QUIZZES_KEY, (current) => [...current, quiz]);

// --- Results ---
export const getResults = (): Promise<QuizResult[]> => 
  fetchData('/results', RESULTS_KEY, []);

export const saveResult = (result: QuizResult) => 
  postData('/results', result, RESULTS_KEY, (current) => [...current, result]);

// --- Materials ---
export const getMaterials = (): Promise<StudyMaterial[]> => 
  fetchData('/materials', MATERIALS_KEY, []);

export const addMaterial = (material: StudyMaterial) => 
  postData('/materials', material, MATERIALS_KEY, (current) => [...current, material]);

// --- Messages ---
export const getMessages = (): Promise<Message[]> => 
  fetchData('/messages', MESSAGES_KEY, []);

export const sendMessage = (msg: Message) => 
  postData('/messages', msg, MESSAGES_KEY, (current) => [...current, msg]);
