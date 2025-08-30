import { visit } from 'unist-util-visit'
import type { Root, Element } from 'hast'

export default function rehypePreMermaid() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element) => {
      if (
        node.tagName === 'pre' &&
        node.children?.[0]?.type === 'element' &&
        (node.children[0] as Element).tagName === 'code' &&
        Array.isArray((node.children[0] as Element).properties?.className) &&
        ((node.children[0] as Element).properties!.className as string[]).includes('language-mermaid')
      ) {
        const code = node.children[0] as Element
        node.tagName = 'pre'
        node.properties = { ...(node.properties || {}), className: ['mermaid'] }
        node.children = code.children
      }
    })
  }
}
