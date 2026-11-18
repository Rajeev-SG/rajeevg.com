import type { Diagram } from "./feature-visuals"

// Editorial interpretations of the cited platform documentation.
export const diagrams: Diagram[] = [
  {
    kind: "scope",
    title: "Where Performance Max can deliver",
    description: "Audience suggestions and search-query exclusions act at different points. A suggestion can expand beyond its input, while query exclusions remove eligible Search and Shopping traffic.",
    columns: ["You configure", "Where it applies", "Effect on delivery"],
    rows: [
      { features: ["ga.performance-max-campaigns"], cells: ["Conversion goals and creative", "One goal-based campaign", "Google can allocate delivery across its inventory"] },
      { features: ["ga.pmax-audience-signals"], cells: ["Optional audience signal", "Asset group", "Google can also reach likely converters outside the signal"] },
      { features: ["ga.pmax-negative-keywords"], cells: ["Negative keywords", "Search and Shopping inventory", "Queries matching an exclusion become ineligible"] },
      { features: ["ga.brand-exclusions"], cells: ["Excluded brand list", "Campaign-level brand settings", "Queries tied to excluded brands are filtered"] },
    ],
    sources: [
      { label: "About Performance Max campaigns", url: "https://support.google.com/google-ads/answer/10724817?hl=en" },
      { label: "About audience signals for Performance Max campaigns", url: "https://support.google.com/google-ads/answer/14530785?hl=en" },
      { label: "Negative keywords in Performance Max campaigns", url: "https://support.google.com/google-ads/answer/15726455?hl=en" },
    ],
  },
  {
    kind: "scope",
    title: "The brand list acts as a query rule",
    description: "The same idea of a named brand list can be used at two different boundaries. Check which campaign owns the rule before configuring it.",
    columns: ["Setting", "Where it applies", "Which queries pass"],
    rows: [
      { features: ["ga.brand-inclusions"], cells: ["Brand inclusions", "Search campaign", "Queries associated with a listed brand"] },
      { features: ["ga.brand-exclusions"], cells: ["Brand exclusions", "Performance Max campaign", "Queries involving an excluded brand are filtered"] },
    ],
    sources: [
      { label: "About brand settings for Search and Performance Max", url: "https://support.google.com/google-ads/answer/13721847?hl=en" },
      { label: "About Performance Max campaigns", url: "https://support.google.com/google-ads/answer/10724817?hl=en" },
    ],
  },
  {
    kind: "scope",
    title: "Channel controls sit at ad group level",
    description: "In Demand Gen, separate ad groups can use separate channel selections. Choose Shorts on the ad group intended for vertical delivery.",
    columns: ["You choose", "Scope", "Eligible surfaces"],
    rows: [
      { features: ["ga.demand-gen-channel-controls"], cells: ["All Google channels", "One Demand Gen ad group", "Available YouTube, Discover, Gmail, Maps and Display inventory"] },
      { features: ["ga.demand-gen-channel-controls"], cells: ["Select channels manually", "One Demand Gen ad group", "Selected channels compatible with the ad and audience"] },
      { features: ["ga.youtube-shorts-placements"], cells: ["Select YouTube Shorts", "One Demand Gen ad group", "The Shorts placement within YouTube"] },
    ],
    sources: [
      { label: "Demand Gen channel controls", url: "https://support.google.com/google-ads/answer/15973205?hl=en" },
    ],
  },
  {
    kind: "flow",
    title: "What Google does with first-party data",
    description: "Customer Match builds an audience. Enhanced conversions adds a match signal to a website conversion that is already being measured.",
    columns: ["Business input", "Google matches", "Used for"],
    rows: [
      { features: ["ga.customer-match"], cells: ["Uploaded customer list", "Records to signed-in Google users", "An audience for eligible Google inventory"] },
      { features: ["ga.enhanced-conversions-web"], cells: ["Website conversion with first-party data", "Hashed data to signed-in user information", "More complete measurement of the website conversion"] },
    ],
    sources: [
      { label: "About Customer Match", url: "https://support.google.com/google-ads/answer/6379332?hl=en" },
      { label: "About enhanced conversions for web", url: "https://support.google.com/google-ads/answer/9888656?hl=en" },
    ],
  },
  {
    kind: "comparison",
    title: "From audience boundaries to audience suggestions",
    description: "Google is rolling out the suggested-audience behaviour for Demand Gen Lookalike segments in phases during 2026.",
    columns: ["Behaviour", "What you configure", "Potential reach"],
    rows: [
      { features: ["ga.lookalike-segments"], cells: ["Similarity threshold", "A seed list and a similarity range", "People within the selected range"] },
      { features: ["ga.lookalike-segments"], cells: ["Audience suggestion", "A seed list that informs optimisation", "Likely converters can include people beyond the suggested audience"] },
    ],
    sources: [
      { label: "Use Lookalike segments to grow your audience", url: "https://support.google.com/google-ads/answer/13541369?hl=en" },
    ],
  },
  {
    kind: "flow",
    title: "Credit and bidding are two different decisions",
    description: "Credit is assigned on a conversion action. A Shopping bid strategy then uses conversion value to decide what to bid.",
    columns: ["Your setting", "What Google processes", "Outcome"],
    rows: [
      { features: ["ga.attribution-model-setting"], cells: ["Model on one conversion action", "Eligible ad interactions that preceded that action", "Conversion credit according to the chosen model"] },
      { features: ["ga.target-roas-shopping"], cells: ["Target return on ad spend", "Predicted conversion value in each auction", "Individual bids aimed at the average return target"] },
    ],
    sources: [
      { label: "About attribution models", url: "https://support.google.com/google-ads/answer/6259715?hl=en" },
      { label: "About automated bidding for Shopping campaigns", url: "https://support.google.com/google-ads/answer/6309029?hl=en" },
    ],
  },
  {
    kind: "scope",
    title: "Content suitability has its own boundary",
    description: "One account setting applies to supported content inventory. Search-query controls operate at a separate boundary.",
    columns: ["Setting", "Scope", "What it changes"],
    rows: [
      { features: ["ga.content-suitability-in-performance-max"], cells: ["Inventory type", "Google Ads account", "Suitability of surrounding content on YouTube, Display and Google Video Partners"] },
      { features: ["ga.content-suitability-in-performance-max"], cells: ["Maximum, Moderate or Limited", "Choice of inventory tier", "How much sensitive content is eligible under the selected tier"] },
    ],
    sources: [
      { label: "How to use brand suitability features in Performance Max", url: "https://support.google.com/google-ads/answer/13607727?hl=en" },
    ],
  },
  {
    kind: "flow",
    title: "From first-party activity to a Meta audience",
    description: "The data source determines what qualifies a person for inclusion. Once the audience exists, you can use it when setting an ad set audience.",
    columns: ["Where the signal starts", "How the list is built", "What you can use"],
    rows: [
      { features: ["meta.custom-audiences", "meta.customer-list-custom-audiences"], cells: ["Customer records", "Upload identifiers and Meta matches accounts", "A customer list Custom Audience"] },
      { features: ["meta.custom-audiences", "meta.website-custom-audience"], cells: ["Website visits or actions", "Meta Pixel records site activity", "A website Custom Audience"] },
      { features: ["meta.custom-audiences", "meta.app-activity-custom-audiences"], cells: ["App opens or purchases", "The app sends events to Meta", "An app activity Custom Audience"] },
      { features: ["meta.custom-audiences", "meta.engagement-custom-audiences"], cells: ["Video, form or Page interactions", "Meta uses engagement on its own surfaces", "An engagement Custom Audience"] },
    ],
    sources: [
      { label: "About custom audiences", url: "https://www.facebook.com/business/help/744354708981227" },
      { label: "Create a customer list custom audience", url: "https://www.facebook.com/business/help/170456843145568" },
      { label: "About Website Custom Audiences", url: "https://www.facebook.com/business/help/610516375684216" },
    ],
  },
  {
    kind: "flow",
    title: "How a seed becomes a new audience",
    description: "The seed carries the characteristics Meta uses for similarity. In a value-based setup, the source also tells Meta which customers are worth more to your business.",
    columns: ["Your source", "What Meta uses", "Audience built"],
    rows: [
      { features: ["meta.lookalike-audiences"], cells: ["Source Custom Audience", "Shared characteristics", "People similar to the source audience"] },
      { features: ["meta.value-based-lookalike-audiences"], cells: ["Source with customer values", "Similarity informed by the value column", "People similar to valuable customers"] },
    ],
    sources: [
      { label: "About Lookalike Audiences", url: "https://www.facebook.com/business/help/164749007013531" },
    ],
  },
  {
    kind: "comparison",
    title: "Three bidding strategies, three kinds of constraint",
    description: "An auction-bid ceiling operates at a different level from an average cost goal. Compare what each strategy asks Meta to optimise around.",
    columns: ["Strategy", "Amount you set", "How Meta bids"],
    rows: [
      { features: ["meta.lowest-cost-bidding"], cells: ["Highest volume", "Budget", "Seeks the most results it can get for the budget"] },
      { features: ["meta.cost-cap"], cells: ["Cost cap", "Target average cost per optimisation event", "Can bid above or below the input to manage average costs"] },
      { features: ["meta.bid-cap"], cells: ["Bid cap", "Maximum auction bid", "Bids up to the cap; average cost per result may vary"] },
    ],
    sources: [
      { label: "Ad Campaign bid strategies", url: "https://developers.facebook.com/docs/graph-api/reference/adcampaigngroup/" },
    ],
  },
  {
    kind: "flow",
    title: "A campaign budget can move between ad sets",
    description: "Each ad set remains under the shared campaign budget. Allocation can change as Meta finds different opportunities.",
    columns: ["Funding setup", "Decision", "Where the money goes"],
    rows: [
      { features: ["meta.campaign-budget"], cells: ["One campaign budget", "Meta assigns spend across the campaign", "Ad sets may receive different shares"] },
      { features: ["meta.campaign-budget"], cells: ["Individual ad set budgets", "You fund each ad set separately", "Each ad set works within its own budget"] },
    ],
    sources: [
      { label: "About Advantage campaign budget", url: "https://www.facebook.com/business/help/153514848493595" },
    ],
  },
  {
    kind: "flow",
    title: "The objective leads to a delivery goal",
    description: "The objective is chosen first. The destination or performance goal you can select next depends on the campaign setup.",
    columns: ["Campaign objective", "Ad set decision", "Example delivery goal"],
    rows: [
      { features: ["meta.awareness-objective"], cells: ["Awareness", "Pick an eligible performance goal", "Reach or recall"] },
      { features: ["meta.traffic-objective", "meta.conversion-location"], cells: ["Traffic", "Choose an eligible destination", "Link clicks or landing-page views"] },
      { features: ["meta.engagement-objective", "meta.conversion-location"], cells: ["Engagement", "Choose where the interaction takes place", "Ad engagement or messaging"] },
      { features: ["meta.leads-objective", "meta.conversion-location"], cells: ["Leads", "Choose where the lead is captured", "Leads from a form or other supported location"] },
      { features: ["meta.sales-objective", "meta.conversion-location"], cells: ["Sales", "Choose a conversion location and event", "Purchase-type actions at the chosen destination"] },
    ],
    sources: [
      { label: "Create ad campaigns in Meta Ads Manager", url: "https://www.facebook.com/business/help/621956575422138" },
      { label: "Image ad specifications", url: "https://www.facebook.com/business/ads-guide/update/image" },
      { label: "How to choose an ad objective in Meta Ads Manager", url: "https://www.facebook.com/business/help/1438417719786914" },
    ],
  },
  {
    kind: "flow",
    title: "Who picks the placement?",
    description: "Your choice changes who selects the placements. With Advantage+ placements, Meta can optimise delivery across the placements the ad is eligible for.",
    columns: ["Ad set choice", "Who selects", "Delivery"],
    rows: [
      { features: ["meta.advantage-plus-placements"], cells: ["Advantage+ placements", "Meta picks from eligible placements", "Meta can shift delivery across placements"] },
      { features: [], cells: ["Manual placements", "You pick from eligible placements", "Meta delivers within your selection"] },
    ],
    sources: [
      { label: "About Advantage+ placements", url: "https://www.facebook.com/business/help/437348354643456" },
    ],
  },
  {
    kind: "scope",
    title: "Four places an ad can appear on Meta",
    description: "These are delivery surfaces. The same campaign may be eligible for several, depending on its setup and creative.",
    columns: ["Placement", "Surrounding experience", "Where the ad appears"],
    rows: [
      { features: ["meta.facebook-feed-placement"], cells: ["Facebook Feed", "The Facebook home stream", "Within the post feed"] },
      { features: ["meta.instagram-feed-placement"], cells: ["Instagram Feed", "The Instagram home stream", "Among photos and videos"] },
      { features: ["meta.instagram-reels-placement"], cells: ["Instagram Reels", "The vertically scrolling Reels viewer", "Between Reels"] },
      { features: ["meta.instagram-stories-placement"], cells: ["Instagram Stories", "The full-screen Stories viewer", "Between Stories"] },
    ],
    sources: [
      { label: "Image ad specifications", url: "https://www.facebook.com/business/ads-guide/update/image" },
      { label: "About ads on Reels", url: "https://www.facebook.com/business/help/437348354643456" },
      { label: "Video ad specifications", url: "https://www.facebook.com/business/ads-guide/update/video" },
      { label: "Create Instagram Reels ads", url: "https://www.facebook.com/business/help/4023434621109377" },
    ],
  },
  {
    kind: "scope",
    title: "Suitability settings act on different surfaces",
    description: "Inventory filters address the surrounding content. Publisher exclusions address who published it. Check applicability for the surface you plan to buy.",
    columns: ["Control", "Applicable example", "What it filters"],
    rows: [
      { features: ["meta.inventory-filter-for-feed-ads"], cells: ["Feed inventory filter", "Facebook and Instagram Feed, Reels feed and Threads feed", "Suitability of adjacent organic content"] },
      { features: ["meta.inventory-filter-for-in-content-ads"], cells: ["In-content inventory filter", "Facebook in-stream Reels and Facebook Reels", "Suitability of the surrounding inventory"] },
      { features: ["meta.publisher-block-lists"], cells: ["Publisher block list", "Supported Facebook Reel in-stream inventory", "Content from named publishers"] },
      { features: ["meta.reels-brand-safety-tools"], cells: ["Reels suitability controls", "Instagram Reels where supported", "Exposure using the available filters or exclusions"] },
    ],
    sources: [
      { label: "About inventory filter", url: "https://www.facebook.com/business/help/3001448133206080" },
      { label: "About Facebook in-stream ads for Reels", url: "https://www.facebook.com/business/help/902459833240201" },
      { label: "About ads on Instagram Reels", url: "https://www.facebook.com/business/help/128078290241927" },
    ],
  },
  {
    kind: "scope",
    title: "Teen eligibility changes the targeting controls",
    description: "The platform applies the restrictions when a campaign can reach teens. The age boundary varies by market.",
    columns: ["Audience context", "Who applies the boundary", "What the advertiser can specify"],
    rows: [
      { features: ["meta.teen-targeting-restrictions"], cells: ["Delivery can reach teens", "Meta applies youth advertising restrictions", "Age and location are the permitted targeting inputs for teen delivery"] },
    ],
    sources: [
      { label: "Advertising options to reach teens", url: "https://www.facebook.com/business/help/229435355723442" },
    ],
  },
  {
    kind: "scope",
    title: "How Pinterest routes Browse and Search",
    description: "The choice is made on the ad group. Related Pins can be eligible under both placements.",
    columns: ["Ad group choice", "Main context", "Additional eligible context"],
    rows: [
      { features: ["pin.browse-placement"], cells: ["Browse", "Pinterest home feed", "Related Pins"] },
      { features: ["pin.search-placement"], cells: ["Search", "Pinterest search results", "Related Pins"] },
      { features: ["pin.browse-placement", "pin.search-placement"], cells: ["All", "Home feed and search results", "Related Pins"] },
    ],
    sources: [
      { label: "Ad placements", url: "https://help.pinterest.com/en-gb/business/article/placement" },
    ],
  },
  {
    kind: "scope",
    title: "Two controls evaluate different inputs",
    description: "A keyword controls how a search can match a promoted Pin. A suitability setting concerns the inventory near the ad.",
    columns: ["Control", "Scope", "What it evaluates"],
    rows: [
      { features: ["pin.keyword-targeting"], cells: ["Ad group keywords", "Advertiser-selected keywords and match types", "Whether a user’s search matches the keyword rule"] },
      { features: ["pin.inventory-filters"], cells: ["Inventory filter", "Brand safety settings in Ads Manager", "The suitability of content around eligible ads"] },
    ],
    sources: [
      { label: "Keyword targeting", url: "https://help.pinterest.com/en-gb/business/article/keyword-targeting" },
      { label: "Brand safety on Pinterest", url: "https://business.pinterest.com/en-gb/brand-safety/" },
    ],
  },
  {
    kind: "flow",
    title: "How Pinterest connects a website event to ad activity",
    description: "A tag captures the event. Enhanced match adds a hashed identifier to help connect the event to a Pinterest account when a cookie is unavailable.",
    columns: ["Your website", "Data sent to Pinterest", "Result"],
    rows: [
      { features: ["pin.pinterest-tag"], cells: ["A page visit or configured event", "Pinterest Tag records the activity", "Event can contribute to reporting and audience building"] },
      { features: ["pin.enhanced-match"], cells: ["An event with a usable email", "The tag sends the hashed email for matching", "Pinterest can match events without its cookie"] },
    ],
    sources: [
      { label: "Install the Pinterest tag", url: "https://help.pinterest.com/en-gb/business/article/install-the-pinterest-tag" },
      { label: "Enable optional enhanced match", url: "https://help.pinterest.com/en/business/article/enhanced-match" },
    ],
  },
  {
    kind: "flow",
    title: "How a viewed product can return as an ad",
    description: "The product the shopper engaged with can be the one shown again, or it can inform the selection of a similar item from the catalogue.",
    columns: ["Shopper action", "Catalogue selection", "Possible ad"],
    note: "Illustrative product photography generated with Nano Banana 2 via OpenRouter.",
    rows: [
      { features: ["pin.dynamic-retargeting"], cells: ["View or basket a blue kettle", "Match the exact product", "Show the same blue kettle"], outputImage: "retargeting-blue.webp" },
      { features: ["pin.dynamic-retargeting"], cells: ["View or basket a blue kettle", "Find a similar product", "Show a similar green kettle"], outputImage: "retargeting-green.webp" },
    ],
    sources: [
      { label: "Set up dynamic retargeting", url: "https://help.pinterest.com/en-gb/business/article/set-up-dynamic-retargeting" },
    ],
  },
  {
    kind: "flow",
    title: "Pinterest separates the campaign goal from creative automation",
    description: "A lead objective tells Pinterest what outcome to work toward. Performance+ creative offers separate image and creative options for Sales.",
    columns: ["Campaign objective", "Setup", "What the setting affects"],
    rows: [
      { features: ["pin.leads-objective"], cells: ["Leads", "Choose the non-transactional event to optimise for", "Delivery towards sign-ups or other lead actions"] },
      { features: ["pin.performance-plus-campaigns"], cells: ["Consideration, Lead or Sales", "Enable the available Performance+ campaign setup", "Pinterest automates eligible parts of setup and delivery"] },
      { features: ["pin.performance-plus-creative"], cells: ["Sales", "Enable individual creative features, such as resizing or backgrounds", "Pinterest can make variations for eligible ads"] },
    ],
    sources: [
      { label: "Simplified objectives", url: "https://help.pinterest.com/en-gb/business/article/simplified-objectives" },
      { label: "Pinterest Performance+", url: "https://help.pinterest.com/en-gb/business/article/pinterest-performance-plus" },
    ],
  },
  {
    kind: "flow",
    title: "Two routes onto a TikTok search results page",
    description: "A dedicated campaign gets its keywords from the advertiser. Automatic Search Placement can reuse eligible creative and makes its own query matches.",
    columns: ["Campaign path", "Who selects keywords", "Where it can deliver"],
    rows: [
      { features: ["tt.search-ads-campaign", "tt.broad-match"], cells: ["Dedicated Search Ads Campaign", "Advertiser supplies keywords and chooses match types", "TikTok search results"] },
      { features: ["tt.automatic-search-placement"], cells: ["Automatic Search Placement", "TikTok matches existing eligible ads to queries", "Search results as an additional placement"] },
      { features: ["tt.broad-match"], cells: ["Broad match in Search Ads", "TikTok can match searches related to the chosen keyword", "Wider eligible query set than narrower match types"] },
    ],
    sources: [
      { label: "Set up a Search Ads Campaign", url: "https://ads.tiktok.com/help/article/how-to-set-up-a-search-ads-campaign-in-tiktok-ads-manager?lang=en" },
      { label: "Search Ads optimisation", url: "https://ads.tiktok.com/resources/help/article/search-ads-optimization?lang=en" },
      { label: "Automatic Search Placement", url: "https://ads.tiktok.com/help/article/faqs-for-automatic-search-placement?lang=en" },
    ],
  },
  {
    kind: "flow",
    title: "Smart+ changes the parts of delivery you hand to TikTok",
    description: "Placement, audience suggestions and the optimisation goal are separate inputs in a Smart+ build.",
    columns: ["Ad group or campaign input", "What TikTok can decide", "Effect"],
    rows: [
      { features: ["tt.automatic-placement"], cells: ["Automatic placement", "Select eligible inventory", "Delivery can move among compatible placements"] },
      { features: ["tt.pangle-placement"], cells: ["Smart+ Web in a Pangle market", "TikTok can select Pangle with automatic placement", "Delivery can reach eligible partner apps"] },
      { features: ["tt.smart-plus-audience-suggestions"], cells: ["Suggested interests or audiences", "Find likely responders and expand beyond suggestions as applicable", "Suggestions guide the search for an audience"] },
      { features: ["tt.smart-plus-traffic-campaigns"], cells: ["Traffic objective and destination", "Optimise toward the selected traffic goal", "Delivery works toward traffic to the destination"] },
    ],
    sources: [
      { label: "About upgrades to Smart+", url: "https://ads.tiktok.com/resources/help/article/about-updates-to-smart-plus?lang=en" },
      { label: "About Smart+ Web Campaigns", url: "https://ads.tiktok.com/resources/help/article/about-smart-plus-web-campaigns?lang=en" },
      { label: "Upgraded Smart+ targeting", url: "https://ads.tiktok.com/resources/help/article/about-targeting-for-your-upgraded-smart-experience" },
      { label: "About Smart+ Traffic Campaigns", url: "https://ads.tiktok.com/resources/help/article/about-smart-plus-traffic-campaigns?lang=en" },
    ],
  },
  {
    kind: "scope",
    title: "Interest selection and expansion",
    description: "Advanced Targeting Interests apply an eligibility rule by default. Smart Targeting can expand that audience when TikTok predicts limited delivery.",
    columns: ["Setting", "Selection", "Effect on delivery"],
    rows: [
      { features: ["tt.interest-targeting"], cells: ["Select an interest", "Advanced Targeting in the ad group", "Deliver to people with higher engagement in that interest"] },
      { features: [], cells: ["Enable Smart Targeting", "TikTok evaluates delivery opportunities", "TikTok can expand beyond selected interests"] },
    ],
    sources: [
      { label: "TikTok ad targeting", url: "https://ads.tiktok.com/resources/help/article/ad-targeting?lang=en" },
    ],
  },
  {
    kind: "flow",
    title: "Matching and experiment results",
    description: "Matching connects actions to ad activity. An experiment compares how campaign strategies perform under separate test conditions.",
    columns: ["Input", "Platform process", "What you learn"],
    rows: [
      { features: ["tt.advanced-matching"], cells: ["Supported customer information and a website event", "TikTok matches identifiers captured with the event", "More website events can be attributed"] },
      { features: ["tt.split-testing-in-smart-plus-traffic"], cells: ["Split test with two configurations", "TikTok compares delivery across test groups", "Which configuration performs better on the chosen metric"] },
    ],
    sources: [
      { label: "Advanced Matching for Web", url: "https://ads.tiktok.com/help/article/advanced-matching-web?lang=en" },
      { label: "About Smart+ Traffic Campaigns", url: "https://ads.tiktok.com/resources/help/article/about-smart-plus-traffic-campaigns?lang=en" },
    ],
  },
]
