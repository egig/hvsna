export function textContent(node: JSONContent) {
  let text = node.text || "";

  if (!node.content?.length) {
    return text.trim();
  }

  for (let i = 0; i < node.content.length; i++) {
    const childNode = node.content[i];
    let sep = "\n";
    if (childNode.type !== "paragraph") {
      sep = " ";
    }

    text = `${text}${sep}${textContent(childNode)}`;
  }

  return text.trim();
}
