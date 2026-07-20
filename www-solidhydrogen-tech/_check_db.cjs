const Database = require('better-sqlite3');
const db = new Database('E:/AI-Projects/website-factory/jcodemore/database/site.db', {readonly:true});
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
for (const t of tables) {
  try {
    const count = db.prepare("SELECT COUNT(*) as c FROM " + t.name).get().c;
    if (count > 0) console.log(t.name + ': ' + count);
  } catch(e) {}
}
db.close();
