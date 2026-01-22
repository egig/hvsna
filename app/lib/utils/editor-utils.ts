import type { JSONContent } from '@tiptap/react';
import type { EditorDocument, EditorDocumentCreateInput } from '../types/note';

export class EditorUtils {
  static createEmptyDocument(): EditorDocumentCreateInput {
    return {
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
          },
        ],
      },
      tags: [],
      metadata: {},
    };
  }

  static isValidJSONContent(content: any): content is JSONContent {
    if (!content || typeof content !== 'object') {
      return false;
    }

    if (content.type !== 'doc') {
      return false;
    }

    if (!Array.isArray(content.content)) {
      return false;
    }

    return true;
  }

  static sanitizeDocumentTitle(title: string): string {
    return title
      .trim()
      .replace(/[<>:"/\\|?*]/g, '')
      .substring(0, 200);
  }

  static extractTextFromContent(content: JSONContent): string {
    if (!content.content) {
      return '';
    }

    let text = '';
    
    const extractFromNode = (node: any): void => {
      if (node.text) {
        text += node.text;
      }
      
      if (node.content) {
        node.content.forEach(extractFromNode);
      }
    };

    content.content.forEach(extractFromNode);
    return text;
  }

  static getWordCount(content: JSONContent): number {
    const text = this.extractTextFromContent(content);
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  static getCharacterCount(content: JSONContent): number {
    return this.extractTextFromContent(content).length;
  }

  static generateDocumentSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }



  static validateDocument(document: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!document.id || typeof document.id !== 'string') {
      errors.push('Invalid or missing id');
    }

    if (!this.isValidJSONContent(document.content)) {
      errors.push('Invalid content structure');
    }

    if (!document.createdAt || !(document.createdAt instanceof Date)) {
      errors.push('Invalid or missing createdAt date');
    }

    if (!document.updatedAt || !(document.updatedAt instanceof Date)) {
      errors.push('Invalid or missing updatedAt date');
    }

    if (typeof document.version !== 'number' || document.version < 1) {
      errors.push('Invalid version number');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  static generateDocumentSummary(content: JSONContent, maxLength: number = 150): string {
    const text = this.extractTextFromContent(content);
    const summary = text.substring(0, maxLength);
    return summary.length < text.length ? `${summary}...` : summary;
  }

  static getDocumentReadingTime(content: JSONContent): number {
    const wordCount = this.getWordCount(content);
    const wordsPerMinute = 200;
    return Math.ceil(wordCount / wordsPerMinute);
  }

  static filterDocumentsByTag(documents: EditorDocument[], tag: string): EditorDocument[] {
    return documents.filter(doc => 
      doc.tags && doc.tags.includes(tag)
    );
  }

  static getUniqueTagsFromDocuments(documents: EditorDocument[]): string[] {
    const allTags = documents.flatMap(doc => doc.tags || []);
    return Array.from(new Set(allTags)).sort();
  }

  static sortDocumentsByDate(documents: EditorDocument[], order: 'asc' | 'desc' = 'desc'): EditorDocument[] {
    return [...documents].sort((a, b) => {
      const dateA = new Date(a.updatedAt).getTime();
      const dateB = new Date(b.updatedAt).getTime();
      return order === 'desc' ? dateB - dateA : dateA - dateB;
    });
  }
}
