import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from '@/lib/supabase';

const ShareDialog = ({ isOpen, onClose, email, userId }) => {
  const [shares, setShares] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  useEffect(() => {
    if (isOpen) fetchShares();
  }, [isOpen]);

  const fetchShares = async () => {
    const { data } = await supabase.from('manageshare').select('*').eq("prof_id", userId).order('created_at', { ascending: false });
    if (data) setShares(data);
  };

  const handleShare = async (shareId) => {
    const share = shares.find(s => s.id === shareId);
    const updatedEmails = [...(share.emails || []), email];
    await supabase.from('manageshare')
      .update({ emails: updatedEmails })
      .eq('id', shareId);
    fetchShares();
  };

  const handleRemove = async (shareId) => {
    const share = shares.find(s => s.id === shareId);
    const updatedEmails = share.emails.filter(e => e !== email);
    await supabase.from('manageshare')
      .update({ emails: updatedEmails })
      .eq('id', shareId);
    fetchShares();
  };

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    await supabase.from('manageshare').insert([{
      title: newTitle.trim(),
      emails: [email],
      prof_id: userId,
      isActive: true
    }]);
    setNewTitle('');
    setIsCreating(false);
    fetchShares();
  };

  const toggleActive = async (shareId, currentState) => {
    await supabase.from('manageshare')
      .update({ isActive: !currentState })
      .eq('id', shareId);
    fetchShares();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl border border-[#1d1d1d] bg-[#0a0a0a] max-h-[400px] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add to Share Page</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <Button onClick={() => setIsCreating(!isCreating)} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Create New Share Page
          </Button>

          {isCreating && (
            <div className="flex gap-2">
              <Input
                placeholder="Enter title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
              />
              <Button onClick={handleCreate}>Create</Button>
            </div>
          )}

          {shares?.map((share) => (
            <div  key={share.id} className="flex items-center justify-between p-4 border border-[#1d1d1d] rounded-lg">
              <a target='_blank' href={`/share/groups?id=${share?.uuid}&token=${userId}`} className="flex-1 ">
                <h3 className="font-medium">{share.title}</h3>
                <div className="mt-1 text-sm text-gray-500">
                  Shared with: {share.emails?.join(', ') || 'No shares yet'}
                </div>
              </a>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={share.isActive}
                    onCheckedChange={() => toggleActive(share.id, share.isActive)}
                  />
                  <span className="text-sm">Active</span>
                </div>

                {share.emails?.includes(email) ? (
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => handleRemove(share.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleShare(share.id)}
                  >
                    Share
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareDialog;