import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Link, Upload } from "lucide-react";
import { withAuth } from "@/lib/authUtils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Navbar from "@/components/Navbar";

function ManageShares({ user }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.clear();
    document.cookie = "access_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
    router.push("/");
  };
  const [shares, setShares] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      if (user?.id) {
        setLoading(true);
        const { data } = await supabase
          .from('manageshare')
          .select('*')
          .eq('prof_id', user?.id)
          .order('created_at', { ascending: false });
        
        setShares(data || []);
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user?.id, refetchTrigger]);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    
    try {
      const newShare = {
        title: newTitle.trim(),
        emails: [],
        prof_id: user?.id,
        isActive: true,
        uuid: crypto.randomUUID()
      };

      const { error } = await supabase.from('manageshare').insert([newShare]);
      if (error) throw error;

      setNewTitle('');
      setIsCreating(false);
      setRefetchTrigger(prev => prev + 1);
    } catch (error) {
      console.error('Error creating share:', error);
    }
  };

  const handleCsvUpload = async (shareId, e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target.result;
        const emails = text.split('\n')
          .map(email => email.trim())
          .filter(email => email && email.includes('@'));

        const share = shares.find(s => s.id === shareId);
        const existingEmails = share.emails || [];
        const uniqueEmails = [...new Set([...existingEmails, ...emails])];

        const { error } = await supabase.from('manageshare')
          .update({ emails: uniqueEmails })
          .eq('id', shareId);
        
        if (error) throw error;
        setRefetchTrigger(prev => prev + 1);
      } catch (error) {
        console.error('Error uploading CSV:', error);
      }
    };
    reader.readAsText(file);
  };

  const handleRemoveEmail = async (shareId, emailToRemove) => {
    const confirmRemove = window.confirm(`Are you sure you want to remove ${emailToRemove} from this share page?`);
    if (confirmRemove) {
      try {
        const share = shares.find(s => s.id === shareId);
        const updatedEmails = share.emails.filter(email => email !== emailToRemove);
        
        const { error } = await supabase.from('manageshare')
          .update({ emails: updatedEmails })
          .eq('id', shareId);
        
        if (error) throw error;
        setRefetchTrigger(prev => prev + 1);
      } catch (error) {
        console.error('Error removing email:', error);
      }
    }
  };

  const handleDeleteShare = async (shareId) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this share page? This action cannot be undone.');
    if (confirmDelete) {
      try {
        // Optimistically remove from UI
        setShares(prev => prev.filter(share => share.id !== shareId));
        
        const { error } = await supabase.from('manageshare')
          .delete()
          .eq('id', shareId);
        
        if (error) {
          // If error, trigger refetch to restore correct state
          setRefetchTrigger(prev => prev + 1);
          throw error;
        }
      } catch (error) {
        console.error('Error deleting share:', error);
      }
    }
  };

  const toggleActive = async (shareId, currentState) => {
    try {
      // Optimistically update UI
      setShares(prev => prev.map(share => 
        share.id === shareId 
          ? { ...share, isActive: !currentState }
          : share
      ));

      const { error } = await supabase.from('manageshare')
        .update({ isActive: !currentState })
        .eq('id', shareId);
      
      if (error) {
        // If error, trigger refetch to restore correct state
        setRefetchTrigger(prev => prev + 1);
        throw error;
      }
    } catch (error) {
      console.error('Error toggling active status:', error);
    }
  };

  return (
    <>
      <Navbar
        user={user}
        onLogout={handleLogout}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />
      <div className="container mx-auto p-4 max-w-5xl text-white pt-20">
      <h1 className="text-2xl font-bold mb-6">Manage Share Pages</h1>
      
      {/* Create new share page section */}
      <Card className="p-4 mb-6 bg-[#0a0a0a] border-[#1d1d1d] text-white">
        <Button 
          onClick={() => setIsCreating(!isCreating)} 
          className="w-full mb-4"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create New Share Page
        </Button>

        {isCreating && (
          <div className="flex gap-2">
            <Input
              placeholder="Enter share page title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="bg-[#0a0a0a] border-[#1d1d1d]"
            />
            <Button onClick={handleCreate}>Create</Button>
          </div>
        )}
      </Card>

      {/* List of share pages */}
      <div className="space-y-4">
        {loading ? (
          <p>Loading share pages...</p>
        ) : shares.length === 0 ? (
          <p>No share pages found. Create one to get started!</p>
        ) : (
          shares.map((share) => (
            <Card 
              key={share.id} 
              className="p-4 bg-[#0a0a0a] border-[#1d1d1d] text-white"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold">{share.title}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <Checkbox
                      checked={share.isActive}
                      onCheckedChange={() => toggleActive(share.id, share.isActive)}
                    />
                    <span className="text-sm">Active</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const url = `${window.location.origin}/share/groups?id=${share.uuid}&token=${user?.id}`;
                      navigator.clipboard.writeText(url);
                    }}
                  >
                    <Link className="h-4 w-4 mr-2" />
                    Copy Link
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteShare(share.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Email list and management */}
              <div className="mt-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium">Shared Emails</h4>
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept=".csv"
                      onChange={(e) => handleCsvUpload(share.id, e)}
                      className="hidden"
                      id={`csv-${share.id}`}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => document.getElementById(`csv-${share.id}`).click()}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Import CSV
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          Paste Emails
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-[#0a0a0a] border border-[#1d1d1d] text-white">
                        <DialogHeader>
                          <DialogTitle>Add Multiple Emails</DialogTitle>
                          <DialogDescription className="text-gray-400">
                            Enter emails separated by commas or spaces
                          </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <textarea
                            id={`emails-input-${share.id}`}
                            className="flex min-h-[100px] w-full rounded-md border border-[#1d1d1d] bg-[#0a0a0a] px-3 py-2 text-sm text-white"
                            placeholder="email1@example.com, email2@example.com"
                          />
                        </div>
                        <DialogFooter>
                          <Button
                            onClick={() => {
                              const textarea = document.getElementById(`emails-input-${share.id}`);
                              const emailText = textarea?.value;
                              
                              if (emailText) {
                                const emails = emailText
                                  .split(/[\s,]+/) // Split by spaces or commas
                                  .map(email => email.trim())
                                  .filter(email => {
                                    // Basic email validation
                                    const isValid = email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
                                    if (!isValid) {
                                      console.warn(`Invalid email format: ${email}`);
                                    }
                                    return isValid;
                                  });

                                if (emails.length > 0) {
                                  const existingEmails = share.emails || [];
                                  const uniqueEmails = [...new Set([...existingEmails, ...emails])];

                                  supabase.from('manageshare')
                                    .update({ emails: uniqueEmails })
                                    .eq('id', share.id)
                                    .then(({ error }) => {
                                      if (error) {
                                        console.error('Error adding emails:', error);
                                        alert('Failed to add emails. Please try again.');
                                      } else {
                                        setRefetchTrigger(prev => prev + 1);
                                        textarea.value = ''; // Clear textarea
                                        const closeButton = textarea.closest('[role="dialog"]').querySelector('button[aria-label="Close"]');
                                        closeButton?.click(); // Close dialog
                                      }
                                    });
                                } else {
                                  alert('No valid emails found. Please check the format.');
                                }
                              }
                            }}
                          >
                            Add Emails
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {share.emails?.map((email) => (
                    <div
                      key={email}
                      className="flex justify-between items-center p-2 bg-[#101010] rounded"
                    >
                      <span className="text-sm">{email}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveEmail(share.id, email)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                
                {(!share.emails || share.emails.length === 0) && (
                  <p className="text-sm text-gray-500 mt-2">
                    No emails added yet. Import a CSV or add emails through the share dialog.
                  </p>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
    </>
  );
}

export default withAuth(ManageShares);
