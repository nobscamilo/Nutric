'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import type { FoodEntry, NutritionalSummary, UserProfile, MealType } from '@/types/nutrition';

interface ExportControlsProps {
  foods: FoodEntry[];
  summary: NutritionalSummary;
  profile?: UserProfile;
  mealType: MealType;
  className?: string;
}

declare global {
  interface Window {
    jsPDF: any;
  }
}

export default function ExportControls({ 
  foods, 
  summary, 
  profile, 
  mealType,
  className = ''
}: ExportControlsProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isJsPDFLoaded, setIsJsPDFLoaded] = useState(false);

  // Load jsPDF scripts
  React.useEffect(() => {
    const loadScripts = async () => {
      try {
        // Load jsPDF
        const jspdfScript = document.createElement('script');
        jspdfScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
        jspdfScript.async = true;
        
        // Load autoTable plugin
        const autotableScript = document.createElement('script');
        autotableScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.28/jspdf.plugin.autotable.min.js';
        autotableScript.async = true;

        document.body.appendChild(jspdfScript);
        document.body.appendChild(autotableScript);

        // Wait for both scripts to load
        await new Promise((resolve, reject) => {
          let scriptsLoaded = 0;
          const checkLoaded = () => {
            scriptsLoaded++;
            if (scriptsLoaded === 2) {
              setIsJsPDFLoaded(true);
              resolve(true);
            }
          };

          jspdfScript.onload = checkLoaded;
          jspdfScript.onerror = reject;
          autotableScript.onload = checkLoaded;
          autotableScript.onerror = reject;
        });

        console.log('✓ PDF libraries loaded successfully');
      } catch (err) {
        console.error('Error loading PDF libraries:', err);
        setError('Error al cargar librerías de exportación');
      }
    };

    loadScripts();

    return () => {
      // Cleanup scripts on unmount
      const scripts = document.querySelectorAll('script[src*="jspdf"], script[src*="autotable"]');
      scripts.forEach(script => {
        if (document.body.contains(script)) {
          document.body.removeChild(script);
        }
      });
    };
  }, []);

  const exportToCSV = async () => {
    try {
      setIsExporting(true);
      setError(null);

      if (foods.length === 0) {
        setError('No hay datos para exportar');
        return;
      }

      // Create CSV content
      let csv = 'Alimento,Cantidad (g/ml),IG,Carbs (g),CG,Kcal\n';
      
      foods.forEach(food => {
        const row = [
          food.name,
          food.quantity.toString(),
          food.gi.toString(),
          food.carbs_g.toFixed(2),
          food.cg.toFixed(2),
          food.kcal.toFixed(1)
        ].join(',');
        csv += row + '\n';
      });

      // Add summary
      csv += '\n--- RESUMEN ---\n';
      csv += `CG total,${summary.totalCG.toFixed(2)}\n`;
      csv += `Kcal total,${Math.round(summary.totalKcal)}\n`;
      csv += `IG ponderado,${summary.weightedGI.toFixed(1)}\n`;
      csv += `IRE (CG/kg),${summary.ire.toFixed(2)}\n`;
      csv += `VG (CG/Kcal×100),${summary.vg.toFixed(2)}\n`;

      // Add profile info if available
      if (profile) {
        csv += '\n--- PERFIL ---\n';
        csv += `Nombre,${profile.nombre}\n`;
        csv += `Sexo,${profile.sexo}\n`;
        csv += `Edad,${profile.edad}\n`;
        csv += `Peso (kg),${profile.peso}\n`;
        csv += `Talla (cm),${profile.talla}\n`;
      }

      csv += `\n--- INFORMACIÓN ---\n`;
      csv += `Tipo de comida,${mealType}\n`;
      csv += `Fecha,${new Date().toLocaleDateString()}\n`;
      csv += `Hora,${new Date().toLocaleTimeString()}\n`;

      // Create and download file
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `calculadora_glucemica_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      console.log('✓ CSV exported successfully');

    } catch (err) {
      console.error('Error exporting CSV:', err);
      setError('Error al exportar CSV');
    } finally {
      setIsExporting(false);
    }
  };

  const exportToPDF = async () => {
    if (!isJsPDFLoaded) {
      setError('Librerías de PDF no están cargadas. Intenta de nuevo.');
      return;
    }

    try {
      setIsExporting(true);
      setError(null);

      if (foods.length === 0) {
        setError('No hay datos para exportar');
        return;
      }

      const { jsPDF } = window.jsPDF;
      const doc = new jsPDF();

      // Header
      doc.setFontSize(18);
      doc.setTextColor(46, 139, 87); // Verde glucémico
      doc.text('🍎 Calculadora Glucémica', 14, 20);

      // Info básica
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 30);
      doc.text(`Hora: ${new Date().toLocaleTimeString()}`, 14, 36);
      doc.text(`Tipo de comida: ${mealType}`, 14, 42);

      // Perfil si existe
      let currentY = 48;
      if (profile) {
        doc.text(`Perfil: ${profile.nombre} - ${profile.edad} años - ${profile.peso} kg`, 14, currentY);
        currentY += 6;
      }

      // Tabla de alimentos
      const tableData = foods.map(food => [
        food.name,
        food.quantity.toString(),
        food.gi.toString(),
        food.carbs_g.toFixed(2),
        food.cg.toFixed(2),
        food.kcal.toFixed(1)
      ]);

      doc.autoTable({
        head: [['Alimento', 'Cantidad', 'IG', 'Carbs (g)', 'CG', 'Kcal']],
        body: tableData,
        startY: currentY + 6,
        theme: 'grid',
        headStyles: { 
          fillColor: [46, 139, 87], // Verde glucémico
          textColor: [255, 255, 255],
          fontSize: 10,
          fontStyle: 'bold'
        },
        bodyStyles: {
          fontSize: 9
        },
        columnStyles: {
          0: { cellWidth: 50 }, // Alimento
          1: { cellWidth: 25, halign: 'center' }, // Cantidad
          2: { cellWidth: 20, halign: 'center' }, // IG
          3: { cellWidth: 25, halign: 'right' }, // Carbs
          4: { cellWidth: 25, halign: 'right' }, // CG
          5: { cellWidth: 25, halign: 'right' }, // Kcal
        }
      });

      // Resumen nutricional
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      
      doc.setFontSize(14);
      doc.setTextColor(46, 139, 87);
      doc.text('📊 Resumen Nutricional', 14, finalY);

      doc.setFontSize(12);
      doc.setTextColor(0, 0, 0);
      doc.text(`CG total: ${summary.totalCG.toFixed(2)} | Kcal total: ${Math.round(summary.totalKcal)}`, 14, finalY + 10);
      doc.text(`IG ponderado: ${summary.weightedGI.toFixed(1)}`, 14, finalY + 18);
      doc.text(`IRE (CG/kg): ${summary.ire.toFixed(2)} | VG (CG/Kcal×100): ${summary.vg.toFixed(2)}`, 14, finalY + 26);

      // Interpretación de resultados
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text('Interpretación:', 14, finalY + 36);
      
      let interpretationY = finalY + 42;
      
      // CG interpretation
      let cgText = '';
      if (summary.totalCG < 10) cgText = 'CG Baja (< 10): Impacto glucémico mínimo';
      else if (summary.totalCG < 20) cgText = 'CG Moderada (10-19): Impacto glucémico moderado';
      else cgText = 'CG Alta (≥ 20): Impacto glucémico alto';
      
      doc.text(`• ${cgText}`, 14, interpretationY);

      // IRE interpretation
      let ireText = '';
      if (summary.ire < 0.7) ireText = 'IRE Bajo (< 0.7): Respuesta estimada baja';
      else if (summary.ire < 1.2) ireText = 'IRE Moderado (0.7-1.2): Respuesta estimada moderada';
      else ireText = 'IRE Alto (≥ 1.2): Respuesta estimada alta';
      
      doc.text(`• ${ireText}`, 14, interpretationY + 6);

      // VG interpretation
      let vgText = '';
      if (summary.vg < 10) vgText = 'VG Bajo (< 10): Bajo valor glucémico por kcal';
      else if (summary.vg < 25) vgText = 'VG Moderado (10-25): Valor glucémico moderado por kcal';
      else vgText = 'VG Alto (≥ 25): Alto valor glucémico por kcal';
      
      doc.text(`• ${vgText}`, 14, interpretationY + 12);

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text('Generado por Calculadora Glucémica - powered by Sarmiento', 14, doc.internal.pageSize.height - 10);

      // Save PDF
      const fileName = `calculadora_glucemica_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

      console.log('✓ PDF exported successfully');

    } catch (err) {
      console.error('Error exporting PDF:', err);
      setError('Error al exportar PDF');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {error && (
        <Alert>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          variant="outline"
          onClick={exportToCSV}
          disabled={isExporting || foods.length === 0}
          className="flex-1 sm:flex-none"
        >
          {isExporting ? '⏳ Exportando...' : '📊 Exportar CSV'}
        </Button>
        
        <Button
          variant="outline"
          onClick={exportToPDF}
          disabled={isExporting || foods.length === 0 || !isJsPDFLoaded}
          className="flex-1 sm:flex-none"
        >
          {isExporting ? '⏳ Exportando...' : 
           !isJsPDFLoaded ? '⏳ Cargando...' : '📄 Exportar PDF'}
        </Button>
      </div>

      {foods.length === 0 && (
        <p className="text-xs text-gray-500">
          Agrega alimentos para habilitar la exportación
        </p>
      )}
    </div>
  );
}