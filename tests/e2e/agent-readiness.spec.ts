import { expect, test } from "@playwright/test"

const publicRoutes = ["/", "/about", "/projects", "/blog", "/privacy", "/contact", "/developers"]

test.describe("agent readiness", () => {
  test("negotiates HTML and Markdown on the canonical public URLs", async ({ request }) => {
    for (const route of publicRoutes) {
      const markdown = await request.get(route, { headers: { Accept: "text/markdown" } })
      expect(markdown.status(), route).toBe(200)
      expect(markdown.headers()["content-type"], route).toMatch(/^text\/markdown;\s*charset=utf-8/i)
      expect(markdown.headers()[varyHeader(markdown.headers())], route).toMatch(/(?:^|,)\s*accept\s*(?:,|$)/i)
      expect((await markdown.text()).length, route).toBeGreaterThan(80)

      const html = await request.get(route, { headers: { Accept: "text/html" } })
      expect(html.status(), route).toBe(200)
      expect(html.headers()["content-type"], route).toMatch(/^text\/html/i)
      expect(html.headers()[varyHeader(html.headers())], route).toMatch(/(?:^|,)\s*accept\s*(?:,|$)/i)
    }
  })

  test("applies q-values and specificity before selecting a representation", async ({ request }) => {
    const cases = [
      { accept: "text/markdown;q=0.8, text/html;q=0.9", contentType: /^text\/html/i },
      { accept: "text/*;q=0.7, text/markdown;q=0.8", contentType: /^text\/markdown/i },
      { accept: "text/markdown;q=0, text/html;q=0.8", contentType: /^text\/html/i },
      { accept: "text/*;q=0.8, text/markdown;q=0.8", contentType: /^text\/markdown/i },
      { accept: "text/html;q=0.8, text/markdown;q=0.8", contentType: /^text\/html/i },
    ]

    for (const testCase of cases) {
      const response = await request.get("/about", { headers: { Accept: testCase.accept } })
      expect(response.status(), testCase.accept).toBe(200)
      expect(response.headers()["content-type"], testCase.accept).toMatch(testCase.contentType)
    }

    const notAcceptable = await request.get("/about", { headers: { Accept: "application/json" } })
    expect(notAcceptable.status()).toBe(406)
  })

  test("returns a useful Markdown 404 without intercepting non-public surfaces", async ({ request }) => {
    const missing = await request.get("/this-page-does-not-exist", { headers: { Accept: "text/markdown" } })
    expect(missing.status()).toBe(404)
    const markdownBody = await missing.text()
    expect(markdownBody).toContain("# Page not found")
    expect(markdownBody).toContain("/sitemap.xml")

    const htmlMissing = await request.get("/this-page-does-not-exist", { headers: { Accept: "text/html" } })
    const htmlBody = await htmlMissing.text()
    expect(htmlMissing.status()).toBe(404)
    expect(htmlBody).toContain('href="/projects"')
    expect(htmlBody).toContain('href="/blog"')
    expect(htmlBody).toContain('href="/llms.txt"')

    const api = await request.get("/api/content-ops/preview", { headers: { Accept: "application/json" } })
    expect(api.status()).not.toBe(406)
    expect(api.headers()["content-type"] || "").not.toMatch(/^text\/markdown/i)

    const asset = await request.get("/favicon.ico", { headers: { Accept: "application/json" } })
    expect(asset.status()).not.toBe(406)
    expect(asset.headers()["content-type"] || "").not.toMatch(/^text\/markdown/i)
  })

  test("keeps meaningful SSR headings and content on the homepage", async ({ page, request }) => {
    const rawResponse = await request.get("/", { headers: { Accept: "text/html" } })
    const rawHtml = await rawResponse.text()
    expect(rawResponse.status()).toBe(200)
    expect(rawHtml.length).toBeGreaterThan(500)
    expect(rawHtml).toMatch(/<h1\b/i)
    expect(rawHtml.indexOf("<h2")).toBeGreaterThan(rawHtml.indexOf("<h1"))
    expect(rawHtml.indexOf("<h3")).toBeGreaterThan(rawHtml.indexOf("<h2"))

    await page.goto("/")
    const snapshot = await page.locator("main").evaluate((main) => ({
      htmlLength: main.innerHTML.length,
      headings: Array.from(main.querySelectorAll("h1, h2, h3")).map((heading) => heading.tagName),
    }))

    expect(snapshot.htmlLength).toBeGreaterThan(500)
    expect(snapshot.headings[0]).toBe("H1")
    expect(snapshot.headings.filter((heading) => heading === "H1")).toHaveLength(1)
    expect(snapshot.headings.indexOf("H2")).toBeGreaterThan(snapshot.headings.indexOf("H1"))
    expect(snapshot.headings.indexOf("H3")).toBeGreaterThan(snapshot.headings.indexOf("H2"))
  })

  test("publishes developer resources, Person JSON-LD, llms.txt, and sitemap links", async ({ page, request }) => {
    await page.goto("/developers")
    await expect(page.getByRole("heading", { name: "Rajeev G. developer resources" })).toBeVisible()
    await expect(page.getByRole("link", { name: "GitHub profile" })).toHaveAttribute("href", "https://github.com/Rajeev-SG")
    await expect(page.getByRole("link", { name: "LinkedIn profile" })).toHaveAttribute("href", "https://www.linkedin.com/in/rajeev-gill/")
    await expect(page.getByText(/no public site-wide API, OAuth, webhooks, or MCP server/i)).toBeVisible()

    await page.goto("/")
    const person = await page.locator('script[type="application/ld+json"]').evaluateAll((scripts) =>
      scripts.map((script) => JSON.parse(script.textContent || "{}")).find((value) => value["@type"] === "Person"),
    )
    expect(person).toMatchObject({
      "@type": "Person",
      name: "Rajeev Gill",
      url: "https://rajeevg.com",
      sameAs: ["https://github.com/Rajeev-SG", "https://www.linkedin.com/in/rajeev-gill/"],
    })
    expect(person).not.toHaveProperty("address")
    expect(person).not.toHaveProperty("telephone")

    const llms = await request.get("/llms.txt")
    expect(llms.status()).toBe(200)
    expect(llms.headers()["content-type"]).toMatch(/^text\/(plain|markdown)/i)
    expect(await llms.text()).toContain("no public site-wide API")

    const sitemap = await request.get("/sitemap.xml")
    const sitemapBody = await sitemap.text()
    expect(sitemap.status()).toBe(200)
    expect(sitemapBody).toContain("https://rajeevg.com/contact")
    expect(sitemapBody).toContain("https://rajeevg.com/developers")

    const blogMarkdown = await request.get("/blog", { headers: { Accept: "text/markdown" } })
    expect(await blogMarkdown.text()).toContain("/blog/how-i-split-sol-planning-from-opencode-go-execution")

    const articleMarkdown = await request.get("/blog/how-i-split-sol-planning-from-opencode-go-execution", {
      headers: { Accept: "text/markdown" },
    })
    const articleBody = await articleMarkdown.text()
    expect(articleBody).toContain("## The short verdict")
    expect(articleBody).toContain("The 620-call closure run")
    expect(articleBody).not.toContain("title: Can I Make Codex Last Longer")
  })
})

function varyHeader(headers: Record<string, string>) {
  return Object.keys(headers).find((header) => header.toLowerCase() === "vary") || "vary"
}
