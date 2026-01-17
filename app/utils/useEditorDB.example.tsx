import React from 'react';
import { useEditorDB } from './useEditorDB';
import type { EditorDocumentCreateInput } from '../../lib/types/editor-document';

export function EditorDBExample() {
  const { 
    db, 
    isLoading, 
    error, 
    createDocument, 
    getAllDocuments, 
    getDocument,
  } = useEditorDB();

  const handleCreateDocument = async () => {
    try {
      const newDoc: EditorDocumentCreateInput = {
        content: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [
                { type: 'text', text: 'Hello from TipTap Editor!' }
              ]
            }
          ]
        },
        tags: ['example', 'demo'],
        metadata: { author: 'Demo User' }
      };

      const createdDoc = await createDocument(newDoc);
      console.log('Created document:', createdDoc);
    } catch (err) {
      console.error('Failed to create document:', err);
    }
  };

  const handleLoadDocuments = async () => {
    try {
      const documents = await getAllDocuments();
      console.log('All documents:', documents);
    } catch (err) {
      console.error('Failed to load documents:', err);
    }
  };


  if (isLoading) {
    return <div>Loading database...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div>
      <h2>Editor Database Example</h2>
      <button onClick={handleCreateDocument}>
        Create Sample Document
      </button>
      <button onClick={handleLoadDocuments}>
        Load All Documents
      </button>
    </div>
  );
}

export default EditorDBExample;
