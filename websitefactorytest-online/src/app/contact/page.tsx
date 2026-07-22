import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { getSettings, getNavigation } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const settings = getSettings();
  const siteName = settings.site_name || process.env.SITE_NAME || "";
  return {
    title: `Contact${siteName ? ` | ${siteName}` : ""}`,
    description: `Get in touch with us.`,
  };
}

export default function ContactPage() {
  const settings = getSettings();
  const navItems = getNavigation().map((item) => ({
    label: item.label,
    href: item.href,
  }));

  const contactDetails = [
    settings.phone ? { label: "Phone", value: settings.phone, href: `tel:${settings.phone.replace(/\s/g, "")}` } : null,
    settings.email ? { label: "Email", value: settings.email, href: `mailto:${settings.email}` } : null,
    settings.address ? { label: "Address", value: settings.address, href: null } : null,
  ].filter(Boolean) as { label: string; value: string; href: string | null }[];

  return (
    <>
      <SiteHeader navItems={navItems} logo={settings.logo} />
      <main>
        <section className="relative flex min-h-[360px] items-center bg-[#007A55] px-4 py-20 md:min-h-[420px]">
          <div className="mx-auto max-w-[1280px] text-center">
            <h1 className="mb-4 text-4xl font-extrabold text-white md:text-5xl lg:text-6xl">
              Contact Us
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-white/90 md:text-xl">
              We&apos;d Love to Hear From You
            </p>
          </div>
        </section>

        <section className="px-4 py-16 md:py-20">
          <div className="mx-auto max-w-[1280px]">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_400px]">
              <div>
                <h2 className="mb-6 text-2xl font-bold text-[#252525]">
                  Send Us a Message
                </h2>
                <form className="space-y-6" action="/api/pages" method="POST">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label htmlFor="name" className="mb-2 block text-sm font-medium text-[#252525]">
                        Full Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        required
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-[#252525] transition-colors focus:border-[#007A55] focus:outline-none focus:ring-2 focus:ring-[#007A55]/20"
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="mb-2 block text-sm font-medium text-[#252525]">
                        Email Address
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        required
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-[#252525] transition-colors focus:border-[#007A55] focus:outline-none focus:ring-2 focus:ring-[#007A55]/20"
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <label htmlFor="phone" className="mb-2 block text-sm font-medium text-[#252525]">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-[#252525] transition-colors focus:border-[#007A55] focus:outline-none focus:ring-2 focus:ring-[#007A55]/20"
                        placeholder="Your phone number"
                      />
                    </div>
                    <div>
                      <label htmlFor="subject" className="mb-2 block text-sm font-medium text-[#252525]">
                        Subject
                      </label>
                      <select
                        id="subject"
                        name="subject"
                        required
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-[#252525] transition-colors focus:border-[#007A55] focus:outline-none focus:ring-2 focus:ring-[#007A55]/20"
                      >
                        <option value="">Select a subject</option>
                        <option value="general">General Enquiry</option>
                        <option value="quote">Request a Quote</option>
                        <option value="custom">Custom Order</option>
                        <option value="support">Order Support</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="message" className="mb-2 block text-sm font-medium text-[#252525]">
                      Message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={5}
                      required
                      className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-sm text-[#252525] transition-colors focus:border-[#007A55] focus:outline-none focus:ring-2 focus:ring-[#007A55]/20"
                      placeholder="How can we help?"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full rounded-lg bg-[#007A55] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#006145] sm:w-auto"
                  >
                    Send Message
                  </button>
                </form>
              </div>

              <div className="space-y-8">
                <div>
                  <h2 className="mb-6 text-2xl font-bold text-[#252525]">
                    Get in Touch
                  </h2>
                  <div className="space-y-4">
                    {contactDetails.map((detail) => (
                      <div
                        key={detail.label}
                        className="flex items-start gap-4"
                      >
                        <div>
                          <div className="text-sm font-medium text-[#252525]">
                            {detail.label}
                          </div>
                          {detail.href ? (
                            <a
                              href={detail.href}
                              className="text-sm text-[#52525C] transition-colors hover:text-[#007A55]"
                            >
                              {detail.value}
                            </a>
                          ) : (
                            <div className="text-sm text-[#52525C]">
                              {detail.value}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
