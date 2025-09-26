import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Configure axios to include credentials
axios.defaults.withCredentials = true;

interface AdminKhatira {
  id: number;
  author: string;
  content: string;
  upvotes: number;
  downvotes: number;
  score: number;
  created_at: string;
}

const AdminPage: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [currentPhase, setCurrentPhase] = useState(1);
  const [khawatir, setKhawatir] = useState<AdminKhatira[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      loadCurrentPhase();
      loadKhawatir();
    }
  }, [isAuthenticated]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await axios.post('https://khatira-tlm.vercel.app/api/admin/login', {
        password: password
      });
      setIsAuthenticated(true);
      setPassword('');
    } catch (error) {
      alert('كلمة مرور خاطئة');
    }
    
    setLoading(false);
  };

  const loadCurrentPhase = async () => {
    try {
      const response = await axios.get('https://khatira-tlm.vercel.app/api/admin/phase');
      setCurrentPhase(response.data.current_phase);
    } catch (error) {
      console.error('Error loading current phase:', error);
    }
  };

  const loadKhawatir = async () => {
    try {
      const response = await axios.get('https://khatira-tlm.vercel.app/api/admin/khawatir');
      setKhawatir(response.data.khawatir);
    } catch (error) {
      console.error('Error loading khawatir:', error);
    }
  };

  const changePhase = async (newPhase: number) => {
    try {
      await axios.post('https://khatira-tlm.vercel.app/api/admin/phase', {
        phase: newPhase
      });
      setCurrentPhase(newPhase);
      alert('تم تغيير المرحلة بنجاح');
    } catch (error) {
      alert('حدث خطأ في تغيير المرحلة');
    }
  };

  const deleteKhatira = async (id: number) => {
    setLoading(true);
    try {
      await axios.delete(`https://khatira-tlm.vercel.app/api/admin/khawatir/${id}`);
      setKhawatir(khawatir.filter(k => k.id !== id));
      setShowDeleteConfirm(null);
      alert('تم حذف الخاطرة بنجاح');
    } catch (error) {
      alert('حدث خطأ في حذف الخاطرة');
    }
    setLoading(false);
  };

  const clearAllKhawatir = async () => {
    setLoading(true);
    try {
      await axios.delete('https://khatira-tlm.vercel.app/api/admin/khawatir/clear-all');
      setKhawatir([]);
      setShowClearAllConfirm(false);
      alert('تم حذف جميع الخواطر بنجاح');
    } catch (error) {
      alert('حدث خطأ في حذف جميع الخواطر');
    }
    setLoading(false);
  };

  const getPhaseDescription = (phase: number) => {
    switch (phase) {
      case 1:
        return 'المرحلة الأولى - استقبال الخواطر';
      case 2:
        return 'المرحلة الثانية - التصويت على الخواطر';
      case 3:
        return 'المرحلة الثالثة - إعلان النتائج';
      default:
        return '';
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center" dir="rtl" style={{background: 'var(--gradient-bg)'}}>
        <div className="card max-w-md w-full mx-4 animate-slide-up">
          <div className="text-center mb-10">
            <div className="text-7xl mb-6 animate-bounce-subtle">🔐</div>
            <h1 className="font-arabic-title text-4xl md:text-5xl gradient-text">
              لوحة تحكم المشرف
            </h1>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-8">
            <div>
              <label className="block text-right text-gray-700 font-arabic-subtitle mb-4">
                كلمة المرور السرية
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field font-arabic-body"
                placeholder="ادخل كلمة المرور..."
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full text-xl disabled:opacity-50 disabled:cursor-not-allowed font-arabic-button"
            >
              {loading ? 'جارِ التحقق...' : '🚀 دخول لوحة التحكم'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full" dir="rtl" style={{background: 'var(--gradient-bg)'}}>
      {/* Header */}
      <header className="glass-effect shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-6">
              <div className="text-5xl animate-bounce-subtle">👨‍💼</div>
              <h1 className="font-arabic-title text-4xl md:text-5xl gradient-text">
                لوحة تحكم المشرف
              </h1>
            </div>
            <div className="phase-indicator font-arabic-subtitle">
              {getPhaseDescription(currentPhase)}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 w-full max-w-7xl">
        {/* Phase Control */}
        <div className="card mb-12 animate-fade-in">
          <h2 className="font-arabic-title text-3xl md:text-4xl mb-10 gradient-text text-center">
            🎛️ إدارة مراحل الفعالية الثقافية
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map((phase) => (
              <div
                key={phase}
                className={`admin-card ${
                  currentPhase === phase ? 'admin-card-active' : 'admin-card-inactive'
                } animate-slide-up`}
                style={{animationDelay: `${phase * 0.1}s`}}
              >
                <div className="text-center mb-6">
                  <div className="text-5xl mb-4">
                    {phase === 1 ? '📝' : phase === 2 ? '🗳️' : '🏆'}
                  </div>
                  <h3 className="font-arabic-subtitle text-xl md:text-2xl mb-4">
                    {getPhaseDescription(phase)}
                  </h3>
                </div>
                
                <div className="font-arabic-body text-sm text-gray-600 mb-8 text-center leading-relaxed">
                  {phase === 1 && 'يمكن للمستخدمين إرسال الخواطر فقط'}
                  {phase === 2 && 'عرض الخواطر والتصويت عليها'}
                  {phase === 3 && 'إعلان النتائج النهائية'}
                </div>
                
                <button
                  onClick={() => changePhase(phase)}
                  disabled={currentPhase === phase}
                  className={`w-full py-4 px-6 rounded-xl font-arabic-button font-bold transition-all duration-300 ${
                    currentPhase === phase
                      ? 'btn-primary cursor-default'
                      : 'btn-secondary hover:scale-105'
                  }`}
                >
                  {currentPhase === phase ? '✅ المرحلة الحالية' : '🚀 تفعيل المرحلة'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          <div className="stat-card animate-slide-up" style={{animationDelay: '0.1s'}}>
            <div className="text-6xl mb-6">📄</div>
            <div className="text-5xl font-bold gradient-text mb-4">
              {khawatir.length}
            </div>
            <div className="text-gray-600 font-arabic-subtitle">إجمالي الخواطر</div>
          </div>
          
          <div className="stat-card animate-slide-up" style={{animationDelay: '0.2s'}}>
            <div className="text-6xl mb-6">👍</div>
            <div className="text-5xl font-bold text-green-600 mb-4">
              {khawatir.reduce((sum, k) => sum + k.upvotes, 0)}
            </div>
            <div className="text-gray-600 font-arabic-subtitle">إجمالي الإعجابات</div>
          </div>
          
          <div className="stat-card animate-slide-up" style={{animationDelay: '0.3s'}}>
            <div className="text-6xl mb-6">👎</div>
            <div className="text-5xl font-bold text-red-600 mb-4">
              {khawatir.reduce((sum, k) => sum + k.downvotes, 0)}
            </div>
            <div className="text-gray-600 font-arabic-subtitle">عدم الإعجابات</div>
          </div>
          
          <div className="stat-card animate-slide-up" style={{animationDelay: '0.4s'}}>
            <div className="text-6xl mb-6">👥</div>
            <div className="text-5xl font-bold text-purple-600 mb-4">
              {new Set(khawatir.map(k => k.author)).size}
            </div>
            <div className="text-gray-600 font-arabic-subtitle">المشاركون</div>
          </div>
        </div>

        {/* Khawatir List */}
        <div className="card animate-fade-in">
          <div className="flex justify-between items-center mb-12">
            <h2 className="font-arabic-title text-3xl md:text-4xl gradient-text">
              📚 جميع الخواطر المشاركة في الفعالية
            </h2>
            {khawatir.length > 0 && (
              <button
                onClick={() => setShowClearAllConfirm(true)}
                disabled={loading}
                className="btn-danger font-arabic-button px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 transition-transform"
              >
                🗑️ حذف جميع الخواطر
              </button>
            )}
          </div>
          
          {khawatir.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-9xl mb-8 animate-bounce-subtle">📝</div>
              <p className="font-arabic-title text-2xl md:text-3xl text-gray-600 mb-4">لا توجد خواطر مشاركة حتى الآن</p>
              <p className="font-arabic-body text-gray-500 mt-4">انتظر المشاركات الجديدة من المستخدمين</p>
            </div>
          ) : (
            <div className="space-y-8">
              {khawatir.map((khatira, index) => (
                <div
                  key={khatira.id}
                  className="khatira-card animate-slide-up"
                  style={{animationDelay: `${index * 0.05}s`}}
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center space-x-4">
                      <div className="text-3xl animate-bounce-subtle">
                        {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '🏅'}
                      </div>
                      <div className="font-arabic-subtitle text-xl md:text-2xl gradient-text">
                        المركز #{index + 1}
                      </div>
                      <div className="bg-green-100 text-green-700 px-4 py-2 rounded-full font-arabic-body font-semibold">
                        النقاط: {khatira.score}
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => setShowDeleteConfirm(khatira.id)}
                        disabled={loading}
                        className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-arabic-button transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        🗑️ حذف
                      </button>
                      <div className="font-arabic-body text-sm text-gray-500">
                        {new Date(khatira.created_at).toLocaleDateString('ar-SA')}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <div className="font-arabic-body text-lg text-gray-600 mb-4 flex items-center">
                      <span className="text-2xl ml-3">✍️</span>
                      الكاتب: <span className="font-arabic-subtitle font-bold text-green-700 mr-2">{khatira.author}</span>
                    </div>
                    <div className="bg-gradient-to-r from-gray-50 to-green-50 p-6 rounded-2xl border border-gray-100">
                      <p className="font-arabic-cursive text-gray-800 leading-loose text-lg">
                        "{khatira.content}"
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-center items-center space-x-8 pt-6 border-t-2 border-green-100">
                    <div className="flex items-center space-x-3 text-red-600 bg-red-50 px-6 py-3 rounded-2xl border-2 border-red-200">
                      <span className="text-2xl">👎</span>
                      <span className="font-arabic-button font-bold text-lg">{khatira.downvotes}</span>
                    </div>
                    <div className="flex items-center space-x-3 text-green-600 bg-green-50 px-6 py-3 rounded-2xl border-2 border-green-200">
                      <span className="text-2xl">👍</span>
                      <span className="font-arabic-button font-bold text-lg">{khatira.upvotes}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="glass-effect mt-24 py-10 text-center">
        <p className="font-arabic-subtitle text-gray-600 text-lg">
          لوحة تحكم فعالية الخواطر الثقافية - جمعية شموع تلمسان الثقافية ✨
        </p>
      </footer>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir="rtl">
          <div className="bg-white rounded-2xl p-8 max-w-md mx-4 shadow-2xl">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">⚠️</div>
              <h3 className="font-arabic-title text-2xl mb-4 text-gray-800">
                تأكيد حذف الخاطرة
              </h3>
              <p className="font-arabic-body text-gray-600 leading-relaxed">
                هل أنت متأكد من حذف هذه الخاطرة؟ لن يمكن استعادتها بعد الحذف.
              </p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                disabled={loading}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-3 px-6 rounded-xl font-arabic-button transition-all disabled:opacity-50"
              >
                إلغاء
              </button>
              <button
                onClick={() => deleteKhatira(showDeleteConfirm)}
                disabled={loading}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-3 px-6 rounded-xl font-arabic-button transition-all disabled:opacity-50"
              >
                {loading ? 'جاري الحذف...' : 'نعم، احذف'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clear All Confirmation Modal */}
      {showClearAllConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" dir="rtl">
          <div className="bg-white rounded-2xl p-8 max-w-md mx-4 shadow-2xl">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">🚨</div>
              <h3 className="font-arabic-title text-2xl mb-4 text-red-600">
                تحذير: حذف جميع البيانات
              </h3>
              <p className="font-arabic-body text-gray-700 leading-relaxed mb-4">
                هل أنت متأكد من حذف <strong>جميع الخواطر والأصوات والمستخدمين</strong>؟
              </p>
              <p className="font-arabic-body text-red-600 font-bold text-sm">
                ⚠️ هذا الإجراء لا يمكن التراجع عنه نهائياً!
              </p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => setShowClearAllConfirm(false)}
                disabled={loading}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 py-3 px-6 rounded-xl font-arabic-button transition-all disabled:opacity-50"
              >
                إلغاء
              </button>
              <button
                onClick={clearAllKhawatir}
                disabled={loading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-6 rounded-xl font-arabic-button transition-all disabled:opacity-50"
              >
                {loading ? 'جاري حذف الكل...' : 'نعم، احذف الكل'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


export default AdminPage;

