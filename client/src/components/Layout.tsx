import { ReactNode } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { LogOut, Upload as UploadIcon, LayoutDashboard } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-64 bg-card border-r border-border p-6 flex flex-col">
        <div className="flex items-center gap-3 mb-10">
          <UploadIcon className="w-8 h-8 text-blue-500" />
          <h1 className="text-2xl font-bold text-foreground">YUMS</h1>
        </div>
        
        <nav className="flex-1 flex flex-col gap-2">
          <Link to="/dashboard" className="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </Link>
          <Link to="/upload" className="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
            <UploadIcon className="w-5 h-5" />
            Upload Video
          </Link>
        </nav>

        <button 
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-md hover:bg-destructive/10 text-destructive transition-colors mt-auto"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">
        {children}
      </main>
    </div>
  );
}
