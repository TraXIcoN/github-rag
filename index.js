import dotenv from "dotenv";
import { Octokit } from "@octokit/rest";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { loadFiles } from "./data/loader.js";
import { chunkText } from "./data/chunker.js";
import { vectorizeChunks } from "./embedding/vectorizer.js";
import { indexEmbeddings } from "./indexing/indexer.js";
import { queryRepo } from "./querying/queryProcessor.js";
import { generateResponse } from "./response/responseGenerator.js";

// Convert `import.meta.url` to `__dirname`
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = process.env.REPO_OWNER;
const REPO_NAME = process.env.REPO_NAME;

const octokit = new Octokit({
  auth: GITHUB_TOKEN,
});

const OUTPUT_DIR = path.join(__dirname, REPO_NAME);

// Ensure the output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

async function getRepoContents(repoPath = "") {
  try {
    const { data } = await octokit.repos.getContent({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: repoPath,
    });

    if (Array.isArray(data)) {
      for (const file of data) {
        if (file.type === "dir") {
          console.log(`Directory: ${file.path}`);
          await getRepoContents(file.path); // Recursive call to explore subdirectories
        } else if (file.type === "file") {
          console.log(`File: ${file.path}`);
          await downloadFile(file.path); // Download the file
        }
      }
    } else {
      console.log(`File: ${data.path}`);
      await downloadFile(data.path); // Download the file
    }
  } catch (error) {
    console.error(`Error fetching repo contents: ${error.message}`);
  }
}

async function downloadFile(filePath) {
  try {
    const { data } = await octokit.repos.getContent({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: filePath,
    });

    if (data.encoding === "base64") {
      const content = Buffer.from(data.content, "base64").toString("utf-8");
      const fileOutputPath = path.join(OUTPUT_DIR, filePath);
      const fileDir = path.dirname(fileOutputPath);

      // Ensure the directory exists
      if (!fs.existsSync(fileDir)) {
        fs.mkdirSync(fileDir, { recursive: true });
      }

      fs.writeFileSync(fileOutputPath, content);
      console.log(`Saved file: ${fileOutputPath}`);
    }
  } catch (error) {
    console.error(`Error downloading file ${filePath}: ${error.message}`);
  }
}

async function getCommits() {
  try {
    const { data } = await octokit.repos.listCommits({
      owner: REPO_OWNER,
      repo: REPO_NAME,
    });

    const commitsOutputPath = path.join(OUTPUT_DIR, "commits.json");
    fs.writeFileSync(commitsOutputPath, JSON.stringify(data, null, 2));
    console.log(`Saved commits: ${commitsOutputPath}`);
  } catch (error) {
    console.error(`Error fetching commits: ${error.message}`);
  }
}

async function getContributors() {
  try {
    const { data } = await octokit.repos.listContributors({
      owner: REPO_OWNER,
      repo: REPO_NAME,
    });

    const contributorsOutputPath = path.join(OUTPUT_DIR, "contributors.json");
    fs.writeFileSync(contributorsOutputPath, JSON.stringify(data, null, 2));
    console.log(`Saved contributors: ${contributorsOutputPath}`);
  } catch (error) {
    console.error(`Error fetching contributors: ${error.message}`);
  }
}

async function scrapeRepo() {
  console.log(`Scraping repository ${REPO_OWNER}/${REPO_NAME}...`);

  console.log("Fetching project structure...");
  await getRepoContents();

  console.log("\nFetching commits...");
  await getCommits();

  console.log("\nFetching contributors...");
  await getContributors();
}

async function main() {
  // Scrape the data from the github repo
  //   scrapeRepo();

  // Step 1: Load and chunk data
  console.log("Starting Loading and Chunking data");
  const files = loadFiles("./repo-data");
  let chunks = [];
  files.forEach((file) => {
    const chunkedContent = chunkText(file.content);
    chunks = chunks.concat(
      chunkedContent.map((chunk) => ({ file: file.file, content: chunk }))
    );
  });
  console.log("Finished Loading and chunking data");

  // Step 2: Vectorize chunks
  console.log("Started vectorizing data");
  const embeddings = await vectorizeChunks(chunks);
  console.log("Finished vectorizing data");

  // Step 3: Index embeddings
  console.log("Generating embeddings");
  await indexEmbeddings(embeddings);
  console.log("Finished generating embeddings");

  // Step 4: Handle a query
  console.log("Handling query");
  const query = "Explain the code changes and commit made by dineshkannan010?";
  const matches = await queryRepo(query);
  console.log("Query processing complete");

  // Step 5: Generate a response
  console.log("Generating response");
  const response = await generateResponse(query, matches);
  console.log(response);
}

main().catch((err) => console.error(err));
