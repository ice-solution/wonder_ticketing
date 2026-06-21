import { useEffect } from "react";

export function TrackingPixels({
  metaPixelId,
  googleAnalyticsId,
}: {
  metaPixelId?: string | null;
  googleAnalyticsId?: string | null;
}) {
  useEffect(() => {
    if (metaPixelId && !document.getElementById("meta-pixel")) {
      const s = document.createElement("script");
      s.id = "meta-pixel";
      s.innerHTML = `
        !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
        n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');
        fbq('init', '${metaPixelId}');
        fbq('track', 'PageView');
      `;
      document.head.appendChild(s);
    }
  }, [metaPixelId]);

  useEffect(() => {
    if (googleAnalyticsId && !document.getElementById("ga-script")) {
      const s = document.createElement("script");
      s.id = "ga-script";
      s.async = true;
      s.src = `https://www.googletagmanager.com/gtag/js?id=${googleAnalyticsId}`;
      document.head.appendChild(s);
      const inline = document.createElement("script");
      inline.innerHTML = `
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', '${googleAnalyticsId}');
      `;
      document.head.appendChild(inline);
    }
  }, [googleAnalyticsId]);

  return null;
}
