import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ArrowRightIcon } from "@/components/icons";

export const metadata = {
  title: "News & Resources | BioPak Blog",
  description:
    "Insights on sustainability, compostable packaging, certifications, and eco-friendly business practices from the BioPak team.",
};

const featuredArticle = {
  title: "The Future of Sustainable Packaging: Trends to Watch in 2025",
  excerpt:
    "From plant-based materials to circular economy models, the packaging industry is undergoing a transformation. Here are the key trends shaping the future of sustainable packaging.",
  date: "January 15, 2025",
  category: "Industry Insights",
  slug: "/resources/future-of-sustainable-packaging",
};

const articles = [
  {
    title: "Why Certifications Matter in Sustainable Packaging",
    excerpt:
      "Not all eco-friendly claims are equal. Learn what AS4736, AS5810, and B Corp certifications really mean and why they should guide your purchasing decisions.",
    date: "December 20, 2024",
    category: "Sustainability",
    slug: "/resources/why-certifications-matter",
  },
  {
    title: "Recycling vs Composting: What's the Difference?",
    excerpt:
      "Many consumers confuse recycling with composting. Discover why composting is the best end-of-life solution for food-contaminated packaging and how it closes the loop.",
    date: "December 5, 2024",
    category: "Education",
    slug: "/resources/recycling-vs-composting",
  },
  {
    title: "Greenwashing: What to Look For",
    excerpt:
      "Greenwashing is rife in the packaging industry. We break down the red flags to watch out for and how to verify genuine sustainability claims.",
    date: "November 18, 2024",
    category: "Sustainability",
    slug: "/resources/greenwashing-what-to-look-for",
  },
  {
    title: "Understanding Eco-Costs: The True Price of Packaging",
    excerpt:
      "Eco-costing measures the environmental burden of a product. See how BioPak uses eco-cost data to help businesses make more informed choices.",
    date: "November 2, 2024",
    category: "Industry Insights",
    slug: "/resources/understanding-eco-costs",
  },
  {
    title: "Our Carbon Footprint Journey",
    excerpt:
      "We're on a roadmap to reduce carbon emissions across our supply chain and operations. Here's where we are and where we're headed.",
    date: "October 15, 2024",
    category: "Company News",
    slug: "/resources/carbon-footprint-journey",
  },
  {
    title: "How Composting Reduces Landfill Waste",
    excerpt:
      "Australia sends millions of tonnes of waste to landfill each year. Learn how commercial composting programs are diverting food packaging from landfill.",
    date: "September 28, 2024",
    category: "Education",
    slug: "/resources/composting-reduces-landfill-waste",
  },
];

export default function BlogPage() {
  return (
    <>
      <SiteHeader />
      <main>
        {/* Hero Section */}
        <section className="relative flex min-h-[360px] items-center bg-[#007A55] px-4 py-20 md:min-h-[420px]">
          <div className="mx-auto max-w-[1280px] text-center">
            <h1 className="mb-4 text-4xl font-extrabold text-white md:text-5xl lg:text-6xl">
              News &amp; Resources
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-white/90 md:text-xl">
              Insights on Sustainability and Packaging
            </p>
          </div>
        </section>

        {/* Featured Article */}
        <section className="px-4 py-12 md:py-16">
          <div className="mx-auto max-w-[1280px]">
            <Link
              href={featuredArticle.slug}
              className="group block rounded-xl border border-black/5 bg-white p-8 transition-all hover:shadow-md md:p-12"
            >
              <div className="mb-4 inline-flex rounded-full bg-[#007A55]/10 px-3 py-1">
                <span className="text-xs font-semibold text-[#007A55]">
                  Featured
                </span>
              </div>
              <div className="mb-4 flex items-center gap-3 text-sm text-[#52525C]">
                <span>{featuredArticle.category}</span>
                <span>&middot;</span>
                <span>{featuredArticle.date}</span>
              </div>
              <h2 className="mb-4 text-2xl font-bold text-[#252525] group-hover:text-[#007A55] md:text-3xl">
                {featuredArticle.title}
              </h2>
              <p className="mb-6 max-w-3xl text-base leading-relaxed text-[#52525C]">
                {featuredArticle.excerpt}
              </p>
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#007A55] transition-all group-hover:gap-3">
                Read Article <ArrowRightIcon size={16} />
              </span>
            </Link>
          </div>
        </section>

        {/* Blog Grid */}
        <section className="bg-[#f8f9fa] px-4 py-12 md:py-16">
          <div className="mx-auto max-w-[1280px]">
            <h2 className="mb-8 text-2xl font-bold text-[#252525] md:text-3xl">
              Latest Articles
            </h2>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map((article) => (
                <Link
                  key={article.slug}
                  href={article.slug}
                  className="group flex flex-col rounded-xl bg-white p-6 shadow-sm transition-all hover:shadow-md"
                >
                  <div className="mb-3 inline-flex w-fit rounded-full bg-[#007A55]/10 px-3 py-1">
                    <span className="text-xs font-semibold text-[#007A55]">
                      {article.category}
                    </span>
                  </div>
                  <h3 className="mb-3 text-lg font-bold text-[#252525] group-hover:text-[#007A55]">
                    {article.title}
                  </h3>
                  <p className="mb-4 flex-1 text-sm leading-relaxed text-[#52525C]">
                    {article.excerpt}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#52525C]">
                      {article.date}
                    </span>
                    <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#007A55] transition-all group-hover:gap-2">
                      Read More <ArrowRightIcon size={14} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
