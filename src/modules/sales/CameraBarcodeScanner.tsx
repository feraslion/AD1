import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats, CameraDevice } from 'html5-qrcode';
import { Camera, X, RefreshCw, Volume2, VolumeX, Flashlight, CheckCircle2, AlertCircle, Scan, Zap, Play, Pause } from 'lucide-react';
import { playScannerSound } from '../../utils/audio';

interface CameraBarcodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanBarcode: (barcode: string) => void;
  autoCloseOnScan?: boolean;
}

export default function CameraBarcodeScanner({
  isOpen,
  onClose,
  onScanBarcode,
  autoCloseOnScan = false
}: CameraBarcodeScannerProps) {
  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [scanCount, setScanCount] = useState<number>(0);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [torchOn, setTorchOn] = useState<boolean>(false);
  const [torchSupported, setTorchSupported] = useState<boolean>(false);

  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const cooldownRef = useRef<boolean>(false);
  const readerElementId = 'camera-barcode-reader-canvas';

  // Fetch available camera devices and request permission
  const requestCameraAccess = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('متصفحك أو جهازك لا يدعم خاصية الوصول للكاميرا.');
      }

      // Step 1: Prompt for camera permission via getUserMedia
      let stream: MediaStream | null = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: { ideal: 'environment' } } 
        });
        // Stop the temp tracks immediately after obtaining permission
        stream.getTracks().forEach(track => track.stop());
      } catch (permissionErr: any) {
        console.warn('getUserMedia permission error:', permissionErr);
        if (permissionErr.name === 'NotAllowedError' || permissionErr.name === 'PermissionDeniedError' || permissionErr.message?.includes('Permission denied')) {
          setCameraError('تم رفض صلاحية الكاميرا من المتصفح. يرجى الضغط على القفل 🔒 أو الكاميرا 📷 بجانب شريط العنوان وتفعيل الكاميرا ثم الضغط على "طلب الإذن".');
          return;
        }
      }

      // Step 2: Retrieve devices list
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length > 0) {
        setCameras(devices);
        const backCam = devices.find(d => 
          d.label.toLowerCase().includes('back') || 
          d.label.toLowerCase().includes('rear') || 
          d.label.toLowerCase().includes('environment') ||
          d.label.toLowerCase().includes('خلفية')
        );
        setSelectedCameraId(backCam ? backCam.id : devices[0].id);
      } else {
        // Fallback to default environment facing mode
        setSelectedCameraId('environment-default');
      }
    } catch (err: any) {
      console.error('Error requesting camera permission:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError' || err?.message?.includes('Permission denied')) {
        setCameraError('تم رفض صلاحية الكاميرا. يرجى السماح باستخدام الكاميرا من إعدادات المتصفح.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('لم يتم العثور على أي كاميرا متصلة بالجهاز.');
      } else {
        setCameraError(`تعذر الوصول إلى الكاميرا: ${err?.message || 'يرجى التأكد من توصيل الكاميرا وإعطاء الصلاحية'}`);
      }
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    requestCameraAccess();
  }, [isOpen]);

  // Start scanner session when modal opens or camera changes
  useEffect(() => {
    if (!isOpen || !selectedCameraId) return;

    let isSubscribed = true;
    setCameraError(null);

    const startScanner = async () => {
      try {
        // Stop any existing instance first
        if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
          html5QrCodeRef.current.clear();
        }

        const qrCodeInstance = new Html5Qrcode(readerElementId);
        html5QrCodeRef.current = qrCodeInstance;

        const config = {
          fps: 15,
          qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            return {
              width: Math.floor(minEdge * 0.8),
              height: Math.floor(minEdge * 0.5)
            };
          },
          aspectRatio: 1.333333,
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.DATA_MATRIX,
            Html5QrcodeSupportedFormats.ITF
          ]
        };

        const cameraConfig = selectedCameraId === 'environment-default' 
          ? { facingMode: 'environment' }
          : { deviceId: { exact: selectedCameraId } };

        await qrCodeInstance.start(
          cameraConfig,
          config,
          (decodedText) => {
            if (!isSubscribed) return;
            handleSuccessfulScan(decodedText);
          },
          () => {
            // Frame parsing progress - ignore
          }
        );

        if (isSubscribed) {
          setIsScanning(true);
          // Check torch support
          try {
            const capabilities = qrCodeInstance.getRunningTrackCapabilities();
            if (capabilities && 'torch' in capabilities) {
              setTorchSupported(true);
            }
          } catch (_) {}
        }
      } catch (err: any) {
        if (!isSubscribed) return;
        console.error('Failed to start camera scanner:', err);
        if (err?.message?.includes('Permission denied') || err?.name === 'NotAllowedError') {
          setCameraError('تم رفض الإذن بالوصول للكاميرا من المتصفح. يرجى تفعيل الكاميرا من شريط العنوان.');
        } else {
          setCameraError(`خطأ في تشغيل الكاميرا: ${err?.message || err || 'الوصول مرفوض'}`);
        }
        setIsScanning(false);
      }
    };

    // Small timeout to allow container element to render in DOM
    const timer = setTimeout(() => {
      startScanner();
    }, 200);

    return () => {
      isSubscribed = false;
      clearTimeout(timer);
      if (html5QrCodeRef.current) {
        if (html5QrCodeRef.current.isScanning) {
          html5QrCodeRef.current.stop().then(() => {
            html5QrCodeRef.current?.clear();
          }).catch(console.error);
        } else {
          try {
            html5QrCodeRef.current.clear();
          } catch (_) {}
        }
      }
      setIsScanning(false);
    };
  }, [isOpen, selectedCameraId]);

  const handleSuccessfulScan = (code: string) => {
    if (cooldownRef.current) return;
    
    // Cooldown 1.2s to prevent rapid double scan of same barcode
    cooldownRef.current = true;
    setTimeout(() => {
      cooldownRef.current = false;
    }, 1200);

    setLastScannedCode(code);
    setScanCount(prev => prev + 1);

    if (soundEnabled) {
      playScannerSound('success');
    }

    onScanBarcode(code);

    if (autoCloseOnScan) {
      onClose();
    }
  };

  const toggleTorch = async () => {
    if (!html5QrCodeRef.current || !isScanning || !torchSupported) return;
    try {
      const nextState = !torchOn;
      await html5QrCodeRef.current.applyVideoConstraints({
        advanced: [{ torch: nextState } as any]
      });
      setTorchOn(nextState);
    } catch (err) {
      console.error('Failed to toggle torch:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col border border-slate-100 animate-fade-in max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/20 border border-blue-400/30 rounded-2xl text-blue-400">
              <Camera className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg flex items-center gap-2">
                ماسح كاميرا الجهاز
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-sans">
                  مباشر HD 📷
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                وجه كاميرا الجوال أو المحمول نحو باركود المنتج للمسح الفوري
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800/80 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar Controls */}
        <div className="bg-slate-100 p-3 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          
          {/* Camera Selection Dropdown */}
          <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
            <Camera className="w-4 h-4 text-slate-500 shrink-0" />
            <select
              value={selectedCameraId}
              onChange={(e) => setSelectedCameraId(e.target.value)}
              className="w-full bg-white border border-slate-300 text-slate-800 text-xs font-semibold rounded-xl px-2.5 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {cameras.map((cam) => (
                <option key={cam.id} value={cam.id}>
                  {cam.label || `كاميرا ${cam.id.slice(0, 8)}...`}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            {/* Torch Toggle */}
            {torchSupported && (
              <button
                onClick={toggleTorch}
                className={`p-2 rounded-xl border font-bold flex items-center gap-1 transition ${
                  torchOn 
                    ? 'bg-amber-500 text-white border-amber-600 shadow-md' 
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
                title="تفعيل فلاش الكاميرا"
              >
                <Flashlight className="w-4 h-4" />
                <span className="text-[11px] hidden sm:inline">الكشاف</span>
              </button>
            )}

            {/* Sound Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-xl border font-bold flex items-center gap-1 transition ${
                soundEnabled 
                  ? 'bg-blue-50 text-blue-600 border-blue-200' 
                  : 'bg-slate-200 text-slate-500 border-slate-300'
              }`}
              title="صوت التنبيه عند القراءة"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>

        </div>

        {/* Viewfinder & Video Frame */}
        <div className="relative bg-black flex-1 min-h-[280px] sm:min-h-[340px] flex items-center justify-center overflow-hidden">
          
          {/* The html5-qrcode target container */}
          <div id={readerElementId} className="w-full h-full object-cover"></div>

          {/* Scanner Targeting Overlay UI */}
          {isScanning && !cameraError && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
              {/* Scan box frame */}
              <div className="w-[72%] max-w-[280px] h-[160px] border-2 border-dashed border-emerald-400/90 rounded-2xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
                
                {/* Corner Accents */}
                <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg"></div>
                <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg"></div>
                <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg"></div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-emerald-400 rounded-br-lg"></div>

                {/* Laser animation line */}
                <div className="w-full h-0.5 bg-emerald-400 shadow-[0_0_12px_#34d399] absolute top-1/2 left-0 transform -translate-y-1/2 animate-pulse"></div>
              </div>
              
              <div className="mt-4 bg-slate-900/80 backdrop-blur-md px-4 py-1.5 rounded-full text-white text-xs font-semibold flex items-center gap-2 border border-slate-700 shadow-lg">
                <Scan className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
                <span>ضع الباركود داخل الإطار للمسح التلقائي</span>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {cameraError && (
            <div className="absolute inset-0 bg-slate-900/95 p-6 flex flex-col items-center justify-center text-center text-white space-y-4">
              <div className="p-3 bg-rose-500/20 rounded-full text-rose-400 border border-rose-500/30">
                <AlertCircle className="w-8 h-8" />
              </div>
              <p className="text-sm font-bold text-rose-300 max-w-sm leading-relaxed">{cameraError}</p>
              
              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={requestCameraAccess}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition shadow-md"
                >
                  <RefreshCw className="w-4 h-4" />
                  طلب الإذن / إعادة المحاولة
                </button>

                <button
                  type="button"
                  onClick={() => window.open(window.location.href, '_blank')}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl font-bold text-xs transition"
                >
                  فتح التطبيق بتبويب مستقل ↗
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Scan Result Feedback Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
          {lastScannedCode ? (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs animate-fade-in">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <div className="font-bold text-emerald-950 flex items-center gap-1">
                    <span>تم التقاط الباركود وإضافته للفاتورة</span>
                    <span className="bg-emerald-200 text-emerald-900 px-1.5 py-0.2 rounded font-mono text-[10px]">
                      #{scanCount}
                    </span>
                  </div>
                  <div className="font-mono text-emerald-800 text-[11px] font-bold">
                    {lastScannedCode}
                  </div>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg font-bold text-[11px] shadow-sm">
                تم الإدخال ⚡
              </span>
            </div>
          ) : (
            <div className="flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-600" />
                <span>المسح الآلي نشط بالخلفية. يتم التوجيه للسلة فوراً.</span>
              </div>
              <span className="font-mono bg-slate-200 text-slate-700 px-2 py-0.5 rounded text-[10px] font-bold">
                {scanCount} مسح
              </span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition shadow-md"
            >
              إغلاق الكاميرا
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
