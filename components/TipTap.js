// Install required packages first:
// npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-code-block @tiptap/extension-image @tiptap/extension-table @tiptap/extension-highlight @tiptap/extension-link @tiptap/extension-mention @tiptap/extension-task-list @tiptap/extension-bullet-list @tiptap/extension-ordered-list @tiptap/extension-paragraph @tiptap/extension-text @tiptap/extension-bold @tiptap/extension-italic @tiptap/extension-underline

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import CodeBlock from '@tiptap/extension-code-block';
import Image from '@tiptap/extension-image';
import Table from '@tiptap/extension-table';



import Highlight from '@tiptap/extension-highlight';
import Link from '@tiptap/extension-link';
import Mention from '@tiptap/extension-mention';

import BulletList from '@tiptap/extension-bullet-list';
import OrderedList from '@tiptap/extension-ordered-list';
import Paragraph from '@tiptap/extension-paragraph';
import Text from '@tiptap/extension-text';
import Bold from '@tiptap/extension-bold';
import Italic from '@tiptap/extension-italic';
import Underline from '@tiptap/extension-underline';

const TiptapEditor = () => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      CodeBlock,
      Image,
      
     
      Highlight,
      Link.configure({
        openOnClick: true,
      }),
      Mention.configure({
        HTMLAttributes: {
          class: 'mention',
        },
        suggestion: {
          items: ({ query }) => {
            return [
              { id: 1, label: 'Krishna' },
              { id: 2, label: 'Lucid' },
              { id: 3, label: 'Tiptap' },
            ].filter(item => item.label.toLowerCase().includes(query.toLowerCase()));
          },
        },
      }),
      
      BulletList,
      OrderedList,
      Paragraph,
      Text,
      Bold,
      Italic,
      Underline,
    ],
    content: `
      <h2>Welcome to Tiptap Editor!</h2>
      <p>You can edit this content or start from scratch!</p>
      <p><strong>Enjoy the full power of Tiptap features.</strong></p>
      <ul>
        <li>Bullet list</li>
        <li><strong>Rich Text Formatting</strong></li>
        <li>Tables and Images</li>
      </ul>
    `,
  });

  return (
    <div>
      <h1>Tiptap Editor</h1>
      <EditorContent editor={editor} />
      <style jsx>{`
        .mention {
          color: blue;
          background: rgba(0, 0, 255, 0.1);
          padding: 0 4px;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
};

export default TiptapEditor;
