import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyCX3euJ0bsl_wE0IiM-7KZL2i-B5IYKcdU",
    authDomain: "nutric-b5cb5.firebaseapp.com",
    projectId: "nutric-b5cb5",
    storageBucket: "nutric-b5cb5.firebasestorage.app",
    messagingSenderId: "891425941004",
    appId: "1:891425941004:web:258cb1cbaebfe53aeff029",
    measurementId: "G-91F2TN45DY"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Usamos un ID fijo o generado si no viene de Telegram para pruebas
export const appId = typeof __app_id !== 'undefined' ? __app_id : 'nutric-twa-prod';

export { app, auth, db };
