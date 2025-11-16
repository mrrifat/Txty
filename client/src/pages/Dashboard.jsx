import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FileText, Trash2, Eye, Calendar, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const [pastes, setPastes] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchPastes();
  }, [user, navigate]);

  const fetchPastes = async () => {
    try {
      const response = await axios.get('/api/paste/user/my-pastes');
      setPastes(response.data);
    } catch (error) {
      toast.error('Failed to load pastes');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this paste?')) return;

    try {
      await axios.delete(`/api/paste/${id}`);
      setPastes(pastes.filter((p) => p.id !== id));
      toast.success('Paste deleted successfully');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete paste');
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">My Pastes</h1>
        <p className="text-gray-600">Manage all your saved pastes</p>
      </div>

      {loading ? (
        <div className="card">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      ) : pastes.length === 0 ? (
        <div className="card text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">No pastes yet</h2>
          <p className="text-gray-600 mb-6">Create your first paste to get started</p>
          <Link to="/" className="btn-primary inline-block">
            Create Paste
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {pastes.map((paste) => (
            <div key={paste.id} className="card hover:shadow-xl transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <Link
                    to={`/paste/${paste.id}`}
                    className="text-lg font-semibold text-gray-800 hover:text-primary-600 transition-colors"
                  >
                    {paste.title || 'Untitled Paste'}
                  </Link>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                    <span className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(paste.created_at).toLocaleDateString()}
                    </span>
                    <span className="flex items-center">
                      <Eye className="w-4 h-4 mr-1" />
                      {paste.views} views
                    </span>
                    {paste.expires_at && (
                      <span className="text-orange-600">
                        Expires: {new Date(paste.expires_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Link
                    to={`/paste/${paste.id}`}
                    className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    title="View"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </Link>
                  <button
                    onClick={() => handleDelete(paste.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
