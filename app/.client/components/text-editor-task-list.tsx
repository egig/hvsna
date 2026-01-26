import { TaskList as BaseTaskList } from '@tiptap/extension-list'
import { Node, mergeAttributes } from '@tiptap/core'

export interface TaskListOptions {
  HTMLAttributes: Record<string, any>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    taskList: {
      /**
       * Toggle a task list
       */
      toggleTaskList: () => ReturnType
    }
  }
}

export const TaskList = BaseTaskList.extend<TaskListOptions>({
  name: 'taskList2',
  addOptions() {
    return {
      ...this.parent?.(),
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
        tag: 'ul[data-type="taskList2"]',
        getAttrs: (element) => {
          return {
            taskId: (element as HTMLElement).getAttribute('data-task-id'),
          }
        },
      },
    ]
  },

  renderHTML({ HTMLAttributes, node }) {
    return [
      'ul',
      mergeAttributes(
        { 'data-type': 'taskList2' },
        this.options.HTMLAttributes,
        HTMLAttributes,
        {
          class: 'task-list',
        }
      ),
      0,
    ]
  },

  addCommands() {
    return {
      toggleTaskList:
        () =>
        ({ commands }) => {
          return commands.toggleList('taskList2', 'taskItem2')
        },
    }
  },
})
