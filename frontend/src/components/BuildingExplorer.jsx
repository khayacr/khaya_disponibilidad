import { useState, useRef, useEffect } from 'react';
import TowerSelector from './TowerSelector';
import FloorSelector from './FloorSelector';
import FloorPlan from './FloorPlan';
import Filters from './Filters';
import UnitModal from './UnitModal';
import { BrandLogo } from './BrandLogo';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { matchesUnitFilters } from '@/utils/unitFilters';

const API_URL = process.env.REACT_APP_BACKEND_URL;
const API_BASE = API_URL || '';

/** Número tipo 1401 = piso 14 + apto 01 (para mapa). */
function mapUnitLegacyNumber(u) {
  const f = Number(u?.floor);
  const a = Number(u?.apartment);
  if (!Number.isFinite(f) || !Number.isFinite(a)) return '—';
  return `${f}${String(a).padStart(2, '0')}`;
}

function formatMapPriceFull(price) {
  const p = Number(price);
  if (!Number.isFinite(p)) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(p);
}

function formatApiDetail(payload) {
  const d = payload?.detail;
  if (typeof d === 'string') return d;
  if (Array.isArray(d)) {
    return d.map((x) => (x && typeof x === 'object' && 'msg' in x ? x.msg : JSON.stringify(x))).join(' ');
  }
  if (d != null && typeof d === 'object') return JSON.stringify(d);
  return null;
}

const STATUS_BG = {
  Disponible: 'bg-emerald-500',
  Reservado: 'bg-[#e08433]',
  Vendido: 'bg-orange-500',
  Bloqueado: 'bg-slate-400',
};

const STATUS_BG_SOFT = {
  Disponible: 'bg-emerald-500/15',
  Reservado: 'bg-[#e08433]/20',
  Vendido: 'bg-orange-500/15',
  Bloqueado: 'bg-slate-400/20',
};

export const BuildingExplorer = ({ onContactClick }) => {
  const [towers, setTowers] = useState({});
  const [selectedTower, setSelectedTower] = useState(null);
  const [selectedFloor, setSelectedFloor] = useState(14);
  const [selectedUnit, setSelectedUnit] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [units, setUnits] = useState([]);
  const [lastSync, setLastSync] = useState(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [filters, setFilters] = useState({
    view: null,
    status: null,
    minPrice: null,
    maxPrice: null
  });
  const [sheetsInfo, setSheetsInfo] = useState({ enabled: false, has_credentials: false, gspread_available: false });
  const [planView, setPlanView] = useState('planta'); // 'planta' | 'mapa'

  const explorerRef = useRef(null);

  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && !API_BASE) {
      console.warn(
        '[Khaya] Sin REACT_APP_BACKEND_URL el frontend no habla con el API. Copia frontend/env.example a frontend/.env, reinicia yarn start.'
      );
    }
  }, []);

  // Load towers
  useEffect(() => {
    const fetchTowers = async () => {
      try {
        const response = await fetch(`${API_BASE}/api/towers`);
        if (response.ok) {
          const data = await response.json();
          setTowers(data);
          // Select first tower by default
          const firstTower = Object.keys(data)[0];
          if (firstTower) {
            setSelectedTower(firstTower);
          }
        }
      } catch (error) {
        console.error('Error fetching towers:', error);
      }
    };
    fetchTowers();
  }, []);

  // Check Sheets write-back availability
  useEffect(() => {
    const fetchSheetsInfo = async () => {
      try {
        const resp = await fetch(`${API_BASE}/api/sheets-enabled`);
        if (resp.ok) setSheetsInfo(await resp.json());
      } catch {
        // ignore
      }
    };
    fetchSheetsInfo();
  }, []);

  // Load units from API
  useEffect(() => {
    const fetchUnits = async () => {
      try {
        const url = selectedTower 
          ? `${API_BASE}/api/units?tower=${encodeURIComponent(selectedTower)}`
          : `${API_BASE}/api/units`;
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          setUnits(data);
        }
      } catch (error) {
        console.error('Error fetching units:', error);
      }
    };
    fetchUnits();
  }, [selectedTower]);

  // Poll sync status every 30s and refresh data when sync occurs
  useEffect(() => {
    const checkSync = async () => {
      try {
        const resp = await fetch(`${API_BASE}/api/sync-status`);
        if (resp.ok) {
          const data = await resp.json();
          if (data.last_sync && data.last_sync !== lastSync) {
            setLastSync(data.last_sync);
            // Refresh units and towers after a new sync
            const [unitsResp, towersResp] = await Promise.all([
              fetch(selectedTower
                ? `${API_BASE}/api/units?tower=${encodeURIComponent(selectedTower)}`
                : `${API_BASE}/api/units`),
              fetch(`${API_BASE}/api/towers`)
            ]);
            if (unitsResp.ok) setUnits(await unitsResp.json());
            if (towersResp.ok) setTowers(await towersResp.json());
            if (lastSync !== null) {
              toast.success('Datos actualizados desde Google Sheets');
            }
          }
        }
      } catch (e) {
        // Silently ignore sync check errors
      }
    };
    checkSync();
    const interval = setInterval(checkSync, 30000);
    return () => clearInterval(interval);
  }, [selectedTower, lastSync]);

  const handleTowerSelect = (tower) => {
    setSelectedTower(tower);
    setSelectedFloor(14);
    // Evita vista/precio de otra torre que no exista en la nueva o deje el Select incoherente
    setFilters({
      view: null,
      status: null,
      minPrice: null,
      maxPrice: null,
    });
  };

  const handleFloorSelect = (floor) => {
    setSelectedFloor(floor);
  };

  const handleUnitClick = (unit) => {
    setSelectedUnit(unit);
    setIsModalOpen(true);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      view: null,
      status: null,
      minPrice: null,
      maxPrice: null
    });
  };

  const handleContactFromModal = (unit) => {
    setSelectedUnit(unit);
    onContactClick(unit);
  };

  const handleUpdateUnit = async (unitId, updateData) => {
    try {
      const response = await fetch(`${API_BASE}/api/units/${encodeURIComponent(unitId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });
      
      const payload = await response.json().catch(() => ({}));
      if (response.ok) {
        const updatedUnit = payload;
        setUnits(prev => prev.map(u => u.id === unitId ? updatedUnit : u));
        setSelectedUnit(updatedUnit);
        toast.success('Cambios guardados');
      } else {
        const msg = formatApiDetail(payload) || response.statusText || 'Error al guardar';
        toast.error(msg);
      }
    } catch (error) {
      console.error('Error updating unit:', error);
      toast.error('Error actualizando unidad');
    }
  };

  const handleManualSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const resp = await fetch(`${API_BASE}/api/sync`, { method: 'POST' });
      if (resp.ok) {
        const data = await resp.json();
        setLastSync(data.last_sync);
        const [unitsResp, towersResp] = await Promise.all([
          fetch(selectedTower
              ? `${API_BASE}/api/units?tower=${encodeURIComponent(selectedTower)}`
              : `${API_BASE}/api/units`),
            fetch(`${API_BASE}/api/towers`)
        ]);
        if (unitsResp.ok) setUnits(await unitsResp.json());
        if (towersResp.ok) setTowers(await towersResp.json());
        toast.success('Sincronizado manualmente');
      }
    } catch (e) {
      toast.error('Error al sincronizar');
    } finally {
      setIsSyncing(false);
    }
  };

  const formatSyncTime = (isoStr) => {
    if (!isoStr) return null;
    const d = new Date(isoStr);
    return d.toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const floorUnits = units.filter((u) => u.floor === selectedFloor);
  const floors = Array.from({ length: 14 }, (_, i) => 14 - i);
  const unitsMatchingFilters = units.filter((u) => matchesUnitFilters(u, filters));
  const unitsByFloor = floors.map((f) => ({
    floor: f,
    units: unitsMatchingFilters
      .filter((u) => u.floor === f)
      .sort((a, b) => a.apartment - b.apartment),
  }));

  return (
    <section 
      ref={explorerRef}
      data-testid="building-explorer"
      className="min-h-screen bg-white"
    >
      {/* Section Header */}
      <div className="py-12 lg:py-16 px-6 lg:px-12 border-b border-black/10">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs tracking-[0.3em] uppercase text-[#e08433] mb-3">
            Explorador Interactivo
          </p>
          <h2 
            className="text-3xl lg:text-4xl font-light text-slate-900 mb-4"
            style={{ fontFamily: 'Cormorant Garamond, serif' }}
          >
            Descubre tu nuevo hogar
          </h2>
          <p className="text-slate-600 max-w-2xl">
            Selecciona una torre y piso para explorar las unidades disponibles. 
            Haz clic en cualquier apartamento para ver su plan de venta personalizado.
          </p>
          {lastSync && (
            <div data-testid="sync-indicator" className="mt-3 flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs text-slate-500">
                Sincronizado: {formatSyncTime(lastSync)} &middot; Auto-sync cada 60s
              </span>
              <button
                onClick={handleManualSync}
                disabled={isSyncing}
                title="Sincronizar ahora"
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-[#644939] transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tower Selector */}
      <div className="px-6 lg:px-12">
        <div className="max-w-7xl mx-auto">
          <TowerSelector 
            towers={towers}
            selectedTower={selectedTower}
            onTowerSelect={handleTowerSelect}
          />
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 lg:px-12 py-6 bg-slate-50 border-b border-black/10">
        <div className="max-w-7xl mx-auto">
          <Filters 
            filters={filters}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
            units={units}
          />
        </div>
      </div>

      {/* Explorer Layout */}
      <div className="flex flex-col lg:flex-row min-h-[80vh]">
        {/* Floor Selector (solo en vista Planta) */}
        {planView === 'planta' && (
          <FloorSelector 
            selectedFloor={selectedFloor}
            onFloorSelect={handleFloorSelect}
            units={units}
          />
        )}

        {/* Floor Plan */}
        <div className="flex-1 bg-white flex flex-col min-h-0">
          <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-black/10 bg-slate-50">
            <span className="text-xs text-slate-600 uppercase tracking-wider">
              {planView === 'planta' ? `Todo el piso ${selectedFloor}` : 'Mapa de pisos'}
            </span>
            <div className="ml-auto flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPlanView('planta')}
                className={`text-xs px-2 py-1.5 border rounded ${
                  planView === 'planta'
                    ? 'bg-white text-slate-900 border-black/20'
                    : 'bg-transparent text-slate-600 border-black/10 hover:bg-black/5'
                }`}
              >
                Planta
              </button>
              <button
                type="button"
                onClick={() => setPlanView('mapa')}
                className={`text-xs px-2 py-1.5 border rounded ${
                  planView === 'mapa'
                    ? 'bg-white text-slate-900 border-black/20'
                    : 'bg-transparent text-slate-600 border-black/10 hover:bg-black/5'
                }`}
              >
                Mapa
              </button>
            </div>
          </div>
          <div className="flex-1 min-h-0">
            {planView === 'planta' ? (
              <FloorPlan 
                selectedFloor={selectedFloor}
                selectedTower={selectedTower}
                onUnitClick={handleUnitClick}
                filters={filters}
                units={floorUnits}
              />
            ) : (
              <div className="p-4 overflow-auto h-full">
                <div className="min-w-[860px] border border-black/10 rounded bg-white">
                  <div className="px-4 py-3 border-b border-black/10 flex items-center justify-between">
                    <div className="text-sm tracking-[0.2em] uppercase text-slate-600">
                      {selectedTower || 'Torre'} · Disponibilidad
                    </div>
                    <div className="flex h-8 shrink-0 items-center">
                      <BrandLogo size="map" className="object-right" />
                    </div>
                  </div>

                  <div className="divide-y divide-black/10">
                    {unitsByFloor.map(({ floor, units: rowUnits }) => (
                      <div key={floor} className="flex items-stretch">
                        <div className="w-32 px-4 py-3 bg-slate-50 border-r border-black/10">
                          <div className="text-sm font-semibold text-slate-900">Piso {floor}</div>
                          <div className="text-[10px] tracking-wider uppercase text-slate-500">
                            {floor === 1 ? 'Planta baja' : 'Planta tipo'}
                          </div>
                        </div>

                        <div className="flex-1 px-4 py-3">
                          <div className="grid grid-cols-10 gap-2">
                            {rowUnits.map((u) => (
                              <button
                                key={u.id}
                                type="button"
                                disabled={u.status === 'Vendido'}
                                onClick={() => handleUnitClick(u)}
                                className={`min-h-[90px] py-1.5 rounded border border-black/15 leading-tight flex flex-col items-center justify-center gap-0.5 px-0.5 ${
                                  STATUS_BG[u.status] || 'bg-emerald-500'
                                } ${
                                  u.status === 'Vendido'
                                    ? 'opacity-60 cursor-not-allowed'
                                    : 'hover:brightness-95'
                                }`}
                                title={
                                  `${u.code} / (${mapUnitLegacyNumber(u)}) · ${u.view || '—'}${
                                    u.ubicacion ? ` · ${u.ubicacion}` : ''
                                  } · ${formatMapPriceFull(u.price)} · ${u.status}`
                                }
                              >
                                <span className="text-[12px] font-normal text-center text-black whitespace-normal leading-snug px-0.5 [text-shadow:0_0_2px_rgba(255,255,255,0.85)]">
                                  {u.code} / ({mapUnitLegacyNumber(u)})
                                </span>
                                <span className="text-[10px] font-medium text-center text-black/90 [text-shadow:0_0_2px_rgba(255,255,255,0.85)] leading-tight line-clamp-2">
                                  {u.view || '—'}
                                  {u.ubicacion ? (
                                    <span className="block text-[9px] font-normal opacity-95 mt-0.5">
                                      {u.ubicacion}
                                    </span>
                                  ) : null}
                                </span>
                                <span className="text-[15px] font-bold tabular-nums tracking-tight text-black [text-shadow:0_0_2px_rgba(255,255,255,0.9)]">
                                  {formatMapPriceFull(u.price)}
                                </span>
                              </button>
                            ))}
                          </div>

                          {floor === 1 && (
                            <div className="mt-3 flex items-center gap-2 text-xs text-slate-600">
                              <span className="inline-block w-2 h-2 rounded-full bg-slate-400" />
                              <span>Recepción (referencia)</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="px-4 py-3 border-t border-black/10 bg-slate-50 flex flex-wrap gap-3 text-xs">
                    {Object.keys(STATUS_BG).map((s) => (
                      <div key={s} className="flex items-center gap-2">
                        <span className={`w-3 h-3 rounded-sm ${STATUS_BG[s]}`} />
                        <span className="text-slate-700">{s}</span>
                      </div>
                    ))}
                    <div className="ml-auto text-slate-500">
                      Click en una unidad (no vendida) para ver detalles
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Unit Detail Modal */}
      <UnitModal 
        unit={selectedUnit}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onUpdateUnit={handleUpdateUnit}
      />
    </section>
  );
};

export default BuildingExplorer;
