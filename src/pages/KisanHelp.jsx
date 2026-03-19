import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { ArrowLeft, Send, Mic, Volume2, VolumeX, Volume1 } from 'lucide-react';
import './KisanHelp.css';

export default function KisanHelp() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  // States
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Refs
  const recognitionRef = useRef(null);
  const messagesEndRef = useRef(null);
  
  // Context Data
  const { language } = useLanguage();
  const currentLangCode = language || localStorage.getItem('appLanguage') || 'en';
  const currentLangLong = currentLangCode === 'hi' ? 'hi-IN' : currentLangCode === 'mr' ? 'mr-IN' : 'en-US';

  // Initial Message Mount
  useEffect(() => {
    const welcomeMsgs = {
      en: "Hello! I am your AI Kisan Help. Ask me anything about your farm, water, or crops.",
      hi: "नमस्ते! मैं आपका एआई किसान सहायक हूँ। खेती, पानी या फसलों के बारे में कुछ भी पूछें।",
      mr: "नमस्कार! मी तुमचा AI किसान सहाय्यक आहे. शेती किंवा पिकांबद्दल काहीही विचारा."
    };
    
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMessages([{
      id: Date.now(),
      text: welcomeMsgs[currentLangCode] || welcomeMsgs['en'],
      sender: 'ai',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }]);
  }, [currentLangCode]);

  // Auto Scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Handle Speech Synthesis
  const speakText = (text) => {
    if (isMuted) return;
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel(); // Clear queue
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = currentLangLong;
    // Slow down slightly for clarity if not English
    if (currentLangCode !== 'en') {
      utterance.rate = 0.9; 
    }
    window.speechSynthesis.speak(utterance);
  };

  const handleReplay = (text) => {
    // If muted, temporarily unmute for the replay
    const wasMuted = isMuted;
    if (wasMuted) setIsMuted(false);
    
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = currentLangLong;
    if (currentLangCode !== 'en') utterance.rate = 0.9;
    
    utterance.onend = () => {
      if (wasMuted) setIsMuted(true);
    };
    window.speechSynthesis.speak(utterance);
  };

  // Response Generator Matrix
  const generateResponse = (input) => {
    const query = input.toLowerCase();
    
    // Fetch user context if available
    let crop = 'your crop';
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const ud = JSON.parse(localStorage.getItem(`farm_${currentUser.email}`) || '{}');
      if (ud && ud.crop) crop = ud.crop;
    } catch { /* empty */ }

    // Intent: Water / Irrigation
    if (query.includes('water') || query.includes('pani') || query.includes('paani') || query.includes('sinchai')) {
      if (currentLangCode === 'hi') return `आज ${crop} को 5-7 लीटर प्रति पौधा पानी दें। नमी चेक करें, बारिश हो तो टालें।`;
      if (currentLangCode === 'mr') return `आज ${crop} ला 5-7 लिटर प्रति झाड पाणी द्या. पाऊस असल्यास पाणी देणे टाळा.`;
      return `Provide 5-7 liters of water per plant for ${crop} today. Skip if it rains.`;
    }

    // Intent: Disease
    if (query.includes('disease') || query.includes('bimari') || query.includes('rog') || query.includes('spot')) {
      if (currentLangCode === 'hi') return `पत्ती पर धब्बे फंगस हो सकते हैं। 2 ग्राम साफ (Saaf) फफूंदनाशक 1 लीटर पानी में मिलाकर स्प्रे करें।`;
      if (currentLangCode === 'mr') return `पानांवरील ठिपके बुरशी असू शकतात. १ लिटर पाण्यात २ ग्रॅम साफ (Saaf) मिसळून फवारणी करा.`;
      return `Spots can be fungal. Spray 2g of Saaf fungicide per liter of water immediately.`;
    }

    // Intent: Fertilizer
    if (query.includes('fertilizer') || query.includes('khad') || query.includes('urvarak') || query.includes('khat')) {
      if (currentLangCode === 'hi') return `${crop} के अच्छे विकास के लिए NPK 19:19:19 का स्प्रे करें।`;
      if (currentLangCode === 'mr') return `${crop} च्या चांगल्या वाढीसाठी NPK 19:19:19 ची फवारणी करा.`;
      return `Spray NPK 19:19:19 for balanced vegetative growth of your ${crop}.`;
    }

    // Intent: Weather
    if (query.includes('weather') || query.includes('mausam') || query.includes('havaman')) {
      if (currentLangCode === 'hi') return `अगले 24 घंटों में हल्की बारिश की संभावना है। स्प्रे या सिंचाई रोक दें।`;
      if (currentLangCode === 'mr') return `पुढील २४ तासात हलक्या पावसाची शक्यता आहे. फवारणी आणि पाणी देणे थांबवा.`;
      return `Light rain expected in next 24 hours. Hold off on any chemical sprays or irrigation.`;
    }

    // Fallback
    if (currentLangCode === 'hi') return `कृपया स्पष्ट सवाल पूछें। मैं खेती, पानी या बीमारी में मदद कर सकता हूँ।`;
    if (currentLangCode === 'mr') return `कृपया स्पष्ट प्रश्न विचारा। मी शेती, पाणी किंवा रोगाशी मदत करू शकतो।`;
    return `Please ask clearly. I can assist with irrigation, diseases, or fertilizers.`;
  };

  const handleSend = (textOverride) => {
    let textToSend = '';
    // Because DOM event could be passed, check if textOverride is string
    if (typeof textOverride === 'string') {
      textToSend = textOverride.trim();
    } else {
      textToSend = inputText.trim();
    }
    
    if (!textToSend) return;

    // Add User Message
    const userMsg = {
      id: Date.now(),
      text: textToSend,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    // Simulate Network/Thinking Delay
    setTimeout(() => {
      const aiReplyText = generateResponse(textToSend);
      
      const aiMsg = {
        id: Date.now() + 1,
        text: aiReplyText,
        sender: 'ai',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
      
      // Speak it automatically
      speakText(aiReplyText);

    }, 1200); // 1.2s delay for realism
  };

  const toggleListen = () => {
    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert("Speech recognition is not supported in your browser.");
      return;
    }

    try {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.lang = currentLangLong;
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setIsListening(false);
        // Auto send voice
        handleSend(transcript);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.error("Microphone access error", e);
      setIsListening(false);
    }
  };

  return (
    <div className="kh-container">
      <header className="kh-header">
        <button className="kh-back-btn" onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={24} />
        </button>
        <div className="kh-header-text">
          <h1 className="kh-title">{t('kisanHelpTitle') || 'Kisan Help AI'}</h1>
          <p className="kh-subtitle">Ask anything about your farm</p>
        </div>
        <div className="kh-controls">
          <button 
            className="kh-icon-action" 
            onClick={() => setIsMuted(!isMuted)}
            title={isMuted ? "Unmute AI Voice" : "Mute AI Voice"}
          >
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </button>
        </div>
      </header>

      <main className="kh-chat-window">
        {messages.map((msg) => (
          <div key={msg.id} className={`kh-message-row ${msg.sender}-row`}>
            <div className={`kh-bubble-wrapper`}>
              <div className={`kh-bubble ${msg.sender}-bubble`}>
                <div className="kh-bubble-text">{msg.text}</div>
                <div className="kh-meta">
                  <span>{msg.timestamp}</span>
                  {msg.sender === 'ai' && (
                    <button 
                      className="kh-replay-btn" 
                      onClick={() => handleReplay(msg.text)}
                      title="Read Aloud"
                    >
                      <Volume1 size={14} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="kh-message-row ai-row">
            <div className="kh-bubble-wrapper">
              <div className="kh-bubble ai-bubble" style={{ padding: '12px', minWidth: '40px' }}>
                <div className="kh-typing" style={{ margin: 0, padding: 0, boxShadow: 'none', backgroundColor: 'transparent' }}>
                  <div className="kh-dot"></div>
                  <div className="kh-dot"></div>
                  <div className="kh-dot"></div>
                </div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      <footer className="kh-input-area">
        <form 
          className="kh-input-form" 
          onSubmit={handleSend}
        >
          <div className="kh-input-wrapper">
            <input
              type="text"
              className="kh-input"
              value={isListening ? "Listening..." : inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={isListening ? "Speak now..." : (t('typeYourMessage') || "Type a message...")}
              disabled={isListening || isTyping}
            />
          </div>
          
          <button 
            type="button" 
            className={`kh-action-btn mic-btn ${isListening ? 'mic-active' : ''}`}
            onClick={toggleListen}
            disabled={isTyping}
            title="Voice Input"
          >
            <Mic size={22} color="white" />
          </button>
          
          <button 
            type="submit" 
            className="kh-action-btn send-btn"
            disabled={(!inputText.trim() && !isListening) || isTyping}
            title="Send"
          >
            <Send size={20} color="white" style={{ marginLeft: '2px' }}/>
          </button>
        </form>
      </footer>
    </div>
  );
}
