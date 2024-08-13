import axios from "axios";
import { OPENAI_API_KEY } from "../config/dotenv.js";

export async function generateResponse(query, matches) {
  const context = matches.map((match) => match.metadata.content).join("\n");

  // Making the request to OpenAI's completion API directly with axios
  const response = await axios({
    method: "post",
    url: "https://api.openai.com/v1/chat/completions",
    data: {
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: `Context:\n${context}` },
        { role: "user", content: `${query}` },
      ],
      max_tokens: 300,
      stream: true,
    },
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    responseType: "stream",
  });

  let finalResponse = "";

  response.data.on("data", (chunk) => {
    const lines = chunk
      .toString("utf8")
      .split("\n")
      .filter((line) => line.trim() !== "");
    for (const line of lines) {
      if (line.startsWith("data: ")) {
        const json = line.slice(6);
        if (json !== "[DONE]") {
          try {
            const payload = JSON.parse(json);
            if (
              payload.choices &&
              payload.choices[0].delta &&
              payload.choices[0].delta.content
            ) {
              finalResponse += payload.choices[0].delta.content;
            }
          } catch (err) {
            console.error("Error parsing JSON:", err);
          }
        }
      }
    }
  });

  return new Promise((resolve, reject) => {
    response.data.on("end", () => {
      resolve(finalResponse.trim());
    });

    response.data.on("error", (err) => {
      reject(err);
    });
  });
}
