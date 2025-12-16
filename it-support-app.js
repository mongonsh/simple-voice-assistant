/**
 * さくら IT Support Assistant
 * Japanese-themed Internal IT Support Voice Assistant
 */

// Configuration
const CONFIG = {
    API_URL: 'http://localhost:5000',
    QUICK_MESSAGES: {
        'pc-freeze': 'パソコンがフリーズして動かなくなりました。助けてください。',
        'dropbox': 'Dropboxの同期がうまくいきません。権限の追加も必要かもしれません。',
        'email': 'Thunderbirdでメールが受信できません。設定を確認してもらえますか？',
        'network': 'インターネットに接続できません。ネットワークの問題だと思います。',
        'password': 'パスワードを忘れてしまいました。リセットの方法を教えてください。',
        'other': 'ITに関する質問があります。'
    },
    GREETINGS: [
        'お困りのことはございますか？',
        'ご用件をお聞かせください',
        '何かお手伝いできることはありますか？',
        'どのようなご相談でしょうか？'
    ]
};

// State
const state = {
    isLoading: false,
    isRecording: false,
    recognition: null,
    history: [],
    audioPlayer: null
};

// DOM Elements
const elements = {
    chatMessages: document.getElementById('chatMessages'),
    messageInput: document.getElementById('messageInput'),
    sendBtn: document.getElementById('sendBtn'),
    voiceBtn: document.getElementById('voiceBtn'),
    loadingOverlay: document.getElementById('loadingOverlay'),
    audioPlayer: document.getElementById('audioPlayer'),
    soundWave: document.getElementById('soundWave'),
    avatarGreeting: document.getElementById('avatarGreeting'),
    avatarContainer: document.getElementById('avatarContainer'),
    sakuraContainer: document.getElementById('sakuraContainer')
};

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initSakuraAnimation();
    initSpeechRecognition();
    initEventListeners();
    rotateGreeting();
});

// ========================================
// Sakura Petal Animation
// ========================================

function initSakuraAnimation() {
    const container = elements.sakuraContainer;
    const petalCount = 20;

    for (let i = 0; i < petalCount; i++) {
        createPetal(container, i);
    }
}

function createPetal(container, index) {
    const petal = document.createElement('div');
    petal.className = 'sakura-petal';

    // Random properties
    const left = Math.random() * 100;
    const delay = Math.random() * 15;
    const duration = 10 + Math.random() * 10;
    const size = 10 + Math.random() * 10;

    petal.style.cssText = `
        left: ${left}%;
        width: ${size}px;
        height: ${size}px;
        animation-delay: ${delay}s;
        animation-duration: ${duration}s;
    `;

    container.appendChild(petal);
}

// ========================================
// Greeting Rotation
// ========================================

function rotateGreeting() {
    let index = 0;
    setInterval(() => {
        index = (index + 1) % CONFIG.GREETINGS.length;
        elements.avatarGreeting.style.opacity = 0;
        setTimeout(() => {
            elements.avatarGreeting.textContent = CONFIG.GREETINGS[index];
            elements.avatarGreeting.style.opacity = 1;
        }, 300);
    }, 5000);
}

// ========================================
// Event Listeners
// ========================================

function initEventListeners() {
    // Send button
    elements.sendBtn.addEventListener('click', sendMessage);

    // Enter key
    elements.messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    // Voice button
    elements.voiceBtn.addEventListener('click', toggleVoiceRecording);

    // Quick action buttons
    document.querySelectorAll('.quick-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const issue = btn.dataset.issue;
            const message = CONFIG.QUICK_MESSAGES[issue];
            if (message) {
                elements.messageInput.value = message;
                sendMessage();
            }
        });
    });

    // Audio player events
    elements.audioPlayer.addEventListener('play', () => {
        elements.soundWave.classList.add('active');
        elements.avatarContainer.classList.add('speaking');
    });

    elements.audioPlayer.addEventListener('ended', () => {
        elements.soundWave.classList.remove('active');
        elements.avatarContainer.classList.remove('speaking');
    });

    elements.audioPlayer.addEventListener('pause', () => {
        elements.soundWave.classList.remove('active');
        elements.avatarContainer.classList.remove('speaking');
    });
}

// ========================================
// Speech Recognition
// ========================================

function initSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        state.recognition = new SpeechRecognition();
        state.recognition.continuous = false;
        state.recognition.interimResults = true;
        state.recognition.lang = 'ja-JP'; // Japanese

        state.recognition.onresult = (event) => {
            const transcript = Array.from(event.results)
                .map(result => result[0].transcript)
                .join('');

            elements.messageInput.value = transcript;

            if (event.results[0].isFinal) {
                stopRecording();
                // Auto-send after voice input
                setTimeout(() => sendMessage(), 500);
            }
        };

        state.recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            stopRecording();
            if (event.error === 'not-allowed') {
                addSystemMessage('マイクの使用が許可されていません。ブラウザの設定を確認してください。');
            }
        };

        state.recognition.onend = () => {
            stopRecording();
        };
    } else {
        elements.voiceBtn.style.display = 'none';
        console.log('Speech recognition not supported');
    }
}

function toggleVoiceRecording() {
    if (state.isRecording) {
        stopRecording();
    } else {
        startRecording();
    }
}

function startRecording() {
    if (state.recognition && !state.isRecording) {
        state.isRecording = true;
        elements.voiceBtn.classList.add('recording');
        elements.messageInput.placeholder = '聞いています...';
        state.recognition.start();
    }
}

function stopRecording() {
    if (state.recognition && state.isRecording) {
        state.isRecording = false;
        elements.voiceBtn.classList.remove('recording');
        elements.messageInput.placeholder = 'メッセージを入力...';
        try {
            state.recognition.stop();
        } catch (e) {
            // Ignore errors when stopping
        }
    }
}

// ========================================
// Chat Functions
// ========================================

async function sendMessage() {
    const message = elements.messageInput.value.trim();
    if (!message || state.isLoading) return;

    // Clear input
    elements.messageInput.value = '';

    // Add user message to chat
    addMessage('user', message);

    // Add to history
    state.history.push({ role: 'user', content: message });

    // Show loading
    setLoading(true);
    const typingIndicator = addTypingIndicator();

    try {
        const response = await fetch(`${CONFIG.API_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message,
                history: state.history
            })
        });

        if (!response.ok) {
            throw new Error('サーバーエラーが発生しました');
        }

        const data = await response.json();

        // Remove typing indicator
        typingIndicator.remove();

        // Add assistant message
        addMessage('assistant', data.response);

        // Add to history
        state.history.push({ role: 'assistant', content: data.response });

        // Play audio if available
        if (data.audio_url) {
            playAudio(data.audio_url);
        }

    } catch (error) {
        console.error('Error:', error);
        typingIndicator.remove();
        addSystemMessage('申し訳ございません。エラーが発生しました。もう一度お試しください。');
    } finally {
        setLoading(false);
    }
}

function addMessage(role, content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;

    const time = new Date().toLocaleTimeString('ja-JP', {
        hour: '2-digit',
        minute: '2-digit'
    });

    const avatar = role === 'assistant' ? '🌸' : '👤';

    messageDiv.innerHTML = `
        <div class="message-avatar">
            <span>${avatar}</span>
        </div>
        <div class="message-content">
            <div class="message-bubble">
                <p>${escapeHtml(content)}</p>
            </div>
            <span class="message-time">${time}</span>
        </div>
    `;

    elements.chatMessages.appendChild(messageDiv);
    scrollToBottom();
}

function addTypingIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'message assistant';
    indicator.innerHTML = `
        <div class="message-avatar">
            <span>🌸</span>
        </div>
        <div class="message-content">
            <div class="message-bubble">
                <div class="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        </div>
    `;
    elements.chatMessages.appendChild(indicator);
    scrollToBottom();
    return indicator;
}

function addSystemMessage(content) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message assistant';
    messageDiv.innerHTML = `
        <div class="message-avatar">
            <span>⚠️</span>
        </div>
        <div class="message-content">
            <div class="message-bubble" style="background: #FFF5F5; border-color: #FFB7C5;">
                <p>${escapeHtml(content)}</p>
            </div>
        </div>
    `;
    elements.chatMessages.appendChild(messageDiv);
    scrollToBottom();
}

function scrollToBottom() {
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

// ========================================
// Audio Functions
// ========================================

function playAudio(url) {
    elements.audioPlayer.src = url;
    elements.audioPlayer.play().catch(error => {
        console.error('Audio playback error:', error);
    });
}

// ========================================
// UI Functions
// ========================================

function setLoading(loading) {
    state.isLoading = loading;
    elements.sendBtn.disabled = loading;

    if (loading) {
        elements.loadingOverlay.classList.add('active');
    } else {
        elements.loadingOverlay.classList.remove('active');
    }
}

// ========================================
// Utility Functions
// ========================================

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ========================================
// Keyboard Shortcuts
// ========================================

document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd + M to toggle microphone
    if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
        e.preventDefault();
        toggleVoiceRecording();
    }

    // Escape to stop recording
    if (e.key === 'Escape' && state.isRecording) {
        stopRecording();
    }
});

// ========================================
// Health Check
// ========================================

async function checkServerHealth() {
    try {
        const response = await fetch(`${CONFIG.API_URL}/health`);
        if (!response.ok) {
            console.warn('Server may not be running properly');
        }
    } catch (error) {
        console.warn('Cannot connect to server. Make sure the server is running at', CONFIG.API_URL);
        addSystemMessage('サーバーに接続できません。サーバーが起動しているか確認してください。');
    }
}

// Check server health on load
setTimeout(checkServerHealth, 1000);
