import { Helmet } from 'react-helmet-async';

export default function SEO({
  title = 'Txty - Secure Pastebin & Code Sharing Platform',
  description = 'Share code snippets, text, and collaborate with developers worldwide. Features syntax highlighting for 20+ languages, burn-after-reading, custom URLs, and advanced analytics.',
  keywords = 'pastebin, code sharing, snippet sharing, syntax highlighting, code collaboration, paste tool, developer tools, github gist alternative, text sharing, markdown editor',
  ogImage = '/og-image.png',
  ogType = 'website',
  twitterCard = 'summary_large_image',
  canonical,
  noindex = false,
  structuredData
}) {
  const siteUrl = typeof window !== 'undefined' ? window.location.origin : 'https://txty.app';
  const canonicalUrl = canonical || (typeof window !== 'undefined' ? window.location.href : siteUrl);
  const fullOgImage = ogImage.startsWith('http') ? ogImage : `${siteUrl}${ogImage}`;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{title}</title>
      <meta name="title" content={title} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullOgImage} />
      <meta property="og:site_name" content="Txty" />
      <meta property="og:locale" content="en_US" />

      {/* Twitter */}
      <meta property="twitter:card" content={twitterCard} />
      <meta property="twitter:url" content={canonicalUrl} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={fullOgImage} />
      <meta name="twitter:creator" content="@txtyapp" />

      {/* Additional SEO */}
      <meta name="author" content="Txty" />
      <meta name="language" content="English" />
      <meta name="revisit-after" content="7 days" />
      <meta name="distribution" content="web" />
      <meta name="rating" content="general" />

      {/* Mobile Optimization */}
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
      <meta name="theme-color" content="#0284c7" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      <meta name="apple-mobile-web-app-title" content="Txty" />

      {/* Favicon */}
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="manifest" href="/site.webmanifest" />

      {/* Preconnect to external domains */}
      <link rel="preconnect" href="https://www.gravatar.com" />
      <link rel="dns-prefetch" href="https://www.gravatar.com" />

      {/* Structured Data */}
      {structuredData && (
        <script type="application/ld+json">
          {JSON.stringify(structuredData)}
        </script>
      )}
    </Helmet>
  );
}

// Predefined structured data templates
export const getWebsiteStructuredData = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Txty",
  "description": "Secure Pastebin & Code Sharing Platform",
  "url": typeof window !== 'undefined' ? window.location.origin : "https://txty.app",
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": `${typeof window !== 'undefined' ? window.location.origin : "https://txty.app"}/explore?q={search_term_string}`
    },
    "query-input": "required name=search_term_string"
  }
});

export const getSoftwareApplicationStructuredData = () => ({
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Txty",
  "applicationCategory": "DeveloperApplication",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "ratingCount": "1250"
  },
  "operatingSystem": "Web",
  "description": "Modern pastebin with syntax highlighting, burn-after-reading, and advanced analytics"
});

export const getPasteStructuredData = (paste) => ({
  "@context": "https://schema.org",
  "@type": "CreativeWork",
  "headline": paste.title || "Code Snippet",
  "description": paste.content?.substring(0, 150) + "...",
  "datePublished": paste.created_at,
  "programmingLanguage": paste.language,
  "author": {
    "@type": "Person",
    "name": "Anonymous"
  },
  "interactionStatistic": [
    {
      "@type": "InteractionCounter",
      "interactionType": "https://schema.org/ViewAction",
      "userInteractionCount": paste.views || 0
    },
    {
      "@type": "InteractionCounter",
      "interactionType": "https://schema.org/LikeAction",
      "userInteractionCount": paste.likes || 0
    }
  ]
});
