const MODEL_ID = "meta-llama/Llama-3.2-3B-Instruct";
const API_URL = `https://api-inference.huggingface.co/models/${MODEL_ID}`;

// Simple cache to avoid re-generating the same post on re-renders
const cache = new Map();

export async function generateTextWithHuggingFace(prompt) {
  if (cache.has(prompt)) {
    return cache.get(prompt);
  }

  const hfToken = process.env.HUGGINGFACE_API_KEY;
  if (!hfToken) {
    throw new Error("HUGGINGFACE_API_KEY is not set. Please add it to your .env.local file.");
  }

  console.log(`Sending prompt to Hugging Face model: ${MODEL_ID}...`);

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${hfToken}`,
    },
    body: JSON.stringify({
      inputs: prompt,
      parameters: {
        max_new_tokens: 512, // Limit the length of the generated post
        temperature: 0.7, // Add some creativity
        top_p: 0.95,
        do_sample: true,
      },
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("Hugging Face API Error:", errorBody);
    throw new Error(`Failed to generate text with Hugging Face API: ${response.status} ${response.statusText}`);
  }

  const result = await response.json();
  const generatedText = result[0]?.generated_text;

  if (!generatedText) {
    throw new Error("Invalid response from Hugging Face API: no generated_text found.");
  }

  // The model often returns the prompt along with the generated text.
  // We need to extract just the newly generated part.
  const post = generatedText.replace(prompt, "").trim();

  cache.set(prompt, post);

  return post;
}