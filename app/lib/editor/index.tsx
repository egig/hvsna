import { useEffect, useRef } from "react"
import {EditorState} from "prosemirror-state"
import {EditorView} from "prosemirror-view"
import {Schema, Node} from "prosemirror-model"
import {schema} from "prosemirror-schema-basic"
import {addListNodes} from "prosemirror-schema-list"
import {setup} from "./setup"

interface EditorProps {
  content?: JSONContent
  onUpdate?: (content: JSONContent) => void
  className?: string
}

// Mix the nodes from prosemirror-schema-list into the basic schema to
// create a schema with list support.
const mySchema = new Schema({
  nodes: addListNodes(schema.spec.nodes, "paragraph block*", "block"),
  marks: schema.spec.marks
})

// Helper function to convert JSONContent to ProseMirror Node
function jsonContentToNode(jsonContent: JSONContent): Node {
  return Node.fromJSON(mySchema, jsonContent)
}

// Helper function to convert ProseMirror Node to JSONContent
function nodeToJSONContent(node: Node): JSONContent {
  return node.toJSON()
}

const defaultContent: JSONContent = {
  type: "doc",
  content: [
    {
      type: "paragraph",
      content: [],
    },
  ],
}

export function Editor({ content = defaultContent, onUpdate, className = "" }: EditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)

  useEffect(() => {
    if (!editorRef.current) return

    const view = new EditorView(editorRef.current, {
      state: EditorState.create({
        doc: jsonContentToNode(content),
        plugins: setup({schema: mySchema})
      })
    })

    viewRef.current = view

    // Set up update handler
    if (onUpdate) {
      view.setProps({
        dispatchTransaction: (transaction) => {
          const newState = view.state.apply(transaction)
          view.updateState(newState)
          
          if (transaction.docChanged) {
            const newContent = nodeToJSONContent(view.state.doc)
            onUpdate(newContent)
          }
        }
      })
    }

    return () => {
      view.destroy()
    }
  }, [])

  useEffect(() => {
    if (viewRef.current && content !== viewRef.current.state.doc.toJSON()) {
      const newState = EditorState.create({
        doc: jsonContentToNode(content),
        plugins: setup({schema: mySchema})
      })
      viewRef.current.updateState(newState)
    }
  }, [content])

  return <div ref={editorRef} className={className} />
}
