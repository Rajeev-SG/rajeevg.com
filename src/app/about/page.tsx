import Link from "next/link"
import { Mail, Github, Linkedin } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"

export default function AboutPage() {
  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">About</h1>
      <div className="max-w-xl">
        <Card>
          <CardHeader className="flex flex-row items-center gap-4">
            <Avatar className="h-12 w-12">
              {/* Replace with /profile.jpg or any local image in public/ */}
              <AvatarImage src="/next.svg" alt="Rajeev Gill" />
              <AvatarFallback>RG</AvatarFallback>
            </Avatar>
            <div className="grid gap-1">
              <CardTitle>Rajeev Gill</CardTitle>
              <CardDescription>Software engineer • Building fast, accessible web apps</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              I design and build modern web applications with a focus on performance, DX, and clean UI systems. This site is
              powered by Next.js, Tailwind, shadcn/ui, and Velite.
            </p>
          </CardContent>
          <CardFooter className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href="mailto:hello@example.com">
                <Mail className="mr-2" /> Email
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="https://github.com/" target="_blank" rel="noreferrer noopener">
                <Github className="mr-2" /> GitHub
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="https://www.linkedin.com/" target="_blank" rel="noreferrer noopener">
                <Linkedin className="mr-2" /> LinkedIn
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </section>
  )
}
