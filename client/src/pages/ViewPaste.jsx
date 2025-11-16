import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Copy, Lock, Eye, Calendar, ArrowLeft, Code, FileText, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSanitize from 'rehype-sanitize';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';

export default function ViewPaste() {
  const { id } = useParams();
  const [paste, setPaste] = useState(null);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [unlocking, setUnlocking] = useState(false);
  const [viewMode, setViewMode] = useState('plain'); // plain, code, markdown
  const [showQR, setShowQR] = useState(false);
  const [language, setLanguage] = useState('javascript');

  useEffect(() => {
    fetchPaste();
  }, [id]);

  useEffect(() => {
    if (viewMode === 'code' && paste?.content) {
      const loadLanguage = async () => {
        try {
          // Dynamically import language component if not JavaScript (which is built-in)
          if (language !== 'javascript' && language !== 'js') {
            await import(`prismjs/components/prism-${language}.js`);
          }
          setTimeout(() => {
            Prism.highlightAll();
          }, 0);
        } catch (error) {
          console.warn(`Failed to load language ${language}, using default highlighting:`, error);
          setTimeout(() => {
            Prism.highlightAll();
          }, 0);
        }
      };
      loadLanguage();
    }
  }, [viewMode, paste, language]);

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
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!paste) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="card">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">Paste Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">This paste does not exist or has been deleted.</p>
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
            <Lock className="w-16 h-16 text-primary-600 dark:text-primary-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">Password Protected</h2>
            <p className="text-gray-600 dark:text-gray-400">This paste is protected. Enter the password to view it.</p>
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
            <Link to="/" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 inline-flex items-center">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="mb-6">
        <Link to="/" className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 inline-flex items-center mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>
      </div>

      <div className="card">
        {/* Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start mb-6 pb-6 border-b dark:border-gray-700">
          <div className="mb-4 lg:mb-0">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
              {paste.title || 'Untitled Paste'}
            </h1>
            <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
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

          <div className="flex flex-wrap gap-2">
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
            <button
              onClick={() => setShowQR(!showQR)}
              className="btn-secondary flex items-center space-x-2"
            >
              <QrCode className="w-4 h-4" />
              <span>QR Code</span>
            </button>
          </div>
        </div>

        {/* QR Code Modal */}
        {showQR && (
          <div className="mb-6 p-6 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex flex-col items-center">
              <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-100">
                Scan to view this paste
              </h3>
              <div className="bg-white p-4 rounded-lg">
                <QRCodeSVG value={window.location.href} size={200} level="H" />
              </div>
              <button
                onClick={() => setShowQR(false)}
                className="mt-4 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* View Mode Tabs */}
        <div className="flex space-x-2 mb-4 border-b dark:border-gray-700">
          <button
            onClick={() => setViewMode('plain')}
            className={`flex items-center space-x-2 px-4 py-2 border-b-2 transition-colors ${
              viewMode === 'plain'
                ? 'border-primary-600 dark:border-primary-400 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Plain Text</span>
          </button>
          <button
            onClick={() => setViewMode('code')}
            className={`flex items-center space-x-2 px-4 py-2 border-b-2 transition-colors ${
              viewMode === 'code'
                ? 'border-primary-600 dark:border-primary-400 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <Code className="w-4 h-4" />
            <span>Code</span>
          </button>
          <button
            onClick={() => setViewMode('markdown')}
            className={`flex items-center space-x-2 px-4 py-2 border-b-2 transition-colors ${
              viewMode === 'markdown'
                ? 'border-primary-600 dark:border-primary-400 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Markdown</span>
          </button>
        </div>

        {/* Language Selector for Code View */}
        {viewMode === 'code' && (
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-3">
              Language:
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="input-field inline-block w-auto"
            >
              <option value="javascript">JavaScript</option>
              <option value="typescript">TypeScript</option>
              <option value="jsx">JSX</option>
              <option value="tsx">TSX</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="c">C</option>
              <option value="cpp">C++</option>
              <option value="csharp">C#</option>
              <option value="go">Go</option>
              <option value="rust">Rust</option>
              <option value="php">PHP</option>
              <option value="ruby">Ruby</option>
              <option value="sql">SQL</option>
              <option value="json">JSON</option>
              <option value="yaml">YAML</option>
              <option value="markdown">Markdown</option>
              <option value="bash">Bash</option>
              <option value="css">CSS</option>
              <option value="html">HTML</option>
            </select>
          </div>
        )}

        {/* Content */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          {viewMode === 'plain' && (
            <pre className="whitespace-pre-wrap break-words font-mono text-sm text-gray-800 dark:text-gray-200">
              {paste.content}
            </pre>
          )}

          {viewMode === 'code' && (
            <pre className="!bg-transparent !p-0 !m-0">
              <code className={`language-${language}`}>{paste.content}</code>
            </pre>
          )}

          {viewMode === 'markdown' && (
            <div className="prose dark:prose-invert max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeSanitize]}
              >
                {paste.content}
              </ReactMarkdown>
            </div>
          )}
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
