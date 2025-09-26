import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

// Configure axios to include credentials
axios.defaults.withCredentials = true;

interface Khatira {
  id: number;
  content: string;
  author?: string;
  upvotes: number;
  downvotes: number;
  user_vote?: string | null;
  created_at: string;
}

const HomePage: React.FC = () => {
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [khawatir, setKhawatir] = useState<Khatira[]>([]);
  const [phase, setPhase] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadKhawatir();
    // Set a unique user ID cookie if it doesn't exist
    if (!Cookies.get('user_id')) {
      Cookies.set('user_id', Date.now().toString(), { expires: 30 });
    }
  }, []);

  const loadKhawatir = async () => {
    try {
      const response = await axios.get('https://khatira-tlm.vercel.app/api/khawatir');
      setKhawatir(response.data.khawatir);
      setPhase(response.data.phase);
    } catch (error) {
      console.error('Error loading khawatir:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !content.trim()) return;

    setLoading(true);
    try {
      await axios.post('https://khatira-tlm.vercel.app/api/submit', {
        name: name.trim(),
        content: content.trim()
      });
      
      setName('');
      setContent('');
      alert('تم إرسال خاطرتك بنجاح!');
      loadKhawatir();
    } catch (error) {
      console.error('Error submitting khatira:', error);
      alert('حدث خطأ في الإرسال. يرجى المحاولة مرة أخرى.');
    }
    setLoading(false);
  };

  const handleVote = async (khatiralId: number, voteType: 'up' | 'down') => {
    if (phase !== 2) return;

    try {
      await axios.post('https://khatira-tlm.vercel.app/api/vote', {
        khatira_id: khatiralId,
        vote_type: voteType
      });
      loadKhawatir();
    } catch (error: any) {
      if (error.response?.status === 403) {
        alert('لقد قمت بالتصويت على هذه الخاطرة من قبل');
      } else {
        alert('حدث خطأ في التصويت');
      }
    }
  };

  const getPhaseDescription = () => {
    switch (phase) {
      case 1:
        return 'مرحبا بكم في فعالية الخواطر - يمكنكم إرسال خواطركم الآن';
      case 2:
        return 'مرحلة التصويت - اختر أجمل الخواطر بتصويتك';
      case 3:
        return 'النتائج النهائية - إليكم الفائزين';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen w-full" dir="rtl" style={{background: 'var(--gradient-bg)'}}>
      {/* Header */}
      <header className="glass-effect shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center animate-fade-in">
            <div className="relative mb-6 animate-float">
              <img 
                src="/logo.png" 
                alt="Logo" 
                className="h-24 w-24 rounded-full shadow-glow-green border-4 border-white"
              />
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full animate-pulse-green"></div>
            </div>
            <h1 className="font-arabic-title text-4xl md:text-6xl gradient-text mb-6 text-center animate-slide-up">
              جمعية شموع تلمسان الثقافية
            </h1>
            <div className="phase-indicator animate-bounce-subtle font-arabic-subtitle">
              {getPhaseDescription()}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 w-full max-w-7xl">
        {/* Submission Form - Only show in phase 1 */}
        {phase === 1 && (
          <div className="w-full max-w-4xl mx-auto mb-16 animate-slide-up">
            <div className="card">
              <h2 className="font-arabic-title text-3xl md:text-4xl text-center mb-10 gradient-text">
                شاركنا خاطرتك الجميلة ✨
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-10">
                <div className="animate-fade-in">
                  <label className="block text-right text-gray-700 font-arabic-subtitle mb-4">
                    الاسم الكريم
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input-field font-arabic-body"
                    placeholder="اكتب اسمك الكريم هنا..."
                    required
                  />
                </div>
                
                <div className="animate-fade-in">
                  <label className="block text-right text-gray-700 font-arabic-subtitle mb-4">
                    خاطرتك المميزة
                  </label>
                  <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={8}
                    className="textarea-field font-arabic-cursive"
                    placeholder="اكتب خاطرتك الجميلة والمعبرة هنا..."
                    required
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full text-xl py-5 disabled:opacity-50 disabled:cursor-not-allowed animate-pulse-green font-arabic-button"
                >
                  {loading ? 'جارِ الإرسال...' : '✨ إرسال الخاطرة المميزة ✨'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Display Khawatir */}
        {phase >= 2 && khawatir.length > 0 && (
          <div className="w-full max-w-6xl mx-auto animate-fade-in">
            <h2 className="font-arabic-title text-4xl md:text-5xl text-center mb-16 gradient-text">
              {phase === 2 ? '🌟 الخواطر المشاركة الرائعة 🌟' : '🏆 النتائج النهائية المشرفة 🏆'}
            </h2>
            
            <div className="grid gap-10">
              {khawatir.map((khatira, index) => (
                <div
                  key={khatira.id}
                  className="khatira-card animate-slide-up"
                  style={{animationDelay: `${index * 0.1}s`}}
                >
                  {phase === 3 && (
                    <div className="flex justify-between items-center mb-8 pb-6 border-b-2 border-green-100">
                      <div className="flex items-center space-x-4">
                        <div className="text-4xl animate-bounce-subtle">
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅'}
                        </div>
                        <div className="font-arabic-title text-2xl md:text-3xl gradient-text">
                          المركز #{index + 1}
                        </div>
                      </div>
                      <div className="font-arabic-subtitle text-lg font-semibold text-green-600 bg-green-100 px-6 py-3 rounded-full">
                        النقاط: {khatira.upvotes - khatira.downvotes}
                      </div>
                    </div>
                  )}
                  
                  <div className="mb-8 text-center">
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-8 rounded-2xl border border-green-100">
                      <p className="font-arabic-cursive text-gray-800 leading-loose text-lg md:text-xl">
                        "{khatira.content}"
                      </p>
                    </div>
                  </div>
                  
                  {phase === 3 && khatira.author && (
                    <div className="text-center mb-8">
                      <span className="font-arabic-subtitle text-xl md:text-2xl font-bold text-green-700 bg-green-50 px-8 py-4 rounded-full border-2 border-green-200">
                        ✍️ {khatira.author}
                      </span>
                    </div>
                  )}
                  
                  {/* Voting buttons for phase 2 */}
                  {phase === 2 && (
                    <div className="flex justify-center items-center space-x-10 pt-8 border-t-2 border-green-100">
                      <button
                        onClick={() => handleVote(khatira.id, 'down')}
                        disabled={khatira.user_vote !== null}
                        className={`vote-button font-arabic-button text-xl ${
                          khatira.user_vote === 'down' ? 'vote-down-active' : 
                          khatira.user_vote === null ? 'vote-down' : 
                          'vote-button bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <span className="text-3xl">👎</span>
                        <span className="font-bold text-xl">{khatira.downvotes}</span>
                      </button>
                      
                      <button
                        onClick={() => handleVote(khatira.id, 'up')}
                        disabled={khatira.user_vote !== null}
                        className={`vote-button font-arabic-button text-xl ${
                          khatira.user_vote === 'up' ? 'vote-up-active' : 
                          khatira.user_vote === null ? 'vote-up' : 
                          'vote-button bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <span className="text-3xl">👍</span>
                        <span className="font-bold text-xl">{khatira.upvotes}</span>
                      </button>
                    </div>
                  )}
                  
                  {phase === 3 && (
                    <div className="flex justify-center items-center space-x-10 pt-8 border-t-2 border-green-100">
                      <div className="flex items-center space-x-4 text-red-600 bg-red-50 px-6 py-4 rounded-2xl border-2 border-red-200">
                        <span className="text-2xl">👎</span>
                        <span className="font-arabic-button font-bold text-xl">{khatira.downvotes}</span>
                      </div>
                      <div className="flex items-center space-x-4 text-green-600 bg-green-50 px-6 py-4 rounded-2xl border-2 border-green-200">
                        <span className="text-2xl">👍</span>
                        <span className="font-arabic-button font-bold text-xl">{khatira.upvotes}</span>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {phase >= 2 && khawatir.length === 0 && (
          <div className="text-center py-24 animate-fade-in">
            <div className="text-9xl mb-8 animate-bounce-subtle">🌸</div>
            <p className="font-arabic-title text-3xl md:text-4xl text-gray-600 mb-6">لا توجد خواطر للعرض حالياً</p>
            <p className="font-arabic-body text-lg md:text-xl text-gray-500 mt-6">انتظرونا قريباً بخواطر جميلة ومعبرة</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="glass-effect mt-24 py-10 text-center">
        <p className="font-arabic-subtitle text-gray-600 text-lg">
          جمعية شموع تلمسان الثقافية - فعالية الخواطر الثقافية ✨
        </p>
      </footer>
    </div>
  );
};


export default HomePage;
