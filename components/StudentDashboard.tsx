
import React, { useState, useEffect } from 'react';
import { User, Quiz, StudyMaterial, QuizResult, Message } from '../types';
import { Card, Button, Input, Label } from './ui/Layout';
import { getQuizzes, getMaterials, saveResult, sendMessage } from '../services/storageService';
import { explainConcept } from '../services/geminiService';
import { PlayCircle, FileText, Image, File, CheckCircle, HelpCircle, Send, ArrowRight } from 'lucide-react';

interface StudentDashboardProps {
  user: User;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'quizzes' | 'materials' | 'ask'>('quizzes');
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [materials, setMaterials] = useState<StudyMaterial[]>([]);
  
  // Quiz Taking State
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [quizCompleted, setQuizCompleted] = useState(false);

  // Ask Teacher State
  const [questionText, setQuestionText] = useState('');
  
  // AI Tutor State
  const [aiQuery, setAiQuery] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const loadData = async () => {
    setQuizzes(await getQuizzes());
    setMaterials(await getMaterials());
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStartQuiz = (quiz: Quiz) => {
    setActiveQuiz(quiz);
    setCurrentQIndex(0);
    setScore(0);
    setSelectedOption(null);
    setQuizCompleted(false);
  };

  const handleAnswer = () => {
    if (!activeQuiz || selectedOption === null) return;
    
    if (selectedOption === activeQuiz.questions[currentQIndex].correctAnswerIndex) {
      setScore(s => s + 1);
    }

    if (currentQIndex < activeQuiz.questions.length - 1) {
      setCurrentQIndex(i => i + 1);
      setSelectedOption(null);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    if (!activeQuiz) return;
    const finalScore = selectedOption === activeQuiz.questions[currentQIndex].correctAnswerIndex ? score + 1 : score;
    setScore(finalScore);
    setQuizCompleted(true);
    
    const result: QuizResult = {
      id: `res_${Date.now()}`,
      quizId: activeQuiz.id,
      studentId: user.id,
      studentName: user.name,
      score: finalScore,
      totalQuestions: activeQuiz.questions.length,
      completedAt: new Date().toISOString()
    };
    await saveResult(result);
  };

  const handleSendQuestion = async () => {
    if (!questionText) return;
    const msg: Message = {
      id: `msg_${Date.now()}`,
      studentId: user.id,
      studentName: user.name,
      content: questionText,
      timestamp: new Date().toISOString(),
      isRead: false
    };
    await sendMessage(msg);
    alert('Question sent to teacher!');
    setQuestionText('');
  };

  const handleAiAsk = async () => {
    if (!aiQuery) return;
    setAiLoading(true);
    const resp = await explainConcept(aiQuery);
    setAiResponse(resp);
    setAiLoading(false);
  };

  if (activeQuiz && !quizCompleted) {
    const question = activeQuiz.questions[currentQIndex];
    return (
      <div className="max-w-2xl mx-auto py-10">
        <Card title={activeQuiz.title}>
          <div className="mb-6">
            <div className="flex justify-between text-sm text-muted-foreground mb-4">
              <span>Question {currentQIndex + 1} of {activeQuiz.questions.length}</span>
              <span>Score: {score}</span>
            </div>
            <h2 className="text-xl font-medium mb-4">{question.text}</h2>
            {question.imageUrl && <img src={question.imageUrl} alt="Q" className="mb-4 max-h-60 rounded object-contain" />}
            
            <div className="space-y-3">
              {question.options.map((opt, idx) => (
                <button
                  key={idx}
                  onClick={() => setSelectedOption(idx)}
                  className={`w-full text-left p-4 rounded border transition-all ${
                    selectedOption === idx 
                      ? 'border-primary bg-primary/10 ring-1 ring-primary' 
                      : 'hover:bg-muted'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleAnswer} disabled={selectedOption === null}>
              {currentQIndex === activeQuiz.questions.length - 1 ? 'Finish' : 'Next'} <ArrowRight className="ml-2 w-4 h-4"/>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (quizCompleted) {
    return (
      <div className="max-w-md mx-auto py-10 text-center">
        <Card className="py-10">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Quiz Completed!</h2>
          <p className="text-xl mb-6">You scored <span className="font-bold text-primary">{score} / {activeQuiz?.questions.length}</span></p>
          <Button onClick={() => setActiveQuiz(null)}>Back to Dashboard</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-4 border-b pb-2">
        <Button variant={activeTab === 'quizzes' ? 'primary' : 'ghost'} onClick={() => setActiveTab('quizzes')}>
          <CheckCircle className="w-4 h-4 mr-2" /> Quizzes
        </Button>
        <Button variant={activeTab === 'materials' ? 'primary' : 'ghost'} onClick={() => setActiveTab('materials')}>
          <FileText className="w-4 h-4 mr-2" /> Study Materials
        </Button>
        <Button variant={activeTab === 'ask' ? 'primary' : 'ghost'} onClick={() => setActiveTab('ask')}>
          <HelpCircle className="w-4 h-4 mr-2" /> Ask Teacher / AI
        </Button>
      </div>

      {activeTab === 'quizzes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {quizzes.map(q => (
            <Card key={q.id} className="hover:shadow-md transition-shadow">
              <h3 className="font-bold text-lg mb-2">{q.title}</h3>
              <p className="text-sm text-muted-foreground mb-4">{q.description}</p>
              <div className="flex justify-between items-center text-xs text-muted-foreground mb-4">
                <span>{q.questions.length} Questions</span>
              </div>
              <Button onClick={() => handleStartQuiz(q)} className="w-full">Start Quiz</Button>
            </Card>
          ))}
          {quizzes.length === 0 && <p className="text-muted-foreground col-span-3 text-center py-10">No quizzes available yet.</p>}
        </div>
      )}

      {activeTab === 'materials' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {materials.map(m => (
            <Card key={m.id} className="flex flex-row items-center p-4 gap-4">
              <div className="p-3 bg-muted rounded-full">
                {m.type === 'video' && <PlayCircle className="w-6 h-6 text-blue-500" />}
                {m.type === 'image' && <Image className="w-6 h-6 text-purple-500" />}
                {m.type === 'pdf' && <FileText className="w-6 h-6 text-red-500" />}
                {m.type === 'doc' && <File className="w-6 h-6 text-blue-400" />}
              </div>
              <div className="flex-1">
                <h4 className="font-bold">{m.title}</h4>
                <p className="text-xs text-muted-foreground">{new Date(m.createdAt).toLocaleDateString()}</p>
              </div>
              <a href={m.url} download={m.title} className="text-primary hover:underline text-sm font-medium">
                View
              </a>
            </Card>
          ))}
          {materials.length === 0 && <p className="text-muted-foreground col-span-2 text-center py-10">No materials uploaded yet.</p>}
        </div>
      )}

      {activeTab === 'ask' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card title="Ask Your Teacher">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Stuck on a problem? Send a direct message to your teacher.</p>
              <textarea 
                className="w-full min-h-[150px] p-3 rounded-md border text-sm"
                placeholder="Type your question here..."
                value={questionText}
                onChange={e => setQuestionText(e.target.value)}
              />
              <Button onClick={handleSendQuestion} className="w-full">
                <Send className="w-4 h-4 mr-2" /> Send Message
              </Button>
            </div>
          </Card>

          <Card title="Ask Gemini AI Tutor">
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Get instant explanations for difficult concepts.</p>
              <Input 
                value={aiQuery}
                onChange={e => setAiQuery(e.target.value)}
                placeholder="What is..."
              />
              <Button onClick={handleAiAsk} disabled={aiLoading} variant="outline" className="w-full">
                {aiLoading ? 'Thinking...' : 'Explain'}
              </Button>
              {aiResponse && (
                <div className="mt-4 p-4 bg-accent/20 rounded-md text-sm leading-relaxed border-l-4 border-primary">
                  <h5 className="font-bold mb-1 text-primary">Explanation:</h5>
                  {aiResponse}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
