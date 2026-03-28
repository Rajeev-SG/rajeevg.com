"use client"

import { useEffect, useMemo, useRef } from "react"
import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Link from "@tiptap/extension-link"
import Placeholder from "@tiptap/extension-placeholder"
import { Table } from "@tiptap/extension-table"
import TableCell from "@tiptap/extension-table-cell"
import TableHeader from "@tiptap/extension-table-header"
import TableRow from "@tiptap/extension-table-row"
import { marked } from "marked"
import TurndownService from "turndown"
import { gfm } from "turndown-plugin-gfm"

import { Button } from "@/components/ui/button"

type TiptapEditorProps = {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

const turndown = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
})

turndown.use(gfm)

export function TiptapEditor({ value, onChange, placeholder }: TiptapEditorProps) {
  const initialHtml = useMemo(() => marked.parse(value || ""), [value])
  const lastExternalValue = useRef(value)

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        link: false,
      }),
      Link.configure({ openOnClick: false }),
      Placeholder.configure({ placeholder: placeholder || "Start writing…" }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: initialHtml,
    onUpdate({ editor: currentEditor }) {
      const markdown = turndown.turndown(currentEditor.getHTML())
      lastExternalValue.current = markdown
      onChange(markdown)
    },
    editorProps: {
      attributes: {
        class:
          "min-h-[420px] rounded-xl border bg-background px-4 py-3 prose prose-sm max-w-none focus:outline-none dark:prose-invert",
      },
    },
  })

  useEffect(() => {
    if (!editor) return
    if (value === lastExternalValue.current) return
    editor.commands.setContent(marked.parse(value || ""), { emitUpdate: false })
    lastExternalValue.current = value
  }, [editor, value])

  if (!editor) return null

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 rounded-xl border bg-muted/30 p-2">
        <Button size="sm" variant="outline" onClick={() => editor.chain().focus().toggleBold().run()}>
          Bold
        </Button>
        <Button size="sm" variant="outline" onClick={() => editor.chain().focus().toggleItalic().run()}>
          Italic
        </Button>
        <Button size="sm" variant="outline" onClick={() => editor.chain().focus().toggleBulletList().run()}>
          Bullets
        </Button>
        <Button size="sm" variant="outline" onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          Numbers
        </Button>
        <Button size="sm" variant="outline" onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          Quote
        </Button>
        <Button size="sm" variant="outline" onClick={() => editor.chain().focus().toggleCodeBlock().run()}>
          Code
        </Button>
        <Button size="sm" variant="outline" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3 }).run()}>
          Table
        </Button>
      </div>
      <EditorContent editor={editor} />
    </div>
  )
}
