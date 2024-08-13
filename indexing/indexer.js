import { Pinecone } from "@pinecone-database/pinecone";
import { PINECONE_API_KEY } from "../config/dotenv.js";

const client = new Pinecone({ apiKey: PINECONE_API_KEY });

export async function indexEmbeddings(embeddings) {
  //   await client.init({ apiKey: PINECONE_API_KEY });
  const index = client.Index("repo-index");

  // Create an array of vectors, each with an id, values, and metadata
  const vectors = embeddings.map((embedding, id) => ({
    id: `${id}`, // Ensure id is a string
    values: embedding.embedding, // Array of embedding values
    metadata: {
      file: embedding.file,
      content: embedding.content,
    },
  }));

  // Ensure the vectors are in an array and passed correctly
  await index.upsert(vectors);
}
