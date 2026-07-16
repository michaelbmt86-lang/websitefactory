import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata = {
  title: "Terms & Conditions | BioPak Australia",
  description:
    "Read BioPak's Terms & Conditions governing the use of our website, products, and services.",
};

const sections = [
  {
    title: "1. Acceptance of Terms",
    content: `By accessing and using the BioPak website (www.biopak.com) and our services, you agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our website or services.

These terms apply to all visitors, users, and customers. We reserve the right to update these terms at any time, and continued use of our website constitutes acceptance of any changes.`,
  },
  {
    title: "2. Use of Website",
    content: `You agree to use our website only for lawful purposes and in accordance with these Terms. You must not:

• Use the website in any way that violates applicable laws or regulations
• Attempt to gain unauthorised access to any part of the website
• Use automated systems or software to extract data from the website without written consent
• Interfere with or disrupt the website's functionality
• Reproduce, duplicate, or resell any part of the website without our written permission

All content on this website, including text, images, logos, and graphics, is the property of BioPak and is protected by copyright law.`,
  },
  {
    title: "3. Products and Orders",
    content: `All products displayed on our website are subject to availability. We reserve the right to discontinue any product at any time without notice.

When you place an order, it constitutes an offer to purchase. We reserve the right to accept or decline any order at our sole discretion. Orders are not confirmed until you receive an order confirmation email.

Product images are for illustration purposes only. Actual products may vary in colour or appearance from what is shown on screen.`,
  },
  {
    title: "4. Pricing and Payment",
    content: `All prices listed on our website are in Australian Dollars (AUD) and include GST unless otherwise stated. We reserve the right to change prices without notice.

Payment must be received in full before order dispatch. We accept payment via credit card, debit card, and other methods displayed at checkout.

In the event of a pricing error, we reserve the right to cancel the order and issue a full refund.`,
  },
  {
    title: "5. Shipping and Delivery",
    content: `We aim to dispatch orders within the timeframe specified at checkout. Delivery times are estimates and not guaranteed. We are not responsible for delays caused by shipping carriers or circumstances beyond our control.

Risk of loss and title for products pass to you upon delivery to the shipping carrier. Please inspect your order upon delivery and report any damage within 48 hours.

Refer to our Delivery & Returns Policy for full details.`,
  },
  {
    title: "6. Intellectual Property",
    content: `All content on this website — including but not limited to text, graphics, logos, images, product designs, and software — is the property of BioPak Pty Ltd and is protected by Australian and international copyright, trademark, and other intellectual property laws.

You may not reproduce, distribute, modify, or create derivative works from any content without our prior written consent. BioPak, the BioPak logo, and all related marks are registered trademarks of BioPak Pty Ltd.`,
  },
  {
    title: "7. Limitation of Liability",
    content: `To the maximum extent permitted by law, BioPak shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from or related to your use of our website or products.

Our total liability for any claim arising from a product purchased through our website shall not exceed the purchase price of that product.

Nothing in these terms excludes or limits our liability for any liability that cannot be excluded under Australian Consumer Law.`,
  },
  {
    title: "8. Governing Law",
    content: `These Terms and Conditions are governed by and construed in accordance with the laws of New South Wales, Australia. Any disputes arising from these terms shall be subject to the exclusive jurisdiction of the courts of New South Wales.

If any provision of these terms is found to be invalid or unenforceable, the remaining provisions shall continue in full force and effect.`,
  },
];

export default function TermsPage() {
  return (
    <>
      <SiteHeader />
      <main>
        {/* Page Header */}
        <section className="bg-[#f8f9fa] px-4 py-16 md:py-20">
          <div className="mx-auto max-w-[1280px] text-center">
            <h1 className="mb-4 text-3xl font-extrabold text-[#252525] md:text-4xl lg:text-5xl">
              Terms &amp; Conditions
            </h1>
            <p className="text-sm text-[#52525C]">
              Last updated: January 1, 2025
            </p>
          </div>
        </section>

        {/* Content */}
        <section className="px-4 py-12 md:py-16">
          <div className="mx-auto max-w-3xl">
            <p className="mb-8 text-base leading-relaxed text-[#52525C]">
              Welcome to BioPak. These Terms and Conditions govern your use of
              our website and the purchase of our products. Please read them
              carefully before placing an order.
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
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
