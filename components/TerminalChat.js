import { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react';

export default function TerminalChat({ onSiteUpdate }) {
  const [messages, setMessages] = useState([
    { id: 1, type: 'system', content: 'Terminal Chat initialized. Enter instructions to modify your site.' }
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewChanges, setPreviewChanges] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewCollapsed, setPreviewCollapsed] = useState(false);
  const [previewContent, setPreviewContent] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const addMessage = (type, content) => {
    const newMessage = {
      id: Date.now(),
      type, // 'user', 'ai', 'system', 'preview', 'error'
      content,
      timestamp: new Date().toLocaleTimeString()
    };
    setMessages(prev => [...prev, newMessage]);
  };

  const processInstruction = async (instruction) => {
    setIsProcessing(true);
    addMessage('user', instruction);
    
    try {
      // Send instruction to AI processor
      const response = await fetch('/api/terminal-chat/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ instruction })
      });

      const result = await response.json();

      if (result.success) {
        addMessage('ai', result.analysis);
        
        if (result.changes) {
          setPreviewChanges(result.changes);
          setShowPreview(true);
          setPreviewContent(result.previewHtml || generatePreviewContent(result.changes));
          addMessage('preview', `Preview ready: ${result.changes.length} file(s) to modify. Check split-screen preview →`);
        }
      } else {
        addMessage('error', result.error || 'Failed to process instruction');
      }
    } catch (error) {
      addMessage('error', `Error: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;
    
    const instruction = input.trim();
    setInput('');
    processInstruction(instruction);
  };

  const handlePreviewApprove = async () => {
    if (!previewChanges) return;
    
    setIsProcessing(true);
    addMessage('system', 'Applying changes and deploying...');
    
    try {
      const response = await fetch('/api/terminal-chat/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ changes: previewChanges })
      });

      const result = await response.json();

      if (result.success) {
        addMessage('system', `✅ Changes applied and deployed! Commit: ${result.commitHash}`);
        setPreviewChanges(null);
        if (onSiteUpdate) onSiteUpdate();
      } else {
        addMessage('error', result.error || 'Deployment failed');
      }
    } catch (error) {
      addMessage('error', `Deployment error: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePreviewReject = () => {
    setPreviewChanges(null);
    setShowPreview(false);
    setPreviewContent('');
    addMessage('system', 'Changes rejected');
  };

  const generatePreviewContent = (changes) => {
    return `
      <div class="p-4 space-y-4">
        <h3 class="text-lg font-semibold">Preview Changes</h3>
        ${changes.map(change => `
          <div class="border border-gray-200 rounded-lg p-3">
            <div class="font-medium text-blue-600">${change.file}</div>
            <div class="text-sm text-gray-600">${change.description}</div>
            <div class="mt-2 bg-gray-50 p-2 rounded text-xs font-mono">
              ${change.type === 'create' ? 'Creating new file...' : 'Modifying existing file...'}
            </div>
          </div>
        `).join('')}
      </div>
    `;
  };

  const togglePreview = () => {
    setPreviewCollapsed(!previewCollapsed);
  };

  const getMessageColor = (type) => {
    switch (type) {
      case 'user': return 'text-blue-400';
      case 'ai': return 'text-green-400';
      case 'system': return 'text-yellow-400';
      case 'preview': return 'text-purple-400';
      case 'error': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="flex h-full">
      {/* Terminal Section */}
      <div className={`${showPreview ? (previewCollapsed ? 'w-full' : 'w-1/2') : 'w-full'} transition-all duration-300`}>
        <div className="bg-black text-green-400 font-mono text-sm border border-gray-600 rounded-lg overflow-hidden h-full">
          {/* Header */}
          <div className="bg-gray-800 px-4 py-2 border-b border-gray-600 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span className="ml-4 text-gray-300">Terminal Chat - Site Modifier</span>
            </div>
            <div className="flex items-center space-x-2">
              {showPreview && (
                <button
                  onClick={togglePreview}
                  className="text-gray-400 hover:text-white text-xs flex items-center space-x-1"
                >
                  {previewCollapsed ? (
                    <>
                      <ChevronLeft size={14} />
                      <span>Show Preview</span>
                    </>
                  ) : (
                    <>
                      <ChevronRight size={14} />
                      <span>Hide Preview</span>
                    </>
                  )}
                </button>
              )}
              <div className="text-xs text-gray-500">
                {isProcessing && '● Processing...'}
              </div>
            </div>
          </div>

      {/* Messages */}
      <div className="h-96 overflow-y-auto p-4 space-y-2">
        {messages.map((message) => (
          <div key={message.id} className="flex flex-col">
            <div className="flex items-start space-x-2">
              <span className="text-gray-500 text-xs w-16 flex-shrink-0">
                [{message.timestamp}]
              </span>
              <span className={`font-semibold ${getMessageColor(message.type)} min-w-0 flex-shrink-0`}>
                {message.type === 'user' ? '>' : 
                 message.type === 'ai' ? 'AI:' :
                 message.type === 'system' ? 'SYS:' :
                 message.type === 'preview' ? 'PREV:' :
                 message.type === 'error' ? 'ERR:' : ''}
              </span>
              <span className={`${getMessageColor(message.type)} break-words min-w-0 flex-1`}>
                {message.content}
              </span>
            </div>
          </div>
        ))}
        
        {/* Preview Actions */}
        {previewChanges && (
          <div className="bg-gray-900 p-3 rounded border border-purple-500 mt-4">
            <div className="text-purple-400 font-semibold mb-2">Preview Changes:</div>
            <div className="text-sm space-y-1 mb-3">
              {previewChanges.map((change, idx) => (
                <div key={idx} className="text-gray-300">
                  • {change.file}: {change.description}
                </div>
              ))}
            </div>
            <div className="flex space-x-2">
              <Button 
                onClick={handlePreviewApprove}
                className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1"
                disabled={isProcessing}
              >
                ✅ Apply & Deploy
              </Button>
              <Button 
                onClick={handlePreviewReject}
                className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1"
                disabled={isProcessing}
              >
                ❌ Reject
              </Button>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="border-t border-gray-600 p-4">
        <div className="flex items-center space-x-2">
          <span className="text-green-400">$</span>
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter instruction (e.g., 'Add a new contact form to the about page')"
            className="flex-1 bg-transparent border-none text-green-400 placeholder-gray-500 focus:ring-0"
            disabled={isProcessing}
          />
          <Button 
            type="submit" 
            disabled={!input.trim() || isProcessing}
            className="bg-green-600 hover:bg-green-700 text-black px-4 py-1"
          >
            {isProcessing ? '...' : 'Send'}
          </Button>
        </div>
      </form>
        </div>
      </div>

      {/* Preview Section */}
      {showPreview && !previewCollapsed && (
        <div className="w-1/2 border-l border-gray-300">
          <div className="bg-white h-full flex flex-col">
            {/* Preview Header */}
            <div className="bg-gray-100 px-4 py-2 border-b border-gray-300 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Eye size={16} className="text-gray-600" />
                <span className="text-gray-700 font-medium">Live Preview</span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-gray-500 hover:text-gray-700 text-xs"
                >
                  <EyeOff size={14} />
                </button>
              </div>
            </div>

            {/* Preview Content */}
            <div className="flex-1 overflow-auto">
              {previewChanges && (
                <div className="p-4 space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">Changes Preview</h3>
                  {previewChanges.map((change, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-mono text-sm text-blue-600">{change.file}</div>
                        <span className={`px-2 py-1 text-xs rounded ${
                          change.type === 'create' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                        }`}>
                          {change.type}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mb-3">{change.description}</div>
                      {change.content && (
                        <div className="bg-white border rounded p-3">
                          <div className="text-xs text-gray-500 mb-2">Code Preview:</div>
                          <pre className="text-xs font-mono text-gray-800 whitespace-pre-wrap overflow-x-auto">
                            {change.content.substring(0, 300)}
                            {change.content.length > 300 && '...'}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Preview Actions */}
            {previewChanges && (
              <div className="border-t border-gray-200 p-4 bg-gray-50">
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    Ready to apply {previewChanges.length} change(s)
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      onClick={handlePreviewReject}
                      className="bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2"
                      disabled={isProcessing}
                    >
                      ❌ Reject
                    </Button>
                    <Button 
                      onClick={handlePreviewApprove}
                      className="bg-green-600 hover:bg-green-700 text-white text-sm px-4 py-2"
                      disabled={isProcessing}
                    >
                      ✅ Apply & Deploy
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}