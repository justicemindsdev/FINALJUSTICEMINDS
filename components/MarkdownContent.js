import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const MarkdownContent = ({ content }) => (
  <div className="prose prose-invert max-w-none">
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        h1: ({node, ...props}) => <h1 className="text-white mt-6 mb-4 text-2xl font-bold border-b border-gray-700 pb-2" {...props} />,
        h2: ({node, ...props}) => <h2 className="text-white mt-5 mb-3 text-xl font-bold" {...props} />,
        h3: ({node, ...props}) => <h3 className="text-white mt-4 mb-2 text-lg font-bold" {...props} />,
        p: ({node, ...props}) => <p className="text-gray-300 my-3 leading-relaxed" {...props} />,
        ul: ({node, ordered, ...props}) => <ul className="list-disc list-inside my-3 space-y-1" {...props} />,
        ol: ({node, ordered, ...props}) => <ol className="list-decimal list-inside my-3 space-y-1" {...props} />,
        li: ({node, ...props}) => <li className="text-gray-300 ml-4" {...props} />,
        a: ({node, ...props}) => (
          <a 
            className="text-blue-400 hover:text-blue-300 underline transition-colors" 
            target="_blank"
            rel="noopener noreferrer"
            {...props} 
          />
        ),
        blockquote: ({node, ...props}) => (
          <blockquote 
            className="border-l-4 border-gray-700 pl-4 my-4 italic text-gray-400"
            {...props} 
          />
        ),
        code({node, inline, className, children, ...props}) {
          const match = /language-(\w+)/.exec(className || '');
          return inline ? (
            <code 
              className="bg-gray-800 px-1.5 py-0.5 rounded text-sm text-gray-200"
              {...props}
            >
              {children}
            </code>
          ) : (
            <pre 
              className="bg-gray-800 p-4 rounded-md overflow-x-auto my-4"
            >
              <code 
                className={`language-${match?.[1] || ''} text-sm text-gray-200`}
                {...props}
              >
                {children}
              </code>
            </pre>
          );
        },
        table({node, ...props}) {
          return (
            <div className="overflow-x-auto my-4">
              <table className="min-w-full divide-y divide-gray-700 border border-gray-700" {...props} />
            </div>
          )
        },
        th({node, ...props}) {
          return <th className="px-4 py-2 bg-gray-800 text-left text-sm font-semibold text-white border-b border-gray-700" {...props} />
        },
        td({node, ...props}) {
          return <td className="px-4 py-2 text-sm text-gray-300 border-t border-gray-700" {...props} />
        },
        img({node, ...props}) {
          return (
            <img 
              className="max-w-full h-auto rounded-lg my-4" 
              {...props}
              loading="lazy"
            />
          )
        },
        hr({node, ...props}) {
          return <hr className="my-6 border-gray-700" {...props} />
        },
      }}
    >
      {content}
    </ReactMarkdown>
  </div>
);

export default MarkdownContent;
