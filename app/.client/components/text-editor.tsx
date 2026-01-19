import { useEditor, EditorContent, type JSONContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Placeholder } from '@tiptap/extensions'
import './text-editor.css'
import clsx from 'clsx'

interface TextEditorProps {
  content?: string
  onChange?: (content: JSONContent) => void
  placeholder?: string
  className?: string
  editable?: boolean
}

export function TextEditor({ 
  content, 
  onChange, 
  placeholder = 'Start typing...', 
  className,
  editable = true 
}: TextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false, // SSR support
    extensions: [
      Placeholder.configure({
        placeholder
      }),
      StarterKit,
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getJSON())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[200px] p-4',
        placeholder,
      },
    },
  }, [content])


  if (!editor) {
    return null
  }

  return (
    <div className={clsx('overflow-hidden', className)}>
      {/* {editable && <MenuBar />} */}
      <EditorContent editor={editor} />
    </div>
  )
}
