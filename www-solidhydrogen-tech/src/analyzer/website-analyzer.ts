import fs from "fs";
import path from "path";
import { WEBSITE_COMPONENTS } from "./config";

export function analyzeWebsite() {
  const result = WEBSITE_COMPONENTS.map((component) => {
    const fullPath = path.join(process.cwd(), component.file);

    let exists = false;
    let editableFields: string[] = [];

    if (fs.existsSync(fullPath)) {
      exists = true;

      const code = fs.readFileSync(fullPath, "utf8");

      if (code.includes("title1")) editableFields.push("title1");
      if (code.includes("title2")) editableFields.push("title2");
      if (code.includes("title3")) editableFields.push("title3");

      if (code.includes("NAV_ITEMS")) editableFields.push("navigation");

      if (code.includes("BENEFITS")) editableFields.push("benefits");

      if (code.includes("TEAM_MEMBERS")) editableFields.push("team");

      if (code.includes("video")) editableFields.push("video");

      if (code.includes("poster")) editableFields.push("poster");

      if (code.includes("mailto")) editableFields.push("email");
    }

    return {
      component: component.name,
      file: component.file,
      table: component.table,
      api: component.api,
      exists,
      editableFields,
    };
  });

  return result;
}