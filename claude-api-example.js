import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

async function main() {
  // Simple message example
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 1024,
    messages: [
      { role: "user", content: "Explain what an API is in 2 sentences." }
    ]
  });

  console.log("Response:");
  console.log(message.content[0].text);
  console.log(`\nTokens used: ${message.usage.input_tokens} input, ${message.usage.output_tokens} output`);

  // Example with system prompt
  const messageWithSystem = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 1024,
    system: "You are a helpful coding assistant. Be concise.",
    messages: [
      { role: "user", content: "Write a JavaScript function to check if a number is prime." }
    ]
  });

  console.log("\n--- With System Prompt ---");
  console.log(messageWithSystem.content[0].text);

  // Streaming example
  console.log("\n--- Streaming Response ---");
  const stream = anthropic.messages.stream({
    model: "claude-sonnet-4-5",
    max_tokens: 256,
    messages: [
      { role: "user", content: "Count from 1 to 5, with a brief pause description between each." }
    ]
  });

  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      process.stdout.write(event.delta.text);
    }
  }
  console.log("\n");
}

main().catch(console.error);
