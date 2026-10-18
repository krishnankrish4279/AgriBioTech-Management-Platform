import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { AnalyticsData } from '../../types';

interface DashboardChartsProps {
  analytics: AnalyticsData | null;
}

export const DashboardCharts: React.FC<DashboardChartsProps> = ({ analytics }) => {
  if (!analytics) return null;

  const COLORS = ['#10b981', '#06b6d4', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899'];

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: '#0d1527',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          borderRadius: '8px',
          padding: '10px 14px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.6)',
        }}>
          <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.85rem', marginBottom: '4px' }}>{label}</div>
          {payload.map((p: any, idx: number) => (
            <div key={idx} style={{ fontSize: '0.78rem', color: p.color || '#34d399' }}>
              {p.name}: <strong>{p.value}</strong>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '28px' }}>
      {/* 2-Column Top Charts */}
      <div className="grid-2">
        {/* Monthly Disease Trends */}
        <div className="card-glass">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff' }}>Disease Incidence Vectors (6-Month Trend)</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Monthly pathogen reports across crop clusters</p>
            </div>
            <span className="badge badge-medium">Multi-Crop Trajectory</span>
          </div>

          <div style={{ height: '260px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.monthlyDiseaseTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="wheatGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="riceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="cottonGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" stroke="var(--text-dim)" fontSize={11} />
                <YAxis stroke="var(--text-dim)" fontSize={11} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '0.75rem', paddingTop: '8px' }} />
                <Area type="monotone" dataKey="Wheat" stroke="#f59e0b" fillOpacity={1} fill="url(#wheatGrad)" />
                <Area type="monotone" dataKey="Rice" stroke="#10b981" fillOpacity={1} fill="url(#riceGrad)" />
                <Area type="monotone" dataKey="Cotton" stroke="#06b6d4" fillOpacity={1} fill="url(#cottonGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Crop Variety Yield Comparison */}
        <div className="card-glass">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff' }}>Crop Variety Yield & Maturity Benchmarks</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Yield potential (Quintals/Acre) across engineered cultivars</p>
            </div>
            <span className="badge badge-low">Genomics Performance</span>
          </div>

          <div style={{ height: '260px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.varietiesYieldComparison} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="name" stroke="var(--text-dim)" fontSize={10} />
                <YAxis stroke="var(--text-dim)" fontSize={11} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '0.75rem', paddingTop: '8px' }} />
                <Bar dataKey="avgYield" name="Avg Yield (Q/Acre)" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="maturityDays" name="Maturity (Days)" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* 2-Column Lower Distribution Charts */}
      <div className="grid-2">
        {/* Recommendation Domains */}
        <div className="card-glass">
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff' }}>Biotechnology Solution Breakdown</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Biofertilizers vs Biopesticides vs Parasitoid Biocontrol</p>
          </div>

          <div style={{ height: '240px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={analytics.recommendationTypeDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="name"
                >
                  {analytics.recommendationTypeDistribution.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '0.72rem' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Growth Stage Field Visits */}
        <div className="card-glass">
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff' }}>Field Observation Growth Stages</h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Agronomist field visit coverage by phenological stage</p>
          </div>

          <div style={{ height: '240px', width: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.growthStageDistribution} layout="vertical" margin={{ top: 10, right: 20, left: 30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" stroke="var(--text-dim)" fontSize={11} />
                <YAxis dataKey="name" type="category" stroke="var(--text-dim)" fontSize={10} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Observations Logged" fill="#06b6d4" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
