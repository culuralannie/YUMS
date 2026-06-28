import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Users, PlaySquare, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';

export default function Dashboard() {
  const [searchParams] = useSearchParams();
  const [stats, setStats] = useState({
    totalChannels: 0,
    totalUsers: 0,
    publishedToday: 0,
    failedUploads: 0,
    scheduledVideos: 0,
  });

  const [channels, setChannels] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      // Fetch Channels
      const { data: channelsData } = await supabase.from('channels').select('*');
      if (channelsData) setChannels(channelsData);

      // Fetch Users count
      const { count: usersCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
      
      // Fetch Videos for stats
      const { data: videosData } = await supabase.from('videos').select('status, created_at');
      
      let published = 0;
      let failed = 0;
      let scheduled = 0;

      if (videosData) {
        const today = new Date().toDateString();
        videosData.forEach((v: any) => {
          if (v.status === 'Published' && new Date(v.created_at).toDateString() === today) published++;
          if (v.status === 'Failed') failed++;
          if (v.status === 'Scheduled') scheduled++;
        });
      }

      setStats({
        totalChannels: channelsData?.length || 0,
        totalUsers: usersCount || 1,
        publishedToday: published,
        failedUploads: failed,
        scheduledVideos: scheduled
      });
    };
    
    fetchStats();
  }, []);

  const linkChannel = async () => {
    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';
      const res = await fetch(`${API_BASE}/youtube/auth-url`, {
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        }
      });
      if (!res.ok) throw new Error('Failed to fetch auth URL');
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error(error);
      alert('Error connecting to server. Please ensure the backend is running. ' + error.message);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Dashboard</h2>
          <p className="text-muted-foreground mt-1">Overview of your YouTube upload operations</p>
        </div>
        <button 
          onClick={linkChannel}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium shadow-lg shadow-red-500/20 transition-all flex items-center gap-2"
        >
          <PlaySquare className="w-5 h-5" />
          Link YouTube Channel
        </button>
      </div>

      {searchParams.get('linked') === 'true' && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-xl flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5" />
          YouTube channel linked successfully!
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
        <StatCard title="Total Channels" value={stats.totalChannels} icon={<PlaySquare />} color="text-red-500" bg="bg-red-500/10" />
        <StatCard title="Team Members" value={stats.totalUsers} icon={<Users />} color="text-blue-500" bg="bg-blue-500/10" />
        <StatCard title="Published Today" value={stats.publishedToday} icon={<CheckCircle2 />} color="text-green-500" bg="bg-green-500/10" />
        <StatCard title="Scheduled" value={stats.scheduledVideos} icon={<Clock />} color="text-orange-500" bg="bg-orange-500/10" />
        <StatCard title="Failed" value={stats.failedUploads} icon={<AlertCircle />} color="text-rose-500" bg="bg-rose-500/10" />
      </div>

      {/* Channels List */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <h3 className="text-xl font-semibold text-white mb-4">Linked Channels</h3>
        {channels.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-border rounded-lg">
            <PlaySquare className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-muted-foreground">No channels linked yet.</p>
            <button onClick={linkChannel} className="text-blue-400 hover:text-blue-300 font-medium mt-2">
              Link your first channel
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {channels.map((channel) => (
              <div key={channel.id} className="p-4 rounded-lg bg-accent/50 border border-border flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                  <PlaySquare className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <p className="font-medium text-white">{channel.name}</p>
                  <p className="text-sm text-muted-foreground">Connected</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, color, bg }: any) {
  return (
    <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-lg ${bg} ${color}`}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <h3 className="text-2xl font-bold text-white">{value}</h3>
        </div>
      </div>
    </div>
  );
}
