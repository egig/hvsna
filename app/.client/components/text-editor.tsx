import { useEditor, EditorContent, type JSONContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { TaskItem, TaskList } from '@tiptap/extension-list'
import { Placeholder } from '@tiptap/extensions'
import './text-editor.css'
import clsx from 'clsx'

interface TextEditorProps {
  content?: string
  onChange?: (content: JSONContent) => void
  placeholder?: string
  className?: string
  editable?: boolean
  instanceID: string
}

export function TextEditor({ 
  content, 
  onChange, 
  placeholder = 'Start typing...', 
  className,
  editable = true,
  instanceID 
}: TextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false, // SSR support
    extensions: [
      Placeholder.configure({
        placeholder
      }),
      StarterKit,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getJSON())
    },
    editorProps: {
      attributes: {
        class: 'mx-auto focus:outline-none min-h-[200px] p-4',
        placeholder,
      },
    },
  }, [content, instanceID])


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
