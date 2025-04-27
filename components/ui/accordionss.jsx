import React, { useState } from 'react';
import MarkdownContent from '../MarkdownContent';

// Helper function to check if content is HTML
const isHTML = (str) => {
  const doc = new DOMParser().parseFromString(str, "text/html");
  return Array.from(doc.body.childNodes).some(node => node.nodeType === 1);
};

// Helper function to render content based on type
const renderContent = (content) => {
  if (isHTML(content)) {
    return (
      <div
        dangerouslySetInnerHTML={{ __html: content }}
        className="prose prose-invert max-w-none"
      />
    );
  }
  return <MarkdownContent content={content} />;
};

export const Accordion = ({ title, content, onEdit, onDelete, isEditable = false }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-gray-600 rounded-lg mb-2 bg-[#1c1c1c]">
      <div 
        className="flex justify-between items-center p-4 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <h3 className="text-white font-medium">{title}</h3>
        <div className="flex items-center gap-2">
          {isEditable && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="px-2 py-1 text-sm bg-yellow-500 text-white rounded hover:bg-yellow-600"
              >
                Edit
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="px-2 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
              >
                Delete
              </button>
            </>
          )}
          <svg
            className={`w-6 h-6 transition-transform ${isOpen ? 'transform rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {isOpen && (
        <div className="p-4 border-t border-gray-600">
          {renderContent(content)}
        </div>
      )}
    </div>
  );
};

export const AccordionForm = ({ onSubmit, initialTitle = '', initialContent = '', isEdit = false }) => {
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [showPreview, setShowPreview] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    onSubmit({ title, content });
    setTitle('');
    setContent('');
    setShowPreview(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Accordion Title"
        className="w-full p-2 bg-[#1c1c1c] border border-gray-600 rounded text-white"
      />
      <div className="space-y-2">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onFocus={() => setShowPreview(true)}
          placeholder="Accordion Content (Supports Markdown)"
          rows="4"
          className="w-full p-2 bg-[#1c1c1c] border border-gray-600 rounded text-white"
        />
        {showPreview && content && (
          <div className="border border-gray-600 rounded-lg p-4 bg-[#1c1c1c]">
            <h3 className="text-white text-sm font-medium mb-2">Preview:</h3>
            <div className="prose prose-invert max-w-none">
              <MarkdownContent content={content} />
            </div>
          </div>
        )}
      </div>
      <button
        type="submit"
        className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        {isEdit ? 'Update Accordion' : 'Add Accordion'}
      </button>
    </form>
  );
};
