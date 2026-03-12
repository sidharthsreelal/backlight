import { getUserProfile } from '../user-profile';
import { saveChatHistory, type ChatEntry } from '../chat-history';

const _appToken = '' as string;

interface ChatMessage {
    role: 'user' | 'assistant';
    text: string;
}

const SYSTEM_PROMPT = `# ROLE AND CONTEXT
You are Backlight, a compassionate AI therapist embedded in a desktop wellness app. Your approach is grounded primarily in Acceptance and Commitment Therapy (ACT), drawing from mindfulness and CBT techniques when helpful. 

Your goal is to help the user build psychological flexibility—the ability to experience thoughts and emotions without being dominated by them, and to take actions aligned with what matters most.

# CONVERSATION DYNAMICS & OUTPUT CONSTRAINTS (CRITICAL)
Your formatting and length must dynamically adapt to the user's energy levels. 
- **Mirror the User's Effort:** If the user sends short, low-effort, or single-sentence messages, your response MUST be equally brief (1-2 sentences maximum). Assume they do not have the energy or desire to read. 
- **Zero Walls of Text:** Never output large paragraphs. Keep responses concise, direct, and to the point while preserving the therapeutic value. 
- **No Repetition:** Do not recycle phrases, sentence structures, or therapeutic buzzwords across your responses. Vary your language naturally.
- **Humane Delivery:** Sound like a real, grounded human. Avoid sounding scripted, robotic, or overly clinical. 

# CORE THERAPEUTIC PROCESSES
Embody these ACT principles naturally in your dialogue, without explicitly naming them to the user:
- **Cognitive Defusion:** Help the user notice thoughts as mental events rather than literal truths. 
- **Acceptance:** Support willingness to experience difficult emotions without avoidance.
- **Present Moment Awareness:** Gently guide attention back to the here and now.
- **Self-as-Context:** Help the user recognize they are more than their thoughts or feelings.
- **Values Clarification:** Invite reflection on what gives their life meaning.
- **Committed Action:** Encourage small, values-aligned actions despite discomfort.

# THERAPEUTIC STYLE & INTERACTION RULES
- Always validate and acknowledge the user's emotional experience first.
- Use reflective listening gently ("It sounds like...", "I notice...", "I'm curious about...").
- Ask open-ended questions that promote exploration rather than providing direct solutions.
- Avoid lectures, long explanations, excessive advice-giving, or trying to instantly "fix" negative emotions.
- Do not diagnose conditions or prescribe medication.

# SAFETY PROTOCOL
If the user expresses suicidal intent, self-harm, or an immediate crisis, respond with compassion and clearly encourage them to reach out to trusted support or a crisis resource such as the 988 Suicide & Crisis Lifeline (or a local equivalent).

# INITIALIZATION
Begin the conversation by using the exact phrase provided to you by the system for this session. Do not add any extra greetings or filler words to it.`;

// Single active request controller — ensures only one in-flight API call at a time
let activeController: AbortController | null = null;

function buildSystemContext(mood: string): string {
    const profile = getUserProfile();
    let context = `[System context: The user selected mood "${mood}" before starting this chat.`;
    if (profile.name) context += ` The user's name is "${profile.name}".`;
    if (profile.aboutMe) context += ` About the user: ${profile.aboutMe}.`;

    if (profile.therapistType === 'curious') {
        context += ` Therapist behavior constraint: You are 'The Curious Therapist'. Mainly ask thoughtful questions to help the user explore their feelings and thoughts deeply. Focus on curiosity and discovery.`;
    } else if (profile.therapistType === 'reflective') {
        context += ` Therapist behavior constraint: You are 'The Reflective Listener'. Focus on validating emotions, paraphrasing what the user says, and making the user feel understood.`;
    } else if (profile.therapistType === 'practical') {
        context += ` Therapist behavior constraint: You are 'The Practical Problem Solver'. Help break down problems and gently guide the user toward actionable steps or new perspectives.`;
    } else if (profile.therapistType === 'calm') {
        context += ` Therapist behavior constraint: You are 'The Calm Grounding Guide'. Help regulate emotions, slow the conversation down, and guide the user toward calmness and mindfulness.`;
    } else if (profile.therapistType === 'challenging') {
        context += ` Therapist behavior constraint: You are 'The Challenging Insight Therapist'. Respectfully challenge assumptions, encourage self-awareness, and gently push the user to reflect more deeply.`;
    } else if (profile.therapistType === 'custom' && profile.therapist) {
        context += ` The user has provided custom instructions for how the therapist should behave: ${profile.therapist}.`;
    } else if (profile.therapist && !profile.therapistType) {
        // Fallback for older stored profiles
        context += ` The user has provided custom instructions for how the therapist should behave: ${profile.therapist}.`;
    }

    context += ` ${SYSTEM_PROMPT}]`;
    return context;
}

async function callAI(messages: ChatMessage[], mood: string): Promise<string> {
    const apiKey = _appToken;
    if (!apiKey) throw new Error('NO_KEY');

    if (activeController) {
        activeController.abort();
        activeController = null;
    }
    activeController = new AbortController();
    const { signal } = activeController;

    const systemContext = buildSystemContext(mood);
    const profile = getUserProfile();

    const isGroq = apiKey.startsWith('gsk_');

    if (isGroq) {
        const groqMessages = [
            { role: 'system', content: systemContext },
            { role: 'user', content: `Hi, I'm feeling ${mood} right now.` },
            {
                role: 'assistant',
                content: messages.length > 0 ? messages[0].text : getInitialResponse(profile.name)
            }
        ];

        for (const msg of messages.slice(1)) {
            groqMessages.push({
                role: msg.role === 'user' ? 'user' : 'assistant',
                content: msg.text
            });
        }

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: groqMessages,
                temperature: 0.8,
                max_tokens: 150,
                top_p: 0.9
            }),
            signal
        });

        activeController = null;
        if (response.status === 429) throw new Error('RATE_LIMIT');
        if (response.status === 401 || response.status === 403 || response.status === 400) throw new Error('BAD_KEY');
        if (!response.ok) throw new Error(`API_ERROR_${response.status}`);

        const data = await response.json();
        return data.choices?.[0]?.message?.content || "I'm here for you. Take a moment to breathe.";
    } else {
        const contents = [
            {
                role: 'user',
                parts: [{ text: `${systemContext}\n\nHi, I'm feeling ${mood} right now.` }]
            },
            {
                role: 'model',
                parts: [{
                    text: messages.length > 0 ? messages[0].text : getInitialResponse(profile.name)
                }]
            }
        ];

        for (const msg of messages.slice(1)) {
            contents.push({
                role: msg.role === 'user' ? 'user' : 'model',
                parts: [{ text: msg.text }]
            });
        }

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents,
                    generationConfig: { temperature: 0.8, maxOutputTokens: 150, topP: 0.9 }
                }),
                signal,
            }
        );

        activeController = null;
        if (response.status === 429) throw new Error('RATE_LIMIT');
        if (response.status === 400) throw new Error('BAD_KEY');
        if (!response.ok) throw new Error(`API_ERROR_${response.status}`);

        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm here for you. Take a moment to breathe.";
    }
}

function getInitialResponse(name?: string): string {
    const phrases = [
        "What's showing up for you right now that you'd like to explore together?",
        "What's on your mind as we begin today?",
        "I'm here. What are you noticing in your thoughts or feelings right now?",
        "Where would you like to start today?",
        "Whatever you're carrying right now, we can look at it together. Where should we begin?",
        "How are things feeling for you in this moment?",
        "Take your time. What feels most important to focus on right now?",
        "What kind of space do you need today?"
    ];
    let phrase = phrases[Math.floor(Math.random() * phrases.length)];
    if (name) phrase = `Hey ${name}. ${phrase}`;
    return phrase;
}

export function renderChatScreen(mood: string, onBack: () => void): HTMLElement {
    const screen = document.createElement('div');
    screen.className = 'screen';

    const profile = getUserProfile();
    const initialMessage = getInitialResponse(profile.name);
    const messages: ChatMessage[] = [
        { role: 'assistant', text: initialMessage }
    ];

    // Chat history entry
    const chatEntry: ChatEntry = {
        id: Date.now().toString(36),
        timestamp: new Date().toISOString(),
        mood,
        messages: [...messages],
    };

    screen.innerHTML = `
    <div class="chat-header-actions">
      <button class="back-btn">← Back</button>
      <button class="chat-end-btn">End Session</button>
    </div>
    <div class="chat-container">
      <div class="chat-messages">
        <div class="chat-bubble assistant">${initialMessage}</div>
      </div>
      <div class="chat-input-row">
        <input type="text" class="chat-input" placeholder="Type how you're feeling..." />
        <button class="chat-send-btn">→</button>
      </div>
    </div>
  `;

    const messagesContainer = screen.querySelector('.chat-messages') as HTMLElement;
    const input = screen.querySelector('.chat-input') as HTMLInputElement;
    const sendBtn = screen.querySelector('.chat-send-btn') as HTMLButtonElement;

    let isSending = false;

    async function sendMessage() {
        const text = input.value.trim();
        if (!text || isSending) return;

        isSending = true;
        sendBtn.disabled = true;
        input.disabled = true;

        messages.push({ role: 'user', text });
        chatEntry.messages.push({ role: 'user', text });
        saveChatHistory(chatEntry);

        const userBubble = document.createElement('div');
        userBubble.className = 'chat-bubble user';
        userBubble.textContent = text;
        messagesContainer.appendChild(userBubble);
        input.value = '';
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        const typingDiv = document.createElement('div');
        typingDiv.className = 'typing-indicator';
        typingDiv.innerHTML = '<span></span><span></span><span></span>';
        messagesContainer.appendChild(typingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        try {
            const response = await callAI(messages, mood);
            typingDiv.remove();

            messages.push({ role: 'assistant', text: response });
            chatEntry.messages.push({ role: 'assistant', text: response });
            saveChatHistory(chatEntry);

            const assistantBubble = document.createElement('div');
            assistantBubble.className = 'chat-bubble assistant';
            assistantBubble.textContent = response;
            messagesContainer.appendChild(assistantBubble);
        } catch (err: any) {
            typingDiv.remove();
            if (err?.name === 'AbortError') return;

            const errorBubble = document.createElement('div');
            errorBubble.className = 'chat-bubble assistant';
            const errMsg = err?.message || '';
            if (errMsg === 'RATE_LIMIT') {
                errorBubble.textContent = "You've hit the API rate limit. Wait a minute and try again — the free tier has limited requests per minute.";
            } else if (errMsg === 'BAD_KEY') {
                errorBubble.textContent = "Your API key seems invalid. Go to ⋯ menu → API Key to update it.";
            } else {
                errorBubble.textContent = "Sorry, I couldn't connect right now. Check your internet connection and try again.";
            }
            messagesContainer.appendChild(errorBubble);
            console.error('Chat error:', err);
        } finally {
            sendBtn.disabled = false;
            input.disabled = false;
            isSending = false;
            input.focus();
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }

    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !isSending) sendMessage();
    });

    screen.querySelector('.back-btn')!.addEventListener('click', () => {
        screen.classList.add('screen-exit');
        setTimeout(onBack, 300);
    });

    screen.querySelector('.chat-end-btn')!.addEventListener('click', () => {
        screen.classList.add('screen-exit');
        setTimeout(onBack, 300);
    });

    setTimeout(() => {
        input.focus();
    }, 100);

    return screen;
}
