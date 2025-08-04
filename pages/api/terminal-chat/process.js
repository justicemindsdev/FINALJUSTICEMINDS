import fs from 'fs';
import path from 'path';

// AI instruction processor for site modifications
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { instruction } = req.body;

  if (!instruction) {
    return res.status(400).json({ success: false, error: 'Instruction is required' });
  }

  try {
    // Analyze the instruction and determine what changes to make
    const analysis = await analyzeInstruction(instruction);
    
    if (analysis.changes && analysis.changes.length > 0) {
      return res.status(200).json({
        success: true,
        analysis: analysis.response,
        changes: analysis.changes
      });
    } else {
      return res.status(200).json({
        success: true,
        analysis: analysis.response,
        changes: null
      });
    }

  } catch (error) {
    console.error('Instruction processing error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to process instruction' 
    });
  }
}

async function analyzeInstruction(instruction) {
  const projectRoot = process.cwd();
  
  // Basic instruction parsing (can be enhanced with actual AI/LLM integration)
  const lowerInstruction = instruction.toLowerCase();
  
  // Example instruction patterns
  const patterns = [
    {
      keywords: ['add', 'contact', 'form'],
      handler: () => generateContactFormChanges(),
      response: 'I\'ll add a contact form to your site'
    },
    {
      keywords: ['change', 'color', 'theme'],
      handler: () => generateThemeChanges(instruction),
      response: 'I\'ll update the color theme'
    },
    {
      keywords: ['add', 'page'],
      handler: () => generateNewPageChanges(instruction),
      response: 'I\'ll create a new page for you'
    },
    {
      keywords: ['update', 'navbar', 'navigation'],
      handler: () => generateNavbarChanges(instruction),
      response: 'I\'ll update the navigation'
    },
    {
      keywords: ['add', 'button', 'link'],
      handler: () => generateButtonChanges(instruction),
      response: 'I\'ll add the requested button/link'
    }
  ];

  // Find matching pattern
  const matchedPattern = patterns.find(pattern => 
    pattern.keywords.every(keyword => lowerInstruction.includes(keyword))
  );

  if (matchedPattern) {
    const changes = matchedPattern.handler();
    return {
      response: matchedPattern.response,
      changes: changes
    };
  }

  // Fallback for unrecognized instructions
  return {
    response: `I understand you want to: "${instruction}". However, I need more specific instructions. Try commands like:
    - "Add a contact form to the about page"
    - "Change the theme color to blue"
    - "Add a new testimonials page"
    - "Update the navbar with a new menu item"`,
    changes: null
  };
}

function generateContactFormChanges() {
  return [
    {
      file: 'components/ContactForm.js',
      type: 'create',
      description: 'Create new contact form component',
      content: `import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';

export default function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission
    console.log('Form submitted:', formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
      <div>
        <label className="block text-sm font-medium mb-1">Name</label>
        <Input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({...formData, name: e.target.value})}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <Input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({...formData, email: e.target.value})}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Message</label>
        <textarea
          className="w-full p-2 border rounded-md"
          rows="4"
          value={formData.message}
          onChange={(e) => setFormData({...formData, message: e.target.value})}
          required
        />
      </div>
      <Button type="submit" className="w-full">Send Message</Button>
    </form>
  );
}`
    },
    {
      file: 'pages/about/index.js',
      type: 'modify',
      description: 'Add contact form to about page',
      content: 'Import and add ContactForm component'
    }
  ];
}

function generateThemeChanges(instruction) {
  // Extract color from instruction (basic parsing)
  const colors = ['blue', 'red', 'green', 'purple', 'orange', 'pink'];
  const foundColor = colors.find(color => instruction.toLowerCase().includes(color));
  
  return [
    {
      file: 'styles/globals.css',
      type: 'modify',
      description: `Update theme to ${foundColor || 'new'} color scheme`,
      content: `/* Updated color scheme */
:root {
  --primary-color: ${foundColor === 'blue' ? '#3b82f6' : 
                   foundColor === 'red' ? '#ef4444' :
                   foundColor === 'green' ? '#10b981' : '#6366f1'};
}`
    }
  ];
}

function generateNewPageChanges(instruction) {
  // Extract page name from instruction
  const words = instruction.split(' ');
  const pageIndex = words.findIndex(word => word.toLowerCase() === 'page');
  const pageName = pageIndex > 0 ? words[pageIndex - 1] : 'newpage';
  
  return [
    {
      file: `pages/${pageName}/index.js`,
      type: 'create',
      description: `Create new ${pageName} page`,
      content: `export default function ${pageName.charAt(0).toUpperCase() + pageName.slice(1)}Page() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">${pageName.charAt(0).toUpperCase() + pageName.slice(1)}</h1>
      <p>Welcome to the ${pageName} page!</p>
    </div>
  );
}`
    }
  ];
}

function generateNavbarChanges(instruction) {
  return [
    {
      file: 'components/Navbar.js',
      type: 'modify',
      description: 'Update navigation menu',
      content: 'Add new menu item to navigation'
    }
  ];
}

function generateButtonChanges(instruction) {
  // Extract button text from instruction
  const buttonText = extractQuotedText(instruction) || 'New Button';
  
  return [
    {
      file: 'components/ui/CustomButton.js',
      type: 'create',
      description: `Add new button: ${buttonText}`,
      content: `import { Button } from './button';

export default function CustomButton() {
  return (
    <Button className="bg-blue-600 hover:bg-blue-700">
      ${buttonText}
    </Button>
  );
}`
    }
  ];
}

function extractQuotedText(text) {
  const match = text.match(/["']([^"']+)["']/);
  return match ? match[1] : null;
}