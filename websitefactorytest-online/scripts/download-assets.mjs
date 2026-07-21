import { mkdirSync, existsSync, writeFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const OUT = join(ROOT, "public/images/www.solidhydrogen.tech");
const SEO = join(ROOT, "public/seo");
const VIDEOS = join(ROOT, "public/videos/www.solidhydrogen.tech");

for (const dir of [OUT, SEO, VIDEOS]) {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
}

const assets = [
  { url: "https://static.wixstatic.com/media/b5a595_00513a147b334c0692776ef84a0c1613~mv2.png/v1/fill/w_291,h_79,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/sh-logo-v2.png", file: "sh-logo-v2.png" },
  { url: "https://static.wixstatic.com/media/b5a595_690b5f3927f24a64b28da17fd11ac0b3~mv2.jpg/v1/fill/w_1259,h_1089,al_t,q_85,enc_avif,quality_auto/b5a595_690b5f3927f24a64b28da17fd11ac0b3~mv2.jpg", file: "bg-home.jpg" },
  { url: "https://static.wixstatic.com/media/11062b_5d184c224d074c13b1301d97fef8e418f000.jpg/v1/fill/w_281,h_116,al_c,q_80,usm_0.33_1.00_0.00,enc_avif,quality_auto/11062b_5d184c224d074c13b1301d97fef8e418f000.jpg", file: "hero-video-poster.jpg" },
  { url: "https://static.wixstatic.com/media/b5a595_9566e3a2a23a4a8b998d414d4dd73720~mv2.png/v1/crop/x_0,y_0,w_731,h_325,q_85,enc_auto/b5a595_9566e3a2a23a4a8b998d414d4dd73720~mv2.png", file: "bg-technology.png" },
  { url: "https://static.wixstatic.com/media/b5a595_d1cea83a4c89491aa89ea8353d08ccf5~mv2.png/v1/crop/x_583,y_0,w_1440,h_908,q_90,enc_auto/b5a595_d1cea83a4c89491aa89ea8353d08ccf5~mv2.png", file: "bg-team.png" },
  { url: "https://static.wixstatic.com/media/b5a595_3a84edac90984547bf7551d07418a748~mv2.png/v1/fill/w_50,h_50,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/icon-cost.png", file: "icon-cost.png" },
  { url: "https://static.wixstatic.com/media/b5a595_ccf5961135f74b9787372cdfbc8d28eb~mv2.png/v1/fill/w_50,h_50,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/icon-nontoxic.png", file: "icon-nontoxic.png" },
  { url: "https://static.wixstatic.com/media/b5a595_f14c2ecb185b47c784ecfdf7446d3bf6~mv2.png/v1/fill/w_50,h_50,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/icon-longlife.png", file: "icon-longlife.png" },
  { url: "https://static.wixstatic.com/media/b5a595_b0a05f1d767e450da0c029e45b493e3b~mv2.png/v1/fill/w_50,h_50,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/icon-recyclable.png", file: "icon-recyclable.png" },
  { url: "https://static.wixstatic.com/media/b5a595_e139c2376fb74ce4924ec4eb0ae179b1~mv2.png/v1/fill/w_50,h_50,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/icon-large-energy.png", file: "icon-large-energy.png" },
  { url: "https://static.wixstatic.com/media/b5a595_4c5db1ced1b8435d8dfc823a1ddfed50~mv2.png/v1/fill/w_50,h_50,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/icon-termperature.png", file: "icon-temperature.png" },
  { url: "https://static.wixstatic.com/media/b5a595_19139916414f4bf3a1899075e1e66b8b~mv2.png/v1/fill/w_50,h_50,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/icon-metals.png", file: "icon-metals.png" },
  { url: "https://static.wixstatic.com/media/b5a595_69c2fd3127ba401989ce29e20327d480~mv2.png/v1/fill/w_50,h_50,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/icon-independent.png", file: "icon-independent.png" },
  { url: "https://static.wixstatic.com/media/b5a595_cbe7f0e5d26647789008770ded457799~mv2.png/v1/fill/w_50,h_50,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/icon-volume.png", file: "icon-volume.png" },
  { url: "https://static.wixstatic.com/media/b5a595_eab8bb52175a44d19078daecd1c82cbc~mv2.png/v1/fill/w_50,h_50,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/b5a595_eab8bb52175a44d19078daecd1c82cbc~mv2.png", file: "icon-quick-cycles.png" },
  { url: "https://static.wixstatic.com/media/b5a595_d6305fd450854eea989a5d96973e307b~mv2.png/v1/fill/w_50,h_50,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/icon-hydrogen-tank.png", file: "icon-hydrogen-tank.png" },
  { url: "https://static.wixstatic.com/media/b5a595_0caf7caedbe24e4f98af053d4745d0fb~mv2.png/v1/fill/w_250,h_250,al_c,q_85,enc_avif,quality_auto/pic-francois.png", file: "pic-francois.png" },
  { url: "https://static.wixstatic.com/media/b5a595_dc4627e8833c45cb9b7d7cf1fd622a95~mv2.png/v1/fill/w_250,h_250,al_c,q_85,enc_avif,quality_auto/pic-philippe.png", file: "pic-philippe.png" },
  { url: "https://static.wixstatic.com/media/b5a595_7eec3209201047b1802daacee060521b%7Emv2.png/v1/fill/w_192%2Ch_192%2Clg_1%2Cusm_0.66_1.00_0.01/b5a595_7eec3209201047b1802daacee060521b%7Emv2.png", file: "favicon-192.png", dest: SEO },
];

const video = {
  url: "https://video.wixstatic.com/video/11062b_5d184c224d074c13b1301d97fef8e418/360p/mp4/file.mp4",
  file: "hero-bg.mp4",
};

async function download(url, destPath, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed ${url}: ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      writeFileSync(destPath, buf);
      console.log(`Downloaded: ${destPath}`);
      return;
    } catch (err) {
      if (attempt === retries) throw err;
      console.log(`Retry ${attempt}/${retries} for ${url}`);
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
  }
}

async function main() {
  for (const a of assets) {
    await download(a.url, join(a.dest || OUT, a.file));
  }
  await download(video.url, join(VIDEOS, video.file));
  console.log("All assets downloaded.");
}

main().catch(console.error);
