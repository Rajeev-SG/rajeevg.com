export const signals = [
  { label: "Ad clicks", source: "Delivery", description: "Ad-platform traffic. A drop here can explain a downstream drop in sales." },
  { label: "Store orders", source: "Commerce", description: "Completed orders from the store’s backend. This count is independent of the ad pixel." },
  { label: "Reported conversions", source: "Attribution", description: "Conversions credited by the ad platform. This count depends on both sales and the measurement pipeline." },
] as const

export const causes = [
  "Conversion tracking failed",
  "Checkout started failing",
  "Ad delivery fell",
] as const

export const cases = [
  {
    name: "Morning report",
    time: "09:30",
    values: [
      [100, 102, 99, 101, 102, 100, 100, 101, 100],
      [100, 98, 101, 100, 99, 102, 101, 99, 101],
      [100, 100, 102, 95, 79, 69, 63, 61, 62],
    ],
    clues: [
      "Ad clicks hold steady after 09:30. Traffic is still reaching the store.",
      "Store orders hold steady. Shoppers are still completing purchases.",
      "A consent update went out at 09:30. The ad pixel stopped seeing some completed orders immediately after.",
    ],
    cause: 0,
    summary: "The sales are still there. The consent update changed which purchase events reached the ad platform.",
    action: "Audit the consent update and validate the purchase event for each consent state before changing bids.",
  },
  {
    name: "Release day",
    time: "09:00",
    values: [
      [100, 102, 101, 100, 99, 100, 98, 101, 100],
      [100, 102, 97, 84, 73, 69, 65, 62, 63],
      [100, 101, 100, 89, 77, 71, 64, 65, 62],
    ],
    clues: [
      "Traffic holds throughout the incident. The loss starts after visitors arrive.",
      "A checkout release went out at 09:00. Payment errors rise and store orders fall in the next interval.",
      "Reported conversions fall alongside store orders. Two independent systems see the same sales loss.",
    ],
    cause: 1,
    summary: "The drop is real. A checkout release increased payment errors while ad traffic held steady.",
    action: "Roll back the checkout release and verify that a test order completes end to end.",
  },
  {
    name: "Midday slide",
    time: "10:00",
    values: [
      [100, 100, 102, 101, 82, 70, 63, 60, 61],
      [100, 101, 99, 100, 100, 84, 73, 65, 63],
      [100, 102, 100, 99, 100, 99, 77, 67, 62],
    ],
    clues: [
      "A budget cap took effect at 10:00. Ad clicks fall first.",
      "Store orders fall after ad clicks. The store’s purchase completion rate holds steady.",
      "Reported conversions follow store orders with a lag. The ad platform is still recording purchases.",
    ],
    cause: 2,
    summary: "Fewer shoppers reached the store. The budget cap cut ad delivery before orders or reporting fell.",
    action: "Check whether the cap was intentional before restoring delivery or changing the campaign.",
  },
] as const

export const times = ["08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00"] as const
