/**
 * Agentic media wall: the five experiments and the 29 finished films in them.
 *
 * Every value here is transcribed from the social-influence production notes
 * (project READMEs, COMPARISON.md, RANKED-COMPARISON.md) and ffprobe output.
 * Durations are seconds, sizes are the H.264/AAC master, and `render` is the
 * measured render time recorded with each film. Nothing is derived or guessed:
 * if a field was not recorded for a film it stays absent.
 */

export type MediaGroupId = "engines" | "foss" | "series" | "explainers" | "brands"

export type MediaGroup = {
  id: MediaGroupId
  name: string
  blurb: string
  date: string
}

export type MediaItem = {
  /** Stable id; also the Cloudflare Worker asset folder name. */
  id: string
  group: MediaGroupId
  /** Rank inside the experiment; only the two ranked experiments carry one. */
  rank?: number
  title: string
  engine: string
  /** Master duration in seconds, as measured by ffprobe. */
  dur: number
  /** Master file size, as recorded with the master. */
  size: string
  render: string
  /** Agent skill or harness that produced the film, when one was recorded. */
  skill?: string
  family: string
  stack: string[]
  note: string
  fmt: string
}

export const mediaGroups: MediaGroup[] = [
  {
    id: "engines",
    name: "Programmatic engine benchmark",
    blurb:
      "Fourteen engines, one brief each: a 15–25s explainer with Kokoro narration, rendered, inspected frame by frame, refined and re-rendered.",
    date: "Oct 2026",
  },
  {
    id: "foss",
    name: "FOSS video showdown",
    blurb:
      "Six free pipelines render the same 15s script, “How AI predicts your next word”. Five finished; one stopped at partial source.",
    date: "Oct 2026",
  },
  {
    id: "series",
    name: "Read AI Better series",
    blurb: "Four reels rebuilt from saved Instagram techniques with free tools only. Nothing published.",
    date: "Nov 2026",
  },
  {
    id: "explainers",
    name: "Long-form explainers",
    blurb: "Narrated 45–90s Reels, each a full production with storyboard, creative QA and review gallery.",
    date: "Oct 2026",
  },
  {
    id: "brands",
    name: "Brand pipelines",
    blurb: "Autonomous brand accounts: brief → script → generated media → QA, with every attempt kept.",
    date: "Sep 2026",
  },
]

type EngineSeed = {
  slug: string
  rank: number
  engine: string
  topic: string
  dur: number
  size: string
  render: string
  skill?: string
  family: string
}

const engineSeeds: EngineSeed[] = [
  { slug: "motion-canvas-tokens", rank: 1, engine: "Motion Canvas 3.17.2", topic: "Tokens", dur: 24.8, size: "1.9 MB", render: "40.3s export", skill: "VideoZero skills", family: "TypeScript" },
  { slug: "revideo-next-token", rank: 2, engine: "Revideo 0.11.0", topic: "Next-token prediction", dur: 20.1, size: "7.0 MB", render: "11s, four ranges", skill: "revideo-video skill", family: "TypeScript" },
  { slug: "threejs-neural-network", rank: 3, engine: "Three.js 0.180", topic: "Neural network", dur: 23.3, size: "7.9 MB", render: "82.5s", skill: "speech + playwright", family: "WebGL" },
  { slug: "pixijs-agent-tools", rank: 4, engine: "PixiJS", topic: "Agent tools", dur: 22.2, size: "4.3 MB", render: "68.3s capture", skill: "Official PixiJS skills", family: "WebGL" },
  { slug: "manim-embeddings", rank: 5, engine: "Manim 0.22.0", topic: "Embeddings", dur: 19.8, size: "2.9 MB", render: "16.4s", skill: "manim-skill", family: "Python" },
  { slug: "mediabunny-multimodal", rank: 6, engine: "Mediabunny 1.56.1", topic: "Multimodal AI", dur: 23.3, size: "11 MB", render: "24.5s", skill: "Remotion skills", family: "TypeScript" },
  { slug: "lottie-web-hallucination", rank: 7, engine: "Lottie-web 5.13.0", topic: "Hallucination", dur: 19.3, size: "1.4 MB", render: "36.3s capture", skill: "none", family: "JSON" },
  { slug: "motionforge-temperature", rank: 8, engine: "MotionForge 1.4.0", topic: "Temperature", dur: 24.5, size: "3.9 MB", render: "130.1s", skill: "speech", family: "TypeScript" },
  { slug: "theatre-js-rag", rank: 9, engine: "Theatre.js 0.7.2", topic: "RAG", dur: 21.6, size: "7.5 MB", render: "142.9s", skill: "none", family: "TypeScript" },
  { slug: "movis-learning", rank: 10, engine: "Movis 0.7.1", topic: "Learning from mistakes", dur: 21.6, size: "1.3 MB", render: "56.7s", skill: "ffmpeg-skill", family: "Python" },
  { slug: "editly-context-window", rank: 11, engine: "Editly 0.15", topic: "Context window", dur: 23.1, size: "3.5 MB", render: "43.6s", skill: "video-editing-skill", family: "Node" },
  { slug: "ffcreator-fine-tuning", rank: 12, engine: "FFCreator 7.5.8", topic: "Fine-tuning", dur: 23.1, size: "2.6 MB", render: "5.3s", skill: "speech + web-search", family: "Node" },
  { slug: "rendiv-attention", rank: 13, engine: "Rendiv 0.2.6", topic: "Attention", dur: 24.5, size: "3.9 MB", render: "151.5s", skill: "rendiv-video", family: "React" },
  { slug: "videoflow-training-inference", rank: 14, engine: "VideoFlow 1.0.4", topic: "Training vs inference", dur: 22.5, size: "1.7 MB", render: "106.4s DAG", skill: "none", family: "Python" },
]

/** Verdict recorded for each ranked engine, by rank. */
const engineNotes: Record<number, string> = {
  1: "Best overall kinetic typography, hierarchy and transition control.",
  2: "Excellent generator-scene animation; strong probability storytelling.",
  3: "Strongest depth, perspective and signal-flow visualisation.",
  4: "Fast, crisp WebGL diagrams and animated action/result packets.",
  5: "Best mathematical explanation and measured-distance clarity.",
  6: "Strong convergence story; most controlled encode/mux path.",
  7: "Reusable motion system; clear plausible-versus-true contrast.",
  8: "Strong kinetic type and branching paths; some export friction.",
  9: "Editable keyframe timeline; slow browser capture.",
  10: "Good custom-layer animation and feedback-loop explanation.",
  11: "Reliable editorial transitions; desk/capacity metaphor.",
  12: "Fast, competent composition; less bespoke motion depth.",
  13: "Clear React frame model; screenshot capture dominated runtime.",
  14: "Distinct DAG production; more infrastructure for similar output.",
}

const engineItems: MediaItem[] = engineSeeds.map((seed) => ({
  id: `video-engines--${seed.slug}`,
  group: "engines",
  rank: seed.rank,
  title: seed.topic,
  engine: seed.engine,
  dur: seed.dur,
  size: seed.size,
  render: seed.render,
  skill: seed.skill,
  family: seed.family,
  stack: [seed.engine, "Kokoro 82M", "FFmpeg"],
  note: engineNotes[seed.rank] ?? "",
  fmt: "1080×1920",
}))

type ItemSeed = Omit<MediaItem, "fmt">

const otherItemSeeds: ItemSeed[] = [
  { id: "foss-video-showdown--f-ultimate-hybrid", group: "foss", rank: 1, title: "F · Ultimate hybrid", engine: "Blender + HyperFrames + FFmpeg", dur: 15.1, size: "10 MB", render: "FFmpeg assembly, seconds", family: "Hybrid", stack: ["Blender", "HyperFrames", "FFmpeg", "Kokoro"], note: "D’s cinematic opening and depth with E’s typography and response loop; unified grade and grain." },
  { id: "foss-video-showdown--e-hyperframes-diffusion-studio", group: "foss", rank: 2, title: "E · HyperFrames + open finishing", engine: "HyperFrames", dur: 15.2, size: "1.9 MB", render: "fast browser render", family: "HTML/GSAP", stack: ["HyperFrames", "GSAP", "FFmpeg", "Kokoro"], note: "Best pure editorial explainer; stable IDs make agent revision easiest." },
  { id: "foss-video-showdown--a-motion-canvas-theatre-pixi", group: "foss", rank: 3, title: "A · Motion Canvas + Theatre + Pixi", engine: "Motion Canvas", dur: 15.2, size: "2.0 MB", render: "1–2 min", family: "TypeScript", stack: ["Motion Canvas", "Theatre.js", "PixiJS", "Kokoro"], note: "Strongest bespoke data motion and layer separation." },
  { id: "foss-video-showdown--d-blender-natron-kdenlive", group: "foss", rank: 4, title: "D · Blender + open compositing", engine: "Blender", dur: 15.2, size: "4.6 MB", render: "~7 min", family: "3D", stack: ["Blender", "FFmpeg", "Kokoro"], note: "Best physical depth and opening type; middle less crisp." },
  { id: "foss-video-showdown--b-openmontage-hyperframes", group: "foss", rank: 5, title: "B · OpenMontage + HyperFrames", engine: "HyperFrames", dur: 15.2, size: "1.3 MB", render: "fast", family: "HTML/GSAP", stack: ["HyperFrames", "OpenMontage", "Kokoro"], note: "Good assembly-line art direction; OpenMontage runtime not locally operable." },

  { id: "instagram-derived-series--01-notebook-watermark", group: "series", title: "Watermark myth", engine: "Gemini Notebook video overview", dur: 80.9, size: "11 MB", render: "cloud, free quota", family: "Hosted", stack: ["Gemini Notebook"], note: "Free cloud export; visible branding retained." },
  { id: "instagram-derived-series--02-painted-confidence", group: "series", title: "Fluent ≠ factual", engine: "p5.js + p5.brush", dur: 17.8, size: "15 MB", render: "headless", family: "Canvas", stack: ["ClaudeAnimationBase", "p5.js", "p5.brush", "Kokoro"], note: "Uncaptioned character-animation test." },
  { id: "instagram-derived-series--03-code-not-video", group: "series", title: "No video model", engine: "MG Styles 15 canvas", dur: 19.5, size: "2.9 MB", render: "local", family: "Canvas", stack: ["mg-styles-15", "mgaudio", "Kokoro"], note: "Original Canvas animation with synthesised sound." },
  { id: "instagram-derived-series--04-open-the-source", group: "series", title: "Open the source", engine: "Motionmaxxing", dur: 19.1, size: "6.8 MB", render: "native CDP", family: "HTML/GSAP", stack: ["motionmaxxing", "GSAP", "Kokoro"], note: "Motion runtime rendered via Chrome DevTools Protocol." },

  { id: "ai-tools-2026", group: "explainers", title: "The most used AI tools of 2026", engine: "HyperFrames 0.8 + Three.js + Blender 5.2", dur: 88.9, size: "20 MB", render: "73.8s middle section, 4 workers", family: "Hybrid", stack: ["HyperFrames", "Three.js", "Blender", "Kokoro"], note: "Ranks seven assistants by worldwide visit share, Sept 2026." },
  { id: "llm-reel", group: "explainers", title: "The Next Token", engine: "Remotion", dur: 51.2, size: "9.6 MB", render: "local", family: "React", stack: ["Remotion", "FFmpeg", "Kokoro"], note: "How language models work, in 51 seconds." },
  { id: "llm-hyperframes", group: "explainers", title: "A Cup of Context", engine: "HyperFrames", dur: 45.2, size: "3.8 MB", render: "local", family: "HTML/GSAP", stack: ["HyperFrames", "GSAP", "Kokoro"], note: "The same idea, simpler: one teacup example, six calm beats." },

  { id: "gutkitchen-pipeline", group: "brands", title: "GutKitchen · pizza-bean bowl", engine: "Content Machine", dur: 31.1, size: "5.9 MB", render: "attempt 23 of 23", family: "Pipeline", stack: ["Content Machine", "LLM script", "FFmpeg"], note: "40g protein, 15g fibre; baseline for Creative Engine v2." },
  { id: "gutkitchen-cev2-new-a", group: "brands", title: "GutKitchen · Creative Engine v2, route A", engine: "OpenRouter image-to-video", dur: 8.1, size: "8.8 MB", render: "six generated shots", family: "Generative", stack: ["OpenRouter images", "OpenRouter video (I2V)", "FFmpeg"], note: "Keyframes generated, then animated; one of three route experiments." },
  { id: "ai-for-accountants-pipeline", group: "brands", title: "AI for Accountants · meeting notes to email", engine: "Content Machine", dur: 32.0, size: "5.3 MB", render: "attempt 2", family: "Pipeline", stack: ["Content Machine", "LLM script", "FFmpeg"], note: "Turn raw client notes into a follow-up email." },
]

export const mediaItems: MediaItem[] = [
  ...engineItems,
  ...otherItemSeeds.map((item) => ({ ...item, fmt: "1080×1920" })),
]

export const mediaTotals = {
  films: mediaItems.length,
  experiments: mediaGroups.length,
  /** Distinct engines and tools named by the finished films. */
  enginesAndTools: "20+",
} as const

const assetBase = "https://assets.rajeevg.com/social-influence"

export type MediaAssets = {
  poster: string
  preview: string
  contactSheet: string
  master: string
}

/** Master, preview, poster and contact sheet for one film, as served by the asset Worker. */
export function mediaAssets(id: string): MediaAssets {
  return {
    poster: `${assetBase}/${id}/poster.jpg`,
    preview: `${assetBase}/${id}/preview.mp4`,
    contactSheet: `${assetBase}/${id}/contact-sheet.jpg`,
    master: `${assetBase}/${id}/master.mp4`,
  }
}

export function countInGroup(group: MediaGroupId): number {
  return mediaItems.filter((item) => item.group === group).length
}

export function getMediaItem(id: string): MediaItem | undefined {
  return mediaItems.find((item) => item.id === id)
}

export function getMediaGroup(id: MediaGroupId): MediaGroup | undefined {
  return mediaGroups.find((group) => group.id === id)
}

/** The film shown on first load: the top-ranked engine entry. */
export const defaultMediaItemId = mediaItems[0]?.id ?? ""