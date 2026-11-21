import { HomeClient } from "@/components/HomeClient";
import { getLandingFaqs } from "@/lib/landingFaq";
import { IS_PAYMENT_GATEWAY_LIVE, PRO_PRICE_USD } from "@/lib/lemonSqueezyConfig";

const BASE_URL = "https://winstash.net";

export default function HomePage() {
  const faqs = getLandingFaqs(IS_PAYMENT_GATEWAY_LIVE);

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        name: "WinStash",
        url: BASE_URL,
        logo: {
          "@type": "ImageObject",
          url: `${BASE_URL}/icon-192.png`,
        },
        contactPoint: {
          "@type": "ContactPoint",
          email: "thestudioplus26@gmail.com",
          contactType: "customer support",
        },
      },
      {
        "@type": "WebSite",
        name: "WinStash",
        url: BASE_URL,
      },
      {
        "@type": "SoftwareApplication",
        name: "WinStash",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web, Chrome",
        url: BASE_URL,
        image: `${BASE_URL}/og-image.png`,
        description:
          "Turn rough work notes into a brag sheet, weekly updates, and STAR stories for your review. Only what you wrote, nothing made up. Free to start.",
        offers: [
          {
            "@type": "Offer",
            name: "Free Plan",
            price: "0",
            priceCurrency: "USD",
            availability: "https://schema.org/InStock",
            url: BASE_URL,
          },
          {
            "@type": "Offer",
            name: "Pro Plan",
            description: "$5.99/mo + tax",
            price: String(PRO_PRICE_USD),
            priceCurrency: "USD",
            priceSpecification: {
              "@type": "UnitPriceSpecification",
              price: String(PRO_PRICE_USD),
              priceCurrency: "USD",
              valueAddedTaxIncluded: false,
              referenceQuantity: {
                "@type": "QuantitativeValue",
                value: 1,
                unitCode: "MON",
              },
            },
            availability: IS_PAYMENT_GATEWAY_LIVE
              ? "https://schema.org/InStock"
              : "https://schema.org/PreOrder",
            url: `${BASE_URL}/pricing`,
          },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: faqs.map((faq) => ({
          "@type": "Question",
          name: faq.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.a,
          },
        })),
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomeClient />
    </>
  );
}
