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
import express from "express";
import cors from "cors";
const app = express();

app.use(cors());
app.use(express.json()); // To parse JSON bodies

app.post("/process-repo", async (req, res) => {
  const { username, repoName } = req.body;

  if (!username || !repoName) {
    return res
      .status(400)
      .json({ error: "username and repoName are required" });
  }

  try {
    // Your logic to process the repo goes here
    // For example: clone the repo, analyze the files, etc.
    main(username, reponame);

    res.status(200).json({ success: true, message: "Repo processing started" });
  } catch (error) {
    res
      .status(500)
      .json({ success: false, message: "Error processing repository" });
  }
});

app.post("/process-query", async (req, res) => {
  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ error: "query is required" });
  }

  try {
    // Step 4: Handle a query
    console.log("Handling query");
    const matches = await queryRepo(query);
    console.log("Query processing complete");

    // Step 5: Generate a response
    console.log("Generating response");
    const response = await generateResponse(query, matches);

    // Return the response to the client
    res.status(200).json({ success: true, response });
  } catch (error) {
    console.error("Error processing query:", error);
    res
      .status(500)
      .json({ success: false, message: "Error processing repository" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

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

async function scrapeRepo(username, repoName) {
  console.log(`Scraping repository ${username}/${repoName}...`);

  console.log("Fetching project structure...");
  await getRepoContents();

  console.log("\nFetching commits...");
  await getCommits();

  console.log("\nFetching contributors...");
  await getContributors();
}

async function main(username, repoName) {
  // Scrape the data from the github repo
  scrapeRepo(username, repoName);

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
}
