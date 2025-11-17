'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserProfile } from '@/types/nutrition';

interface ProfilePanelProps {
  profile?: UserProfile;
  onSaveProfile: (profile: UserProfile) => void;
  onLoadProfile: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export default function ProfilePanel({ 
  profile, 
  onSaveProfile, 
  onLoadProfile, 
  isCollapsed, 
  onToggleCollapse 
}: ProfilePanelProps) {
  const [formData, setFormData] = useState<UserProfile>({
    nombre: profile?.nombre || '',
    sexo: profile?.sexo || 'M',
    edad: profile?.edad || 0,
    peso: profile?.peso || 0,
    talla: profile?.talla || 0
  });

  // Sincronizar con perfil cuando cambie
  useEffect(() => {
    if (profile) {
      setFormData(profile);
    }
  }, [profile]);

  const handleInputChange = (field: keyof UserProfile, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = () => {
    onSaveProfile(formData);
  };

  const handleLoad = () => {
    onLoadProfile();
  };

  const handleClear = () => {
    const emptyProfile: UserProfile = {
      nombre: '',
      sexo: 'M',
      edad: 0,
      peso: 0,
      talla: 0
    };
    setFormData(emptyProfile);
    onSaveProfile(emptyProfile);
  };

  // Calcular métricas adicionales
  const calculateIMC = (peso: number, talla: number): number => {
    if (peso <= 0 || talla <= 0) return 0;
    return Math.round((peso / Math.pow(talla / 100, 2)) * 10) / 10;
  };

  const calculateTMB = (profile: UserProfile): number => {
    if (!profile.peso || !profile.talla || !profile.edad) return 0;
    if (profile.sexo === 'M') {
      return Math.round(88.362 + (13.397 * profile.peso) + (4.799 * profile.talla) - (5.677 * profile.edad));
    } else {
      return Math.round(447.593 + (9.247 * profile.peso) + (3.098 * profile.talla) - (4.330 * profile.edad));
    }
  };

  const imc = profile ? calculateIMC(profile.peso, profile.talla) : 0;
  const tmb = profile ? calculateTMB(profile) : 0;

  const getProfileInfo = (): string => {
    if (!profile || !profile.nombre) {
      return 'Sin perfil guardado';
    }
    return `Perfil: ${profile.nombre}, ${profile.edad} años, ${profile.peso} kg`;
  };

  return (
    <Card className="w-full mb-6 shadow-lg border-green-100">
      <CardHeader 
        className="cursor-pointer hover:bg-green-50/50 transition-colors"
        onClick={onToggleCollapse}
      >
        <CardTitle className="flex items-center justify-between text-green-700">
          <span className="flex items-center gap-2">
            <span className="text-2xl">👤</span>
            Perfil de usuario
          </span>
          <span 
            className={`transition-transform duration-300 ${isCollapsed ? '-rotate-90' : 'rotate-0'}`}
            aria-label={isCollapsed ? 'Expandir' : 'Contraer'}
          >
            ▼
          </span>
        </CardTitle>
      </CardHeader>

      {!isCollapsed && (
        <CardContent className="space-y-4">

            {/* Form Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre</Label>
                <Input
                  id="nombre"
                  type="text"
                  placeholder="Tu nombre"
                  value={formData.nombre}
                  onChange={(e) => handleInputChange('nombre', e.target.value)}
                  className="min-h-[44px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sexo">Sexo</Label>
                <Select 
                  value={formData.sexo} 
                  onValueChange={(value: 'M' | 'F') => handleInputChange('sexo', value)}
                >
                  <SelectTrigger id="sexo" className="min-h-[44px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">Masculino</SelectItem>
                    <SelectItem value="F">Femenino</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edad">Edad</Label>
                <Input
                  id="edad"
                  type="number"
                  min="1"
                  max="120"
                  placeholder="Años"
                  value={formData.edad || ''}
                  onChange={(e) => handleInputChange('edad', parseInt(e.target.value) || 0)}
                  className="min-h-[44px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="peso">Peso (kg)</Label>
                <Input
                  id="peso"
                  type="number"
                  step="0.1"
                  min="20"
                  max="300"
                  placeholder="70"
                  value={formData.peso || ''}
                  onChange={(e) => handleInputChange('peso', parseFloat(e.target.value) || 0)}
                  className="min-h-[44px]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="talla">Talla (cm)</Label>
                <Input
                  id="talla"
                  type="number"
                  min="100"
                  max="250"
                  placeholder="170"
                  value={formData.talla || ''}
                  onChange={(e) => handleInputChange('talla', parseInt(e.target.value) || 0)}
                  className="min-h-[44px]"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 flex-wrap">
              <Button 
                onClick={handleSave} 
                disabled={!formData.nombre}
                className="flex items-center gap-2"
              >
                <span className="text-sm">💾</span>
                Guardar perfil
              </Button>
              
              <Button 
                variant="outline" 
                onClick={handleLoad}
                className="flex items-center gap-2"
              >
                <span className="text-sm">📂</span>
                Cargar perfil
              </Button>

              <Button 
                variant="outline" 
                onClick={handleClear}
                className="flex items-center gap-2 text-red-600 hover:text-red-700"
              >
                <span className="text-sm">🗑️</span>
                Limpiar
              </Button>
            </div>

            {/* Profile Info */}
            <div className="bg-white p-3 rounded-lg border">
              <p className="text-sm text-gray-600">
                {getProfileInfo()}
              </p>
              
              {/* Additional Metrics */}
              {profile && imc > 0 && (
                <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">IMC:</span> {imc}
                    <span className="ml-1 text-gray-500">
                      {imc < 18.5 ? '(Bajo peso)' : 
                       imc < 25 ? '(Normal)' : 
                       imc < 30 ? '(Sobrepeso)' : '(Obesidad)'}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">TMB:</span> {tmb} kcal/día
                  </div>
                </div>
              )}
            </div>
        </CardContent>
      )}
    </Card>
  );
}