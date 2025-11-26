
import React, { useState, useEffect } from 'react';
import { User, Quiz, StudyMaterial, Question, QuizResult, Message } from '../types';
import { Card, Button, Input, Label } from './ui/Layout';
import { addQuiz, addMaterial, getResults, getStudents, getMessages } from '../services/storageService';
import { generateQuizFromTopic } from '../services/geminiService';
import { Plus, Upload, Users, BrainCircuit, MessageSquare, Image as ImageIcon } from 'lucide-react';

export const TeacherDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'monitor' | 'create-quiz' | 'upload' | 'inbox'>('monitor');
  const [students, setStudents] = useState<User[]>([]);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  
  // Quiz Creation State
  const [quizTitle, setQuizTitle] = useState('');
  const [quizTopic, setQuizTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  
  // Manual Question State
  const [manualQuestionText, setManualQuestionText] = useState('');
  const [manualOptions, setManualOptions] = useState(['', '', '', '']);
  const [manualCorrectIdx, setManualCorrectIdx] = useState(0);
  const [manualImage, setManualImage] = useState<string | undefined>(undefined);

  // Material Upload State
  const [materialTitle, setMaterialTitle] = useState('');
  const [materialType, setMaterialType] = useState<StudyMaterial['type']>('doc');
  const [materialFile, setMaterialFile] = useState<File | null>(null);

  const loadData = async () => {
    setStudents(await getStudents());
    setResults(await getResults());
    setMessages(await getMessages());
  };

  useEffect(() => {
    loadData();
    // Poll for messages periodically in a real app, here just on tab switch/mount
  }, [activeTab]);

  const handleGenerateQuiz = async () => {
    if (!quizTopic) return;
    setIsGenerating(true);
    const generated = await generateQuizFromTopic(quizTopic, 3);
    setQuestions([...questions, ...generated]);
    setIsGenerating(false);
  };

  const handleManualImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => setManualImage(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleAddManualQuestion = () => {
    if (!manualQuestionText) return;
    const newQ: Question = {
      id: `manual_${Date.now()}`,
      text: manualQuestionText,
      options: [...manualOptions],
      correctAnswerIndex: manualCorrectIdx,
      imageUrl: manualImage
    };
    setQuestions([...questions, newQ]);
    
    // Reset form
    setManualQuestionText('');
    setManualOptions(['', '', '', '']);
    setManualImage(undefined);
  };

  const handleSaveQuiz = async () => {
    if (!quizTitle || questions.length === 0) return;
    const newQuiz: Quiz = {
      id: `quiz_${Date.now()}`,
      title: quizTitle,
      description: `Generated on ${new Date().toLocaleDateString()}`,
      questions,
      createdAt: new Date().toISOString()
    };
    await addQuiz(newQuiz);
    alert('Quiz Saved Successfully!');
    setQuestions([]);
    setQuizTitle('');
    setQuizTopic('');
  };

  const handleUploadMaterial = async () => {
    if (!materialTitle || !materialFile) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const url = e.target?.result as string;
      const newMaterial: StudyMaterial = {
        id: `mat_${Date.now()}`,
        title: materialTitle,
        type: materialType,
        url,
        description: 'Uploaded by Teacher',
        createdAt: new Date().toISOString()
      };
      await addMaterial(newMaterial);
      alert('Material Uploaded!');
      setMaterialTitle('');
      setMaterialFile(null);
    };
    reader.readAsDataURL(materialFile);
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4 border-b pb-2 overflow-x-auto">
        <Button variant={activeTab === 'monitor' ? 'primary' : 'ghost'} onClick={() => setActiveTab('monitor')}>
          <Users className="w-4 h-4 mr-2" /> Monitor Students
        </Button>
        <Button variant={activeTab === 'create-quiz' ? 'primary' : 'ghost'} onClick={() => setActiveTab('create-quiz')}>
          <BrainCircuit className="w-4 h-4 mr-2" /> Create Quiz
        </Button>
        <Button variant={activeTab === 'upload' ? 'primary' : 'ghost'} onClick={() => setActiveTab('upload')}>
          <Upload className="w-4 h-4 mr-2" /> Upload Material
        </Button>
        <Button variant={activeTab === 'inbox' ? 'primary' : 'ghost'} onClick={() => setActiveTab('inbox')}>
          <MessageSquare className="w-4 h-4 mr-2" /> Inbox
        </Button>
      </div>

      {activeTab === 'monitor' && (
        <Card title="Student Monitoring" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted text-muted-foreground uppercase text-xs">
                <tr>
                  <th className="px-6 py-3">Student Name</th>
                  <th className="px-6 py-3">Last Login</th>
                  <th className="px-6 py-3">Quizzes Taken</th>
                  <th className="px-6 py-3">Avg Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {students.map(student => {
                  const studentResults = results.filter(r => r.studentId === student.id);
                  const avgScore = studentResults.length 
                    ? Math.round(studentResults.reduce((acc, curr) => acc + (curr.score / curr.totalQuestions) * 100, 0) / studentResults.length)
                    : 0;

                  return (
                    <tr key={student.id} className="bg-card hover:bg-muted/50">
                      <td className="px-6 py-4 font-medium">{student.name}</td>
                      <td className="px-6 py-4">{student.lastLogin ? new Date(student.lastLogin).toLocaleString() : 'Never'}</td>
                      <td className="px-6 py-4">{studentResults.length}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-xs ${avgScore >= 70 ? 'bg-green-100 text-green-800' : avgScore >= 40 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}`}>
                          {avgScore}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'create-quiz' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card title="Quiz Settings">
            <div className="space-y-4">
              <div>
                <Label>Quiz Title</Label>
                <Input value={quizTitle} onChange={e => setQuizTitle(e.target.value)} placeholder="e.g. History Final" />
              </div>
              
              <div className="p-4 border rounded-md bg-accent/20">
                <h4 className="font-semibold flex items-center gap-2 mb-2 text-primary">
                  <BrainCircuit className="w-5 h-5" /> Gemini AI Assistant
                </h4>
                <div className="flex gap-2">
                  <Input 
                    value={quizTopic} 
                    onChange={e => setQuizTopic(e.target.value)} 
                    placeholder="Enter topic (e.g., Photosynthesis)" 
                  />
                  <Button onClick={handleGenerateQuiz} disabled={isGenerating}>
                    {isGenerating ? 'Thinking...' : 'Auto-Generate'}
                  </Button>
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <Label>Manual Question Add</Label>
                <Input className="mb-2" value={manualQuestionText} onChange={e => setManualQuestionText(e.target.value)} placeholder="Question text" />
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {manualOptions.map((opt, idx) => (
                    <Input 
                      key={idx} 
                      value={opt} 
                      onChange={e => {
                        const newOpts = [...manualOptions];
                        newOpts[idx] = e.target.value;
                        setManualOptions(newOpts);
                      }} 
                      placeholder={`Option ${idx + 1}`} 
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <Label>Correct Option (0-3):</Label>
                  <Input 
                    type="number" 
                    min="0" max="3" 
                    className="w-20"
                    value={manualCorrectIdx} 
                    onChange={e => setManualCorrectIdx(parseInt(e.target.value))} 
                  />
                </div>
                <div className="mb-4">
                  <Label className="flex items-center gap-2 cursor-pointer border p-2 rounded hover:bg-accent w-fit text-xs">
                    <ImageIcon className="w-4 h-4" /> 
                    {manualImage ? 'Image Selected' : 'Add Image to Question'}
                    <input type="file" className="hidden" accept="image/*" onChange={handleManualImageSelect} />
                  </Label>
                  {manualImage && <img src={manualImage} alt="preview" className="mt-2 h-20 w-auto rounded border" />}
                </div>
                <Button variant="outline" onClick={handleAddManualQuestion} className="w-full">
                  <Plus className="w-4 h-4 mr-2" /> Add Question
                </Button>
              </div>
            </div>
          </Card>

          <Card title="Preview Quiz" className="h-fit">
            <div className="space-y-4 max-h-[500px] overflow-y-auto">
              {questions.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">No questions added yet.</p>
              ) : (
                questions.map((q, idx) => (
                  <div key={q.id} className="p-3 border rounded bg-card/50">
                    <div className="flex justify-between items-start">
                      <p className="font-medium text-sm">Q{idx + 1}: {q.text}</p>
                      {q.imageUrl && <ImageIcon className="w-4 h-4 text-blue-500" />}
                    </div>
                    {q.imageUrl && <img src={q.imageUrl} alt="Q" className="my-2 max-h-32 rounded" />}
                    <ul className="list-disc list-inside text-xs text-muted-foreground ml-2 mt-1">
                      {q.options.map((o, i) => (
                        <li key={i} className={i === q.correctAnswerIndex ? "text-green-600 font-bold" : ""}>{o}</li>
                      ))}
                    </ul>
                  </div>
                ))
              )}
            </div>
            {questions.length > 0 && (
              <Button className="w-full mt-4" onClick={handleSaveQuiz}>Save & Publish Quiz</Button>
            )}
          </Card>
        </div>
      )}

      {activeTab === 'upload' && (
        <Card title="Upload Study Material">
          <div className="space-y-4 max-w-md">
            <div>
              <Label>Material Title</Label>
              <Input value={materialTitle} onChange={e => setMaterialTitle(e.target.value)} placeholder="e.g. Chapter 1 PDF" />
            </div>
            <div>
              <Label>Material Type</Label>
              <div className="grid grid-cols-4 gap-2 mt-1">
                {['video', 'image', 'pdf', 'doc'].map(t => (
                  <button 
                    key={t}
                    onClick={() => setMaterialType(t as any)}
                    className={`p-2 border rounded text-center text-xs uppercase ${materialType === t ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-accent'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>File Selection</Label>
              <Input type="file" onChange={e => setMaterialFile(e.target.files?.[0] || null)} />
            </div>
            <Button onClick={handleUploadMaterial} className="w-full">
              <Upload className="w-4 h-4 mr-2" /> Upload Material
            </Button>
          </div>
        </Card>
      )}

      {activeTab === 'inbox' && (
        <Card title="Student Questions">
          <div className="space-y-3">
             {messages.length === 0 ? (
               <p className="text-muted-foreground">No questions from students yet.</p>
             ) : (
               messages.map((msg, idx) => (
                 <div key={idx} className="p-4 border rounded bg-accent/10">
                   <div className="flex justify-between items-start mb-2">
                     <span className="font-semibold text-primary">{msg.studentName}</span>
                     <span className="text-xs text-muted-foreground">{new Date(msg.timestamp).toLocaleDateString()}</span>
                   </div>
                   <p className="text-sm">{msg.content}</p>
                 </div>
               ))
             )}
          </div>
        </Card>
      )}
    </div>
  );
};
