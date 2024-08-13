import axios from "axios";
import { Pinecone } from "@pinecone-database/pinecone";
import { OPENAI_API_KEY, PINECONE_API_KEY } from "../config/dotenv.js";

export async function queryRepo(query) {
  // Create embedding for the query
  const queryEmbeddingResponse = await axios.post(
    "https://api.openai.com/v1/embeddings",
    {
      model: "text-embedding-ada-002",
      input: query,
    },
    {
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  const queryEmbedding = queryEmbeddingResponse.data.data[0].embedding;

  // Initialize Pinecone client and perform the query
  const pineconeClient = new Pinecone({ apiKey: PINECONE_API_KEY });
  //   await pineconeClient.init({ apiKey: PINECONE_API_KEY });
  const index = pineconeClient.Index("repo-index");

  const results = await index.query({
    vector: queryEmbedding,
    topK: 5,
    includeMetadata: true,
  });

  return results.matches;
}
