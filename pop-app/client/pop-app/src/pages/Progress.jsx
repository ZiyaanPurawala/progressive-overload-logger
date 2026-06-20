import { useState, useEffect, useRef } from 'react';
import { axios } from '../context/AuthContext';

export default function Progress() {
  const [exercises, setExercises] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [metric, setMetric] = useState('estimated1RM');
  const canvasRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    axios.get('/exercises').then(r => {
      const exs = r.data || [];
      setExercises(exs);
      if (exs.length) setSelectedId(exs[0]._id);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    setLoading(true);
    axios.get(`/sessions/strength-curve?exerciseId=${selectedId}`)
      .then(r => setChartData(r.data || []))
      .catch(() => setChartData([]))
      .finally(() => setLoading(false));
  }, [selectedId]);

  useEffect(() => {
    if (!canvasRef.current || !chartData.length) return;

    const renderChart = async () => {
      const { Chart, registerables } = await import('chart.js');
      await import('chartjs-adapter-date-fns').catch(() => {});
      Chart.register(...registerables);

      if (chartInstance.current) chartInstance.current.destroy();

      const labels = chartData.map(d => d.date);
      const values = chartData.map(d => {
        if (metric === 'estimated1RM') return d.estimated1RM;
        if (metric === 'totalVolume')  return d.totalVolume;
        return d.maxWeight;
      });

      const metricLabel = metric === 'estimated1RM' ? 'Estimated 1RM (kg)' :
                          metric === 'totalVolume'  ? 'Session Volume (kg)' : 'Max Weight (kg)';

      chartInstance.current = new Chart(canvasRef.current, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label: metricLabel,
            data: values,
            borderColor: '#C8FF00',
            backgroundColor: 'rgba(200,255,0,0.08)',
            borderWidth: 2,
            tension: 0.35,
            pointRadius: 5,
            pointHoverRadius: 7,
            pointBackgroundColor: '#C8FF00',
            pointBorderColor: '#0A0A0A',
            pointBorderWidth: 2,
            fill: true,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#1C1C1C',
              borderColor: 'rgba(255,255,255,0.1)',
              borderWidth: 1,
              titleColor: '#F2F0EB',
              bodyColor: '#888884',
              padding: 12,
              callbacks: {
                title: (items) => new Date(items[0].label).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
                label: (item) => `  ${item.raw?.toFixed(1)} kg`,
              }
            }
          },
          scales: {
            x: {
              type: 'category',
              grid: { color: 'rgba(255,255,255,0.04)' },
              ticks: {
                color: '#888884',
                font: { family: "'Inter', sans-serif", size: 11 },
                maxTicksLimit: 8,
                callback: (_, i) => {
                  const d = new Date(labels[i]);
                  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                }
              },
              border: { color: 'rgba(255,255,255,0.07)' }
            },
            y: {
              grid: { color: 'rgba(255,255,255,0.04)' },
              ticks: { color: '#888884', font: { family: "'Inter', sans-serif", size: 11 }, callback: v => `${v}` },
              border: { color: 'rgba(255,255,255,0.07)' }
            }
          }
        }
      });
    };

    renderChart();
    return () => { if (chartInstance.current) chartInstance.current.destroy(); };
  }, [chartData, metric]);

  const selectedExercise = exercises.find(e => e._id === selectedId);

  const prChange = chartData.length >= 2
    ? ((chartData.at(-1).estimated1RM - chartData[0].estimated1RM) / chartData[0].estimated1RM * 100).toFixed(1)
    : null;

  return (
    <div>
      <div className="page-header">
        <h1>Progress Charts</h1>
        <p className="text-muted">Your strength curve over time</p>
      </div>

      {/* Controls */}
      <div className="card mb-4">
        <div className="flex items-center gap-3" style={{ flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label className="form-label">Exercise</label>
            <select className="form-input" value={selectedId} onChange={e => setSelectedId(e.target.value)}>
              {exercises.map(ex => <option key={ex._id} value={ex._id}>{ex.name}</option>)}
            </select>
          </div>
          <div style={{ minWidth: 180 }}>
            <label className="form-label">Metric</label>
            <select className="form-input" value={metric} onChange={e => setMetric(e.target.value)}>
              <option value="estimated1RM">Estimated 1RM (Epley)</option>
              <option value="maxWeight">Max weight lifted</option>
              <option value="totalVolume">Session volume</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats row */}
      {chartData.length > 0 && (
        <div className="grid-3 mb-4">
          <div className="stat-card">
            <p className="stat-label">Data points</p>
            <p className="stat-value">{chartData.length}</p>
            <p className="stat-sub">Sessions logged</p>
          </div>
          <div className="stat-card">
            <p className="stat-label">Current est. 1RM</p>
            <p className="stat-value">{chartData.at(-1)?.estimated1RM?.toFixed(1)} kg</p>
            <p className="stat-sub">{selectedExercise?.name}</p>
          </div>
          <div className={`stat-card${prChange > 0 ? ' stat-card-accent' : ''}`}>
            <p className="stat-label">Total improvement</p>
            <p className="stat-value">{prChange ? `${prChange > 0 ? '+' : ''}${prChange}%` : '—'}</p>
            <p className="stat-sub">From first to last session</p>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="card">
        {loading ? (
          <div className="chart-placeholder">
            <div className="bar-loader"><div/><div/><div/><div/><div/></div>
            <p className="text-sm text-muted">Loading strength data…</p>
          </div>
        ) : chartData.length === 0 ? (
          <div className="chart-placeholder">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
            <p style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>No data yet</p>
            <p className="text-sm text-muted">Log a session with {selectedExercise?.name} to see your curve</p>
          </div>
        ) : (
          <div className="chart-container">
            <canvas ref={canvasRef} />
          </div>
        )}
      </div>
    </div>
  );
}