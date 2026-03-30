"use client"

import { useEffect, useRef } from "react"
import {
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  codeBlockPlugin,
  CreateLink,
  diffSourcePlugin,
  DiffSourceToggleWrapper,
  headingsPlugin,
  imagePlugin,
  InsertCodeBlock,
  InsertImage,
  InsertTable,
  jsxPlugin,
  linkDialogPlugin,
  linkPlugin,
  listsPlugin,
  ListsToggle,
  markdownShortcutPlugin,
  MDXEditor,
  type MDXEditorMethods,
  quotePlugin,
  Separator,
  tablePlugin,
  thematicBreakPlugin,
  toolbarPlugin,
  UndoRedo,
} from "@mdxeditor/editor"
import "@mdxeditor/editor/style.css"

import { mdxJsxComponentDescriptors } from "@/components/content-ops/mdx-component-descriptors"
import { Button } from "@/components/ui/button"
import { COMPONENT_INSERTION_TEMPLATES } from "@/lib/content-ops/component-registry"

type ContentMdxEditorProps = {
  value: string
  onChange: (value: string) => void
  diffMarkdown?: string
}

export function ContentMdxEditor({ value, onChange, diffMarkdown }: ContentMdxEditorProps) {
  const editorRef = useRef<MDXEditorMethods>(null)
  const lastValueRef = useRef(value)

  useEffect(() => {
    if (!editorRef.current) return
    if (value === lastValueRef.current) return
    editorRef.current.setMarkdown(value)
    lastValueRef.current = value
  }, [value])

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 rounded-xl border bg-muted/30 p-2">
        {COMPONENT_INSERTION_TEMPLATES.map((template) => (
          <Button
            key={template.name}
            size="sm"
            variant="outline"
            onClick={() => editorRef.current?.insertMarkdown(`\n\n${template.snippet}\n\n`)}
          >
            {template.label}
          </Button>
        ))}
      </div>
      <div className="rounded-xl border bg-background p-3">
        <MDXEditor
          ref={editorRef}
          markdown={value}
          onChange={(nextValue) => {
            lastValueRef.current = nextValue
            onChange(nextValue)
          }}
          contentEditableClassName="prose prose-sm dark:prose-invert max-w-none min-h-[420px] px-4 py-4"
          plugins={[
            headingsPlugin(),
            listsPlugin(),
            linkPlugin(),
            linkDialogPlugin(),
            imagePlugin(),
            tablePlugin(),
            codeBlockPlugin(),
            quotePlugin(),
            thematicBreakPlugin(),
            jsxPlugin({ jsxComponentDescriptors: mdxJsxComponentDescriptors }),
            diffSourcePlugin({
              diffMarkdown,
              viewMode: "rich-text",
            }),
            toolbarPlugin({
              toolbarContents: () => (
                <DiffSourceToggleWrapper>
                  <UndoRedo />
                  <Separator />
                  <BoldItalicUnderlineToggles />
                  <Separator />
                  <BlockTypeSelect />
                  <Separator />
                  <ListsToggle />
                  <Separator />
                  <CreateLink />
                  <InsertImage />
                  <InsertTable />
                  <InsertCodeBlock />
                </DiffSourceToggleWrapper>
              ),
            }),
            markdownShortcutPlugin(),
          ]}
        />
      </div>
    </div>
  )
}
