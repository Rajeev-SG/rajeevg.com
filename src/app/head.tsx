export default function Head() {
  const gtmOrigin =
    process.env.NEXT_PUBLIC_GTM_SCRIPT_ORIGIN || "https://www.googletagmanager.com"
  const isAbsoluteOrigin = /^https?:\/\//.test(gtmOrigin)

  return (
    <>
      {isAbsoluteOrigin ? (
        <>
          <link rel="preconnect" href={gtmOrigin} crossOrigin="anonymous" />
          <link rel="dns-prefetch" href={gtmOrigin} />
        </>
      ) : null}
      <link rel="preconnect" href="https://www.google-analytics.com" crossOrigin="anonymous" />
      <link rel="dns-prefetch" href="https://www.google-analytics.com" />
    </>
  )
}
