import * as React from "react"
import * as runtime from "react/jsx-runtime"

// Parse the Velite-generated MDX function-body string into a React component
export const useMDXComponent = (code: string) => {
  const fn = new Function(code)
  return fn({ ...runtime }).default
}

export interface MDXContentProps {
  code: string
  components?: Record<string, React.ComponentType<any>>
}

export function MDXContent({ code, components }: MDXContentProps) {
  const Component = useMDXComponent(code)
  return <Component components={components} />
}
