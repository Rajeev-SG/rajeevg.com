import Script from "next/script"

const GTM_SCRIPT_ORIGIN = "https://www.googletagmanager.com"

export function TagManagerScript({ gtmId }: { gtmId: string }) {
  const noscriptUrl = `${GTM_SCRIPT_ORIGIN}/ns.html?id=${gtmId}`

  return (
    <>
      <Script id="google-tag-manager" strategy="afterInteractive">
        {`
          (function(w,d,s,l,i,u){
            w[l]=w[l]||[];
            w[l].push({'gtm.start': new Date().getTime(), event:'gtm.js'});
            var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),
              dl=l!='dataLayer'?'&l='+l:'';
            j.async=true;
            j.src=u + '/gtm.js?id=' + i + dl;
            f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer',${JSON.stringify(gtmId)},${JSON.stringify(GTM_SCRIPT_ORIGIN)});
        `}
      </Script>
      <noscript>
        <iframe
          src={noscriptUrl}
          height="0"
          width="0"
          style={{ display: "none", visibility: "hidden" }}
        />
      </noscript>
    </>
  )
}
