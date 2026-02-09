import React from 'react';
import { Helmet } from 'react-helmet';

interface SEOProps {
    title: string;
    description: string;
    canonicalUrl?: string;
    ogType?: 'website' | 'article';
    ogImage?: string;
    twitterCard?: 'summary' | 'summary_large_image';
    keywords?: string;
    structuredData?: Record<string, any>;
}

const SEO: React.FC<SEOProps> = ({
    title,
    description,
    canonicalUrl,
    ogType = 'website',
    ogImage = '/blog-images/home-og-image.png',
    twitterCard = 'summary_large_image',
    keywords,
    structuredData
}) => {
    const siteUrl = 'https://FIRECalculator.ai';
    const fullCanonicalUrl = canonicalUrl
        ? (canonicalUrl.startsWith('http') ? canonicalUrl : `${siteUrl}${canonicalUrl}`)
        : siteUrl;

    const fullOgImage = ogImage.startsWith('http') ? ogImage : `${siteUrl}${ogImage}`;

    return (
        <Helmet>
            {/* Basic Metadata */}
            <title>{title}</title>
            <meta name="description" content={description} />
            {keywords && <meta name="keywords" content={keywords} />}
            <link rel="canonical" href={fullCanonicalUrl} />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={ogType} />
            <meta property="og:url" content={fullCanonicalUrl} />
            <meta property="og:title" content={title} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={fullOgImage} />

            {/* Twitter */}
            <meta name="twitter:card" content={twitterCard} />
            <meta name="twitter:url" content={fullCanonicalUrl} />
            <meta name="twitter:title" content={title} />
            <meta name="twitter:description" content={description} />
            <meta name="twitter:image" content={fullOgImage} />

            {/* Structured Data */}
            {structuredData && (
                <script type="application/ld+json">
                    {JSON.stringify(structuredData)}
                </script>
            )}
        </Helmet>
    );
};

export default SEO;
