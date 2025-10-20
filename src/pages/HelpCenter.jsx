// Enhanced Help Center Page - Phase 38
// Integrated with database-backed help articles and search

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// Simple markdown-like parser for article content
function parseMarkdown(text) {
  if (!text) return '';
  
  return text
    // Headers
    .replace(/^### (.*$)/gim, '<h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-4 mb-2">$1</h3>')
    .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold text-gray-900 dark:text-gray-100 mt-6 mb-3">$1</h2>')
    .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-8 mb-4">$1</h1>')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
    // Code blocks
    .replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-100 dark:bg-slate-700 p-3 rounded my-2 overflow-x-auto"><code>$1</code></pre>')
    // Inline code
    .replace(/`(.*?)`/g, '<code class="bg-gray-100 dark:bg-slate-700 px-1 rounded text-sm">$1</code>')
    // Links
    .replace(/\[([^\]]+)\]\(([^\)]+)\)/g, '<a href="$2" class="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 underline">$1</a>')
    // Lists
    .replace(/^\- (.*$)/gim, '<li class="ml-4">• $1</li>')
    .replace(/^(\d+)\. (.*$)/gim, '<li class="ml-4">$1. $2</li>')
    // Paragraphs
    .replace(/\n\n/g, '</p><p class="text-gray-700 dark:text-gray-300 mb-3">');
}

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [categories, setCategories] = useState([]);
  const [articles, setArticles] = useState([]);
  const [featuredArticles, setFeaturedArticles] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchResults, setSearchResults] = useState(null);
  const [viewMode, setViewMode] = useState('browse'); // 'browse' or 'article'

  // Fetch categories and featured articles on mount
  useEffect(() => {
    fetchHelpData();
  }, []);

  // Fetch articles when category changes
  useEffect(() => {
    if (selectedCategory !== 'all') {
      fetchArticlesByCategory(selectedCategory);
    } else {
      fetchAllArticles();
    }
  }, [selectedCategory]);

  // Search when query changes (with debounce)
  useEffect(() => {
    if (searchQuery.length >= 2) {
      const timer = setTimeout(() => {
        performSearch(searchQuery);
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setSearchResults(null);
    }
  }, [searchQuery]);

  const fetchHelpData = async () => {
    try {
      const response = await fetch('/api/help-center', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setCategories(data.data.categories || []);
        setFeaturedArticles(data.data.featured || []);
      }
    } catch (error) {
      console.error('Error fetching help data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllArticles = async () => {
    try {
      const response = await fetch('/api/help-center/articles?limit=50', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setArticles(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching articles:', error);
    }
  };

  const fetchArticlesByCategory = async (categorySlug) => {
    try {
      const response = await fetch(`/api/help-center/articles?category=${categorySlug}&limit=50`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setArticles(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching articles:', error);
    }
  };

  const performSearch = async (query) => {
    try {
      const response = await fetch(`/api/help-center/search?q=${encodeURIComponent(query)}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setSearchResults(data.data || []);
      }
    } catch (error) {
      console.error('Error searching:', error);
    }
  };

  const openArticle = async (slug) => {
    try {
      const response = await fetch(`/api/help-center/articles/${slug}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setSelectedArticle(data.data);
        setViewMode('article');
      }
    } catch (error) {
      console.error('Error fetching article:', error);
    }
  };

  const markHelpful = async (helpful) => {
    if (!selectedArticle) return;
    try {
      await fetch(`/api/help-center/articles/${selectedArticle.slug}/helpful`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ helpful })
      });
    } catch (error) {
      console.error('Error marking helpful:', error);
    }
  };

  const goBack = () => {
    setViewMode('browse');
    setSelectedArticle(null);
  };

  const quickLinks = [
    { title: 'Dashboard Principal', path: '/', icon: '🏠' },
    { title: 'Transacciones', path: '/transactions', icon: '💳' },
    { title: 'Cuentas', path: '/accounts', icon: '🏦' },
    { title: 'Presupuestos', path: '/budgets', icon: '📋' },
    { title: 'Fiscal', path: '/fiscal', icon: '📄' },
    { title: 'Reglas de Deducibilidad', path: '/deductibility-rules', icon: '✅' },
    { title: 'Facturas', path: '/invoices', icon: '📑' },
    { title: 'Reportes', path: '/reports', icon: '📊' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Cargando ayuda...</p>
        </div>
      </div>
    );
  }

  // Article view
  if (viewMode === 'article' && selectedArticle) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Back button */}
        <button
          onClick={goBack}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
        >
          <span>←</span>
          <span>Volver al Centro de Ayuda</span>
        </button>

        {/* Article header */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg shadow-lg p-8 text-white">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{selectedArticle.category_icon}</span>
            <span className="text-primary-100">{selectedArticle.category_name}</span>
          </div>
          <h1 className="text-3xl font-bold mb-3">{selectedArticle.title}</h1>
          <p className="text-primary-100">{selectedArticle.summary}</p>
          <div className="flex items-center gap-4 mt-4 text-sm text-primary-100">
            <span>⏱️ {selectedArticle.estimated_read_time} min lectura</span>
            <span>👁️ {selectedArticle.view_count} vistas</span>
            <span className={`px-2 py-1 rounded ${
              selectedArticle.difficulty_level === 'beginner' ? 'bg-green-500' :
              selectedArticle.difficulty_level === 'intermediate' ? 'bg-yellow-500' :
              'bg-red-500'
            }`}>
              {selectedArticle.difficulty_level === 'beginner' ? 'Principiante' :
               selectedArticle.difficulty_level === 'intermediate' ? 'Intermedio' : 'Avanzado'}
            </span>
          </div>
        </div>

        {/* Article content */}
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-8">
          <div 
            className="prose dark:prose-invert max-w-none"
            dangerouslySetInnerHTML={{ __html: '<p class="text-gray-700 dark:text-gray-300 mb-3">' + parseMarkdown(selectedArticle.content) + '</p>' }}
          />

          {/* Tags */}
          {selectedArticle.tags && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Etiquetas:</h3>
              <div className="flex flex-wrap gap-2">
                {selectedArticle.tags.split(',').map((tag, i) => (
                  <span key={i} className="px-3 py-1 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 text-sm rounded-full">
                    {tag.trim()}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Helpful feedback */}
          <div className="mt-6 pt-6 border-t border-gray-200 dark:border-slate-700">
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">¿Te fue útil este artículo?</p>
            <div className="flex gap-3">
              <button
                onClick={() => markHelpful(true)}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <span>👍</span>
                <span>Sí, útil ({selectedArticle.helpful_count})</span>
              </button>
              <button
                onClick={() => markHelpful(false)}
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors flex items-center gap-2"
              >
                <span>👎</span>
                <span>No mucho ({selectedArticle.not_helpful_count})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Related articles */}
        {selectedArticle.related && selectedArticle.related.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              Artículos relacionados
            </h2>
            <div className="space-y-3">
              {selectedArticle.related.map(article => (
                <button
                  key={article.slug}
                  onClick={() => openArticle(article.slug)}
                  className="w-full text-left p-4 bg-gray-50 dark:bg-slate-700 hover:bg-primary-50 dark:hover:bg-slate-600 rounded-lg transition-colors"
                >
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                    {article.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {article.summary}
                  </p>
                  <span className="text-xs text-gray-500 dark:text-gray-500 mt-1 inline-block">
                    ⏱️ {article.estimated_read_time} min
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Browse view (main help center)
  const displayArticles = searchResults || articles;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg shadow-lg p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">❓ Centro de Ayuda</h1>
        <p className="text-primary-100">
          Encuentra respuestas a tus preguntas y aprende a usar Avanta Finance
        </p>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar en la ayuda..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100"
          />
          <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-2xl">
            🔍
          </span>
        </div>
        {searchResults && (
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {searchResults.length} resultado(s) encontrado(s)
          </p>
        )}
      </div>

      {/* Quick Links */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          🚀 Accesos Rápidos
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {quickLinks.map(link => (
            <Link
              key={link.path}
              to={link.path}
              className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-slate-700 hover:bg-primary-50 dark:hover:bg-slate-600 rounded-lg transition-colors"
            >
              <span className="text-xl">{link.icon}</span>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {link.title}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Featured Articles */}
      {!searchResults && featuredArticles.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            ⭐ Artículos Destacados
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredArticles.map(article => (
              <button
                key={article.slug}
                onClick={() => openArticle(article.slug)}
                className="text-left p-4 bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 border border-primary-200 dark:border-primary-800 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{article.category_icon}</span>
                  <span className="text-xs text-primary-600 dark:text-primary-400">
                    {article.category_name}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {article.title}
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  {article.summary}
                </p>
                <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                  <span>⏱️ {article.estimated_read_time} min</span>
                  <span>👁️ {article.view_count}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Category Filter */}
      {!searchResults && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            📚 Explorar por Categoría
          </h2>
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
              }`}
            >
              Todas
            </button>
            {categories.map(cat => (
              <button
                key={cat.slug}
                onClick={() => setSelectedCategory(cat.slug)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedCategory === cat.slug
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                }`}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Articles List */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          {searchResults ? '🔍 Resultados de búsqueda' : '📖 Artículos'}
        </h2>
        
        {displayArticles.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No se encontraron artículos
          </div>
        ) : (
          <div className="space-y-3">
            {displayArticles.map(article => (
              <button
                key={article.slug}
                onClick={() => openArticle(article.slug)}
                className="w-full text-left p-4 bg-gray-50 dark:bg-slate-700 hover:bg-primary-50 dark:hover:bg-slate-600 rounded-lg transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{article.category_icon}</span>
                    <span className="text-xs text-gray-600 dark:text-gray-400">
                      {article.category_name}
                    </span>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${
                    article.difficulty_level === 'beginner' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                    article.difficulty_level === 'intermediate' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' :
                    'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                  }`}>
                    {article.difficulty_level === 'beginner' ? 'Principiante' :
                     article.difficulty_level === 'intermediate' ? 'Intermedio' : 'Avanzado'}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  {article.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {article.summary}
                </p>
                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-500">
                  <span>⏱️ {article.estimated_read_time} min</span>
                  <span>👁️ {article.view_count} vistas</span>
                  {article.helpful_count > 0 && (
                    <span>👍 {article.helpful_count}</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Contact Support */}
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
        <h2 className="text-xl font-bold mb-2">¿Necesitas más ayuda?</h2>
        <p className="text-blue-100 mb-4">
          Si no encontraste lo que buscabas, contáctanos para obtener soporte personalizado.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href="mailto:soporte@avanta.com"
            className="px-6 py-3 bg-white text-blue-600 rounded-lg font-medium hover:bg-blue-50 transition-colors"
          >
            📧 Enviar Email
          </a>
          <Link
            to="/"
            className="px-6 py-3 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-medium transition-colors"
          >
            🏠 Volver al Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
