import { useEffect } from "react";
import { Icon, List, ListItem, Navbar, NavTitle, Page, Preloader, Block, Button } from "framework7-react";
import { useNote } from "../hooks/useNote";
import { StickyNoteIcon } from "lucide-react";
import { textContent } from "~/lib/text-content";

export default function Notes() {
  const { notes, loading, error, deleteNote, refreshNotes } = useNote();

  const handleDeleteNote = async (id: string) => {
    try {
      await deleteNote(id);
    } catch (err) {
      console.error('Failed to delete note:', err);
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

  return (
    <Page>
      <Navbar>
        <NavTitle>
          Notes
        </NavTitle>
      </Navbar>
      
      {loading && (
        <Block className="text-center">
          <Preloader />
          <div>Loading notes...</div>
        </Block>
      )}

      {error && (
        <Block className="text-center">
          <div style={{ color: 'red' }}>Error: {error}</div>
          <Button fill onClick={refreshNotes}>
            <Icon ios="f7:arrow_clockwise" md="material:refresh" />
            Retry
          </Button>
        </Block>
      )}

      {!loading && !error && (
        <>
          {notes.length === 0 ? (
            <Block className="text-center">
              <Icon ios="f7:note_text" md="material:note" size="48" />
              <p>No notes yet</p>
              <p>Create your first note to get started!</p>
            </Block>
          ) : (
            <List mediaList>
              {notes.map((note) => (
                <ListItem
                  key={note.id}
                  title={getNotePreview(note.content)}
                  subtitle={formatDate(note.updated_at || note.created_at || '')}
                  link={`/note/${note.id}`}
                  swipeout
                >
                  <div slot="root-end" className="swipeout-actions-right">
                    <a href="#" className="swipeout-delete" onClick={() => handleDeleteNote(note.id)}>
                      Delete
                    </a>
                  </div>
                  <div slot="media">
                    <StickyNoteIcon />
                  </div>
                </ListItem>
              ))}
            </List>
          )}
        </>
      )}
    </Page>
  );
}