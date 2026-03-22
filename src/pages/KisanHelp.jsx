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

    // Intent: Disease / Pests
    if (query.includes('disease') || query.includes('bimari') || query.includes('rog') || query.includes('spot') || query.includes('yellow') || query.includes('pila') || query.includes('pivali') || query.includes('pest') || query.includes('keeda') || query.includes('kid')) {
      if (currentLangCode === 'hi') return `पत्ती पर धब्बे या पीलापन फंगस या कीड़े हो सकते हैं। 2 ग्राम साफ (Saaf) या नीम तेल 1 लीटर पानी में मिलाकर स्प्रे करें।`;
      if (currentLangCode === 'mr') return `पानांवरील ठिपके किंवा पिवळेपणा बुरशी किंवा कीड असू शकतात. १ लिटर पाण्यात २ ग्रॅम साफ (Saaf) किंवा कडुनिंबाचे तेल मिसळून फवारणी करा.`;
      return `Spots or yellowing can be fungal or pest-related. Spray 2g of Saaf fungicide or Neem oil per liter of water immediately.`;
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

    // Intent: Yield / Growth
    if (query.includes('yield') || query.includes('grow') || query.includes('upaj') || query.includes('utpadan')) {
      if (currentLangCode === 'hi') return `उत्पादन बढ़ाने के लिए सही समय पर खाद और पानी दें, और खरपतवार नियंत्रण करें।`;
      if (currentLangCode === 'mr') return `उत्पादन वाढवण्यासाठी योग्य वेळी खत आणि पाणी द्या, आणि तण नियंत्रण करा.`;
      return `To increase yield, ensure timely fertilization, proper irrigation, and weed control.`;
    }
    
    // Intent: Soil
    if (query.includes('soil') || query.includes('mitti') || query.includes('mati') || query.includes('zameen')) {
      if (currentLangCode === 'hi') return `मिट्टी की जांच कराएं। आम तौर पर बुवाई से पहले वर्मीकम्पोस्ट या गोबर की खाद मिलाना फायदेमंद होता है।`;
      if (currentLangCode === 'mr') return `माती परीक्षण करा. साधारणपणे पेरणीपूर्वी गांडूळ खत किंवा शेणखत मिसळणे फायदेशीर ठरते.`;
      return `Get your soil tested. Generally, adding vermicompost or FYM before sowing is beneficial.`;
    }
    
    // Intent: Market / Price
    if (query.includes('price') || query.includes('market') || query.includes('bhav') || query.includes('mandi') || query.includes('bazaar')) {
      if (currentLangCode === 'hi') return `बाज़ार भाव प्रतिदिन बदलते हैं। कृपया ताज़ा मंडी भाव के लिए नज़दीकी मंडी या कृषि ऐप देखें।`;
      if (currentLangCode === 'mr') return `बाजारभाव दररोज बदलतात. कृपया ताज्या बाजारभावासाठी जवळची बाजार समिती किंवा कृषी ॲप पहा.`;
      return `Market prices fluctuate daily. Please check your local mandi or agricultural app for the latest rates.`;
    }

    // Fallback
    if (currentLangCode === 'hi') return `मुझे यह समझने में कठिनाई हो रही है। क्या आप पानी, बीमारी, या खाद के बारे में पूछना चाहते हैं?`;
    if (currentLangCode === 'mr') return `मला हे समजण्यात अडचण येत आहे. तुम्हाला पाणी, रोग किंवा खताबद्दल विचारायचे आहे का?`;
    return `I'm having trouble understanding. Did you mean to ask about water, diseases, yield, or fertilizers?`;
  };

  const handleSend = (textOverride) => {
    let textToSend = '';
    // Because DOM event could be passed, check if textOverride is string
    if (typeof textOverride === 'string') {
      textToSend = textOverride.trim();
    } else {
      if (textOverride && typeof textOverride.preventDefault === 'function') {
        textOverride.preventDefault();
      }
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
            <Mic size={22} />
          </button>
          
          <button 
            type="submit" 
            className="kh-action-btn send-btn"
            disabled={(!inputText.trim() && !isListening) || isTyping}
            title="Send"
          >
            <Send size={20} style={{ marginLeft: '2px' }}/>
          </button>
        </form>
      </footer>
    </div>
  );
}
