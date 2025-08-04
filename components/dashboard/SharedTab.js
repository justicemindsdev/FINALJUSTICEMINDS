import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
// Simple date formatting helper (replacing date-fns)
const formatDistance = (date, baseDate, options = {}) => {
  const msPerMinute = 60 * 1000;
  const msPerHour = msPerMinute * 60;
  const msPerDay = msPerHour * 24;
  const msPerMonth = msPerDay * 30;
  const msPerYear = msPerDay * 365;

  const elapsed = baseDate - date;

  if (elapsed < msPerMinute) {
    const seconds = Math.round(elapsed / 1000);
    return options.addSuffix ? `${seconds} seconds ago` : `${seconds} seconds`;
  } else if (elapsed < msPerHour) {
    const minutes = Math.round(elapsed / msPerMinute);
    return options.addSuffix ? `${minutes} minutes ago` : `${minutes} minutes`;
  } else if (elapsed < msPerDay) {
    const hours = Math.round(elapsed / msPerHour);
    return options.addSuffix ? `${hours} hours ago` : `${hours} hours`;
  } else if (elapsed < msPerMonth) {
    const days = Math.round(elapsed / msPerDay);
    return options.addSuffix ? `${days} days ago` : `${days} days`;
  } else if (elapsed < msPerYear) {
    const months = Math.round(elapsed / msPerMonth);
    return options.addSuffix ? `${months} months ago` : `${months} months`;
  } else {
    const years = Math.round(elapsed / msPerYear);
    return options.addSuffix ? `${years} years ago` : `${years} years`;
  }
};

export default function SharedTab({ userId }) {
  const [sharedLinks, setSharedLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedLink, setExpandedLink] = useState(null);

  useEffect(() => {
    fetchSharedLinks();
  }, [userId]);

  const fetchSharedLinks = async () => {
    try {
      const { data, error } = await supabase
        .from('manageshare')
        .select(`
          *,
          shared_link_access_logs (
            id,
            accessed_at,
            duration,
            accessed_emails,
            ip_address
          )
        `)
        .eq('prof_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSharedLinks(data || []);
    } catch (error) {
      console.error('Error fetching shared links:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleLinkStatus = async (linkId, currentStatus) => {
    try {
      const { error } = await supabase
        .from('manageshare')
        .update({ isActive: !currentStatus })
        .eq('id', linkId);

      if (error) throw error;
      fetchSharedLinks();
    } catch (error) {
      console.error('Error toggling link status:', error);
    }
  };

  const deleteSharedLink = async (linkId) => {
    if (!confirm('Are you sure you want to delete this shared link? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('manageshare')
        .delete()
        .eq('id', linkId);

      if (error) throw error;
      fetchSharedLinks();
    } catch (error) {
      console.error('Error deleting shared link:', error);
    }
  };

  const copyToClipboard = async (link) => {
    const fullUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://finaljusticeminds-fyqa.vercel.app'}/share/groups?id=${link.uuid}&token=${userId}`;
    try {
      await navigator.clipboard.writeText(fullUrl);
      alert('Link copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '0s';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };

  const getTotalStats = (link) => {
    const logs = link.shared_link_access_logs || [];
    const totalAccesses = logs.length;
    const totalDuration = logs.reduce((sum, log) => sum + (log.duration || 0), 0);
    const lastAccessed = logs.length > 0 ? Math.max(...logs.map(log => new Date(log.accessed_at).getTime())) : null;
    
    return {
      totalAccesses,
      totalDuration,
      lastAccessed: lastAccessed ? new Date(lastAccessed) : null
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading shared links...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4 p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">Shared Email Links</h2>
        <div className="text-sm text-gray-400">
          {sharedLinks.length} shared link{sharedLinks.length !== 1 ? 's' : ''}
        </div>
      </div>

      {sharedLinks.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">No shared links yet</div>
          <div className="text-sm text-gray-500">
            Share email conversations from the Emails tab to see them here
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {sharedLinks.map((link) => {
            const stats = getTotalStats(link);
            const isExpanded = expandedLink === link.id;
            
            return (
              <div key={link.id} className="border border-[#1d1d1d] rounded-lg bg-[#0a0a0a] overflow-hidden">
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium text-white">{link.title}</h3>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          link.isActive 
                            ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}>
                          {link.isActive ? 'Active' : 'Disabled'}
                        </span>
                      </div>
                      
                      <div className="text-sm text-gray-400 space-y-1">
                        <div>Shared with: {link.emails?.join(', ') || 'No emails selected'}</div>
                        <div>Created: {formatDistance(new Date(link.created_at), new Date(), { addSuffix: true })}</div>
                        {stats.lastAccessed && (
                          <div>Last accessed: {formatDistance(stats.lastAccessed, new Date(), { addSuffix: true })}</div>
                        )}
                      </div>

                      <div className="flex gap-4 mt-3 text-sm">
                        <div className="flex items-center gap-1">
                          <span className="text-blue-400">👁️</span>
                          <span className="text-gray-300">{stats.totalAccesses} views</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-green-400">⏱️</span>
                          <span className="text-gray-300">{formatDuration(stats.totalDuration)} total</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setExpandedLink(isExpanded ? null : link.id)}
                        className="px-3 py-1 text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded hover:bg-blue-500/30 transition-colors"
                      >
                        {isExpanded ? 'Hide Details' : 'Show Details'}
                      </button>
                      <button
                        onClick={() => copyToClipboard(link)}
                        className="px-3 py-1 text-xs bg-gray-500/20 text-gray-400 border border-gray-500/30 rounded hover:bg-gray-500/30 transition-colors"
                      >
                        Copy Link
                      </button>
                      <button
                        onClick={() => toggleLinkStatus(link.id, link.isActive)}
                        className={`px-3 py-1 text-xs rounded border transition-colors ${
                          link.isActive
                            ? 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30'
                            : 'bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30'
                        }`}
                      >
                        {link.isActive ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        onClick={() => deleteSharedLink(link.id)}
                        className="px-3 py-1 text-xs bg-red-500/20 text-red-400 border border-red-500/30 rounded hover:bg-red-500/30 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-[#1d1d1d] bg-[#050505] p-4">
                    <h4 className="text-sm font-medium text-white mb-3">Access History</h4>
                    {link.shared_link_access_logs && link.shared_link_access_logs.length > 0 ? (
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {link.shared_link_access_logs
                          .sort((a, b) => new Date(b.accessed_at) - new Date(a.accessed_at))
                          .map((log, index) => (
                          <div key={log.id || index} className="flex items-center justify-between text-xs bg-[#0a0a0a] p-2 rounded border border-[#1d1d1d]">
                            <div className="text-gray-300">
                              {new Date(log.accessed_at).toLocaleString()}
                            </div>
                            <div className="flex gap-3 text-gray-400">
                              <span>Duration: {formatDuration(log.duration || 0)}</span>
                              {log.accessed_emails && log.accessed_emails.length > 0 && (
                                <span>Viewed: {log.accessed_emails.length} email{log.accessed_emails.length !== 1 ? 's' : ''}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-500 text-sm">No access logs yet</div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}