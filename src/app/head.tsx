export default function Head() {
  const gtmOrigin = "https://www.googletagmanager.com"

  return (
    <>
      <link rel="preconnect" href={gtmOrigin} crossOrigin="anonymous" />
      <link rel="dns-prefetch" href={gtmOrigin} />
      <link rel="preconnect" href="https://www.google-analytics.com" crossOrigin="anonymous" />
      <link rel="dns-prefetch" href="https://www.google-analytics.com" />
    </>
  )
}
