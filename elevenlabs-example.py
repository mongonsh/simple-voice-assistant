from dotenv import load_dotenv
from elevenlabs import ElevenLabs
import os

# Load environment variables from .env file
load_dotenv()

# Initialize the client
client = ElevenLabs(api_key=os.getenv("ELEVENLABS_API_KEY"))


# ============================================
# 1. TEXT-TO-SPEECH (Basic Example)
# ============================================
def text_to_speech_basic():
    """Convert text to speech using a pre-made voice"""
    audio = client.text_to_speech.convert(
        voice_id="21m00Tcm4TlvDq8ikWAM",  # "Rachel" - a pre-made voice
        text="Hello! This is a test of the ElevenLabs text to speech API.",
        model_id="eleven_multilingual_v2"
    )

    # Save the audio to a file
    with open("output_basic.mp3", "wb") as f:
        for chunk in audio:
            f.write(chunk)

    print("Audio saved to output_basic.mp3")


# ============================================
# 2. LIST AVAILABLE VOICES
# ============================================
def list_voices():
    """List all available voices"""
    response = client.voices.get_all()

    print("\n--- Available Voices ---")
    for voice in response.voices:
        print(f"- {voice.name} (ID: {voice.voice_id})")


# ============================================
# 3. CLONE A VOICE
# ============================================
def clone_voice(name: str, audio_files: list[str]):
    """
    Clone a voice from audio samples

    Args:
        name: Name for the cloned voice
        audio_files: List of paths to audio files (mp3, wav, etc.)
    """
    # Open audio files
    files = []
    for path in audio_files:
        files.append(open(path, "rb"))

    try:
        voice = client.voices.add(
            name=name,
            description="A cloned voice created via API",
            files=files
        )
        print(f"\nVoice cloned successfully!")
        print(f"Voice ID: {voice.voice_id}")
        print(f"Voice Name: {voice.name}")
        return voice.voice_id
    finally:
        # Close all files
        for f in files:
            f.close()


# ============================================
# 4. USE CLONED VOICE FOR TTS
# ============================================
def text_to_speech_cloned(voice_id: str, text: str, output_file: str = "output_cloned.mp3"):
    """Use a cloned voice for text-to-speech"""
    audio = client.text_to_speech.convert(
        voice_id=voice_id,
        text=text,
        model_id="eleven_multilingual_v2",
        voice_settings={
            "stability": 0.5,
            "similarity_boost": 0.75,
            "style": 0.0,
            "use_speaker_boost": True
        }
    )

    with open(output_file, "wb") as f:
        for chunk in audio:
            f.write(chunk)

    print(f"Audio saved to {output_file}")


# ============================================
# 5. STREAMING AUDIO
# ============================================
def text_to_speech_stream(text: str):
    """Stream audio in real-time (useful for long texts)"""
    # Use convert() - it returns an iterator that can be streamed
    audio_iterator = client.text_to_speech.convert(
        voice_id="21m00Tcm4TlvDq8ikWAM",
        text=text,
        model_id="eleven_multilingual_v2"
    )

    # Save streamed audio
    with open("output_stream.mp3", "wb") as f:
        for chunk in audio_iterator:
            f.write(chunk)

    print("Streamed audio saved to output_stream.mp3")


# ============================================
# 6. DELETE A VOICE
# ============================================
def delete_voice(voice_id: str):
    """Delete a cloned voice"""
    client.voices.delete(voice_id)
    print(f"Voice {voice_id} deleted successfully")


# ============================================
# MAIN - Run examples
# ============================================
if __name__ == "__main__":
    print("ElevenLabs API Examples\n")

    # Example 1: Basic text-to-speech
    print("1. Running basic text-to-speech...")
    text_to_speech_basic()

    # Example 2: List available voices
    print("\n2. Listing available voices...")
    list_voices()

    # Example 3: Clone a voice (uncomment to use)
    # Provide paths to your audio samples (at least 1 minute of clean audio recommended)
    # voice_id = clone_voice(
    #     name="My Cloned Voice",
    #     audio_files=["sample1.mp3", "sample2.mp3"]
    # )

    # Example 4: Use cloned voice (uncomment and provide voice_id)
    # text_to_speech_cloned(
    #     voice_id="your-cloned-voice-id",
    #     text="This is my cloned voice speaking!"
    # )

    # Example 5: Streaming
    print("\n3. Running streaming text-to-speech...")
    text_to_speech_stream("This is a longer text that will be streamed chunk by chunk for better performance.")

    print("\nDone!")
