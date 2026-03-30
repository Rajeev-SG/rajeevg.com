export type RegisteredMdxComponent =
  | "div"
  | "span"
  | "ArticleExplain"
  | "ArticleFigure"
  | "ProjectSpotlight"
  | "WorkflowFrame"
  | "TerminalLine"
  | "TerminalNote"
  | "ReviewPill"

export type ComponentInsertionTemplate = {
  name: RegisteredMdxComponent
  label: string
  description: string
  snippet: string
}

export const ALLOWED_MDX_COMPONENTS: RegisteredMdxComponent[] = [
  "div",
  "span",
  "ArticleExplain",
  "ArticleFigure",
  "ProjectSpotlight",
  "WorkflowFrame",
  "TerminalLine",
  "TerminalNote",
  "ReviewPill",
]

export const COMPONENT_INSERTION_TEMPLATES: ComponentInsertionTemplate[] = [
  {
    name: "ArticleExplain",
    label: "Explainer pill",
    description: "Inline glossary/explainer chip with a popover body.",
    snippet:
      '<ArticleExplain term="Term to explain">Plain-language explanation that helps the reader understand the idea in context.</ArticleExplain>',
  },
  {
    name: "ArticleFigure",
    label: "Figure",
    description: "Structured image figure with title, eyebrow, and caption.",
    snippet:
      '<ArticleFigure src="/images/blog/example.png" alt="Describe the image" eyebrow="Proof" title="What this shows" caption="Explain why this image matters for the argument." />',
  },
  {
    name: "ProjectSpotlight",
    label: "Project spotlight",
    description: "Embeds an approved portfolio project card by slug.",
    snippet: '<ProjectSpotlight slug="site-analytics" />',
  },
  {
    name: "WorkflowFrame",
    label: "Workflow frame",
    description: "Framed walkthrough block for process steps or command sequences.",
    snippet:
      '<WorkflowFrame eyebrow="Workflow" title="Recommended sequence" tone="ocean">\n  <TerminalLine>pnpm dev</TerminalLine>\n  <TerminalNote>Explain why this step matters.</TerminalNote>\n</WorkflowFrame>',
  },
  {
    name: "ReviewPill",
    label: "Review pill",
    description: "Inline status chip for checks, risks, or outcomes.",
    snippet: '<ReviewPill tone="success">Checks passed</ReviewPill>',
  },
]

const JSX_COMPONENT_PATTERN = /<([A-Z][A-Za-z0-9]*)\b/g

export function getComponentUsages(markdown: string) {
  const matches = Array.from(markdown.matchAll(JSX_COMPONENT_PATTERN)).map((match) => match[1])
  return [...new Set(matches)].filter((name): name is RegisteredMdxComponent =>
    ALLOWED_MDX_COMPONENTS.includes(name as RegisteredMdxComponent)
  )
}

export function validateAllowedMdxComponents(markdown: string) {
  const discovered = Array.from(markdown.matchAll(JSX_COMPONENT_PATTERN)).map((match) => match[1])
  const unknown = [...new Set(discovered)].filter(
    (name) => !ALLOWED_MDX_COMPONENTS.includes(name as RegisteredMdxComponent)
  )

  return {
    valid: unknown.length === 0,
    unknown,
    used: getComponentUsages(markdown),
  }
}
