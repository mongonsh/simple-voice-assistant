import anthropic
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Initialize the client (reads ANTHROPIC_API_KEY from .env)
client = anthropic.Anthropic()

# Simple message example
message = client.messages.create(
    model="claude-sonnet-4-5",
    max_tokens=1024,
    messages=[
        {"role": "user", "content": "Explain what an API is in 2 sentences."}
    ]
)

print("Response:")
print(message.content[0].text)
print(f"\nTokens used: {message.usage.input_tokens} input, {message.usage.output_tokens} output")


# Example with system prompt
message_with_system = client.messages.create(
    model="claude-sonnet-4-5",
    max_tokens=1024,
    system="You are a helpful coding assistant. Be concise.",
    messages=[
        {"role": "user", "content": "Write a Python function to check if a number is prime."}
    ]
)

print("\n--- With System Prompt ---")
print(message_with_system.content[0].text)


# Multi-turn conversation example
conversation = client.messages.create(
    model="claude-sonnet-4-5",
    max_tokens=1024,
    messages=[
        {"role": "user", "content": "What is 25 * 4?"},
        {"role": "assistant", "content": "25 * 4 = 100"},
        {"role": "user", "content": "Now divide that by 5"}
    ]
)

print("\n--- Multi-turn Conversation ---")
print(conversation.content[0].text)
