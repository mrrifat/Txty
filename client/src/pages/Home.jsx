import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Copy, Lock, Clock, Send, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [password, setPassword] = useState('');
  const [expiresIn, setExpiresIn] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!content.trim()) {
      toast.error('Please enter some text');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post('/api/paste', {
        title: title.trim() || null,
        content,
        password: password || null,
        expiresIn: expiresIn || null,
      });

      const pasteId = response.data.id;
      const url = `${window.location.origin}/paste/${pasteId}`;

      // Copy to clipboard
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');

      // Redirect to paste view
      navigate(`/paste/${pasteId}`);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to create paste');
    } finally {
      setLoading(false);
    }
  };

  const handleClearAll = () => {
    setTitle('');
    setContent('');
    setPassword('');
    setExpiresIn('');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="inline-block mb-4">
          <Sparkles className="w-12 h-12 text-primary-600 mx-auto" />
        </div>
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
          Share Text Instantly
        </h1>
        <p className="text-xl text-gray-600">
          Paste your text, get a link, share it with anyone. Simple and secure.
        </p>
      </div>

      {/* Main Form */}
      <div className="card mb-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Title (optional)
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give your paste a title..."
              className="input-field"
              maxLength={100}
            />
          </div>

          {/* Content */}
          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
              Your Text
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste your text here..."
              className="input-field resize-none"
              rows={12}
              required
            />
            <div className="mt-2 text-sm text-gray-500 text-right">
              {content.length} characters
            </div>
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Password Protection */}
            <div>
              <label htmlFor="password" className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Lock className="w-4 h-4 mr-2" />
                Password (optional)
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Protect with password..."
                className="input-field"
              />
            </div>

            {/* Expiration */}
            <div>
              <label htmlFor="expires" className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 mr-2" />
                Expires In
              </label>
              <select
                id="expires"
                value={expiresIn}
                onChange={(e) => setExpiresIn(e.target.value)}
                className="input-field"
              >
                <option value="">Never</option>
                <option value="1h">1 Hour</option>
                <option value="1d">1 Day</option>
                <option value="7d">7 Days</option>
                <option value="30d">30 Days</option>
              </select>
            </div>
          </div>

          {/* Info Box */}
          {!user && (
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
              <p className="text-sm text-primary-800">
                <strong>Tip:</strong> Create an account to manage and delete your pastes later!
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 flex items-center justify-center space-x-2"
            >
              <Send className="w-5 h-5" />
              <span>{loading ? 'Creating...' : 'Create & Share'}</span>
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              className="btn-secondary"
            >
              Clear
            </button>
          </div>
        </form>
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="text-center p-6 bg-white rounded-lg shadow-md">
          <Copy className="w-10 h-10 text-primary-600 mx-auto mb-3" />
          <h3 className="font-semibold mb-2">Instant Sharing</h3>
          <p className="text-sm text-gray-600">Get a shareable link instantly</p>
        </div>
        <div className="text-center p-6 bg-white rounded-lg shadow-md">
          <Lock className="w-10 h-10 text-primary-600 mx-auto mb-3" />
          <h3 className="font-semibold mb-2">Password Protected</h3>
          <p className="text-sm text-gray-600">Keep your pastes secure</p>
        </div>
        <div className="text-center p-6 bg-white rounded-lg shadow-md">
          <Clock className="w-10 h-10 text-primary-600 mx-auto mb-3" />
          <h3 className="font-semibold mb-2">Auto-Expire</h3>
          <p className="text-sm text-gray-600">Set expiration time</p>
        </div>
      </div>
    </div>
  );
}
