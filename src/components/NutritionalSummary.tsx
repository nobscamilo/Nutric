'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { NutritionalSummary as NutritionalSummaryType, UserProfile } from '@/types/nutrition';

interface NutritionalSummaryProps {
  summary: NutritionalSummaryType;
  profile?: UserProfile;
  className?: string;
}

interface ProgressBarProps {
  label: string;
  value: number;
  percentage: number;
  type: 'low' | 'medium' | 'high';
  description?: string;
}

function ProgressBar({ label, value, percentage, type, description }: ProgressBarProps) {
  const getColorClass = () => {
    switch (type) {
      case 'low': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'high': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getBadgeVariant = () => {
    switch (type) {
      case 'low': return 'default';
      case 'medium': return 'secondary';
      case 'high': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <Badge variant={getBadgeVariant()} className="text-xs">
          {value}
        </Badge>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ease-out ${getColorClass()}`}
          style={{ width: `${Math.min(100, percentage)}%` }}
        />
      </div>
      
      {description && (
        <p className="text-xs text-gray-500 italic">{description}</p>
      )}
    </div>
  );
}

export default function NutritionalSummary({ summary, profile, className = '' }: NutritionalSummaryProps) {
  // Helper function to get progress bar type
  const getProgressBarType = (value: number, type: 'cg' | 'ire' | 'vg'): 'low' | 'medium' | 'high' => {
    if (type === 'cg') {
      if (value < 20) return 'low';
      if (value < 50) return 'medium';
      return 'high';
    }
    if (type === 'ire') {
      if (value < 0.7) return 'low';
      if (value < 1.2) return 'medium';
      return 'high';
    }
    if (type === 'vg') {
      if (value < 10) return 'low';
      if (value < 25) return 'medium';
      return 'high';
    }
    return 'low';
  };

  // Calculate percentages for progress bars
  const cgPercentage = Math.min(100, (summary.totalCG / 100) * 100);
  const irePercentage = Math.min(100, (summary.ire / 2) * 100);
  const vgPercentage = Math.min(100, summary.vg);

  const cgType = getProgressBarType(summary.totalCG, 'cg');
  const ireType = getProgressBarType(summary.ire, 'ire');
  const vgType = getProgressBarType(summary.vg, 'vg');

  return (
    <Card className={`shadow-lg border-green-100 ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-green-700">
          <span className="text-2xl">📊</span>
          Resumen Nutricional
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Main Results */}
        <div className="bg-white p-4 rounded-lg border-2 border-green-100">
          <div className="text-lg font-bold text-gray-900 mb-2">
            CG total: {summary.totalCG.toFixed(2)} | Kcal total: {Math.round(summary.totalKcal)}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-600">
            <div>
              <span className="font-medium">Carbohidratos:</span> {summary.totalCarbs.toFixed(1)}g
            </div>
            <div>
              <span className="font-medium">IG promedio:</span> {summary.weightedGI.toFixed(1)}
            </div>
            <div className="md:col-span-1 col-span-2">
              <span className="font-medium">Por kg corporal:</span> {summary.ire.toFixed(2)} CG/kg
            </div>
          </div>
        </div>

        {/* Progress Bars */}
        <div className="space-y-4">
          <ProgressBar
            label="Carga Glucémica Total"
            value={parseFloat(summary.totalCG.toFixed(2))}
            percentage={cgPercentage}
            type={cgType}
            description="Impacto total en glucemia"
          />

          <ProgressBar
            label={`IRE (CG / kg) - Peso: ${profile?.peso || 70}kg`}
            value={parseFloat(summary.ire.toFixed(2))}
            percentage={irePercentage}
            type={ireType}
            description="Índice de respuesta estimada por kg de peso corporal"
          />

          <ProgressBar
            label="VG (CG / Kcal × 100)"
            value={parseFloat(summary.vg.toFixed(2))}
            percentage={vgPercentage}
            type={vgType}
            description="Valor glucémico por cada 100 kcal consumidas"
          />
        </div>

        {/* IG Ponderado Display */}
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">IG Ponderado</span>
            <Badge 
              variant={summary.weightedGI > 70 ? 'destructive' : 
                     summary.weightedGI > 55 ? 'secondary' : 'default'}
            >
              {summary.weightedGI.toFixed(1)}
            </Badge>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Índice glucémico promedio ponderado por carbohidratos
          </p>
        </div>

        {/* Legend */}
        <div className="bg-gray-50 p-3 rounded-lg text-xs text-gray-600">
          <h5 className="font-semibold mb-2">Clasificación:</h5>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div>
              <span className="font-medium">CG:</span> &lt;20 baja, 20-50 media, &gt;50 alta
            </div>
            <div>
              <span className="font-medium">IRE:</span> &lt;0.7 baja, 0.7-1.2 media, &gt;1.2 alta
            </div>
            <div>
              <span className="font-medium">VG:</span> &lt;10 bajo, 10-25 medio, &gt;25 alto
            </div>
          </div>
        </div>

        {/* Empty State */}
        {summary.totalCG === 0 && (
          <div className="text-center py-8 text-gray-500">
            <div className="text-4xl mb-2">🍽️</div>
            <p>Agrega alimentos para ver el resumen nutricional</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}