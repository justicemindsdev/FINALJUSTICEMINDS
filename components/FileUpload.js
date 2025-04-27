import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Trash2 } from 'lucide-react';

const FileUpload = ({ docs, setNewMention }) => {
  const [uploading, setUploading] = useState(false);

  const uploadFile = async (file) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { data, error } = await supabase.storage
        .from('DashboardData')
        .upload(filePath, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('DashboardData')
        .getPublicUrl(filePath);

      return {
        url: publicUrl,
        name: file.name,
        type: file.type,
        size: file.size
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      return null;
    }
  };

  const handleFileChange = async (e) => {
    try {
      setUploading(true);
      const files = Array.from(e.target.files);
      const uploadPromises = files.map(uploadFile);
      const uploadedFiles = await Promise.all(uploadPromises);
      
      const validFiles = uploadedFiles.filter(file => file !== null);
      console.log(validFiles);
      
      setNewMention(prev => ({
        ...prev,
        docs: [...prev?.docs, ...validFiles]
      }));
    } catch (error) {
      console.error('Error handling files:', error);
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (index) => {
    setNewMention(prev => ({
      ...prev,
      docs: prev.docs.filter((_, i) => i !== index)
    }));
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-center w-full">
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer border-gray-600 bg-[#0e0e0e] hover:bg-[#1a1a1a]">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <p className="mb-2 text-sm text-gray-400">
              {uploading ? 'Uploading...' : 'Click to upload or drag and drop'}
            </p>
            <p className="text-xs text-gray-500">
              All file types supported
            </p>
          </div>
          <input
            type="file"
            className="hidden"
            multiple
            onChange={handleFileChange}
            disabled={uploading}
          />
        </label>
      </div>

      {docs?.length > 0 && (
        <div className="space-y-2">
          {docs?.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-2 bg-[#1a1a1a] rounded">
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-300">{file.name}</span>
                <span className="text-xs text-gray-500">({formatFileSize(file.size)})</span>
              </div>
              <button
                onClick={() => removeFile(index)}
                className="p-1 text-gray-400 hover:text-red-400"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUpload;