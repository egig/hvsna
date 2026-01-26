import { TaskItem as BaseTaskItem } from '@tiptap/extension-list'
import { Node, mergeAttributes } from '@tiptap/core'

export interface TaskItemOptions {
  HTMLAttributes: Record<string, any>
  nested: boolean
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    taskItem: {
      /**
       * Toggle a task item
       */
      toggleTaskItem: () => ReturnType
      /**
       * Set the task item to checked/unchecked
       */
      setTaskItemChecked: (checked: boolean) => ReturnType
    }
  }
}

export const TaskItem2 = BaseTaskItem.extend<TaskItemOptions>({
  name: 'taskItem2',
  addOptions() {
    return {
      ...this.parent?.(),
      nested: false,
      HTMLAttributes: {},
    }
  },

  addAttributes() {
    return {
      ...this.parent?.(),
      taskId: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-task-id'),
        renderHTML: (attributes) => {
          if (!attributes.taskId) {
            return {}
          }

          return {
            'data-task-id': attributes.taskId,
          }
        },
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'li[data-type="taskItem2"]',
        getAttrs: (element) => {
          return {
            checked: (element as HTMLElement).hasAttribute('data-checked'),
            taskId: (element as HTMLElement).getAttribute('data-task-id'),
          }
        },
      },
    ]
  },

  renderHTML({ HTMLAttributes, node }) {
    console.log("NODE", node)
    const { checked } = node.attrs

    return [
      'li',
      mergeAttributes(
        { 'data-type': 'taskItem2' },
        { 'data-checked': checked },
        this.options.HTMLAttributes,
        HTMLAttributes,
        {
          class: 'task-item',
        }
      ),
      [
        'label',
        { class: 'task-item-label' },
        [
          'input',
          {
            type: 'checkbox',
            checked: checked ? 'checked' : undefined,
            disabled: 'disabled',
          },
        ],
        [
          'div',
          { class: 'task-item-content' },
          0,
        ],
      ],
    ]
  },

  addKeyboardShortcuts() {
    return {
      Enter: () => this.editor.commands.splitListItem('taskItem2'),
      'Shift-Tab': () => this.editor.commands.liftListItem('taskItem2'),
      Tab: () => this.editor.commands.sinkListItem('taskItem2'),
      'Mod-Enter': () => this.editor.commands.setTaskItemChecked(false),
    }
  },

  addCommands() {
    return {
      ...this.parent?.(),
      toggleTaskItemChecked:
        () =>
        ({ commands, state }: { commands: any; state: any }) => {
          const { selection } = state
          const node = selection.$from.node(selection.$from.depth - 1)

          if (node.type.name === 'taskItem2') {
            return commands.updateAttributes('taskItem2', {
              checked: !node.attrs.checked,
            })
          }

          return false
        },
      setTaskItemChecked:
        (checked: boolean) =>
        ({ commands, state }: { commands: any; state: any }) => {
          const { selection } = state
          const node = selection.$from.node(selection.$from.depth - 1)

          if (node.type.name === 'taskItem2') {
            return commands.updateAttributes('taskItem2', {
              checked,
            })
          }

          return false
        },
    }
  },
})
