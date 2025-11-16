import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Eye, Heart, Calendar, Code, Tag, TrendingUp } from 'lucide-react';

export default function Explore() {
  const [pastes, setPastes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [selectedTag, setSelectedTag] = useState('');
  const [page, setPage] = useState(1);

  const languages = [
    'javascript', 'python', 'java', 'cpp', 'go', 'rust',
    'typescript', 'php', 'ruby', 'sql', 'html', 'css'
  ];

  useEffect(() => {
    fetchPastes();
  }, [page, selectedLanguage, selectedTag]);

  const fetchPastes = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (selectedLanguage) params.append('language', selectedLanguage);
      if (selectedTag) params.append('tag', selectedTag);

      const response = await axios.get(`/api/paste/feed/public?${params}`);
      setPastes(response.data);
    } catch (error) {
      toast.error('Failed to load pastes');
    } finally {
      setLoading(false);
    }
  };

  const getLanguageColor = (lang) => {
    const colors = {
      javascript: 'bg-yellow-500',
      typescript: 'bg-blue-500',
      python: 'bg-green-500',
      java: 'bg-orange-500',
      cpp: 'bg-purple-500',
      go: 'bg-cyan-500',
      rust: 'bg-red-500',
      php: 'bg-indigo-500',
      ruby: 'bg-red-600',
      sql: 'bg-pink-500',
      html: 'bg-orange-400',
      css: 'bg-blue-400'
    };
    return colors[lang] || 'bg-gray-500';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2 flex items-center">
          <TrendingUp className="w-8 h-8 mr-3 text-primary-600 dark:text-primary-400" />
          Explore Public Pastes
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Discover code snippets and pastes shared by the community
        </p>
      </div>

      {/* Filters */}
      <div className="mb-8 flex flex-wrap gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Filter by Language
          </label>
          <select
            value={selectedLanguage}
            onChange={(e) => {
              setSelectedLanguage(e.target.value);
              setPage(1);
            }}
            className="input-field"
          >
            <option value="">All Languages</option>
            {languages.map(lang => (
              <option key={lang} value={lang}>
                {lang.charAt(0).toUpperCase() + lang.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {selectedTag && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Current Tag
            </label>
            <div className="flex items-center gap-2">
              <span className="px-3 py-2 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 rounded-lg">
                #{selectedTag}
              </span>
              <button
                onClick={() => {
                  setSelectedTag('');
                  setPage(1);
                }}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Pastes Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            </div>
          ))}
        </div>
      ) : pastes.length === 0 ? (
        <div className="card text-center py-12">
          <Code className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
            No pastes found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Try adjusting your filters or check back later
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pastes.map(paste => (
              <Link
                key={paste.id}
                to={`/paste/${paste.custom_url || paste.id}`}
                className="card hover:shadow-xl transition-shadow duration-200 group"
              >
                {/* Title */}
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors truncate">
                  {paste.title || 'Untitled Paste'}
                </h3>

                {/* Language Badge */}
                <div className="mb-3">
                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs text-white ${getLanguageColor(paste.language)}`}>
                    <Code className="w-3 h-3 mr-1" />
                    {paste.language || 'plaintext'}
                  </span>
                </div>

                {/* Tags */}
                {paste.tags && paste.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {paste.tags.slice(0, 3).map(tag => (
                      <button
                        key={tag}
                        onClick={(e) => {
                          e.preventDefault();
                          setSelectedTag(tag);
                          setPage(1);
                        }}
                        className="inline-flex items-center px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs hover:bg-gray-200 dark:hover:bg-gray-600"
                      >
                        <Tag className="w-3 h-3 mr-1" />
                        {tag}
                      </button>
                    ))}
                  </div>
                )}

                {/* Metadata */}
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                  <div className="flex items-center space-x-3">
                    <span className="flex items-center">
                      <Eye className="w-4 h-4 mr-1" />
                      {paste.views}
                    </span>
                    <span className="flex items-center">
                      <Heart className="w-4 h-4 mr-1" />
                      {paste.likes}
                    </span>
                  </div>
                  <span className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    {new Date(paste.created_at).toLocaleDateString()}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {/* Pagination */}
          <div className="mt-8 flex justify-center gap-4">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="flex items-center text-gray-700 dark:text-gray-300">
              Page {page}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={pastes.length < 20}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
