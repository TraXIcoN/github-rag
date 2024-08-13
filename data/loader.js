import fs from "fs";
import path from "path";

export function loadFiles(directory) {
  const files = fs.readdirSync(directory);
  const contents = [];

  files.forEach((file) => {
    const filePath = path.join(directory, file);

    // Ensure it's a file before reading
    if (fs.lstatSync(filePath).isFile()) {
      const content = fs.readFileSync(filePath, "utf-8");
      contents.push({ file: filePath, content });
    } else {
      console.warn(`Skipping directory: ${filePath}`);
    }
  });

  return contents;
}
