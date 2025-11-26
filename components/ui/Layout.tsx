import React from 'react';
import { User, UserRole } from '../../types';
import { LogOut, GraduationCap, LayoutDashboard } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  user: User | null;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, onLogout }) => {
  return (
    <div className="min-h-screen bg-muted/20 flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl text-primary">
            <GraduationCap className="h-6 w-6" />
            <span>EduNexus</span>
          </div>
          
          {user && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground hidden sm:inline-block">
                Welcome, {user.name} <span className="text-xs uppercase bg-muted px-2 py-0.5 rounded ml-1">{user.role}</span>
              </span>
              <button 
                onClick={onLogout}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-9 px-3"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </button>
            </div>
          )}
        </div>
      </header>
      <main className="flex-1 container mx-auto px-4 py-6">
        {children}
      </main>
    </div>
  );
};

export const Card: React.FC<{ children: React.ReactNode; className?: string; title?: string }> = ({ children, className = '', title }) => (
  <div className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`}>
    {title && (
      <div className="flex flex-col space-y-1.5 p-6 border-b">
        <h3 className="text-2xl font-semibold leading-none tracking-tight">{title}</h3>
      </div>
    )}
    <div className="p-6">{children}</div>
  </div>
);

export const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'outline' | 'ghost' | 'destructive' }> = ({ className = '', variant = 'primary', ...props }) => {
  const baseStyles = "inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 h-10 px-4 py-2";
  
  const variants = {
    primary: "bg-primary text-primary-foreground hover:bg-primary/90",
    outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90"
  };

  return <button className={`${baseStyles} ${variants[variant]} ${className}`} {...props} />;
};

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className = '', ...props }) => (
  <input className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`} {...props} />
);

export const Label: React.FC<React.LabelHTMLAttributes<HTMLLabelElement>> = ({ className = '', ...props }) => (
  <label className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`} {...props} />
);
