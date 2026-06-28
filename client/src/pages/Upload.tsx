import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { UploadCloud, Image as ImageIcon, CheckCircle2 } from 'lucide-react';

export default function Upload() {
  const [channels, setChannels] = useState<any[]>([]);
  const [selectedChannel, setSelectedChannel] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [visibility, setVisibility] = useState('Private');
  const [madeForKids, setMadeForKids] = useState('false');
  const [scheduledTime, setScheduledTime] = useState('');
  
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchChannels = async () => {
      const { data } = await supabase.from('channels').select('*');
      if (data) setChannels(data);
    };
    fetchChannels();
  }, []);

  const handleUpload = async (e: React.FormEvent, isDraft = false) => {
    e.preventDefault();
    if (!videoFile || !selectedChannel) {
      setError('Please select a channel and a video file.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const formData = new FormData();
      formData.append('video', videoFile);
      if (thumbnailFile) formData.append('thumbnail', thumbnailFile);
      formData.append('channelId', selectedChannel);
      formData.append('title', title);
      formData.append('description', description);
      formData.append('tags', tags);
      formData.append('visibility', visibility);
      formData.append('madeForKids', madeForKids);
      if (scheduledTime) formData.append('scheduledTime', scheduledTime);
      if (isDraft) formData.append('isDraft', 'true');

      const token = (await supabase.auth.getSession()).data.session?.access_token;
      
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Upload failed');
      }

      setSuccess(true);
      // Reset form
      setTitle('');
      setDescription('');
      setVideoFile(null);
      setThumbnailFile(null);
      
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight text-white">Upload Video</h2>
        <p className="text-muted-foreground mt-1">Upload and publish videos to your connected channels</p>
      </div>

      {success && (
        <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-4 rounded-xl flex items-center gap-3 mb-6 shadow-lg shadow-green-500/5">
          <CheckCircle2 className="w-6 h-6" />
          <div>
            <p className="font-semibold">Upload successfully queued!</p>
            <p className="text-sm opacity-90">The video is being processed in the background.</p>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl mb-6">
          {error}
        </div>
      )}

      <form onSubmit={(e) => handleUpload(e, false)} className="space-y-6 bg-card border border-border p-6 sm:p-8 rounded-2xl shadow-sm">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Select Channel</label>
          <select 
            value={selectedChannel}
            onChange={(e) => setSelectedChannel(e.target.value)}
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 transition-all"
            required
          >
            <option value="">-- Choose a channel --</option>
            {channels.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* File Uploads */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Video File</label>
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border hover:border-blue-500/50 hover:bg-blue-500/5 rounded-xl cursor-pointer transition-all">
              <div className="flex flex-col items-center justify-center pt-5 pb-6 text-muted-foreground">
                <UploadCloud className="w-8 h-8 mb-2" />
                <p className="text-sm">{videoFile ? videoFile.name : "Click to select video"}</p>
              </div>
              <input type="file" accept="video/*" className="hidden" onChange={(e) => setVideoFile(e.target.files?.[0] || null)} required />
            </label>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Thumbnail (Optional)</label>
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border hover:border-blue-500/50 hover:bg-blue-500/5 rounded-xl cursor-pointer transition-all">
              <div className="flex flex-col items-center justify-center pt-5 pb-6 text-muted-foreground">
                <ImageIcon className="w-8 h-8 mb-2" />
                <p className="text-sm">{thumbnailFile ? thumbnailFile.name : "Click to select image"}</p>
              </div>
              <input type="file" accept="image/*" className="hidden" onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)} />
            </label>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 transition-all"
            placeholder="Awesome Video Title"
            required
            maxLength={100}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 transition-all min-h-[120px]"
            placeholder="Tell viewers about your video..."
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Tags (comma separated)</label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 transition-all"
            placeholder="gaming, tutorial, vlogs"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Visibility</label>
            <select 
              value={visibility}
              onChange={(e) => setVisibility(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 transition-all"
            >
              <option value="Private">Private</option>
              <option value="Unlisted">Unlisted</option>
              <option value="Public">Public</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Audience</label>
            <select 
              value={madeForKids}
              onChange={(e) => setMadeForKids(e.target.value)}
              className="w-full bg-background border border-border rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 transition-all"
            >
              <option value="false">Not made for kids</option>
              <option value="true">Made for kids</option>
            </select>
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-300">Schedule (Optional)</label>
          <input
            type="datetime-local"
            value={scheduledTime}
            onChange={(e) => setScheduledTime(e.target.value)}
            className="w-full bg-background border border-border rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 transition-all"
          />
          <p className="text-xs text-muted-foreground mt-1">If set, visibility will initially be Private and publish at this time.</p>
        </div>

        <div className="flex gap-4 pt-4 border-t border-border">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-xl transition-all shadow-lg shadow-blue-500/25 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? 'Uploading...' : 'Publish Video'}
          </button>
          
          <button
            type="button"
            onClick={(e) => handleUpload(e, true)}
            disabled={loading}
            className="flex-1 bg-accent hover:bg-accent/80 text-white font-medium py-3 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50"
          >
            Save as Draft
          </button>
        </div>
      </form>
    </div>
  );
}
