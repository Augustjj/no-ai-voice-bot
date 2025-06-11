import { useState, useEffect, useRef, useCallback } from 'react';
import { useChat, ChatProvider } from '../../utils/chat/ChatContext';

const SILENCE_DELAY = 1000;

const ChatInterfaceContent = ({ onVoiceStart, recognizing, setInput, input }) => {
  const { currentQuestion, messages, startChat, handleResponse } = useChat();
  const [backgroundNoiseEnabled, setBackgroundNoiseEnabled] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAudioInitialized, setIsAudioInitialized] = useState(false);

  const inputRef = useRef('');
  const backgroundAudioRef = useRef(null);
  const silenceTimeoutRef = useRef(null);
  const sendMessageRef = useRef(null);

  // Initialize background audio
  useEffect(() => {
    console.log('Initializing background noise...');
    try {
      backgroundAudioRef.current = new Audio('/assets/urban-noise.mp3');
      console.log('Audio object created:', backgroundAudioRef.current);

      // Add event listeners for audio state
      backgroundAudioRef.current.onloadstart = () => {
        console.log('Background noise loading started');
      };

      backgroundAudioRef.current.oncanplay = () => {
        console.log('Background noise can play');
      };

      backgroundAudioRef.current.onplay = () => {
        console.log('Background noise started playing');
        setIsPlaying(true);
      };
      
      backgroundAudioRef.current.onpause = () => {
        console.log('Background noise paused');
        setIsPlaying(false);
      };
      
      backgroundAudioRef.current.onended = () => {
        console.log('Background noise ended (should not happen due to loop)');
      };
      
      backgroundAudioRef.current.onerror = (error) => {
        console.error('Background noise error:', error);
        console.error('Error code:', backgroundAudioRef.current.error?.code);
        console.error('Error message:', backgroundAudioRef.current.error?.message);
      };

      // Set properties
      backgroundAudioRef.current.loop = true;
      backgroundAudioRef.current.volume = 0.3;
      console.log('Audio properties set - loop:', backgroundAudioRef.current.loop, 'volume:', backgroundAudioRef.current.volume);
      setIsAudioInitialized(true);

    } catch (error) {
      console.error('Error during background noise initialization:', error);
    }

    return () => {
      console.log('Cleaning up background noise...');
      if (backgroundAudioRef.current) {
        backgroundAudioRef.current.pause();
        backgroundAudioRef.current = null;
      }
    };
  }, []);

  // Function to start background noise
  const startBackgroundNoise = useCallback(() => {
    if (backgroundAudioRef.current && !isPlaying && backgroundNoiseEnabled) {
      console.log('Attempting to start background noise...');
      const playPromise = backgroundAudioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('Background noise play promise resolved');
          })
          .catch(error => {
            console.error('Failed to start background noise:', error);
            console.error('Error details:', {
              name: error.name,
              message: error.message,
              stack: error.stack
            });
          });
      }
    }
  }, [isPlaying, backgroundNoiseEnabled]);

  const handleInputChange = e => {
    setInput(e.target.value);
    inputRef.current = e.target.value;
  };

  const handleSendMessage = () => {
    if (input.trim()) {
      handleResponse(input);
      setInput('');
      inputRef.current = '';
    }
  };

  // Keep ref updated
  useEffect(() => {
    sendMessageRef.current = handleSendMessage;
  }, [handleSendMessage]);

  return (
    <main style={{ padding: '2rem', fontFamily: 'Arial' }}>
      <h1>Sonic Store Verification</h1>
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <button onClick={startChat}>Start New Chat</button>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input
            type="checkbox"
            checked={backgroundNoiseEnabled}
            onChange={(e) => {
              setBackgroundNoiseEnabled(e.target.checked);
              if (!e.target.checked && backgroundAudioRef.current) {
                backgroundAudioRef.current.pause();
                setIsPlaying(false);
              } else if (e.target.checked && isAudioInitialized) {
                startBackgroundNoise();
              }
            }}
          />
          Background Noise
        </label>
      </div>
      <div style={{ 
        marginTop: '1rem', 
        padding: '1rem', 
        border: '1px solid #ccc',
        borderRadius: '8px',
        maxHeight: '60vh',
        overflowY: 'auto'
      }}>
        {messages.map((m, i) => (
          <div
            key={i}
            style={{
              marginBottom: '1rem',
              padding: '0.5rem 1rem',
              borderRadius: '8px',
              backgroundColor: m.role === 'assistant' ? '#f0f0f0' : '#e3f2fd',
              maxWidth: '80%',
              marginLeft: m.role === 'assistant' ? '0' : 'auto',
              marginRight: m.role === 'assistant' ? 'auto' : '0'
            }}
          >
            <strong style={{ 
              color: m.role === 'assistant' ? '#2196f3' : '#1976d2',
              display: 'block',
              marginBottom: '0.25rem'
            }}>
              {m.role === 'assistant' ? 'Assistant' : 'You'}
            </strong>
            {m.text}
          </div>
        ))}
      </div>
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '0.5rem',
        marginTop: '1rem',
        padding: '1rem',
        borderTop: '1px solid #ccc'
      }}>
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          placeholder={currentQuestion ? "Type or speak..." : "Click 'Start New Chat' to begin"}
          disabled={!currentQuestion}
          style={{ 
            width: '60%',
            padding: '0.5rem',
            borderRadius: '4px',
            border: '1px solid #ccc',
            opacity: currentQuestion ? 1 : 0.7
          }}
        />
        <button 
          onClick={onVoiceStart}
          disabled={!currentQuestion}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            border: '1px solid #2196f3',
            backgroundColor: recognizing ? '#f44336' : '#2196f3',
            color: 'white',
            cursor: currentQuestion ? 'pointer' : 'not-allowed',
            opacity: currentQuestion ? 1 : 0.7
          }}
        >
          🎤 {recognizing ? 'Stop' : 'Speak'}
        </button>
        <button 
          onClick={handleSendMessage}
          disabled={!currentQuestion}
          style={{
            padding: '0.5rem 1rem',
            borderRadius: '4px',
            border: '1px solid #4caf50',
            backgroundColor: '#4caf50',
            color: 'white',
            cursor: currentQuestion ? 'pointer' : 'not-allowed',
            opacity: currentQuestion ? 1 : 0.7
          }}
        >
          Send
        </button>
      </div>
    </main>
  );
};

export const ChatInterface = ({ recognitionRef }) => {
  const [recognizing, setRecognizing] = useState(false);
  const [input, setInput] = useState('');
  const inputRef = useRef('');
  const silenceTimeoutRef = useRef(null);
  const { handleResponse, currentQuestion } = useChat();

  // Stop recognition when chat ends
  useEffect(() => {
    if (!currentQuestion && recognitionRef.current) {
      recognitionRef.current.stop();
      setRecognizing(false);
      clearTimeout(silenceTimeoutRef.current);
    }
  }, [currentQuestion]);

  const handleVoiceStart = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    if (recognizing) {
      recognition.stop();
    } else if (currentQuestion) {
      inputRef.current = '';
      setInput('');
      clearTimeout(silenceTimeoutRef.current);
      recognition.start();
    }
  }, [recognizing, recognitionRef, currentQuestion]);

  // Speech recognition setup
  useEffect(() => {
    if (!('webkitSpeechRecognition' in window)) return;
    const recognition = new webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    let finalTranscript = '';

    recognition.onresult = event => {
      // Stop if no current question
      if (!currentQuestion) {
        recognition.stop();
        return;
      }

      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) finalTranscript += t + ' ';
        else interim += t;
      }
      const combined = finalTranscript + interim;
      setInput(combined);
      inputRef.current = combined;

      // reset silence timer
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = setTimeout(() => {
        const text = inputRef.current.trim();
        if (text && currentQuestion) {
          console.log('Sending voice input:', text);
          handleResponse(text);
          setInput('');
          inputRef.current = '';
          finalTranscript = '';
        }
        recognition.stop();
      }, SILENCE_DELAY);
    };

    recognition.onstart = () => {
      if (!currentQuestion) {
        recognition.stop();
        return;
      }
      console.log('Recognition started');
      setRecognizing(true);
      finalTranscript = '';
    };

    recognition.onend = () => {
      console.log('Recognition ended');
      setRecognizing(false);
      clearTimeout(silenceTimeoutRef.current);
    };

    recognition.onerror = e => {
      console.error('Speech recognition error:', e);
      setRecognizing(false);
      clearTimeout(silenceTimeoutRef.current);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, [handleResponse, recognitionRef, currentQuestion]);

  return (
    <ChatInterfaceContent 
      onVoiceStart={handleVoiceStart} 
      recognizing={recognizing} 
      setInput={setInput}
      input={input}
    />
  );
}; 