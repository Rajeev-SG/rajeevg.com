import * as React from "react"
import * as runtime from "react/jsx-runtime"

// Parse the Velite-generated MDX function-body string into a React component
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type MDXComponentsMap = Record<string, React.ComponentType<any>>

export type ArticleHeading = {
  id: string
  text: string
  depth: 2 | 3
}

export const getMDXComponent = (
  code: string
): React.FC<{ components?: MDXComponentsMap }> => {
  const fn = new Function(code)
  return fn({ ...runtime }).default as React.FC<{
    components?: MDXComponentsMap
  }>
}

function getNodeText(node: React.ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node)
  if (Array.isArray(node)) return node.map(getNodeText).join("")
  if (!React.isValidElement(node)) return ""

  return getNodeText((node.props as { children?: React.ReactNode }).children)
}

export function extractMdxHeadings(
  code: string,
  components: MDXComponentsMap
): ArticleHeading[] {
  const Component = getMDXComponent(code)
  const tree = Component({ components }) as React.ReactNode
  const headings: ArticleHeading[] = []
  const headingTypes = new Map<unknown, 2 | 3>([
    [components.h2, 2],
    [components.h3, 3],
  ])

  function visit(node: React.ReactNode) {
    if (Array.isArray(node)) {
      node.forEach(visit)
      return
    }

    if (!React.isValidElement(node)) return

    const depth = headingTypes.get(node.type)
    const props = node.props as { id?: string; children?: React.ReactNode }

    if (depth && props.id) {
      headings.push({
        id: props.id,
        text: getNodeText(props.children).trim(),
        depth,
      })
    }

    visit(props.children)
  }

  visit(tree)
  return headings
}

export interface MDXContentProps {
  code: string
  components?: MDXComponentsMap
}

export function MDXContent({ code, components }: MDXContentProps) {
  const Component = getMDXComponent(code)
  return <Component components={components} />
}
