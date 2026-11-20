import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import SignalRoom from "../signal-room"

export const metadata: Metadata = {
  title: "Signal Room",
  description: "Investigate three simulated campaign incidents and trace what caused reported conversions to fall.",
  alternates: { canonical: "/solutions/signal-room" },
}

export default function SignalRoomPage() {
  return (
    <div className="space-y-6">
      <Link
        href="/solutions#signal-room"
        className="inline-flex min-h-11 items-center gap-2 text-sm font-medium underline-offset-4 hover:underline"
      >
        <ArrowLeft size={16} aria-hidden="true" />
        Back to Solutions
      </Link>
      <SignalRoom />
    </div>
  )
}
