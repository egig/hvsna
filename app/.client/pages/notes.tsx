import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useNote } from "../hooks/useNote";
import { StickyNoteIcon, RefreshCw, FileText, Loader2 } from "lucide-react";
import { textContent } from "~/lib/text-content";
import { Navbar } from "../navigation/components/Navbar";

export default function Notes() {
  const { notes, loading, loadingMore, error, hasMore, deleteNote, refreshNotes, loadMoreNotes } = useNote();
  const pageContentRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDeleteNote = async (id: string) => {
    if (deletingId) return;
    
    const confirmed = window.confirm('Are you sure you want to delete this note?');
    if (!confirmed) return;

    setDeletingId(id);
    try {
      await deleteNote(id);
    } catch (err) {
      console.error('Failed to delete note:', err);
      alert('Failed to delete note. Please try again.');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getNotePreview = (content: any[]) => {
    if (!content || content.length === 0) return 'Empty note';
    
    const c = textContent(content[0]);
    
    return c || 'No text content';
  };

  useEffect(() => {
    const handleScroll = () => {
      if (!pageContentRef.current) return;
      
      const { scrollTop, scrollHeight, clientHeight } = pageContentRef.current;
      if (scrollHeight - scrollTop <= clientHeight + 100 && hasMore && !loadingMore) {
        loadMoreNotes();
      }
    };

    const pageContent = pageContentRef.current;
    if (pageContent) {
      pageContent.addEventListener('scroll', handleScroll);
      return () => pageContent.removeEventListener('scroll', handleScroll);
    }
  }, [hasMore, loadingMore, loadMoreNotes]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar title="Notes" />

      <main className="max-w-[520px] mx-auto px-4 py-6">
        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading notes...</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-red-600 dark:text-red-400 mb-4 text-center">
              <p className="font-semibold">Error</p>
              <p className="text-sm">{error}</p>
            </div>
            <button
              onClick={refreshNotes}
              className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 active:scale-95 transition-transform"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Retry</span>
            </button>
          </div>
        )}

        {!loading && !error && (
          <div 
            ref={pageContentRef} 
            className="h-[calc(100vh-8rem)] overflow-y-auto"
          >
            {notes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <FileText className="w-16 h-16 text-gray-400 dark:text-gray-600 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No notes yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 text-center">
                  Create your first note to get started!
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {notes.map((note) => (
                  <div
                    key={note.id}
                    className="group bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <StickyNoteIcon className="w-5 h-5 text-gray-400 dark:text-gray-600 mt-1" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <button
                          onClick={() => navigate(`/note/${note.id}`)}
                          className="block w-full text-left"
                        >
                          <h3 className="font-medium text-gray-900 dark:text-white truncate mb-1">
                            {getNotePreview(note.content)}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {formatDate(note.updated_at || note.created_at || '')}
                          </p>
                        </button>
                      </div>
                      
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        disabled={deletingId === note.id}
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex-shrink-0"
                      >
                        <div className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                          {deletingId === note.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          )}
                        </div>
                      </button>
                    </div>
                  </div>
                ))}
                
                {loadingMore && (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600 dark:text-blue-400" />
                  </div>
                )}
                
                {!hasMore && notes.length > 0 && (
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No more notes to load
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}