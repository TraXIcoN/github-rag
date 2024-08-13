import dotenv from "dotenv";

dotenv.config();

export const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
export const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
export const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
export const REPO_NAME = process.env.REPO_NAME;
export const REPO_OWNER = process.env.REPO_OWNER;
