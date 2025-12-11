from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
from dotenv import load_dotenv
import anthropic
from elevenlabs import ElevenLabs
import os
import uuid
import base64

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Initialize clients
claude_client = anthropic.Anthropic()
elevenlabs_client = ElevenLabs(api_key=os.getenv("ELEVENLABS_API_KEY"))

# Directory for audio files
AUDIO_DIR = "audio_output"
os.makedirs(AUDIO_DIR, exist_ok=True)


@app.route('/chat', methods=['POST'])
def chat():
    """Handle chat requests - get response from Claude and convert to speech"""
    try:
        data = request.json
        user_message = data.get('message', '')
        history = data.get('history', [])

        if not user_message:
            return jsonify({'error': 'No message provided'}), 400

        # Prepare messages for Claude
        messages = []
        for msg in history[:-1]:  # Exclude the last message (current one)
            messages.append({
                'role': msg['role'],
                'content': msg['content']
            })

        # Add current message
        messages.append({
            'role': 'user',
            'content': user_message
        })

        # Get response from Claude
        response = claude_client.messages.create(
            model="claude-sonnet-4-5",
            max_tokens=1024,
            system="You are a helpful voice assistant. Keep your responses concise and conversational, suitable for spoken dialogue. Avoid using markdown, bullet points, or complex formatting since your responses will be read aloud.",
            messages=messages
        )

        assistant_response = response.content[0].text

        # Generate audio using ElevenLabs
        audio_url = None
        try:
            audio = elevenlabs_client.text_to_speech.convert(
                voice_id="21m00Tcm4TlvDq8ikWAM",  # Rachel voice
                text=assistant_response,
                model_id="eleven_multilingual_v2"
            )

            # Save audio file
            audio_filename = f"{uuid.uuid4()}.mp3"
            audio_path = os.path.join(AUDIO_DIR, audio_filename)

            with open(audio_path, 'wb') as f:
                for chunk in audio:
                    f.write(chunk)

            audio_url = f"http://localhost:5000/audio/{audio_filename}"

        except Exception as e:
            print(f"ElevenLabs error (continuing without audio): {e}")
            # Continue without audio if ElevenLabs fails

        return jsonify({
            'response': assistant_response,
            'audio_url': audio_url
        })

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/audio/<filename>', methods=['GET'])
def serve_audio(filename):
    """Serve audio files"""
    audio_path = os.path.join(AUDIO_DIR, filename)
    if os.path.exists(audio_path):
        return send_file(audio_path, mimetype='audio/mpeg')
    return jsonify({'error': 'Audio not found'}), 404


@app.route('/voices', methods=['GET'])
def list_voices():
    """List available ElevenLabs voices"""
    try:
        response = elevenlabs_client.voices.get_all()
        voices = [{'name': v.name, 'voice_id': v.voice_id} for v in response.voices]
        return jsonify({'voices': voices})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({'status': 'ok'})


if __name__ == '__main__':
    print("=" * 50)
    print("Voice Chat Server")
    print("=" * 50)
    print(f"Server running at http://localhost:5000")
    print(f"Open voice-chat.html in your browser to start chatting")
    print("=" * 50)
    app.run(host='0.0.0.0', port=5000, debug=True)
