import type { FeatureGuide } from "./feature-pages"

const google = "https://support.google.com/google-ads/answer/14530785"
const meta = "https://www.facebook.com/business/ads/meta-advantage-plus/audience"
const tiktok = "https://ads.tiktok.com/resources/help/article/about-targeting-for-your-upgraded-smart-experience"
const pinterest = "https://help.pinterest.com/en-gb/business/article/targeting-overview"

export const pmaxAudienceSignals: FeatureGuide = {
  id: "ga.pmax-audience-signals",
  name: "Performance Max audience signals",
  vendor: "Google Ads",
  platform: "Performance Max",
  category: "Targeting",
  summary: {
    text: "Audience signals are optional suggestions you add to a Performance Max asset group to help Google’s AI find likely buyers faster. Performance Max can still show ads outside those audiences when it predicts someone is likely to convert.",
    sources: [google],
  },
  control: "signal",
  controlLabel: "Signal — guides delivery, doesn’t restrict it",
  checkedAt: "2026-11-17",
  availability: "Live · all markets where PMax runs",
  facts: [
    { label: "Set at", value: "Asset group" },
    { label: "Required?", value: "No — optional" },
    { label: "Restricts reach?", value: "No" },
    { label: "Hard limits in PMax", value: "Location, language" },
  ],
  inputs: [
    { title: "Your data", text: "Website visitors, app users, customer lists and video viewers." },
    { title: "Custom segments", text: "Search terms, similar or competitor URLs and apps that describe your buyer." },
    { title: "Google segments", text: "Affinity, in-market, life events and detailed demographics." },
    { title: "Demographics", text: "Age, gender and parental status refine the suggestion. Delivery can still go wider." },
  ],
  useCases: [
    { text: "The campaign is new or has little conversion history. Signals can help it learn faster." },
    { text: "You have useful first-party lists, such as customers or high-value visitors." },
    { text: "Different asset groups are designed for genuinely different buyers." },
  ],
  limitations: [
    { text: "You must keep ads away from an audience. Signals can’t exclude anyone." },
    { text: "You want audience reports to tell you who you targeted. Delivery goes wider." },
    { text: "You need strict audience targeting. Use a Search, Demand Gen or Display campaign that supports it." },
  ],
  steps: [
    { text: "Open the Performance Max campaign and go to Asset groups." },
    { text: "Edit the asset group and find Audiences beneath the assets." },
    { text: "Select an existing audience, or create and name one. Add your data and custom segments." },
    { text: "Optionally add Google segments and demographics, then save the audience. Repeat for each asset group." },
  ],
  kpis: [
    { title: "Time to stable CPA / ROAS", text: "May stabilise sooner if the campaign starts closer to likely converters." },
    { title: "Early-flight efficiency", text: "Useful signals can reduce the spend needed to explore during the first few weeks." },
    { title: "Reach and audience mix", text: "Expect delivery outside the signal over time. Signals place no cap on reach." },
  ],
  comparisonHeading: "Hard limits you still control",
  comparisons: [
    {
      vendor: "Meta", name: "Advantage+ audience suggestions", href: meta, match: "Same idea",
      details: { text: "Location, minimum age, language and custom-audience exclusions.", sources: [meta] },
    },
    {
      vendor: "TikTok", name: "Smart+ audience suggestions", href: tiktok, match: "Same idea",
      details: { text: "Location, minimum age, language and excluded audiences.", sources: [tiktok] },
    },
    {
      vendor: "Pinterest", name: "Performance+ targeting", href: pinterest,
      match: "Partial — expands from keywords and interests.",
      details: { text: "Supported objectives: Not documented", sources: [pinterest] },
    },
  ],
  sources: [
    { url: google, label: "Google Ads Help — About audience signals for Performance Max" },
    { url: meta, label: "Meta — Advantage+ audience" },
    { url: tiktok, label: "TikTok Ads — Targeting in the upgraded Smart+ experience" },
    { url: pinterest, label: "Pinterest Business — Targeting overview" },
  ],
}
