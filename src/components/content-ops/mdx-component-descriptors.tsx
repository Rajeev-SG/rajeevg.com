"use client"

import {
  GenericJsxEditor,
  type JsxComponentDescriptor,
} from "@mdxeditor/editor"

export const mdxJsxComponentDescriptors: JsxComponentDescriptor[] = [
  {
    name: "div",
    kind: "flow",
    props: [{ name: "className", type: "string" }],
    hasChildren: true,
    Editor: GenericJsxEditor,
  },
  {
    name: "span",
    kind: "text",
    props: [{ name: "className", type: "string" }],
    hasChildren: true,
    Editor: GenericJsxEditor,
  },
  {
    name: "ArticleExplain",
    kind: "text",
    props: [
      { name: "term", type: "string" },
      { name: "className", type: "string" },
    ],
    hasChildren: true,
    Editor: GenericJsxEditor,
  },
  {
    name: "ArticleFigure",
    kind: "flow",
    props: [
      { name: "src", type: "string" },
      { name: "alt", type: "string" },
      { name: "caption", type: "string" },
      { name: "title", type: "string" },
      { name: "eyebrow", type: "string" },
      { name: "className", type: "string" },
      { name: "imgClassName", type: "string" },
    ],
    hasChildren: false,
    Editor: GenericJsxEditor,
  },
  {
    name: "ProjectSpotlight",
    kind: "flow",
    props: [{ name: "slug", type: "string" }],
    hasChildren: false,
    Editor: GenericJsxEditor,
  },
  {
    name: "WorkflowFrame",
    kind: "flow",
    props: [
      { name: "eyebrow", type: "string" },
      { name: "title", type: "string" },
      { name: "tone", type: "string" },
    ],
    hasChildren: true,
    Editor: GenericJsxEditor,
  },
  {
    name: "TerminalLine",
    kind: "flow",
    props: [{ name: "prefix", type: "string" }],
    hasChildren: true,
    Editor: GenericJsxEditor,
  },
  {
    name: "TerminalNote",
    kind: "flow",
    props: [],
    hasChildren: true,
    Editor: GenericJsxEditor,
  },
  {
    name: "ReviewPill",
    kind: "text",
    props: [{ name: "tone", type: "string" }],
    hasChildren: true,
    Editor: GenericJsxEditor,
  },
]
