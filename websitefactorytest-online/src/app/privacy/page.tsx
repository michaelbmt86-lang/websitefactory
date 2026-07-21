import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export const metadata = {
  title: "Privacy Policy | BioPak Australia",
  description:
    "Read BioPak's Privacy Policy. Learn how we collect, use, and protect your personal information.",
};

const sections = [
  {
    title: "1. Information We Collect",
    content: `We collect personal information you voluntarily provide when you interact with our website, place an order, subscribe to our newsletter, or contact us. This may include:

• Name and contact details (email, phone, address)
• Company name and business information
• Payment and billing information
• Order history and preferences
• Communications you send to us

We also automatically collect certain information when you visit our website, including your IP address, browser type, operating system, referral URLs, and browsing behaviour through cookies and similar technologies.`,
  },
  {
    title: "2. How We Use Your Information",
    content: `We use the information we collect to:

• Process and fulfil your orders
• Communicate with you about your orders, products, and services
• Send you marketing communications (with your consent)
• Improve our website, products, and customer experience
• Comply with legal obligations
• Detect and prevent fraud or unauthorised access

We will not sell your personal information to third parties.`,
  },
  {
    title: "3. Data Security",
    content: `We take reasonable steps to protect your personal information from misuse, interference, loss, unauthorised access, modification, or disclosure. Our security measures include:

• Encrypted data transmission (SSL/TLS)
• Secure server infrastructure
• Access controls and authentication
• Regular security assessments

However, no method of transmission over the Internet or electronic storage is completely secure, and we cannot guarantee absolute security.`,
  },
  {
    title: "4. Cookies and Tracking Technologies",
    content: `Our website uses cookies and similar technologies to enhance your experience. Cookies are small files stored on your device that help us:

• Remember your preferences and settings
• Analyse website traffic and usage patterns
• Provide personalised content
• Support marketing and advertising efforts

You can control cookies through your browser settings. Disabling certain cookies may affect website functionality.`,
  },
  {
    title: "5. Third-Party Services",
    content: `We may use third-party service providers to assist in operating our website and conducting our business, including payment processing, shipping, analytics, and marketing. These third parties have access to personal information only to perform specific tasks on our behalf and are obligated to protect your information.

We may also share your information when required by law, to protect our rights, or in connection with a merger, acquisition, or sale of assets.`,
  },
  {
    title: "6. Your Rights",
    content: `Under the Australian Privacy Act 1988 and applicable state legislation, you have the right to:

• Access the personal information we hold about you
• Request correction of inaccurate information
• Opt out of marketing communications at any time
• Lodge a complaint with the Office of the Australian Information Commissioner (OAIC)

To exercise any of these rights, please contact us using the details below.`,
  },
  {
    title: "7. Contact Us",
    content: `If you have any questions about this Privacy Policy or our data practices, please contact us:

BioPak Pty Ltd
Email: privacy@biopak.com.au
Phone: 1300 246 725
Address: Sydney, Australia

For privacy complaints, you may also contact the Office of the Australian Information Commissioner (OAIC) at www.oaic.gov.au.`,
  },
];

export default function PrivacyPage() {
  return (
    <>
      <SiteHeader />
      <main>
        {/* Page Header */}
        <section className="bg-[#f8f9fa] px-4 py-16 md:py-20">
          <div className="mx-auto max-w-[1280px] text-center">
            <h1 className="mb-4 text-3xl font-extrabold text-[#252525] md:text-4xl lg:text-5xl">
              Privacy Policy
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
              At BioPak, we are committed to protecting your privacy. This
              Privacy Policy explains how we collect, use, disclose, and
              safeguard your personal information when you visit our website or
              use our services.
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
