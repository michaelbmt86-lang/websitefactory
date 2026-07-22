import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getNavigation, getSettings, getPageBySlug } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const page = getPageBySlug("terms");
  const settings = getSettings();
  const siteName = settings.site_name || process.env.SITE_NAME || "";
  return {
    title: page?.meta_title || `Terms & Conditions${siteName ? ` | ${siteName}` : ""}`,
    description: page?.meta_description || `Terms and conditions governing the use of our website, products, and services.`,
  };
}

const defaultSections = [
  {
    title: "1. Acceptance of Terms",
    content: `By accessing and using our website and our services, you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our website or services.

These terms apply to all visitors, users, and customers. We reserve the right to update these terms at any time, and continued use of our website constitutes acceptance of any changes.`,
  },
  {
    title: "2. Use of Website",
    content: `You agree to use our website only for lawful purposes and in accordance with these Terms. You must not:

\u2022 Use the website in any way that violates applicable laws or regulations
\u2022 Attempt to gain unauthorised access to any part of the website
\u2022 Use automated systems or software to extract data from the website without written consent
\u2022 Interfere with or disrupt the website's functionality
\u2022 Reproduce, duplicate, or resell any part of the website without our written permission

All content on this website, including text, images, logos, and graphics, is the property of the website owner and is protected by copyright law.`,
  },
  {
    title: "3. Products and Orders",
    content: `All products displayed on our website are subject to availability. We reserve the right to discontinue any product at any time without notice.

When you place an order, it constitutes an offer to purchase. We reserve the right to accept or decline any order at our sole discretion. Orders are not confirmed until you receive an order confirmation email.

Product images are for illustration purposes only. Actual products may vary in colour or appearance from what is shown on screen.`,
  },
  {
    title: "4. Pricing and Payment",
    content: `All prices listed on our website are in the local currency and include applicable taxes unless otherwise stated. We reserve the right to change prices without notice.

Payment must be received in full before order dispatch. We accept payment via credit card, debit card, and other methods displayed at checkout.

In the event of a pricing error, we reserve the right to cancel the order and issue a full refund.`,
  },
  {
    title: "5. Shipping and Delivery",
    content: `We aim to dispatch orders within the timeframe specified at checkout. Delivery times are estimates and not guaranteed. We are not responsible for delays caused by shipping carriers or circumstances beyond our control.

Risk of loss and title for products pass to you upon delivery to the shipping carrier. Please inspect your order upon delivery and report any damage within 48 hours.`,
  },
  {
    title: "6. Intellectual Property",
    content: `All content on this website \u2014 including but not limited to text, graphics, logos, images, product designs, and software \u2014 is the property of the website owner and is protected by applicable copyright, trademark, and other intellectual property laws.

You may not reproduce, distribute, modify, or create derivative works from any content without our prior written consent.`,
  },
  {
    title: "7. Limitation of Liability",
    content: `To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from or related to your use of our website or products.

Our total liability for any claim arising from a product purchased through our website shall not exceed the purchase price of that product.`,
  },
  {
    title: "8. Governing Law",
    content: `These Terms and Conditions are governed by and construed in accordance with the applicable laws of the jurisdiction in which we operate. Any disputes arising from these terms shall be subject to the exclusive jurisdiction of the courts of that jurisdiction.

If any provision of these terms is found to be invalid or unenforceable, the remaining provisions shall continue in full force and effect.`,
  },
];

export default async function TermsPage() {
  const settings = getSettings();
  const page = getPageBySlug("terms");
  const navItems = getNavigation().map((item) => ({
    label: item.label,
    href: item.href,
  }));

  const sections = defaultSections;

  return (
    <>
      <SiteHeader navItems={navItems} logo={settings.logo} />
      <main>
        {/* Page Header */}
        <section className="bg-[#f8f9fa] px-4 py-16 md:py-20">
          <div className="mx-auto max-w-[1280px] text-center">
            <h1 className="mb-4 text-3xl font-extrabold text-[#252525] md:text-4xl lg:text-5xl">
              {page?.title || "Terms & Conditions"}
            </h1>
            <p className="text-sm text-[#52525C]">
              Last updated: January 1, 2025
            </p>
          </div>
        </section>

        {/* Content */}
        <section className="px-4 py-12 md:py-16">
          <div className="mx-auto max-w-3xl">
            {page?.content ? (
              <div
                className="prose prose-lg max-w-none"
                dangerouslySetInnerHTML={{ __html: page.content }}
              />
            ) : (
              <>
                <p className="mb-8 text-base leading-relaxed text-[#52525C]">
                  Welcome. These Terms and Conditions govern your use of our website
                  and the purchase of our products. Please read them carefully before
                  placing an order.
                </p>

                <div className="space-y-8">
                  {sections.map((section) => (
                    <div key={section.title}>
                      <h2 className="mb-4 text-xl font-bold text-[#252525]">
                        {section.title}
                      </h2>
                      <div className="whitespace-pre-line text-base leading-relaxed text-[#52525C]">
                        {section.content}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
