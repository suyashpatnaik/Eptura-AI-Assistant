import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Search, RefreshCw, ExternalLink } from 'lucide-react';

const API_BASE_URL = 'http://localhost:3001/api';

const translations = {
  en: {
    quickQuestions: "Quick Questions",
    questions: [
      "How do I create a work order?",
      "What are the different asset modules?",
      "How to set up preventive maintenance?",
      "How do I manage inventory?",
      "What are the security roles?",
      "How to generate reports?"
    ],
    placeholder: "Ask me anything about Eptura Asset Management...",
    sendHint: "Press Enter to send, Shift+Enter for new line",
    welcome: "Hello! I'm your Eptura AI Assistant. I can help you with questions about Eptura Asset Management, work orders, preventive maintenance, and more. What would you like to know?"
  },
  ja: {
    quickQuestions: "クイック質問",
    questions: [
      "作業指示書はどのように作成しますか？",
      "さまざまな資産モジュールとは？",
      "予防保全の設定方法は？",
      "在庫管理はどうしますか？",
      "セキュリティロールとは？",
      "レポートの作成方法は？"
    ],
    placeholder: "Eptura資産管理について何でも聞いてください...",
    sendHint: "Enterで送信、Shift+Enterで改行",
    welcome: "こんにちは！私はエプチュラAIアシスタントです。Eptura資産管理、作業指示書、予防保全などについてご質問にお答えします。何を知りたいですか？"
  }
};

export default function Main() {
  const [language, setLanguage] = useState('en');
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: translations.en.welcome,
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('checking');
  const [sources, setSources] = useState([]);
  const [darkMode, setDarkMode] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    checkBackendConnection();
  }, []);

  const checkBackendConnection = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      if (response.ok) {
        const data = await response.json();
        setConnectionStatus('connected');
        console.log('Backend connected:', data);
      } else {
        setConnectionStatus('error');
      }
    } catch (error) {
      console.error('Backend connection failed:', error);
      setConnectionStatus('error');
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setIsTyping(true);
    setSources([]);

    try {
      const response = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          conversation: messages.slice(-10).map(msg => ({
            role: msg.sender === 'user' ? 'user' : 'assistant',
            content: msg.text
          }))
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      setIsTyping(false);
      
      // Simulate typing effect
      const botMessage = {
        id: Date.now() + 1,
        text: '',
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);

      // Type out the message character by character
      const fullText = data.response;
      let currentText = '';
      
      for (let i = 0; i < fullText.length; i++) {
        currentText += fullText[i];
        setMessages(prev => 
          prev.map(msg => 
            msg.id === botMessage.id 
              ? { ...msg, text: currentText }
              : msg
          )
        );
        await new Promise(resolve => setTimeout(resolve, 20));
      }

      if (data.sources && data.sources.length > 0) {
        setSources(data.sources);
      }

    } catch (error) {
      console.error('Error sending message:', error);
      setIsTyping(false);
      
      const errorMessage = {
        id: Date.now() + 1,
        text: connectionStatus === 'error' 
          ? "I'm having trouble connecting to the backend server. Please make sure the server is running on port 3001."
          : "I'm sorry, I encountered an error while processing your request. Please try again.",
        sender: 'bot',
        timestamp: new Date(),
        isError: true
      };
      
      setMessages(prev => [...prev, errorMessage]);
    }

    setIsLoading(false);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTimestamp = (timestamp) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const quickQuestions = translations[language].questions;

  const handleQuickQuestion = (question) => {
    setInputMessage(question);
  };

  return (
    <div className={darkMode ? "dark-mode" : ""}>
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {language === 'en' ? 'Eptura AI Assistant' : 'エプチュラAIアシスタント'}
                </h1>
                <p className="text-sm text-gray-500 flex items-center space-x-2">
                  <span className={`w-2 h-2 rounded-full ${
                    connectionStatus === 'connected' ? 'bg-green-500' : 
                    connectionStatus === 'checking' ? 'bg-yellow-500' : 'bg-red-500'
                  }`}></span>
                  <span>
                    {connectionStatus === 'connected' ? 'Connected' : 
                     connectionStatus === 'checking' ? 'Connecting...' : 'Connection Error'}
                  </span>
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <button
                onClick={checkBackendConnection}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Refresh connection"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
              <select
                value={language}
                onChange={e => setLanguage(e.target.value)}
                className="border rounded px-2 py-1 text-sm ml-2"
                title="Select language"
              >
                <option value="en">English</option>
                <option value="ja">日本語</option>
              </select>
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="ml-2 p-2 rounded transition-colors"
                title="Toggle dark mode"
              >
                {darkMode ? '🌙' : '☀️'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Quick Questions */}
        {messages.length <= 1 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              {translations[language].quickQuestions}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {translations[language].questions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => handleQuickQuestion(question)}
                  className="text-left p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-sm transition-colors text-sm text-gray-700"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Chat Messages */}
        <div className="bg-white rounded-xl shadow-sm border min-h-[500px] flex flex-col">
          <div className="flex-1 p-4 space-y-4 overflow-y-auto max-h-96">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex space-x-2 max-w-3xl ${message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    message.sender === 'user' 
                      ? 'bg-blue-600' 
                      : message.isError 
                        ? 'bg-red-100' 
                        : 'bg-gray-100'
                  }`}>
                    {message.sender === 'user' ? (
                      <User className="w-4 h-4 text-white" />
                    ) : (
                      <Bot className={`w-4 h-4 ${message.isError ? 'text-red-600' : 'text-gray-600'}`} />
                    )}
                  </div>
                  <div className={`rounded-2xl px-4 py-2 ${
                    message.sender === 'user'
                      ? 'bg-blue-600 text-white'
                      : message.isError
                        ? 'bg-red-50 text-red-800 border border-red-200'
                        : 'bg-gray-100 text-gray-800'
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                    <p className={`text-xs mt-1 ${
                      message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {formatTimestamp(message.timestamp)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="flex space-x-2 max-w-3xl">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-gray-600" />
                  </div>
                  <div className="bg-gray-100 rounded-2xl px-4 py-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Sources */}
          {sources.length > 0 && (
            <div className="border-t p-4 bg-gray-50">
              <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                <Search className="w-4 h-4 mr-1" />
                Sources from Eptura Knowledge Base
              </h4>
              <div className="space-y-1">
                {sources.map((source, index) => (
                  <a
                    key={index}
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-sm text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    <ExternalLink className="w-3 h-3 mr-1" />
                    {source.title}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="border-t p-4">
            <div className="flex space-x-2">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={translations[language].placeholder}
                className="flex-1 resize-none border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                rows="2"
                disabled={isLoading || connectionStatus === 'error'}
              />
              <button
                onClick={sendMessage}
                disabled={isLoading || !inputMessage.trim() || connectionStatus === 'error'}
                className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {translations[language].sendHint}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}