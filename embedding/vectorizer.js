import openaiImport from "openai";
import { OPENAI_API_KEY } from "../config/dotenv.js";

// Configure the OpenAI client
const openai = new openaiImport({ key: OPENAI_API_KEY });

export async function vectorizeChunks(chunks) {
  const embeddings = [];
  for (const chunk of chunks) {
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: chunk.content,
    });
    embeddings.push({
      file: chunk.file,
      embedding: response.data[0].embedding,
      content: chunk.content,
    });
  }
  return embeddings;
}
