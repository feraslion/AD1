import React, { useState, useEffect } from 'react';
import { StoreSettings } from '../../types';
import { Lock, ShieldAlert, KeyRound, ArrowRightLeft, RefreshCw, ShieldCheck } from 'lucide-react';
import { UserService } from '../../services/api';
import { authenticateWithFirebase } from './firebase';
import { PermissionService } from '../permissions/PermissionService';

interface LoginProps {
  onLoginSuccess: (user: { name: string; role: string; code: string; roleId?: string; token?: string }) => void;
  settings: StoreSettings;
}

export default function Login({ onLoginSuccess, settings }: LoginProps) {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [authInProgress, setAuthInProgress] = useState(false);

  useEffect(() => {
    UserService.getUsers()
      .then(res => {
        const mapped = res.map((u: any) => {
          let pin = '1234';
          if (u.id === '001') pin = '1111';
          else if (u.id === '002') pin = '2222';
          else if (u.id === '003') pin = '3333';
          else if (u.id === '004') pin = '4444';
          
          return {
            ...u,
            pin,
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
          { id: '001', code: '001', name: 'عبدالرحمن (المدير العام)', role: 'manager', pin: '1111' },
          { id: '002', code: '002', name: 'ياسر (المحاسب المالي)', role: 'accountant', pin: '2222' },
          { id: '003', code: '003', name: 'أنس (أمين المستودع)', role: 'inventory', pin: '3333' },
          { id: '004', code: '004', name: 'أحمد (موظف الكاشير)', role: 'cashier', pin: '4444' }
        ];
        setEmployees(staticList);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const handleUserClick = (user: any) => {
    setSelectedUser(user);
    setPin('');
    setError('');
  };

  const handleNumberClick = async (num: string) => {
    if (authInProgress) return;
    setError('');
    if (pin.length < 4) {
      const nextPin = pin + num;
      setPin(nextPin);
      
      // Auto-validate once PIN reaches 4 digits
      if (nextPin.length === 4) {
        if (selectedUser && nextPin === selectedUser.pin) {
          setAuthInProgress(true);
          try {
            // Trigger Firebase Auth session creation
            const fbUser = await authenticateWithFirebase();
            const token = fbUser ? await fbUser.getIdToken() : selectedUser.code;

            const sessionUser = {
              id: selectedUser.id || selectedUser.code,
              name: selectedUser.name,
              role: selectedUser.role,
              code: selectedUser.code,
              roleId: selectedUser.roleId,
              email: selectedUser.email,
              token
            };

            PermissionService.setCurrentUser(sessionUser);

            onLoginSuccess(sessionUser);
          } catch (e: any) {
            console.error('Auth completion error:', e);
            setError('حدث خطأ أثناء إجراء المصادقة الآمنة.');
            setPin('');
          } finally {
            setAuthInProgress(false);
          }
        } else {
          setError('رمز PIN الذي أدخلته غير صحيح. يرجى المحاولة مرة أخرى.');
          setPin('');
        }
      }
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
          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">نظام تخطيط موارد المؤسسات المتكامل</p>
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
        ) : !selectedUser ? (
          /* Phase 1: Select Profile */
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <Lock className="w-4 h-4 text-slate-500" />
              <h3 className="text-xs sm:text-sm font-black text-slate-700">اختر ملف موظف لتسجيل الدخول:</h3>
            </div>

            <div className="grid grid-cols-1 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
              {employees.map(emp => (
                <button
                  key={emp.code}
                  onClick={() => handleUserClick(emp)}
                  className="p-4 border rounded-2xl flex items-center justify-between hover:shadow-md transition text-slate-700 font-semibold text-xs sm:text-sm text-right bg-slate-50 border-slate-100 hover:border-slate-300"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-black text-slate-600 text-xs">
                      {emp.code}
                    </div>
                    <div>
                      <span className="font-extrabold block text-slate-800 text-right">{emp.name}</span>
                      <span className="text-[10px] text-slate-400 font-medium block text-right">
                        {emp.role === 'manager' ? 'التحكم بالصلاحيات الكاملة' :
                         emp.role === 'accountant' ? 'الحسابات والميزانية والأستاذ العام' :
                         emp.role === 'inventory' ? 'مراقبة المخازن وفواتير المشتريات' :
                         'نقطة الكاشير والمبيعات السريعة'}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-slate-400 font-mono">PIN: {emp.pin}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Phase 2: Enter PIN Code with PIN Pad */
          <div className="space-y-5">
            {/* Header info */}
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
                <span className="text-[10px] text-slate-400 font-mono">رمز: {selectedUser.code}</span>
              </div>
            </div>

            {/* Display code dots */}
            <div className="flex justify-center gap-4 py-4" dir="ltr">
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

            {/* Simulated Pin Pad */}
            <div className="grid grid-cols-3 gap-3 max-w-[280px] mx-auto font-mono text-lg font-extrabold text-slate-800">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleNumberClick(num)}
                  className="h-14 bg-slate-50 hover:bg-slate-100 rounded-2xl flex items-center justify-center transition active:scale-95 shadow-sm border border-slate-100"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={handleClear}
                className="h-14 text-rose-600 font-sans font-bold text-xs bg-rose-50 hover:bg-rose-100 rounded-2xl flex items-center justify-center transition active:scale-95 border border-rose-100"
              >
                مسح
              </button>
              <button
                type="button"
                onClick={() => handleNumberClick('0')}
                className="h-14 bg-slate-50 hover:bg-slate-100 rounded-2xl flex items-center justify-center transition active:scale-95 shadow-sm border border-slate-100"
              >
                0
              </button>
              <div className="h-14 flex items-center justify-center text-slate-300">
                <KeyRound className="w-5 h-5 opacity-40" />
              </div>
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="text-center text-[10px] text-slate-400 border-t border-slate-100 pt-4">
          محمي بواسطة بروتوكول المصادقة المحلية في AI Studio ERP.
        </div>
      </div>
    </div>
  );
}
