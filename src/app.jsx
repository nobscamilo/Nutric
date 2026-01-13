import React, { useState, useEffect } from 'react';
import {
  signInAnonymously,
  onAuthStateChanged,
  signInWithCustomToken
} from 'firebase/auth';
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  doc,
  setDoc
} from 'firebase/firestore';
import {
  Utensils,
  Droplet,
  User,
  Activity
} from 'lucide-react';

import { auth, db, appId } from './firebase';
import { MealTracker } from './features/MealTracker';
import { ProfileScreen } from './features/ProfileScreen';
import { NavBtn } from './components/NavBtn';

export default function App() {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [activeTab, setActiveTab] = useState('food');
  const [todayMeals, setTodayMeals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
      }
    };
    init();
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubProfile = onSnapshot(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main'), (doc) => {
      if (doc.exists()) setUserProfile(doc.data());
      else setActiveTab('profile');
    });
    const q = query(collection(db, 'artifacts', appId, 'users', user.uid, 'meals'), orderBy('timestamp', 'desc'));
    const unsubMeals = onSnapshot(q, (snapshot) => {
      const meals = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      const today = new Date().toDateString();
      setTodayMeals(meals.filter(m => m.timestamp?.toDate().toDateString() === today));
      setLoading(false);
    });
    return () => { unsubProfile(); unsubMeals(); };
  }, [user]);

  const saveProfile = async (data) => {
    if (!user) return;
    await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'profile', 'main'), data);
    setActiveTab('food');
  };
  const saveMeal = async (data) => {
    if (!user) return;
    await addDoc(collection(db, 'artifacts', appId, 'users', user.uid, 'meals'), data);
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Activity className="animate-spin text-blue-600" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans pb-24">
      <header className="bg-white/90 dark:bg-slate-900/90 backdrop-blur p-4 sticky top-0 z-40 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
        <h1 className="font-black text-lg flex items-center gap-2">
          <Droplet className="text-blue-600 fill-current" size={20} />
          Nutric<span className="text-slate-400 font-light">TWA</span>
        </h1>
        {userProfile && (
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-bold uppercase text-slate-400">{userProfile.isDiabetic ? 'Modo Clínico' : 'Estilo de Vida'}</span>
          </div>
        )}
      </header>
      <main className="p-4 max-w-md mx-auto">
        {activeTab === 'profile' && <ProfileScreen userProfile={userProfile} onSaveProfile={saveProfile} />}
        {activeTab === 'food' && (userProfile ? <MealTracker userProfile={userProfile} onSaveMeal={saveMeal} todayMeals={todayMeals} /> : <div className="text-center p-8 text-slate-500">Configura tu perfil primero</div>)}
      </main>
      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur border-t border-slate-200 dark:border-slate-800 pb-safe pt-2 px-8 flex justify-between items-center z-50 max-w-md mx-auto">
        <NavBtn active={activeTab === 'food'} onClick={() => setActiveTab('food')} icon={<Utensils size={22} />} label="Diario" />
        <NavBtn active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={<User size={22} />} label="Perfil" />
      </nav>
    </div>
  );
}
