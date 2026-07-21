import Database from "better-sqlite3";
import path from "path";

const db = new Database(
  path.join(process.cwd(), "database", "site.db")
);

console.log("Seeding database...");

/* ---------------- Theme ---------------- */

db.prepare(`DELETE FROM theme`).run();

db.prepare(`
INSERT INTO theme
(
  id,
  site_name,
  logo,
  favicon,
  primary_color,
  secondary_color,
  background_color,
  text_color,
  button_color,
  font_family
)
VALUES
(
  1,
  ?,?,?,?,?,?,?,?,?
)
`).run(
  "Solid Hydrogen",
  "/images/www.solidhydrogen.tech/sh-logo-v2.png",
  "/favicon.ico",
  "#F26329",
  "#05203C",
  "#05203C",
  "#FFFFFF",
  "#F26329",
  "Albert Sans"
);

/* ---------------- SEO ---------------- */

db.prepare(`DELETE FROM seo`).run();

db.prepare(`
INSERT INTO seo
(
  id,
  title,
  description,
  keywords,
  og_image,
  canonical,
  robots
)
VALUES
(
  1,
  ?,?,?,?,?,?
)
`).run(

  "Solid Hydrogen",

  "Solid Hydrogen official website",

  "hydrogen,solid hydrogen,clean energy",

  "/images/www.solidhydrogen.tech/sh-logo-v2.png",

  "https://www.solidhydrogen.tech",

  "index,follow"

);

/* ---------------- Hero ---------------- */

db.prepare(`DELETE FROM hero`).run();

db.prepare(`
INSERT INTO hero
(id,title1,title2,title3,video,poster)
VALUES
(1,?,?,?,?,?)
`).run(
  "The future of",
  "hydrogen is",
  "SOLID",
  "/videos/www.solidhydrogen.tech/hero-bg.mp4",
  "/images/www.solidhydrogen.tech/hero-video-poster.jpg"
);

/* ---------------- Navigation ---------------- */

db.prepare(`DELETE FROM navigation`).run();

const navigation = [
  ["Technology", "#technology", 1],
  ["Applications", "#applications", 2],
  ["Leadership", "#leadership", 3],
  ["About", "#about", 4],
  ["News", "#news", 5],
];

const insertNavigation = db.prepare(`
INSERT INTO navigation
(label,href,sort_order)
VALUES
(?,?,?)
`);

for (const item of navigation) {
  insertNavigation.run(...item);
}

/* ---------------- Benefits ---------------- */

db.prepare(`DELETE FROM benefits`).run();

const benefits = [
  [
    "/images/www.solidhydrogen.tech/icon-hydrogen-tank.png",
    "Hydrogen Tank Storage",
  ],
  [
    "/images/www.solidhydrogen.tech/icon-cost.png",
    "Lower Cost",
  ],
  [
    "/images/www.solidhydrogen.tech/icon-independent.png",
    "Energy Independence",
  ],
  [
    "/images/www.solidhydrogen.tech/icon-large-energy.png",
    "Large Energy Capacity",
  ],
];

const insertBenefit = db.prepare(`
INSERT INTO benefits
(icon,title)
VALUES
(?,?)
`);

for (const item of benefits) {
  insertBenefit.run(...item);
}

/* ---------------- Team ---------------- */

db.prepare(`DELETE FROM team_members`).run();

const team = [
  [
    "Francois",
    "Chief Executive Officer",
    "Leader of Solid Hydrogen.",
    "/images/www.solidhydrogen.tech/pic-francois.png",
  ],
  [
    "Philippe",
    "Chief Technology Officer",
    "Hydrogen Technology Expert.",
    "/images/www.solidhydrogen.tech/pic-philippe.png",
  ],
];

const insertTeam = db.prepare(`
INSERT INTO team_members
(name,position,bio,image)
VALUES
(?,?,?,?)
`);

for (const member of team) {
  insertTeam.run(...member);
}

/* ---------------- Images ---------------- */

db.prepare(`DELETE FROM images`).run();

const images = [

  [
    "Logo",
    "/images/www.solidhydrogen.tech/sh-logo-v2.png",
    "Solid Hydrogen Logo",
  ],

  [
    "Hero Poster",
    "/images/www.solidhydrogen.tech/hero-video-poster.jpg",
    "Hero Poster",
  ],

  [
    "Technology Background",
    "/images/www.solidhydrogen.tech/bg-technology.png",
    "Technology Background",
  ],

  [
    "Team Background",
    "/images/www.solidhydrogen.tech/bg-team.png",
    "Team Background",
  ],

  [
    "Francois",
    "/images/www.solidhydrogen.tech/pic-francois.png",
    "Francois",
  ],

  [
    "Philippe",
    "/images/www.solidhydrogen.tech/pic-philippe.png",
    "Philippe",
  ]

];

const insertImage = db.prepare(`
INSERT INTO images
(name,path,alt)
VALUES
(?,?,?)
`);

for (const image of images) {
  insertImage.run(...image);
}

/* ---------------- Videos ---------------- */

db.prepare(`DELETE FROM videos`).run();

const videos = [

  [
    "Hero Background",
    "/videos/www.solidhydrogen.tech/hero-bg.mp4",
    "/images/www.solidhydrogen.tech/hero-video-poster.jpg",
  ]

];

const insertVideo = db.prepare(`
INSERT INTO videos
(name,path,poster)
VALUES
(?,?,?)
`);

for (const video of videos) {
  insertVideo.run(...video);
}


/* ---------------- Footer ---------------- */

db.prepare(`DELETE FROM footer`).run();

db.prepare(`
INSERT INTO footer
(id,address,copyright,email)
VALUES
(1,?,?,?)
`).run(
  "Singapore",
  "© Solid Hydrogen",
  "contact@solidhydrogen.tech"
);

console.log("Database Seed Complete.");