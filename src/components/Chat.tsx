// src/components/Chat.tsx
import { useState } from 'react';
import { sendMessage } from '../utils/openrouterAuth';
import { ModelPicker } from './ModelPicker';

type Props = {
  apiKey: string;
  onDisconnect: () => void;
};

export const Chat = ({ apiKey, onDisconnect }: Props) => {
  const [model, setModel] = useState('openai/gpt-4o-mini');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user' as const, content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setError(null);
    try {
      const reply = await sendMessage(apiKey, model, [...messages, userMsg]);
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-card glass">
      <h2 className="title">OpenRouter Chat</h2>

      {/* Model selector */}
      <div className="model-select mb-3">
        <label className="block text-sm opacity-70 mb-1">Model:</label>
        <ModelPicker value={model} onChange={setModel} apiKey={apiKey} />
      </div>

      {/* Message list */}
      <div className="messages p-3 mb-3 overflow-y-auto" style={{ maxHeight: '400px' }}>
        {messages.map((msg, i) => (
          <div key={i} className={msg.role === 'assistant' ? 'assistant-msg' : 'user-msg'}>
            <strong>{msg.role === 'assistant' ? '🤖' : '🧑'}:</strong> {msg.content}
          </div>
        ))}
        {loading && <div className="loading">Generating response...</div>}
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {/* Input & buttons */}
      <div className="flex gap-2 items-center">
        <input
          type="text"
          className="input flex-1"
          placeholder="Type a message..."
          value={input}
          disabled={loading}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !loading && handleSend()}
        />
        <button className="btn primary" onClick={handleSend} disabled={loading}>
          Send
        </button>
        <button className="btn outline" onClick={onDisconnect} type="button">
          Disconnect OpenRouter
        </button>
      </div>
    </div>
  );
};
