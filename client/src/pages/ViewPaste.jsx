import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Copy, Lock, Eye, Calendar, ArrowLeft } from 'lucide-react';

export default function ViewPaste() {
  const { id } = useParams();
  const [paste, setPaste] = useState(null);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [unlocking, setUnlocking] = useState(false);

  useEffect(() => {
    fetchPaste();
  }, [id]);

  const fetchPaste = async () => {
    try {
      const response = await axios.get(`/api/paste/${id}`);
      setPaste(response.data);
    } catch (error) {
      toast.error(error.response?.data?.error || 'Paste not found');
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async (e) => {
    e.preventDefault();
    setUnlocking(true);
    try {
      const response = await axios.post(`/api/paste/${id}/unlock`, { password });
      setPaste(response.data);
      toast.success('Paste unlocked!');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Invalid password');
    } finally {
      setUnlocking(false);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const copyLink = async () => {
    await copyToClipboard(window.location.href);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="card">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!paste) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="card text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Paste Not Found</h2>
          <p className="text-gray-600 mb-6">This paste does not exist or has been deleted.</p>
          <Link to="/" className="btn-primary inline-block">
            Create New Paste
          </Link>
        </div>
      </div>
    );
  }

  if (paste.passwordProtected && !paste.content) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="card">
          <div className="text-center mb-6">
            <Lock className="w-16 h-16 text-primary-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Password Protected</h2>
            <p className="text-gray-600">This paste is protected. Enter the password to view it.</p>
          </div>

          <form onSubmit={handleUnlock} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password..."
              className="input-field"
              required
              autoFocus
            />
            <button type="submit" disabled={unlocking} className="btn-primary w-full">
              {unlocking ? 'Unlocking...' : 'Unlock Paste'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/" className="text-primary-600 hover:text-primary-700 inline-flex items-center">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-6">
        <Link to="/" className="text-primary-600 hover:text-primary-700 inline-flex items-center mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>
      </div>

      <div className="card">
        {/* Header */}
        <div className="flex justify-between items-start mb-6 pb-6 border-b">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">
              {paste.title || 'Untitled Paste'}
            </h1>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                {new Date(paste.created_at).toLocaleString()}
              </span>
              <span className="flex items-center">
                <Eye className="w-4 h-4 mr-1" />
                {paste.views} views
              </span>
            </div>
          </div>
          <div className="flex space-x-2">
            <button onClick={copyLink} className="btn-secondary flex items-center space-x-2">
              <Copy className="w-4 h-4" />
              <span>Copy Link</span>
            </button>
            <button
              onClick={() => copyToClipboard(paste.content)}
              className="btn-primary flex items-center space-x-2"
            >
              <Copy className="w-4 h-4" />
              <span>Copy Text</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
          <pre className="whitespace-pre-wrap break-words font-mono text-sm text-gray-800">
            {paste.content}
          </pre>
        </div>
      </div>

      <div className="mt-6 text-center">
        <Link to="/" className="btn-primary inline-block">
          Create Your Own Paste
        </Link>
      </div>
    </div>
  );
}
