import * as React from "react"
import * as runtime from "react/jsx-runtime"

// Parse the Velite-generated MDX function-body string into a React component
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type MDXComponentsMap = Record<string, React.ComponentType<any>>

export const useMDXComponent = (
  code: string
): React.ComponentType<{ components?: MDXComponentsMap }> => {
  const fn = new Function(code)
  return fn({ ...runtime }).default as React.ComponentType<{
    components?: MDXComponentsMap
  }>
}

export interface MDXContentProps {
  code: string
  components?: MDXComponentsMap
}

export function MDXContent({ code, components }: MDXContentProps) {
  const Component = useMDXComponent(code)
  return <Component components={components} />
}
