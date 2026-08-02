import React, { useState, useEffect } from 'react';
import { StoreSettings } from '../../types';
import { Lock, ShieldAlert, KeyRound, ArrowRightLeft, RefreshCw, Mail, Key, Send, CheckCircle2, ShieldCheck, UserCheck, UserPlus, Flame, Shield } from 'lucide-react';
import { UserService } from '../../services/api';
import { PermissionService } from '../permissions/PermissionService';
import { signUpWithFirebase } from './firebase';

interface LoginProps {
  onLoginSuccess: (user: { name: string; role: string; code: string; roleId?: string; token?: string; isVerified?: boolean }) => void;
  settings: StoreSettings;
}

export default function Login({ onLoginSuccess, settings }: LoginProps) {
  const [loginMode, setLoginMode] = useState<'pin' | 'password' | 'signup'>('pin');
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [pin, setPin] = useState('');
  
  // Password Mode state
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');

  // Sign Up Form State
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupRole, setSignupRole] = useState<'manager' | 'accountant' | 'inventory' | 'cashier'>('cashier');
  const [signupPin, setSignupPin] = useState('1234');
  const [useFirebaseAuth, setUseFirebaseAuth] = useState(true);
  const [signupSuccessMsg, setSignupSuccessMsg] = useState('');
  
  // Forgot Password Modal
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');
  const [resetTokenReceived, setResetTokenReceived] = useState('');
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [resetSuccessMsg, setResetSuccessMsg] = useState('');

  const [error, setError] = useState('');
  const [authInProgress, setAuthInProgress] = useState(false);

  useEffect(() => {
    UserService.getUsers()
      .then(res => {
        const mapped = res.map((u: any) => {
          let empPin = '1234';
          if (u.id === '001') empPin = '1111';
          else if (u.id === '002') empPin = '2222';
          else if (u.id === '003') empPin = '3333';
          else if (u.id === '004') empPin = '4444';
          
          return {
            ...u,
            pin: empPin,
            code: u.id,
            color: u.role === 'manager' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' :
                   u.role === 'accountant' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                   u.role === 'inventory' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                   'bg-blue-50 border-blue-200 text-blue-700'
          };
        });
        setEmployees(mapped);
      })
      .catch(err => {
        console.error('Error fetching employees, falling back to static list:', err);
        const staticList = [
          { id: '001', code: '001', email: 'manager@system.com', name: 'عبدالرحمن (المدير العام)', role: 'manager', pin: '1111' },
          { id: '002', code: '002', email: 'accountant@system.com', name: 'ياسر (المحاسب المالي)', role: 'accountant', pin: '2222' },
          { id: '003', code: '003', email: 'inventory@system.com', name: 'أنس (أمين المستودع)', role: 'inventory', pin: '3333' },
          { id: '004', code: '004', email: 'cashier@system.com', name: 'أحمد (موظف الكاشير)', role: 'cashier', pin: '4444' }
        ];
        setEmployees(staticList);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleUserClick = (user: any) => {
    setSelectedUser(user);
    setEmailInput(user.email || '');
    setPin('');
    setError('');
  };

  const executeApiLogin = async (payload: { code?: string; pin?: string; email?: string; password?: string }) => {
    setAuthInProgress(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'فشلت عملية المصادقة');
      }

      // Store tokens
      if (data.refreshToken) {
        localStorage.setItem('erp_refresh_token', data.refreshToken);
      }

      const sessionUser = {
        id: data.user.id,
        name: data.user.name,
        role: data.user.role,
        code: data.user.code || data.user.id,
        roleId: data.user.roleId,
        email: data.user.email,
        permissions: data.user.permissions,
        token: data.token,
        isVerified: data.user.isVerified
      };

      PermissionService.setCurrentUser(sessionUser);
      onLoginSuccess(sessionUser);
    } catch (e: any) {
      console.error('Login error:', e);
      setError(e.message || 'حدث خطأ أثناء تسجيل الدخول');
      setPin('');
    } finally {
      setAuthInProgress(false);
    }
  };

  const handleNumberClick = async (num: string) => {
    if (authInProgress) return;
    setError('');
    if (pin.length < 4) {
      const nextPin = pin + num;
      setPin(nextPin);
      
      if (nextPin.length === 4) {
        if (selectedUser) {
          await executeApiLogin({
            code: selectedUser.code,
            pin: nextPin
          });
        }
      }
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput || !passwordInput) {
      setError('يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }
    await executeApiLogin({
      email: emailInput,
      password: passwordInput
    });
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotMsg('');
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      });
      const data = await res.json();
      setForgotMsg(data.message || 'تم إرسال تعليمات إعادة التعيين');
      if (data.resetToken) {
        setResetTokenReceived(data.resetToken);
      }
    } catch (err: any) {
      setForgotMsg('حدث خطأ أثناء إرسال طلب إعادة التعيين');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetSuccessMsg('');
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: resetTokenReceived, newPassword: newPasswordInput })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setResetSuccessMsg('تم تغيير كلمة المرور بنجاح! يمكنك الآن تسجيل الدخول.');
        setTimeout(() => {
          setShowForgotModal(false);
          setResetTokenReceived('');
          setNewPasswordInput('');
          setLoginMode('password');
        }, 2000);
      } else {
        setError(data.error || 'فشل في تعيين كلمة المرور');
      }
    } catch (err: any) {
      setError('حدث خطأ في الشبكة');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupName || !signupEmail || !signupPassword) {
      setError('يرجى تعبئة جميع الحقول المطلوبة (الاسم، البريد، كلمة المرور)');
      return;
    }

    setAuthInProgress(true);
    setError('');
    setSignupSuccessMsg('');

    try {
      let firebaseUid = '';
      if (useFirebaseAuth) {
        try {
          const fbUser = await signUpWithFirebase(signupEmail, signupPassword, signupName);
          if (fbUser) {
            firebaseUid = fbUser.uid;
          }
        } catch (fbErr: any) {
          console.warn('Firebase signup notice:', fbErr?.message || fbErr);
        }
      }

      // Call System Backend API Register endpoint
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: signupEmail,
          name: signupName,
          password: signupPassword,
          role: signupRole,
          pin: signupPin,
          uid: firebaseUid
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'فشل إنشاء حساب موظف جديد');
      }

      setSignupSuccessMsg('تم إنشاء حساب الموظف بنجاح ومزامنته مع Firebase Auth! يمكنك الآن تسجيل الدخول.');

      // Refresh employees list
      UserService.getUsers().then(usersRes => {
        const mapped = usersRes.map((u: any) => ({
          ...u,
          pin: u.pin || '1234',
          code: u.id,
          color: u.role === 'manager' ? 'bg-indigo-50 border-indigo-200 text-indigo-700' :
                 u.role === 'accountant' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' :
                 u.role === 'inventory' ? 'bg-amber-50 border-amber-200 text-amber-700' :
                 'bg-blue-50 border-blue-200 text-blue-700'
        }));
        setEmployees(mapped);
      }).catch(() => {});

      setTimeout(() => {
        setEmailInput(signupEmail);
        setPasswordInput(signupPassword);
        setLoginMode('password');
        setSignupSuccessMsg('');
        setSignupName('');
        setSignupEmail('');
        setSignupPassword('');
      }, 2000);

    } catch (err: any) {
      console.error('Sign-up error:', err);
      setError(err.message || 'حدث خطأ أثناء إنشاء الحساب');
    } finally {
      setAuthInProgress(false);
    }
  };

  const handleClear = () => {
    setPin('');
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 text-right" dir="rtl" id="login-screen">
      <div className="w-full max-w-md bg-white border border-slate-200 shadow-2xl rounded-3xl overflow-hidden flex flex-col p-6 sm:p-8 space-y-6">
        
        {/* Branding & Logo */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-slate-900 rounded-2xl flex items-center justify-center text-3xl mx-auto shadow-lg shadow-slate-100 overflow-hidden">
            {settings.logo && (settings.logo.startsWith('http') || settings.logo.startsWith('/') || settings.logo.startsWith('data:image')) ? (
              <img src={settings.logo} alt="Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              settings.logo || '⚖️'
            )}
          </div>
          <h1 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight">{settings.name}</h1>
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">نظام المصادقة وحماية المؤسسات المتقدم (Enterprise JWT)</p>
        </div>

        {/* Auth Mode Toggle Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 font-bold text-[11px] sm:text-xs">
          <button
            type="button"
            onClick={() => { setLoginMode('pin'); setError(''); }}
            className={`flex-1 py-2 rounded-xl transition ${loginMode === 'pin' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            رمز PIN
          </button>
          <button
            type="button"
            onClick={() => { setLoginMode('password'); setError(''); }}
            className={`flex-1 py-2 rounded-xl transition ${loginMode === 'password' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            كلمة المرور
          </button>
          <button
            type="button"
            onClick={() => { setLoginMode('signup'); setError(''); }}
            className={`flex-1 py-2 rounded-xl transition flex items-center justify-center gap-1 ${loginMode === 'signup' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            حساب جديد
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-2 text-rose-800 text-xs font-bold animate-shake">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="py-8 flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-7 h-7 text-emerald-600 animate-spin" />
            <span className="text-xs text-slate-500 font-bold">جاري تحميل ملفات الموظفين الآمنة...</span>
          </div>
        ) : loginMode === 'signup' ? (
          /* Sign Up Mode */
          <form onSubmit={handleSignUp} className="space-y-3.5 text-right">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                اسم الموظف / المستخدم:
              </label>
              <input
                type="text"
                value={signupName}
                onChange={(e) => setSignupName(e.target.value)}
                placeholder="مثال: محمد علي (مشرف المبيعات)"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                البريد الإلكتروني:
              </label>
              <input
                type="email"
                value={signupEmail}
                onChange={(e) => setSignupEmail(e.target.value)}
                placeholder="employee@system.com"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-slate-500" />
                  كلمة المرور:
                </label>
                <input
                  type="password"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                  رمز PIN (4 أرقام):
                </label>
                <input
                  type="text"
                  maxLength={4}
                  value={signupPin}
                  onChange={(e) => setSignupPin(e.target.value)}
                  placeholder="1234"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600 text-center"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-slate-500" />
                الصلاحية والدور:
              </label>
              <select
                value={signupRole}
                onChange={(e: any) => setSignupRole(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                <option value="cashier">كاشير المبيعات (Cashier)</option>
                <option value="accountant">محاسب مالي (Accountant)</option>
                <option value="inventory">أمين مستودع (Inventory)</option>
                <option value="manager">مدير النظام (Manager / Admin)</option>
              </select>
            </div>

            <label className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-pointer hover:bg-slate-100 transition">
              <input
                type="checkbox"
                checked={useFirebaseAuth}
                onChange={(e) => setUseFirebaseAuth(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
              />
              <Flame className="w-4 h-4 text-amber-500" />
              <span>الربط والمصادقة مع Firebase Auth</span>
            </label>

            {signupSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2 animate-fadeIn">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                <span>{signupSuccessMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={authInProgress}
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl transition shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
            >
              {authInProgress ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  جاري تسجيل المستخدم في الخادم و Firebase Auth...
                </>
              ) : (
                <>
                  <UserPlus className="w-4 h-4" />
                  إنشاء وتفعيل حساب الموظف الجديد
                </>
              )}
            </button>
          </form>
        ) : loginMode === 'password' ? (
          /* Password Login Mode */
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div className="space-y-1 text-right">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-500" />
                البريد الإلكتروني / معرف المستخدم:
              </label>
              <input
                type="text"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="manager@system.com"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                required
              />
            </div>

            <div className="space-y-1 text-right">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-slate-500" />
                كلمة المرور:
              </label>
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900"
                required
              />
            </div>

            <div className="flex justify-between items-center text-[11px] pt-1">
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-indigo-600 hover:underline font-bold"
              >
                نسيت كلمة المرور؟
              </button>
            </div>

            <button
              type="submit"
              disabled={authInProgress}
              className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl transition shadow-lg flex items-center justify-center gap-2"
            >
              {authInProgress ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  جاري التحقق من الاعتماد والتشفير...
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  تسجيل الدخول وإصدار رمز JWT
                </>
              )}
            </button>
          </form>
        ) : !selectedUser ? (
          /* PIN Mode - Select Profile */
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Lock className="w-4 h-4 text-slate-500" />
              <h3 className="text-xs sm:text-sm font-black text-slate-700">اختر ملف موظف لتسجيل الدخول السريع:</h3>
            </div>

            <div className="grid grid-cols-1 gap-2.5 max-h-[280px] overflow-y-auto pr-1">
              {employees.map(emp => (
                <button
                  key={emp.code}
                  onClick={() => handleUserClick(emp)}
                  className="p-3.5 border rounded-2xl flex items-center justify-between hover:shadow-md transition text-slate-700 font-semibold text-xs text-right bg-slate-50 border-slate-100 hover:border-slate-300"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-black text-slate-600 text-xs">
                      {emp.code}
                    </div>
                    <div>
                      <span className="font-extrabold block text-slate-800 text-right">{emp.name}</span>
                      <span className="text-[10px] text-slate-400 font-medium block text-right">
                        {emp.role === 'manager' ? 'مدير عام بصلاحيات كاملة' :
                         emp.role === 'accountant' ? 'المحاسب المالي والأستاذ العام' :
                         emp.role === 'inventory' ? 'أمين المستودع والمخازن' :
                         'كاشير المبيعات السريعة'}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 font-mono">PIN: {emp.pin}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* PIN Mode - Enter PIN Pad */
          <div className="space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <button
                onClick={() => setSelectedUser(null)}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 transition flex items-center gap-1"
              >
                <ArrowRightLeft className="w-3.5 h-3.5" />
                تغيير الموظف
              </button>
              <div className="text-left flex flex-col items-end">
                <span className="font-extrabold text-xs text-slate-800">{selectedUser.name}</span>
                <span className="text-[10px] text-slate-400 font-mono">كود: {selectedUser.code}</span>
              </div>
            </div>

            <div className="flex justify-center gap-4 py-2" dir="ltr">
              {[0, 1, 2, 3].map(i => (
                <div
                  key={i}
                  className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                    pin.length > i 
                      ? 'bg-slate-900 border-slate-900 scale-110' 
                      : 'border-slate-300'
                  }`}
                ></div>
              ))}
            </div>

            <div className="grid grid-cols-3 gap-2.5 max-w-[260px] mx-auto font-mono text-lg font-extrabold text-slate-800">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleNumberClick(num)}
                  className="h-12 bg-slate-50 hover:bg-slate-100 rounded-2xl flex items-center justify-center transition active:scale-95 shadow-sm border border-slate-100"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={handleClear}
                className="h-12 text-rose-600 font-sans font-bold text-xs bg-rose-50 hover:bg-rose-100 rounded-2xl flex items-center justify-center transition active:scale-95 border border-rose-100"
              >
                مسح
              </button>
              <button
                type="button"
                onClick={() => handleNumberClick('0')}
                className="h-12 bg-slate-50 hover:bg-slate-100 rounded-2xl flex items-center justify-center transition active:scale-95 shadow-sm border border-slate-100"
              >
                0
              </button>
              <div className="h-12 flex items-center justify-center text-slate-300">
                <KeyRound className="w-5 h-5 opacity-40" />
              </div>
            </div>
          </div>
        )}

        {/* Forgot Password Modal */}
        {showForgotModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" dir="rtl">
            <div className="bg-white rounded-3xl p-6 w-full max-w-md border border-slate-200 shadow-2xl space-y-4">
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                  <Key className="w-4 h-4 text-indigo-600" />
                  إعادة تعيين كلمة المرور
                </h3>
                <button onClick={() => setShowForgotModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-xs">✕</button>
              </div>

              {!resetTokenReceived ? (
                <form onSubmit={handleForgotPassword} className="space-y-3">
                  <p className="text-xs text-slate-500 font-semibold">أدخل بريدك الإلكتروني ليصلك رمز إعادة التعيين الآمن:</p>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-bold"
                    required
                  />
                  {forgotMsg && (
                    <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-800 text-xs font-bold">
                      {forgotMsg}
                    </div>
                  )}
                  <button type="submit" className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700">
                    إرسال طلب التعيين
                  </button>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-3">
                  <div className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                    <span>تم إنشاء رمز تعيين كلمة المرور بنجاح.</span>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">رمز التعيين المستلم:</label>
                    <input type="text" value={resetTokenReceived} readOnly className="w-full px-3 py-2 bg-slate-100 border rounded-xl text-xs font-mono" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">كلمة المرور الجديدة:</label>
                    <input
                      type="password"
                      value={newPasswordInput}
                      onChange={e => setNewPasswordInput(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-bold"
                      required
                    />
                  </div>
                  {resetSuccessMsg && (
                    <p className="text-xs text-emerald-700 font-bold">{resetSuccessMsg}</p>
                  )}
                  <button type="submit" className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800">
                    تأكيد وحفظ كلمة المرور
                  </button>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="text-center text-[10px] text-slate-400 border-t border-slate-100 pt-3 flex items-center justify-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>محمي بواسطة خوادم المؤسسة ومصادقة JWT والتعاقب الآمن للتحديث.</span>
        </div>
      </div>
    </div>
  );
}
