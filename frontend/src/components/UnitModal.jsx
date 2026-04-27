import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Input } from './ui/input';
import {
  X,
  Maximize,
  Bed,
  Bath,
  Car,
  Calendar,
  Edit3,
  Save,
  Calculator,
  CheckCircle,
  Clock,
  XCircle,
  Lock,
  FileText
} from 'lucide-react';
import { generateReservationPDF } from '../utils/generateReservationPDF';
import {
  computeBankFinancing,
  DEFAULT_TASA_ANUAL,
  DEFAULT_CUOTA_MANTENIMIENTO,
  PLAZO_ANOS_FINANCIAMIENTO,
} from '../utils/bankFinancing';
import {
  parkingPremiumUsd,
  parkingM2ForSize,
  totalAreaM2,
  PARKING_LARGE_PREMIUM_USD,
  isSheetParkingLarge,
} from '../utils/parkingPricing';

const STATUS_OPTIONS = [
  { value: 'Disponible', label: 'Disponible', icon: CheckCircle, color: 'text-[#10b981] bg-[#10b981]/20 border-[#10b981]/50' },
  { value: 'Reservado', label: 'Reservado', icon: Clock, color: 'text-[#e08433] bg-[#e08433]/20 border-[#e08433]/50' },
  { value: 'Vendido', label: 'Vendido', icon: XCircle, color: 'text-[#f97316] bg-[#f97316]/20 border-[#f97316]/50' },
  { value: 'Bloqueado', label: 'Bloqueado', icon: Lock, color: 'text-[#64748b] bg-[#64748b]/20 border-[#64748b]/50' }
];

export const UnitModal = ({ unit, isOpen, onClose, onUpdateUnit }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(null);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  
  // Editable calculation params - all fields
  const [primaPct, setPrimaPct] = useState(10);
  const [primaAmount, setPrimaAmount] = useState(0);
  const [primaLastEdited, setPrimaLastEdited] = useState('pct'); // 'pct' | 'amount'
  const [reserva, setReserva] = useState(1000);
  const [opcionCompra, setOpcionCompra] = useState(1000);
  const [mesesPrima, setMesesPrima] = useState(13);
  const [cuotaMensual, setCuotaMensual] = useState(0);
  const [gastosCierrePct, setGastosCierrePct] = useState(2);
  const [reservaDate, setReservaDate] = useState(() => new Date());
  const [tasaAnualPct, setTasaAnualPct] = useState(DEFAULT_TASA_ANUAL);
  const [cuotaMantenimiento, setCuotaMantenimiento] = useState(DEFAULT_CUOTA_MANTENIMIENTO);
  const [parkingSize, setParkingSize] = useState('small'); // 'small' 14.3m² | 'large' 28.6m²

  const aptArea = editData?.area ?? unit?.area ?? 0;
  const basePrice = editData?.price ?? unit?.price ?? 0;
  const parkingPremium = unit ? parkingPremiumUsd(unit, parkingSize) : 0;
  const price = Math.max(0, basePrice + parkingPremium);
  const selectedParkingM2 = parkingM2ForSize(parkingSize);
  const totalBuiltM2 = totalAreaM2(aptArea, parkingSize);

  const addDays = (date, days) => {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
  };

  const addMonths = (date, months) => {
    const d = new Date(date);
    d.setMonth(d.getMonth() + months);
    return d;
  };

  const setPrimaFromPct = (pct) => {
    const safePct = Number.isFinite(pct) ? pct : 0;
    setPrimaPct(safePct);
    setPrimaAmount(Math.round(price * (safePct / 100)));
    setPrimaLastEdited('pct');
  };

  const setPrimaFromAmount = (amount) => {
    const safeAmount = Number.isFinite(amount) ? amount : 0;
    setPrimaAmount(safeAmount);
    const pct = price > 0 ? (safeAmount / price) * 100 : 0;
    setPrimaPct(parseFloat(pct.toFixed(1)) || 0);
    setPrimaLastEdited('amount');
  };

  useEffect(() => {
    if (!price || price <= 0) return;
    if (primaLastEdited === 'amount') {
      const pct = (primaAmount / price) * 100;
      setPrimaPct(parseFloat(pct.toFixed(1)) || 0);
      return;
    }
    setPrimaAmount(Math.round(price * (primaPct / 100)));
  }, [price]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!unit) return;
    setIsEditing(false);
    setEditData(null);
    setShowStatusMenu(false);
    setPrimaPct(10);
    setPrimaAmount(Math.round((unit.price || 0) * 0.1));
    setPrimaLastEdited('pct');
    setReserva(1000);
    setOpcionCompra(1000);
    setMesesPrima(13);
    setCuotaMensual(0);
    setGastosCierrePct(2);
    setReservaDate(new Date());
    setTasaAnualPct(DEFAULT_TASA_ANUAL);
    setCuotaMantenimiento(DEFAULT_CUOTA_MANTENIMIENTO);
    setParkingSize(isSheetParkingLarge(unit.parkingArea) ? 'large' : 'small');
    // Intencional: solo al cambiar de unidad (id), no cuando el padre repasa otro objeto con el mismo id.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- deps limitadas a unit?.id
  }, [unit?.id]);

  if (!unit) return null;

  // Sales plan calculations - all dynamic
  const primaTotal = primaAmount;
  const primaEquivPct = price > 0 ? ((primaAmount / price) * 100).toFixed(1) : null;
  const remainingPrima = Math.max(0, primaTotal - reserva - opcionCompra);
  const cuotasCount = Math.max(1, Number.isFinite(mesesPrima) ? Math.floor(mesesPrima) : 1);
  const computedCuota = Math.round(((remainingPrima / cuotasCount) || 0) * 100) / 100;
  const cuotaBase = cuotaMensual > 0 ? cuotaMensual : computedCuota;
  const primaFraccionada = cuotaBase;
  const gastosCierre = price * (gastosCierrePct / 100);
  const montoFinanciar = price - primaTotal;

  const bankFin = computeBankFinancing(montoFinanciar, tasaAnualPct, cuotaMantenimiento, PLAZO_ANOS_FINANCIAMIENTO);

  const formatPrice = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  };

  const formatShortDate = (value) => {
    if (!value) return '';
    const d = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return new Intl.DateTimeFormat('en-US').format(d);
  };

  const primaSchedule = (() => {
    const safePrimaTotal = Number.isFinite(primaTotal) ? primaTotal : 0;
    const safeReserva = Number.isFinite(reserva) ? reserva : 0;
    const safeOpc = Number.isFinite(opcionCompra) ? opcionCompra : 0;
    const cuotas = cuotasCount;

    const remaining = Math.max(0, safePrimaTotal - safeReserva - safeOpc);
    const base = Math.round((cuotaBase || 0) * 100) / 100;
    const last = Math.round((remaining - base * (cuotas - 1)) * 100) / 100;

    const opcDate = addDays(reservaDate, 15);
    const cuotaStartDate = addMonths(reservaDate, 1);

    const rows = [
      { label: 'PRIMA', amount: safePrimaTotal, date: null, kind: 'total' },
      { label: 'RESERVA', amount: safeReserva, date: reservaDate, kind: 'fixed' },
      { label: 'OPC', amount: safeOpc, date: opcDate, kind: 'fixed' },
    ];

    for (let i = 1; i <= cuotas; i += 1) {
      const amount = i === cuotas ? Math.max(0, last) : base;
      rows.push({
        label: `CUOTA ${String(i).padStart(2, '0')}`,
        amount,
        date: addMonths(cuotaStartDate, i - 1),
        kind: 'cuota',
      });
    }

    rows.push({ label: 'PRIMA', amount: safePrimaTotal, date: null, kind: 'total' });
    return rows;
  })();

  const getStatusColor = (status) => {
    switch (status) {
      case 'Disponible': return 'bg-[#10b981]/20 text-[#10b981] border-[#10b981]/30';
      case 'Reservado': return 'bg-[#e08433]/20 text-[#e08433] border-[#e08433]/30';
      case 'Vendido': return 'bg-[#f97316]/20 text-[#f97316] border-[#f97316]/30';
      case 'Bloqueado': return 'bg-[#64748b]/20 text-[#64748b] border-[#64748b]/30';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (onUpdateUnit) {
      await onUpdateUnit(unit.id, { status: newStatus });
    }
    setShowStatusMenu(false);
  };

  const handleEdit = () => {
    setEditData({
      price: unit.price,
      area: unit.area,
      parkingArea: unit.parkingArea,
      bedrooms: unit.bedrooms,
      bathrooms: unit.bathrooms,
      status: unit.status
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (onUpdateUnit && editData) {
      await onUpdateUnit(unit.id, editData);
    }
    setIsEditing(false);
    setEditData(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData(null);
  };

  const currentStatus = editData?.status || unit.status;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        data-testid="unit-modal"
        className="bg-white border-black/10 text-slate-900 max-w-2xl p-0 gap-0 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b border-black/10 sticky top-0 bg-white z-10">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs tracking-[0.2em] uppercase text-gray-500 mb-1">
                Unidad {unit.code}
              </p>
              <DialogTitle 
                className="text-2xl font-light text-slate-900"
                style={{ fontFamily: 'Cormorant Garamond, serif' }}
              >
                Apto {unit.apartment} · Piso {unit.floor}
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-600 mt-1">
                {aptArea}m² apartamento + {selectedParkingM2}m² parqueo ({totalBuiltM2} m² total) · {unit.view}
                {unit.ubicacion ? ` · ${unit.ubicacion}` : ''}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative text-right">
                <button
                  data-testid="status-btn"
                  type="button"
                  onClick={() => setShowStatusMenu(!showStatusMenu)}
                  className={`px-3 py-1 text-xs border cursor-pointer hover:opacity-80 transition-opacity ${getStatusColor(currentStatus)}`}
                >
                  {currentStatus} ▼
                </button>
                {showStatusMenu && (
                  <div className="absolute right-0 top-full mt-1 bg-white border border-black/10 rounded shadow-xl z-50 min-w-[150px]">
                    {STATUS_OPTIONS.map((option) => {
                      const Icon = option.icon;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          data-testid={`status-option-${option.value}`}
                          onClick={() => handleStatusChange(option.value)}
                          className={`w-full px-3 py-2 flex items-center gap-2 hover:bg-black/5 transition-colors text-left ${
                            currentStatus === option.value ? 'bg-black/5' : ''
                          }`}
                        >
                          <Icon className={`w-4 h-4 ${option.color.split(' ')[0]}`} />
                          <span className="text-sm text-slate-900">{option.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {!isEditing ? (
                <button
                  data-testid="edit-unit-btn"
                  onClick={handleEdit}
                  className="p-2 hover:bg-black/5 rounded transition-colors"
                  title="Editar información"
                >
                  <Edit3 className="w-4 h-4 text-slate-500" />
                </button>
              ) : (
                <div className="flex gap-1">
                  <button
                    data-testid="save-unit-btn"
                    onClick={handleSave}
                    className="p-2 hover:bg-[#10b981]/20 rounded transition-colors"
                    title="Guardar"
                  >
                    <Save className="w-4 h-4 text-[#10b981]" />
                  </button>
                  <button
                    onClick={handleCancel}
                    className="p-2 hover:bg-black/5 rounded transition-colors"
                    title="Cancelar"
                  >
                    <X className="w-4 h-4 text-slate-500" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="p-6">
          {/* Unit Info Header */}
          <div className="bg-white border border-black/10 p-4 mb-6">
            <p className="text-slate-900 font-medium text-sm">
              {unit.tower} · Apto {unit.code} · {aptArea}m² + {selectedParkingM2}m² parqueo · {totalBuiltM2} m² total
              {' '}(Piso {unit.floor} · {unit.view}
              {unit.ubicacion ? ` · ${unit.ubicacion}` : ''})
            </p>
          </div>

          {/* Parqueo cotización */}
          <div className="mb-4 p-4 border border-black/10 bg-slate-50/80">
            <p className="text-xs tracking-[0.15em] uppercase text-[#e08433] mb-2">Parqueo (cotización)</p>
            <p className="text-xs text-slate-600 mb-3">
              Listado según hoja: {unit.parkingArea}m². El precio base corresponde a esa configuración; al cambiar
              parqueo se ajusta ±{formatPrice(PARKING_LARGE_PREMIUM_USD)} (28,6 m² vs 14,3 m²).
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setParkingSize('small')}
                className={`flex-1 min-w-[140px] px-3 py-2 text-sm font-medium border rounded transition-colors ${
                  parkingSize === 'small'
                    ? 'bg-[#e08433] text-black border-[#e08433]'
                    : 'bg-white text-slate-800 border-black/15 hover:bg-black/5'
                }`}
              >
                14,3 m²
              </button>
              <button
                type="button"
                onClick={() => setParkingSize('large')}
                className={`flex-1 min-w-[140px] px-3 py-2 text-sm font-medium border rounded transition-colors ${
                  parkingSize === 'large'
                    ? 'bg-[#e08433] text-black border-[#e08433]'
                    : 'bg-white text-slate-800 border-black/15 hover:bg-black/5'
                }`}
              >
                28,6 m² (+US$15.000 vs 14,3 m²)
              </button>
            </div>
            {parkingPremium !== 0 && (
              <p className="text-xs text-slate-700 mt-2">
                Ajuste vs precio listado: {parkingPremium > 0 ? '+' : '−'}
                {formatPrice(Math.abs(parkingPremium))}
              </p>
            )}
          </div>

          {/* Sales Plan Table */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Calculator className="w-5 h-5 text-[#e08433]" />
              <h3 className="text-lg font-light" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                Plan de Venta Personalizado
              </h3>
            </div>

            <div className="border border-black/10 overflow-hidden">
              {/* Price Row */}
              <div className="flex border-b border-black/10">
                <div className="flex-1 p-4 bg-slate-50 font-medium">
                  <span className="block">Precio total cotización</span>
                  <span className="block text-xs font-normal text-slate-500 mt-0.5">
                    Incluye parqueo {selectedParkingM2}m²
                  </span>
                </div>
                <div className="w-44 p-4 bg-[#f97316]/10 text-right font-semibold text-[#f97316]">
                  {isEditing ? (
                    <div className="space-y-1">
                      <span className="block text-[10px] font-normal text-slate-600">Precio base (hoja)</span>
                      <Input
                        type="number"
                        value={editData.price}
                        onChange={(e) => setEditData({ ...editData, price: parseFloat(e.target.value) })}
                        className="bg-transparent border-0 text-right text-[#f97316] h-6 p-0 w-full"
                      />
                      <span className="block text-xs font-semibold pt-1 border-t border-black/10">
                        {formatPrice(price)}
                      </span>
                    </div>
                  ) : (
                    formatPrice(price)
                  )}
                </div>
              </div>

              {/* Prima personalizada (como Excel: % y monto visibles y sincronizados) */}
              <div className="flex border-b border-black/10">
                <div className="flex-1 p-4 bg-[#e08433]/10 flex items-center gap-3 flex-wrap">
                  <span className="font-medium text-slate-900">Prima personalizada</span>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={primaPct}
                      onChange={(e) => setPrimaFromPct(parseFloat(e.target.value) || 0)}
                      className="w-16 h-8 bg-white border border-black/10 text-center text-slate-900 font-medium"
                      min={0}
                      max={100}
                      step={0.1}
                    />
                    <span>%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      value={primaAmount}
                      onChange={(e) => setPrimaFromAmount(parseFloat(e.target.value) || 0)}
                      className="w-28 h-8 bg-white border border-black/10 text-right text-slate-900 font-medium pr-2"
                      min={0}
                    />
                    <span className="text-xs text-slate-500">= {primaEquivPct}%</span>
                  </div>
                </div>
                <div className="w-40 p-4 text-right text-slate-700">
                  {formatPrice(primaTotal)}
                </div>
              </div>

              {/* Fecha base (para el cuadro estilo Excel) */}
              <div className="flex border-b border-black/10">
                <div className="flex-1 p-4 bg-white flex items-center gap-2">
                  <span>Fecha de reserva</span>
                </div>
                <div className="w-40 p-4 bg-white text-right">
                  <Input
                    type="date"
                    value={new Date(reservaDate).toISOString().slice(0, 10)}
                    onChange={(e) => setReservaDate(new Date(`${e.target.value}T00:00:00`))}
                    className="w-full h-8 bg-white border border-black/10 text-right text-slate-900 font-medium pr-2"
                  />
                </div>
              </div>

              {/* Reserva */}
              <div className="flex border-b border-black/10">
                <div className="flex-1 p-4 bg-white flex items-center gap-2">
                  <span>Reserva el día de hoy</span>
                </div>
                <div className="w-40 p-4 bg-white text-right">
                  <Input
                    type="number"
                    value={reserva}
                    onChange={(e) => setReserva(parseFloat(e.target.value) || 0)}
                    className="w-full h-8 bg-white border border-black/10 text-right text-slate-900 font-medium pr-2"
                    min={0}
                  />
                </div>
              </div>

              {/* Opción de compra */}
              <div className="flex border-b border-black/10">
                <div className="flex-1 p-4 bg-slate-50 flex items-center gap-2">
                  <span>Opción de compra en 15 días</span>
                </div>
                <div className="w-40 p-4 text-right">
                  <Input
                    type="number"
                    value={opcionCompra}
                    onChange={(e) => setOpcionCompra(parseFloat(e.target.value) || 0)}
                    className="w-full h-8 bg-white border border-black/10 text-right text-slate-900 font-medium pr-2"
                    min={0}
                  />
                </div>
              </div>

              {/* Prima fraccionada */}
              <div className="flex border-b border-black/10">
                <div className="flex-1 p-4 bg-white flex items-center gap-2">
                  <span>Cuotas</span>
                  <select
                    value={mesesPrima}
                    onChange={(e) => setMesesPrima(parseInt(e.target.value) || 1)}
                    className="h-8 bg-white border border-black/10 text-slate-900 font-medium px-2"
                  >
                    {Array.from({ length: 24 }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                  <span>pagos de</span>
                  <Input
                    type="number"
                    value={cuotaMensual}
                    onChange={(e) => setCuotaMensual(parseFloat(e.target.value) || 0)}
                    className="w-28 h-8 bg-white border border-black/10 text-right text-slate-900 font-medium pr-2"
                    min={0}
                  />
                </div>
                <div className="w-40 p-4 bg-white text-right text-slate-700">
                  {formatPrice(primaFraccionada)}
                </div>
              </div>

              {/* Gastos de cierre */}
              <div className="flex border-b border-black/10">
                <div className="flex-1 p-4 bg-slate-50 flex items-center gap-2">
                  <span>Gastos de cierre aprox</span>
                  <Input
                    type="number"
                    value={gastosCierrePct}
                    onChange={(e) => setGastosCierrePct(parseFloat(e.target.value) || 0)}
                    className="w-16 h-8 bg-white border border-black/10 text-center text-slate-900 font-medium"
                    min={0}
                    max={10}
                    step={0.5}
                  />
                  <span>%</span>
                </div>
                <div className="w-40 p-4 text-right text-slate-700">
                  {formatPrice(gastosCierre)}
                </div>
              </div>

              {/* Monto a financiar */}
              <div className="flex border-b border-black/10">
                <div className="flex-1 p-4 bg-white font-medium">
                  Monto a financiar o pago de contado
                </div>
                <div className="w-40 p-4 bg-white text-right font-semibold text-[#e08433]">
                  {formatPrice(montoFinanciar)}
                </div>
              </div>
            </div>
          </div>

          {/* Financiamiento bancario (referencia) */}
          <div className="mb-6 border border-black/10 overflow-hidden">
            <div className="flex items-center gap-2 mb-0 px-1 pt-1">
              <Calculator className="w-5 h-5 text-[#f97316]" />
              <h3 className="text-lg font-light" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                Financiamiento bancario (referencia)
              </h3>
            </div>
            <p className="text-xs text-slate-500 px-1 pb-3">
              Cuota estimada a {PLAZO_ANOS_FINANCIAMIENTO} años; la tasa es editable. Ingreso neto requerido estimado
              (cuota bancaria ÷ 45%).
            </p>
            <div className="grid grid-cols-[1fr_11rem] border-t border-black/10">
              <div className="p-3 bg-white font-bold text-sm text-slate-900 border-r border-black/10">
                Datos de financiamiento Bancario
              </div>
              <div className="p-3 bg-[#f97316] font-bold text-sm text-white text-right">
                Datos en Dólares
              </div>
            </div>
            <div className="grid grid-cols-[1fr_11rem] border-t border-black/10">
              <div className="p-3 bg-white font-bold text-sm text-slate-900 border-r border-black/10">
                Tasa en dólares a {PLAZO_ANOS_FINANCIAMIENTO} años (% nominal anual)
              </div>
              <div className="p-3 bg-white flex items-center justify-end gap-1 border-black/10">
                <Input
                  type="number"
                  value={tasaAnualPct}
                  onChange={(e) => setTasaAnualPct(parseFloat(e.target.value) || 0)}
                  className="w-20 h-8 bg-white border border-black/10 text-right text-slate-900 font-bold pr-2"
                  min={0}
                  max={30}
                  step={0.05}
                />
                <span className="text-sm font-bold text-slate-900">%</span>
              </div>
            </div>
            <div className="grid grid-cols-[1fr_11rem] border-t border-black/10">
              <div className="p-3 bg-white font-bold text-sm text-slate-900 border-r border-black/10">
                Ingreso neto familiar Requerido
              </div>
              <div className="p-3 bg-white text-right font-bold text-sm text-slate-900 tabular-nums">
                {formatPrice(bankFin.ingresoRequerido)}
              </div>
            </div>
            <div className="grid grid-cols-[1fr_11rem] border-t border-black/10">
              <div className="p-3 bg-white font-bold text-sm text-slate-900 border-r border-black/10">
                Cuota Bancaria aproximada {PLAZO_ANOS_FINANCIAMIENTO} años
              </div>
              <div className="p-3 bg-white text-right font-bold text-sm text-slate-900 tabular-nums">
                {formatPrice(bankFin.cuotaBancaria)}
              </div>
            </div>
            <div className="grid grid-cols-[1fr_11rem] border-t border-black/10">
              <div className="p-3 bg-slate-50 font-bold text-sm text-slate-900 border-r border-black/10">
                Cuota de mantenimiento aprox
              </div>
              <div className="p-3 bg-slate-50 text-right">
                <Input
                  type="number"
                  value={cuotaMantenimiento}
                  onChange={(e) => setCuotaMantenimiento(parseFloat(e.target.value) || 0)}
                  className="w-full max-w-[9rem] ml-auto h-8 bg-white border border-black/10 text-right text-slate-900 font-bold pr-2 inline-block"
                  min={0}
                  step={1}
                />
              </div>
            </div>
            <div className="grid grid-cols-[1fr_11rem] border-t border-black/10">
              <div className="p-3 bg-white font-bold text-sm text-slate-900 border-r border-black/10">
                Total de gastos mensuales
              </div>
              <div className="p-3 bg-white text-right font-bold text-sm text-slate-900 tabular-nums">
                {formatPrice(bankFin.totalGastosMensuales)}
              </div>
            </div>
          </div>

          {/* Cuadro estilo Excel: Prima personalizada */}
          <div className="mb-6 border border-black/10 bg-white overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-black/10">
              <div className="text-sm font-semibold text-slate-900">Prima personalizada</div>
            </div>
            <div className="divide-y divide-black/10">
              {primaSchedule.map((row, idx) => (
                <div
                  key={`${row.label}-${idx}`}
                  className={`grid grid-cols-[1fr_180px_140px] ${
                    row.kind === 'total' ? 'bg-[#e08433]/10 font-semibold' : 'bg-white'
                  }`}
                >
                  <div className="px-4 py-2 text-sm text-slate-900">{row.label}</div>
                  <div className="px-4 py-2 text-sm text-slate-900 text-right tabular-nums">
                    {formatPrice(row.amount)}
                  </div>
                  <div className="px-4 py-2 text-sm text-slate-600 text-right tabular-nums">
                    {row.date ? formatShortDate(row.date) : ''}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Edit Mode - Additional Fields */}
          {isEditing && (
              <div className="mb-6 p-4 bg-slate-50 border border-black/10">
              <p className="text-xs tracking-[0.15em] uppercase text-[#e08433] mb-4">
                Editar Información
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Área (m²)</label>
                  <Input
                    type="number"
                    value={editData.area}
                    onChange={(e) => setEditData({...editData, area: parseFloat(e.target.value)})}
                    className="bg-white border-black/10 text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Parqueo (m²)</label>
                  <Input
                    type="number"
                    value={editData.parkingArea}
                    onChange={(e) => setEditData({...editData, parkingArea: parseFloat(e.target.value)})}
                    className="bg-white border-black/10 text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Habitaciones</label>
                  <Input
                    type="number"
                    value={editData.bedrooms}
                    onChange={(e) => setEditData({...editData, bedrooms: parseInt(e.target.value)})}
                    className="bg-white border-black/10 text-slate-900"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Baños</label>
                  <Input
                    type="number"
                    value={editData.bathrooms}
                    onChange={(e) => setEditData({...editData, bathrooms: parseInt(e.target.value)})}
                    className="bg-white border-black/10 text-slate-900"
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-gray-500 block mb-1">Estado</label>
                  <select
                    value={editData.status}
                    onChange={(e) => setEditData({...editData, status: e.target.value})}
                    className="w-full bg-white border border-black/10 text-slate-900 p-2 rounded"
                  >
                    <option value="Disponible">Disponible</option>
                    <option value="Reservado">Reservado</option>
                    <option value="Vendido">Vendido</option>
                    <option value="Bloqueado">Bloqueado</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Features Grid */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            <div className="bg-slate-50 p-3 border border-black/10 text-center">
              <Maximize className="w-4 h-4 mx-auto text-slate-500 mb-1" />
              <p className="text-lg font-light" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                {isEditing ? editData.area : unit.area}m²
              </p>
              <p className="text-[10px] text-slate-600 uppercase">Área</p>
            </div>
            <div className="bg-slate-50 p-3 border border-black/10 text-center">
              <Car className="w-4 h-4 mx-auto text-slate-500 mb-1" />
              <p className="text-lg font-light" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                {selectedParkingM2}m²
              </p>
              <p className="text-[10px] text-slate-600 uppercase">Parqueo (cotización)</p>
            </div>
            <div className="bg-slate-50 p-3 border border-black/10 text-center">
              <Bed className="w-4 h-4 mx-auto text-slate-500 mb-1" />
              <p className="text-lg font-light" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                {isEditing ? editData.bedrooms : unit.bedrooms}
              </p>
              <p className="text-[10px] text-slate-600 uppercase">Hab.</p>
            </div>
            <div className="bg-slate-50 p-3 border border-black/10 text-center">
              <Bath className="w-4 h-4 mx-auto text-slate-500 mb-1" />
              <p className="text-lg font-light" style={{ fontFamily: 'Cormorant Garamond, serif' }}>
                {isEditing ? editData.bathrooms : unit.bathrooms}
              </p>
              <p className="text-[10px] text-slate-600 uppercase">Baños</p>
            </div>
          </div>

          {/* Additional Info */}
          <div className="flex items-center justify-between py-3 border-b border-black/10">
            <div className="flex items-center gap-2 text-slate-600">
              <Calendar className="w-4 h-4" />
              <span className="text-sm">Entrega</span>
            </div>
            <span className="text-slate-900">{unit.delivery}</span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6 pt-2">
            <button
              data-testid="reserve-unit-btn"
              onClick={() => {
                generateReservationPDF(unit, {
                  price,
                  basePrice,
                  parkingPremium,
                  parkingM2: selectedParkingM2,
                  totalAreaM2: totalBuiltM2,
                  aptArea,
                  primaMode: 'amount',
                  primaPct,
                  primaAmount,
                  primaTotal,
                  primaEquivPct,
                  reserva,
                  reservaDate,
                  opcionCompra,
                  mesesPrima,
                  cuotaMensual,
                  primaFraccionada,
                  gastosCierrePct,
                  gastosCierre,
                  montoFinanciar,
                  tasaAnualPct,
                  cuotaMantenimiento,
                  plazoAnosFinanciamiento: PLAZO_ANOS_FINANCIAMIENTO,
                  bankFinancing: bankFin,
                });
              }}
              className="flex-1 flex items-center justify-center gap-2 bg-[#e08433] hover:bg-[#644939] hover:text-white text-black font-semibold text-sm py-3 transition-colors"
            >
              <FileText className="w-4 h-4" />
              Descargar PDF
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UnitModal;
