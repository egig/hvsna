import { cn } from "~/lib/utils"

export default  function MenuBar({editor}: {editor: any}) {
    if (!editor) {
      return null
    }

    return (
      <div className="border border-gray-200 rounded-t-lg bg-gray-50 p-2 flex flex-wrap gap-1">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor.can().chain().focus().toggleBold().run()}
          className={cn(
            'p-2 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed',
            editor.isActive('bold') && 'bg-gray-300'
          )}
          title="Bold"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M6 4v12h4.5c1.5 0 2.5-1 2.5-2.5S12 11 10.5 11H8V8h2c1 0 2-1 2-2s-1-2-2-2H6zm2 2h2c.5 0 1 .5 1 1s-.5 1-1 1H8V6zm0 4h2.5c.5 0 1 .5 1 1.5s-.5 1.5-1 1.5H8v-3z"/>
          </svg>
        </button>

        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor.can().chain().focus().toggleItalic().run()}
          className={cn(
            'p-2 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed',
            editor.isActive('italic') && 'bg-gray-300'
          )}
          title="Italic"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M8 4h6v2h-2.5l-2 8H14v2H6v-2h2.5l2-8H8V4z"/>
          </svg>
        </button>

        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={!editor.can().chain().focus().toggleStrike().run()}
          className={cn(
            'p-2 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed',
            editor.isActive('strike') && 'bg-gray-300'
          )}
          title="Strike"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M6 4v2h8V4H6zm0 4v8h8V8H6zm2 2h4v4H8v-4z"/>
          </svg>
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={cn(
            'p-2 rounded hover:bg-gray-200',
            editor.isActive('heading', { level: 1 }) && 'bg-gray-300'
          )}
          title="Heading 1"
        >
          H1
        </button>

        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={cn(
            'p-2 rounded hover:bg-gray-200',
            editor.isActive('heading', { level: 2 }) && 'bg-gray-300'
          )}
          title="Heading 2"
        >
          H2
        </button>

        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={cn(
            'p-2 rounded hover:bg-gray-200',
            editor.isActive('heading', { level: 3 }) && 'bg-gray-300'
          )}
          title="Heading 3"
        >
          H3
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn(
            'p-2 rounded hover:bg-gray-200',
            editor.isActive('bulletList') && 'bg-gray-300'
          )}
          title="Bullet List"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M3 4h14v2H3V4zm0 4h14v2H3V8zm0 4h14v2H3v-2z"/>
          </svg>
        </button>

        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={cn(
            'p-2 rounded hover:bg-gray-200',
            editor.isActive('orderedList') && 'bg-gray-300'
          )}
          title="Ordered List"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M3 4h14v2H3V4zm0 4h14v2H3V8zm0 4h14v2H3v-2z"/>
          </svg>
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <button
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
          className={cn(
            'p-2 rounded hover:bg-gray-200',
            editor.isActive('codeBlock') && 'bg-gray-300'
          )}
          title="Code Block"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M8 4l-6 6 6 6v-4h8v-4H8V4z"/>
          </svg>
        </button>

        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={cn(
            'p-2 rounded hover:bg-gray-200',
            editor.isActive('blockquote') && 'bg-gray-300'
          )}
          title="Quote"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M3 5h14v2H3V5zm0 4h14v2H3V9zm0 4h14v2H3v-2z"/>
          </svg>
        </button>

        <div className="w-px h-6 bg-gray-300 mx-1" />

        <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().chain().focus().undo().run()}
          className={cn(
            'p-2 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed'
          )}
          title="Undo"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"/>
          </svg>
        </button>

        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().chain().focus().redo().run()}
          className={cn(
            'p-2 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed'
          )}
          title="Redo"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"/>
          </svg>
        </button>
      </div>
    )
  }