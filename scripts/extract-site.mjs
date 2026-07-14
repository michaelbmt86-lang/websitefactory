import { chromium } from "playwright";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const HOST = "www.solidhydrogen.tech";
const URL = `https://${HOST}/`;
const RESEARCH = join(ROOT, "docs/research", HOST);
const DESIGN_REFS = join(ROOT, "docs/design-references", HOST);

for (const dir of [RESEARCH, DESIGN_REFS, join(ROOT, "public/images", HOST)]) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

const EXTRACTION_SCRIPT = `
(function() {
  const props = [
    'fontSize','fontWeight','fontFamily','lineHeight','letterSpacing','color',
    'textTransform','textDecoration','backgroundColor','background',
    'padding','paddingTop','paddingRight','paddingBottom','paddingLeft',
    'margin','marginTop','marginRight','marginBottom','marginLeft',
    'width','height','maxWidth','minWidth','maxHeight','minHeight',
    'display','flexDirection','justifyContent','alignItems','gap',
    'gridTemplateColumns','gridTemplateRows',
    'borderRadius','border','borderTop','borderBottom','borderLeft','borderRight',
    'boxShadow','overflow','overflowX','overflowY',
    'position','top','right','bottom','left','zIndex',
    'opacity','transform','transition','cursor',
    'objectFit','objectPosition','mixBlendMode','filter','backdropFilter',
    'whiteSpace','textOverflow','WebkitLineClamp'
  ];
  function extractStyles(element) {
    const cs = getComputedStyle(element);
    const styles = {};
    props.forEach(p => { const v = cs[p]; if (v && v !== 'none' && v !== 'normal' && v !== 'auto' && v !== '0px' && v !== 'rgba(0, 0, 0, 0)') styles[p] = v; });
    return styles;
  }
  function walk(element, depth) {
    if (depth > 5) return null;
    const children = [...element.children];
    return {
      tag: element.tagName.toLowerCase(),
      id: element.id || null,
      classes: element.className?.toString().split(' ').slice(0, 8).join(' ') || null,
      text: element.childNodes.length === 1 && element.childNodes[0].nodeType === 3 ? element.textContent.trim().slice(0, 300) : null,
      styles: extractStyles(element),
      images: element.tagName === 'IMG' ? { src: element.src, alt: element.alt, naturalWidth: element.naturalWidth, naturalHeight: element.naturalHeight } : null,
      childCount: children.length,
      children: children.slice(0, 30).map(c => walk(c, depth + 1)).filter(Boolean)
    };
  }
  return {
    images: [...document.querySelectorAll('img')].map(img => ({
      src: img.src || img.currentSrc,
      alt: img.alt,
      width: img.naturalWidth,
      height: img.naturalHeight,
      parentClasses: img.parentElement?.className,
      position: getComputedStyle(img).position,
      zIndex: getComputedStyle(img).zIndex
    })),
    videos: [...document.querySelectorAll('video')].map(v => ({
      src: v.src || v.querySelector('source')?.src,
      poster: v.poster,
      autoplay: v.autoplay,
      loop: v.loop,
      muted: v.muted
    })),
    backgroundImages: [...document.querySelectorAll('*')].filter(el => {
      const bg = getComputedStyle(el).backgroundImage;
      return bg && bg !== 'none';
    }).slice(0, 100).map(el => ({
      url: getComputedStyle(el).backgroundImage,
      element: el.tagName + (el.id ? '#' + el.id : '') + '.' + (el.className?.toString().split(' ')[0] || '')
    })),
    svgCount: document.querySelectorAll('svg').length,
    svgs: [...document.querySelectorAll('svg')].slice(0, 20).map(svg => ({
      outerHTML: svg.outerHTML.slice(0, 2000),
      width: svg.getAttribute('width'),
      height: svg.getAttribute('height'),
      viewBox: svg.getAttribute('viewBox')
    })),
    fonts: [...new Set([...document.querySelectorAll('h1,h2,h3,h4,h5,h6,p,span,a,button')].slice(0, 100).map(el => getComputedStyle(el).fontFamily))],
    favicons: [...document.querySelectorAll('link[rel*="icon"]')].map(l => ({ href: l.href, sizes: l.sizes?.toString() })),
    fontLinks: [...document.querySelectorAll('link[href*="font"], style')].map(l => l.href || l.textContent?.slice(0, 500)),
    hasLenis: !!document.querySelector('.lenis'),
    hasLocomotive: !!document.querySelector('.locomotive-scroll'),
    bodyStyles: extractStyles(document.body),
    htmlStyles: extractStyles(document.documentElement),
    sections: [...document.querySelectorAll('[data-testid], section, header, footer, #SITE_HEADER, #SITE_FOOTER, #PAGES_CONTAINER > *')].map(el => ({
      tag: el.tagName,
      id: el.id,
      classes: el.className?.toString().slice(0, 100),
      rect: el.getBoundingClientRect(),
      styles: extractStyles(el)
    }))
  };
})()
`;

async function main() {
  console.log("Launching browser...");
  const browser = await chromium.launch({ headless: true });
  const results = {};

  for (const [name, width, height] of [
    ["desktop", 1440, 900],
    ["tablet", 768, 1024],
    ["mobile", 390, 844],
  ]) {
    console.log(`Viewport: ${name} (${width}x${height})`);
    const context = await browser.newContext({ viewport: { width, height } });
    const page = await context.newPage();
    await page.goto(URL, { waitUntil: "networkidle", timeout: 60000 });
    await page.waitForTimeout(3000);

    // Full page screenshot
    await page.screenshot({
      path: join(DESIGN_REFS, `full-page-${name}.png`),
      fullPage: true,
    });

    // Viewport screenshot
    await page.screenshot({
      path: join(DESIGN_REFS, `viewport-${name}.png`),
      fullPage: false,
    });

    if (name === "desktop") {
      // Extract global data
      const globalData = await page.evaluate(EXTRACTION_SCRIPT);
      writeFileSync(join(RESEARCH, "global-extraction.json"), JSON.stringify(globalData, null, 2));

      // Scroll sweep - capture header at top and scrolled
      const headerTop = await page.evaluate(() => {
        const header = document.querySelector('#SITE_HEADER, header');
        if (!header) return null;
        const cs = getComputedStyle(header);
        return {
          scrollY: window.scrollY,
          backgroundColor: cs.backgroundColor,
          boxShadow: cs.boxShadow,
          height: cs.height,
          position: cs.position,
          opacity: cs.opacity,
          transform: cs.transform,
          transition: cs.transition
        };
      });
      results.headerTop = headerTop;

      // Scroll through page
      const scrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);
      const steps = 10;
      const behaviors = [];
      for (let i = 0; i <= steps; i++) {
        const y = Math.floor((scrollHeight / steps) * i);
        await page.evaluate((scrollY) => window.scrollTo(0, scrollY), y);
        await page.waitForTimeout(500);
        const state = await page.evaluate(() => {
          const header = document.querySelector('#SITE_HEADER, header');
          const cs = header ? getComputedStyle(header) : null;
          return {
            scrollY: window.scrollY,
            header: cs ? {
              backgroundColor: cs.backgroundColor,
              boxShadow: cs.boxShadow,
              height: cs.height,
              position: cs.position,
              opacity: cs.opacity,
              transform: cs.transform
            } : null,
            visibleSections: [...document.querySelectorAll('h1,h2,h3')].filter(el => {
              const r = el.getBoundingClientRect();
              return r.top >= 0 && r.top < window.innerHeight;
            }).map(el => ({ tag: el.tagName, text: el.textContent.trim().slice(0, 100) }))
          };
        });
        behaviors.push(state);
      }
      writeFileSync(join(RESEARCH, "scroll-behaviors.json"), JSON.stringify(behaviors, null, 2));

      // Header scrolled state
      await page.evaluate(() => window.scrollTo(0, 500));
      await page.waitForTimeout(500);
      results.headerScrolled = await page.evaluate(() => {
        const header = document.querySelector('#SITE_HEADER, header');
        if (!header) return null;
        const cs = getComputedStyle(header);
        return {
          scrollY: window.scrollY,
          backgroundColor: cs.backgroundColor,
          boxShadow: cs.boxShadow,
          height: cs.height,
          position: cs.position,
          opacity: cs.opacity,
          transform: cs.transform,
          transition: cs.transition
        };
      });

      // Extract text content
      const textContent = await page.evaluate(() => {
        const texts = [];
        document.querySelectorAll('h1,h2,h3,h4,h5,h6,p,span,a,button,li').forEach(el => {
          const t = el.textContent?.trim();
          if (t && t.length > 2 && t.length < 500) texts.push({ tag: el.tagName, text: t, classes: el.className?.toString().slice(0, 80) });
        });
        return texts;
      });
      writeFileSync(join(RESEARCH, "text-content.json"), JSON.stringify(textContent, null, 2));

      // Page topology
      const topology = await page.evaluate(() => {
        const sections = [];
        const container = document.querySelector('#PAGES_CONTAINER') || document.body;
        function findSections(el, depth) {
          if (depth > 8) return;
          const rect = el.getBoundingClientRect();
          if (rect.height > 50 && (el.tagName === 'SECTION' || el.id?.includes('comp-') || el.dataset?.testid || el.className?.includes('StripColumnsContainer') || el.className?.includes('ClassicSection'))) {
            sections.push({
              tag: el.tagName,
              id: el.id,
              classes: el.className?.toString().slice(0, 120),
              height: rect.height,
              top: rect.top + window.scrollY,
              childHeadings: [...el.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(h => h.textContent.trim().slice(0, 100))
            });
          }
          [...el.children].forEach(c => findSections(c, depth + 1));
        }
        findSections(container, 0);
        return sections;
      });
      writeFileSync(join(RESEARCH, "page-topology-raw.json"), JSON.stringify(topology, null, 2));

      // Hover states on visible links/buttons only
      const interactiveElements = await page.$$('a:visible, button:visible, [role="button"]:visible');
      const hoverStates = [];
      for (const el of interactiveElements.slice(0, 10)) {
        try {
          const visible = await el.isVisible();
          if (!visible) continue;
          const before = await el.evaluate((node) => {
            const cs = getComputedStyle(node);
            return { color: cs.color, backgroundColor: cs.backgroundColor, textDecoration: cs.textDecoration, opacity: cs.opacity, transform: cs.transform, transition: cs.transition };
          });
          await el.hover({ timeout: 3000 });
          await page.waitForTimeout(200);
          const after = await el.evaluate((node) => {
            const cs = getComputedStyle(node);
            return { color: cs.color, backgroundColor: cs.backgroundColor, textDecoration: cs.textDecoration, opacity: cs.opacity, transform: cs.transform, transition: cs.transition };
          });
          const text = await el.textContent();
          hoverStates.push({ text: text?.trim().slice(0, 50), before, after });
        } catch {
          // skip non-hoverable elements
        }
      }
      writeFileSync(join(RESEARCH, "hover-states.json"), JSON.stringify(hoverStates, null, 2));

      // Color palette extraction
      const colors = await page.evaluate(() => {
        const palette = new Set();
        document.querySelectorAll('*').forEach(el => {
          const cs = getComputedStyle(el);
          if (cs.color && cs.color !== 'rgba(0, 0, 0, 0)') palette.add(cs.color);
          if (cs.backgroundColor && cs.backgroundColor !== 'rgba(0, 0, 0, 0)') palette.add(cs.backgroundColor);
        });
        return [...palette].slice(0, 50);
      });
      writeFileSync(join(RESEARCH, "color-palette.json"), JSON.stringify(colors, null, 2));

      // Typography samples
      const typography = await page.evaluate(() => {
        const samples = {};
        for (const sel of ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'a', 'button']) {
          const el = document.querySelector(sel);
          if (el) {
            const cs = getComputedStyle(el);
            samples[sel] = {
              fontSize: cs.fontSize, fontWeight: cs.fontWeight, fontFamily: cs.fontFamily,
              lineHeight: cs.lineHeight, letterSpacing: cs.letterSpacing, color: cs.color,
              textTransform: cs.textTransform, text: el.textContent.trim().slice(0, 100)
            };
          }
        }
        return samples;
      });
      writeFileSync(join(RESEARCH, "typography.json"), JSON.stringify(typography, null, 2));

      // Section screenshots
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(500);
      const sectionNames = ['hero', 'about', 'benefits', 'advantage', 'contact', 'team'];
      const headings = await page.$$('h1, h2');
      for (let i = 0; i < Math.min(headings.length, 8); i++) {
        await headings[i].scrollIntoViewIfNeeded();
        await page.waitForTimeout(300);
        const name = sectionNames[i] || `section-${i}`;
        await page.screenshot({ path: join(DESIGN_REFS, `section-${name}.png`) });
      }
    }

    await context.close();
  }

  writeFileSync(join(RESEARCH, "header-states.json"), JSON.stringify(results, null, 2));
  await browser.close();
  console.log("Extraction complete!");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
