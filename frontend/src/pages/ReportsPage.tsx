import React, { useState, useEffect } from 'react';
import { api } from '../api/client';
import { AnalyticsData, DashboardKPIs, CropVariety, DiseaseCase, FieldObservation, Farmer } from '../types';
import { exportComprehensivePDF, exportToCSV } from '../components/reports/ExportServices';
import { BarChart3, FileDown, FileText, Download, TrendingUp, ShieldAlert, Users, Sprout, RefreshCw } from 'lucide-react';
import { DashboardCharts } from '../components/dashboard/DashboardCharts';
import confetti from 'canvas-confetti';

export const ReportsPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [kpis, setKpis] = useState<DashboardKPIs | null>(null);
  const [varieties, setVarieties] = useState<CropVariety[]>([]);
  const [diseaseCases, setDiseaseCases] = useState<DiseaseCase[]>([]);
  const [observations, setObservations] = useState<FieldObservation[]>([]);
  const [farmers, setFarmers] = useState<Farmer[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [aData, kData, vData, dData, oData, fData] = await Promise.all([
        api.analytics.getCharts(),
        api.analytics.getKPIs(),
        api.varieties.getAll(),
        api.diseases.getCases(),
        api.observations.getAll(),
        api.farmers.getAll(),
      ]);
      setAnalytics(aData);
      setKpis(kData);
      setVarieties(vData);
      setDiseaseCases(dData);
      setObservations(oData);
      setFarmers(fData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleExportPDF = () => {
    if (!kpis) return;

    const summaryMetrics = {
      'Total Farmers': kpis.totalFarmers,
      'Monitored Farms': kpis.totalFarms,
      'Crop Varieties': kpis.totalVarieties,
      'Disease Outbreaks': kpis.totalDiseaseCases,
    };

    const tableRows = varieties.map(v => [
      v.varietyName,
      v.cropName,
      v.cropType,
      v.growingSeason,
      `${v.expectedYieldMin} - ${v.expectedYieldMax}`,
      `${v.maturityDays} Days`,
      v.diseaseResistanceTraits || 'Standard',
    ]);

    exportComprehensivePDF(
      'AgriBioTech Crop Performance & Surveillance Report',
      summaryMetrics,
      {
        headers: ['Variety Name', 'Crop', 'Type', 'Season', 'Yield (Q/Acre)', 'Maturity', 'Disease Resistance'],
        rows: tableRows,
      }
    );

    try {
      confetti({ particleCount: 50, spread: 60 });
    } catch {}
  };

  const handleExportVarietiesCSV = () => {
    exportToCSV(
      'crop_varieties_dataset',
      varieties,
      [
        { key: 'varietyName', label: 'Variety Name' },
        { key: 'cropName', label: 'Crop Name' },
        { key: 'cropType', label: 'Crop Type' },
        { key: 'growingSeason', label: 'Season' },
        { key: 'expectedYieldMin', label: 'Min Yield' },
        { key: 'expectedYieldMax', label: 'Max Yield' },
        { key: 'yieldUnit', label: 'Unit' },
        { key: 'maturityDays', label: 'Maturity Days' },
        { key: 'biotechTraits', label: 'Biotech Traits' },
      ]
    );
  };

  const handleExportDiseasesCSV = () => {
    const formatted = diseaseCases.map(d => ({
      diseaseName: d.diseaseName,
      severity: d.severity,
      status: d.status,
      farmName: d.farm?.farmName,
      farmer: d.farm?.farmer?.fullName,
      symptoms: d.symptoms,
      treatment: d.recommendedTreatment,
      dateObserved: d.dateObserved,
    }));

    exportToCSV(
      'disease_surveillance_cases',
      formatted,
      [
        { key: 'diseaseName', label: 'Disease / Pathogen' },
        { key: 'severity', label: 'Severity' },
        { key: 'status', label: 'Status' },
        { key: 'farmName', label: 'Farm Plot' },
        { key: 'farmer', label: 'Farmer' },
        { key: 'symptoms', label: 'Symptoms' },
        { key: 'treatment', label: 'Biotech Protocol' },
        { key: 'dateObserved', label: 'Observed Date' },
      ]
    );
  };

  const handleExportFarmersCSV = () => {
    exportToCSV(
      'farmers_registry',
      farmers,
      [
        { key: 'fullName', label: 'Full Name' },
        { key: 'phone', label: 'Phone' },
        { key: 'state', label: 'State' },
        { key: 'district', label: 'District' },
        { key: 'farmSizeAcres', label: 'Acreage' },
        { key: 'preferredLanguage', label: 'Language' },
        { key: 'primaryCrops', label: 'Crops' },
      ]
    );
  };

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            <BarChart3 size={28} color="#06b6d4" /> Reports & Deep Analytics Hub
          </h1>
          <p className="page-subtitle">
            Export comprehensive surveillance audit reports, variety performance benchmarks, and CSV datasets.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleExportPDF}
            className="btn btn-primary"
          >
            <FileDown size={16} /> Export Styled PDF Report
          </button>
          <button onClick={loadAllData} className="btn btn-secondary">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {/* Export Action Strip */}
      <div className="card-glass" style={{ marginBottom: '24px', padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#fff' }}>
              One-Click CSV Data Export Tools
            </div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              Download raw database tabular dumps for external statistical and GIS packages
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button onClick={handleExportVarietiesCSV} className="btn btn-secondary btn-sm">
              <Download size={14} /> Crop Varieties ({varieties.length})
            </button>
            <button onClick={handleExportDiseasesCSV} className="btn btn-secondary btn-sm">
              <Download size={14} /> Disease Cases ({diseaseCases.length})
            </button>
            <button onClick={handleExportFarmersCSV} className="btn btn-secondary btn-sm">
              <Download size={14} /> Farmers Directory ({farmers.length})
            </button>
          </div>
        </div>
      </div>

      {/* Analytics Visualizations */}
      <DashboardCharts analytics={analytics} />

      {/* Tabular Benchmark Preview */}
      <div className="card-glass" style={{ padding: '20px' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sprout size={18} color="#10b981" /> Cultivar Yield Benchmark Matrix
        </h3>

        <div className="table-container">
          <table className="table-modern">
            <thead>
              <tr>
                <th>Crop Variety</th>
                <th>Category</th>
                <th>Season</th>
                <th>Min Yield</th>
                <th>Max Yield</th>
                <th>Maturity</th>
                <th>Biotech Gene Stacks</th>
              </tr>
            </thead>
            <tbody>
              {varieties.map(v => (
                <tr key={v.id}>
                  <td style={{ fontWeight: 700, color: '#fff' }}>{v.varietyName}</td>
                  <td><span className="badge badge-medium">{v.cropType}</span></td>
                  <td>{v.growingSeason}</td>
                  <td style={{ color: '#34d399', fontWeight: 600 }}>{v.expectedYieldMin} {v.yieldUnit.split('/')[0]}</td>
                  <td style={{ color: '#10b981', fontWeight: 700 }}>{v.expectedYieldMax} {v.yieldUnit.split('/')[0]}</td>
                  <td>{v.maturityDays} Days</td>
                  <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{v.biotechTraits}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
