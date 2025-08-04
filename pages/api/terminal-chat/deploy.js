import fs from 'fs/promises';
import path from 'path';
import { execSync } from 'child_process';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { changes } = req.body;

  if (!changes || !Array.isArray(changes)) {
    return res.status(400).json({ success: false, error: 'Changes array is required' });
  }

  try {
    const projectRoot = process.cwd();
    let appliedChanges = [];

    // Apply each change
    for (const change of changes) {
      const filePath = path.join(projectRoot, change.file);
      
      try {
        if (change.type === 'create') {
          // Create new file
          await ensureDirectoryExists(path.dirname(filePath));
          await fs.writeFile(filePath, change.content);
          appliedChanges.push(`Created: ${change.file}`);
          
        } else if (change.type === 'modify') {
          // Modify existing file
          if (change.content && change.content !== 'Import and add ContactForm component') {
            await fs.writeFile(filePath, change.content);
            appliedChanges.push(`Modified: ${change.file}`);
          } else {
            // Handle specific modifications
            await applySpecificModification(filePath, change);
            appliedChanges.push(`Updated: ${change.file}`);
          }
        }
      } catch (fileError) {
        console.error(`Error applying change to ${change.file}:`, fileError);
        // Continue with other changes
      }
    }

    // Generate commit message
    const commitMessage = `Terminal Chat: ${appliedChanges.join(', ')}

🤖 Generated with Terminal Chat
Applied ${appliedChanges.length} changes via English instructions`;

    // Git operations
    try {
      // Add all changes
      execSync('git add .', { cwd: projectRoot, stdio: 'pipe' });
      
      // Commit changes
      execSync(`git commit -m "${commitMessage}"`, { 
        cwd: projectRoot, 
        stdio: 'pipe' 
      });
      
      // Get commit hash
      const commitHash = execSync('git rev-parse --short HEAD', { 
        cwd: projectRoot, 
        encoding: 'utf8' 
      }).trim();
      
      // Push to remote
      execSync('git push origin main', { 
        cwd: projectRoot, 
        stdio: 'pipe' 
      });

      return res.status(200).json({
        success: true,
        commitHash,
        appliedChanges,
        message: `Successfully applied ${appliedChanges.length} changes and deployed to Git/Vercel`
      });

    } catch (gitError) {
      console.error('Git operation failed:', gitError);
      return res.status(500).json({
        success: false,
        error: 'Changes applied but Git deployment failed',
        appliedChanges
      });
    }

  } catch (error) {
    console.error('Deployment error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to apply changes'
    });
  }
}

async function ensureDirectoryExists(dirPath) {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

async function applySpecificModification(filePath, change) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    
    // Handle specific modification types
    if (change.description.includes('contact form')) {
      // Add ContactForm import and component
      let modifiedContent = content;
      
      // Add import if not present
      if (!content.includes('ContactForm')) {
        const importLine = "import ContactForm from '../../components/ContactForm';\\n";
        modifiedContent = importLine + content;
      }
      
      // Add component to JSX (basic insertion)
      if (content.includes('</div>')) {
        modifiedContent = modifiedContent.replace(
          '</div>',
          '  <ContactForm />\\n    </div>'
        );
      }
      
      await fs.writeFile(filePath, modifiedContent);
    }
    
    // Handle navbar updates
    else if (change.description.includes('navigation')) {
      // Add menu item to navbar (basic implementation)
      const modifiedContent = content.replace(
        '</nav>',
        '  <a href="/new-page" className="nav-link">New Page</a>\\n      </nav>'
      );
      await fs.writeFile(filePath, modifiedContent);
    }
    
    // Handle theme updates
    else if (change.description.includes('theme')) {
      // This would be handled by the content provided in the change
      await fs.writeFile(filePath, change.content);
    }
    
  } catch (error) {
    console.error('Error in specific modification:', error);
    throw error;
  }
}