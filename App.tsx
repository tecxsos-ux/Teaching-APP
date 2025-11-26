
import React, { useState, useEffect } from 'react';
import { User, UserRole } from './types';
import { Layout, Button, Card, Input, Label } from './components/ui/Layout';
import { TeacherDashboard } from './components/TeacherDashboard';
import { StudentDashboard } from './components/StudentDashboard';
import { getUsers, initStorage, updateUserLogin, registerUser } from './services/storageService';
import { UserCircle, GraduationCap, UserPlus } from 'lucide-react';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'login' | 'register'>('login');
  const [regName, setRegName] = useState('');

  useEffect(() => {
    const init = async () => {
      await initStorage();
      await refreshUsers();
      setLoading(false);
    };
    init();
  }, []);

  const refreshUsers = async () => {
    const users = await getUsers();
    setAvailableUsers(users);
  };

  const handleLogin = async (user: User) => {
    await updateUserLogin(user.id);
    setCurrentUser(user);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim()) return;

    await registerUser(regName, UserRole.STUDENT);
    await refreshUsers();
    setRegName('');
    setView('login');
    alert('Registration successful! Please select your name to login.');
  };

  const handleLogout = async () => {
    setCurrentUser(null);
    await refreshUsers();
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading EduNexus...</div>;
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/20 p-4">
        <Card className="w-full max-w-md p-0 overflow-hidden shadow-xl border-t-4 border-t-primary">
          <div className="bg-primary/5 p-8 text-center border-b">
            <div className="bg-background w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <GraduationCap className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Welcome to EduNexus</h1>
            <p className="text-muted-foreground mt-2 text-sm">
              {view === 'login' ? 'Select your role to continue' : 'Create a Student Account'}
            </p>
          </div>
          
          <div className="p-8 space-y-6">
            {view === 'login' ? (
              <>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Teachers</h3>
                  <div className="space-y-2">
                    {availableUsers.filter(u => u.role === UserRole.TEACHER).map(user => (
                      <button 
                        key={user.id} 
                        onClick={() => handleLogin(user)}
                        className="w-full flex items-center p-3 rounded-lg border hover:border-primary hover:bg-primary/5 transition-all group"
                      >
                        <div className="bg-muted group-hover:bg-white p-2 rounded-full mr-3 transition-colors">
                           <UserCircle className="w-5 h-5 text-gray-500 group-hover:text-primary" />
                        </div>
                        <span className="font-medium">{user.name}</span>
                      </button>
                    ))}
                    {availableUsers.filter(u => u.role === UserRole.TEACHER).length === 0 && <p className="text-sm text-muted-foreground italic">No teachers found</p>}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Students</h3>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                    {availableUsers.filter(u => u.role === UserRole.STUDENT).map(user => (
                      <button 
                        key={user.id} 
                        onClick={() => handleLogin(user)}
                        className="w-full flex items-center p-3 rounded-lg border hover:border-primary hover:bg-primary/5 transition-all group"
                      >
                        <div className="bg-muted group-hover:bg-white p-2 rounded-full mr-3 transition-colors">
                           <UserCircle className="w-5 h-5 text-gray-500 group-hover:text-primary" />
                        </div>
                        <span className="font-medium">{user.name}</span>
                      </button>
                    ))}
                    {availableUsers.filter(u => u.role === UserRole.STUDENT).length === 0 && <p className="text-sm text-muted-foreground italic">No students found</p>}
                  </div>
                </div>

                <div className="pt-4 border-t mt-4">
                  <Button variant="outline" className="w-full" onClick={() => setView('register')}>
                    <UserPlus className="w-4 h-4 mr-2" /> Register as New Student
                  </Button>
                </div>
              </>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <Label>Full Name</Label>
                  <Input 
                    placeholder="e.g. John Doe" 
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    autoFocus
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button type="button" variant="ghost" className="flex-1" onClick={() => setView('login')}>
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1">
                    Register
                  </Button>
                </div>
              </form>
            )}
            
            <div className="pt-4 text-center">
              <p className="text-xs text-muted-foreground bg-yellow-50 text-yellow-800 p-2 rounded border border-yellow-200">
                To use MongoDB, run <code>node server.cjs</code>. Currently running in demo mode (LocalStorage).
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <Layout user={currentUser} onLogout={handleLogout}>
      {currentUser.role === UserRole.TEACHER ? (
        <TeacherDashboard />
      ) : (
        <StudentDashboard user={currentUser} />
      )}
    </Layout>
  );
};

export default App;
