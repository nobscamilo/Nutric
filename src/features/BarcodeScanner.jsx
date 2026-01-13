import React, { useState, useEffect, useRef } from 'react';
import { ScanBarcode, Loader2, X, ArrowRight } from 'lucide-react';

export const BarcodeScanner = ({ onDetected, onClose }) => {
    const [error, setError] = useState(null);
    const [loadingLib, setLoadingLib] = useState(true);
    const [manualCode, setManualCode] = useState('');
    const scannerRef = useRef(null);

    useEffect(() => {
        const script = document.createElement('script');
        script.src = "https://unpkg.com/html5-qrcode";
        script.async = true;
        script.onload = () => { setLoadingLib(false); initScanner(); };
        script.onerror = () => setError("Error librería escaneo.");
        document.body.appendChild(script);
        return () => {
            if (scannerRef.current) try { scannerRef.current.stop().then(() => scannerRef.current.clear()); } catch (e) { }
            if (document.body.contains(script)) document.body.removeChild(script);
        };
    }, []);

    const initScanner = () => {
        if (!window.Html5Qrcode) return;
        try {
            const html5QrCode = new window.Html5Qrcode("reader");
            scannerRef.current = html5QrCode;
            const config = { fps: 10, qrbox: { width: 250, height: 150 }, aspectRatio: 1.0 };
            html5QrCode.start({ facingMode: "environment" }, config, (decodedText) => {
                html5QrCode.stop().then(() => onDetected(decodedText));
            }, () => { }).catch(err => setError("Permiso de cámara denegado."));
        } catch (e) { setError("Error init."); }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black flex flex-col animate-in fade-in duration-300">
            <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-20 bg-gradient-to-b from-black/80 to-transparent">
                <span className="text-white font-bold flex items-center gap-2"><ScanBarcode /> Escáner EAN</span>
                <button onClick={onClose} className="p-2 bg-white/20 rounded-full text-white"><X size={20} /></button>
            </div>
            <div className="flex-1 relative bg-black flex flex-col justify-center">
                {loadingLib ? <Loader2 className="animate-spin mx-auto text-blue-500" size={48} /> :
                    error ? <p className="text-white text-center p-6">{error}</p> :
                        <div id="reader" className="w-full h-full overflow-hidden"></div>}
            </div>
            <div className="bg-slate-900 p-6 rounded-t-2xl z-20 border-t border-slate-700">
                <div className="flex gap-2">
                    <input type="number" placeholder="Código manual..." value={manualCode} onChange={e => setManualCode(e.target.value)} className="flex-1 bg-slate-800 border border-slate-600 text-white rounded-xl px-4 py-3 outline-none" />
                    <button onClick={() => onDetected(manualCode)} disabled={!manualCode} className="bg-blue-600 text-white p-3 rounded-xl font-bold disabled:opacity-50"><ArrowRight /></button>
                </div>
            </div>
            <style>{`#reader video { object-fit: cover; width: 100% !important; height: 100% !important; } #reader__scan_region { display: none !important; }`}</style>
        </div>
    );
};
