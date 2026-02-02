type JSONContent = {
  /**
   * The type of the node
   */
  type?: string;
  /**
   * The attributes of the node. Attributes can have any JSON-serializable value.
   */
  attrs?: Record<string, any> | undefined;
  /**
   * The children of the node. A node can have other nodes as children.
   */
  content?: JSONContent[];
  /**
   * A list of marks of the node. Inline nodes can have marks.
   */
  marks?: {
    /**
     * The type of the mark
     */
    type: string;
    /**
     * The attributes of the mark. Attributes can have any JSON-serializable value.
     */
    attrs?: Record<string, any>;
    [key: string]: any;
  }[];
  /**
   * The text content of the node. This property is only present on text nodes
   * (i.e. nodes with `type: 'text'`).
   *
   * Text nodes cannot have children, but they can have marks.
   */
  text?: string;
  [key: string]: any;
};
