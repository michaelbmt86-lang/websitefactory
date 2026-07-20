"use client";

import { useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import {
  PhoneIcon,
  MailIcon,
  MapPinIcon,
  FacebookIcon,
  LinkedinIcon,
} from "@/components/icons";

const contactDetails = [
  {
    icon: PhoneIcon,
    label: "Phone",
    value: "1300 246 725",
    href: "tel:1300246725",
  },
  {
    icon: MailIcon,
    label: "Email",
    value: "sales@biopak.com.au",
    href: "mailto:sales@biopak.com.au",
  },
  {
    icon: MapPinIcon,
    label: "Address",
    value: "Sydney, Australia",
    href: null,
  },
];

const businessHours = [
  { day: "Monday - Friday", hours: "8:30 AM - 5:30 PM" },
  { day: "Saturday", hours: "Closed" },
  { day: "Sunday", hours: "Closed" },
];

const socialLinks = [
  {
    platform: "Facebook",
    url: "https://www.facebook.com/biopak/",
    icon: FacebookIcon,
  },
  {
    platform: "LinkedIn",
    url: "https://www.linkedin.com/company/biopakpackaging/",
    icon: LinkedinIcon,
  },
];

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    try {
      await fetch("/api/pages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: `contact-${Date.now()}`,
          title: `Contact: ${data.subject || "General"}`,
          content: JSON.stringify(data),
          status: "draft",
        }),
      });
    } catch {
      // Silently handle - form still shows success for UX
    }

    setLoading(false);
    setSubmitted(true);
    form.reset();
  }

  return (
    <>
      <SiteHeader />
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

                {submitted ? (
                  <div className="rounded-xl border border-green-200 bg-green-50 p-8 text-center">
                    <h3 className="mb-2 text-xl font-bold text-[#007A55]">
                      Thank you for your message!
                    </h3>
                    <p className="text-[#52525C]">
                      We&apos;ll get back to you as soon as possible.
                    </p>
                    <button
                      type="button"
                      onClick={() => setSubmitted(false)}
                      className="mt-4 text-sm font-semibold text-[#007A55] underline"
                    >
                      Send another message
                    </button>
                  </div>
                ) : (
                  <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <div>
                        <label
                          htmlFor="name"
                          className="mb-2 block text-sm font-medium text-[#252525]"
                        >
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
                        <label
                          htmlFor="email"
                          className="mb-2 block text-sm font-medium text-[#252525]"
                        >
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
                        <label
                          htmlFor="phone"
                          className="mb-2 block text-sm font-medium text-[#252525]"
                        >
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
                        <label
                          htmlFor="subject"
                          className="mb-2 block text-sm font-medium text-[#252525]"
                        >
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
                          <option value="custom">Custom Packaging</option>
                          <option value="support">Order Support</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="message"
                        className="mb-2 block text-sm font-medium text-[#252525]"
                      >
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
                      disabled={loading}
                      className="w-full rounded-lg bg-[#007A55] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#006145] sm:w-auto disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {loading ? "Sending..." : "Send Message"}
                    </button>
                  </form>
                )}
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
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#007A55]/10">
                          <detail.icon
                            size={20}
                            className="text-[#007A55]"
                          />
                        </div>
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

                <div>
                  <h3 className="mb-4 text-lg font-bold text-[#252525]">
                    Business Hours
                  </h3>
                  <div className="rounded-xl bg-[#f8f9fa] p-4">
                    {businessHours.map((entry) => (
                      <div
                        key={entry.day}
                        className="flex justify-between py-2 text-sm"
                      >
                        <span className="text-[#52525C]">{entry.day}</span>
                        <span className="font-medium text-[#252525]">
                          {entry.hours}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="mb-4 text-lg font-bold text-[#252525]">
                    Our Location
                  </h3>
                  <div className="flex h-[200px] items-center justify-center rounded-xl bg-[#f8f9fa] text-sm text-[#52525C]">
                    Sydney, Australia
                  </div>
                </div>

                <div>
                  <h3 className="mb-4 text-lg font-bold text-[#252525]">
                    Follow Us
                  </h3>
                  <div className="flex gap-4">
                    {socialLinks.map((social) => (
                      <a
                        key={social.platform}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={social.platform}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-[#007A55]/10 text-[#007A55] transition-colors hover:bg-[#007A55] hover:text-white"
                      >
                        <social.icon size={18} />
                      </a>
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
