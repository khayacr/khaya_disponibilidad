import { useState } from 'react';
import { Maximize2 } from 'lucide-react';
import { matchesUnitFilters } from '@/utils/unitFilters';

const FLOOR_PLAN_TYPICAL = `${process.env.PUBLIC_URL || ''}/planta-tipo.png`;
const FLOOR_PLAN_GROUND = `${process.env.PUBLIC_URL || ''}/planta-baja.png`;

// Unit positions on the floor plan (relative percentages of the image box)
// Calibrated to /planta-tipo.png (1024×631)
const UNIT_POSITIONS = {
  // Top row (8–2)
  8:  { top: '18.88%', left: '13.28%', width: '13.67%', height: '21.23%' },
  9:  { top: '28.38%', left: '27.83%', width: '13.48%', height: '21.87%' },
  10: { top: '18.72%', left: '42.29%', width: '13.67%', height: '21.56%' },
  1:  { top: '28.55%', left: '57.03%', width: '13.48%', height: '21.71%' },
  2:  { top: '18.88%', left: '71.39%', width: '13.67%', height: '21.23%' },
  // Bottom row (7–3)
  7:  { top: '58.30%', left: '13.28%', width: '13.67%', height: '21.56%' },
  6:  { top: '52.28%', left: '27.83%', width: '13.48%', height: '21.87%' },
  5:  { top: '58.30%', left: '42.29%', width: '13.67%', height: '21.56%' },
  4:  { top: '52.43%', left: '57.03%', width: '13.48%', height: '21.71%' },
  3:  { top: '58.30%', left: '71.39%', width: '13.67%', height: '21.56%' },
};

const STATUS_COLORS = {
  Disponible: 'rgba(16, 185, 129, 0.5)',
  Reservado: 'rgba(224, 132, 51, 0.5)',
  Vendido: 'rgba(249, 115, 22, 0.5)',
  Bloqueado: 'rgba(100, 116, 139, 0.5)'
};

const STATUS_HOVER_COLORS = {
  Disponible: 'rgba(16, 185, 129, 0.7)',
  Reservado: 'rgba(224, 132, 51, 0.7)',
  Vendido: 'rgba(249, 115, 22, 0.7)',
  Bloqueado: 'rgba(100, 116, 139, 0.7)'
};

export const FloorPlan = ({ selectedFloor, selectedTower, onUnitClick, filters, units = [] }) => {
  const [hoveredUnit, setHoveredUnit] = useState(null);
  
  const floorPlanImage = selectedFloor === 1 ? FLOOR_PLAN_GROUND : FLOOR_PLAN_TYPICAL;

  const filteredUnits = units.filter((unit) => matchesUnitFilters(unit, filters));

  const filteredIds = new Set(filteredUnits.map(u => u.id));

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  return (
    <div 
      data-testid="floor-plan-container"
      className="relative w-full h-full flex items-center justify-center p-2 lg:p-4 bg-white"
    >
      {/* Floor indicator */}
      <div className="absolute top-2 left-2 lg:top-4 lg:left-4 z-10">
        <p className="text-[10px] tracking-[0.2em] uppercase text-gray-600">
          {selectedTower || 'Torre'} · Planta
        </p>
        <p 
          className="text-3xl lg:text-4xl font-light text-gray-900"
          style={{ fontFamily: 'Cormorant Garamond, serif' }}
        >
          {selectedFloor}
        </p>
      </div>

      {/* Floor plan container - matches image aspect ratio */}
      <div
        className="relative w-full"
        style={{ aspectRatio: selectedFloor === 1 ? '1024/631' : '1024/631' }}
      >
        {/* Floor plan image */}
        <img 
          src={floorPlanImage}
          alt={`Planta Piso ${selectedFloor}`}
          className="absolute inset-0 w-full h-full object-fill"
          data-testid="floor-plan-image"
        />

        {/* Unit overlays */}
        {units.map((unit) => {
          const position = UNIT_POSITIONS[unit.apartment];
          const isFiltered = filteredIds.has(unit.id);
          const isHovered = hoveredUnit === unit.id;
          const isVendido = unit.status === 'Vendido';
          const isClickable = isFiltered && !isVendido;
          
          if (!position) return null;

          return (
            <div
              key={unit.id}
              data-testid={`unit-${unit.id}`}
              onClick={() => isClickable && onUnitClick(unit)}
              onMouseEnter={() => setHoveredUnit(unit.id)}
              onMouseLeave={() => setHoveredUnit(null)}
              className={`
                absolute transition-all duration-300
                ${!isFiltered ? 'opacity-30 pointer-events-none' : 'opacity-100'}
                ${isVendido ? 'cursor-not-allowed' : 'cursor-pointer'}
              `}
              style={{
                top: position.top,
                left: position.left,
                width: position.width,
                height: position.height
              }}
            >
              {/* Status overlay */}
              <div 
                className="absolute inset-0 rounded-sm transition-all duration-300"
                style={{
                  backgroundColor: isHovered && !isVendido
                    ? STATUS_HOVER_COLORS[unit.status] 
                    : STATUS_COLORS[unit.status],
                  border: isHovered && !isVendido ? '2px solid rgba(0,0,0,0.35)' : '1px solid rgba(0,0,0,0.15)'
                }}
              />

              {/* Vendido X overlay */}
              {isVendido && (
                <div className="absolute inset-0 z-[4] flex items-center justify-center pointer-events-none">
                  <span className="text-black/50 text-4xl font-bold">✕</span>
                </div>
              )}

              {/* Unit info tooltip on hover */}
              {isHovered && isFiltered && (
                <div 
                  className="absolute -top-24 left-1/2 -translate-x-1/2 rounded-none p-3 min-w-[160px] z-20 animate-fade-in bg-white/95 border border-black/10 shadow-lg"
                  data-testid={`unit-tooltip-${unit.id}`}
                >
                  <p className="text-[10px] tracking-[0.15em] uppercase text-gray-400 mb-1">
                    Apto {unit.apartment} · {unit.type}
                  </p>
                  <p 
                    className="text-lg font-light text-gray-900"
                    style={{ fontFamily: 'Cormorant Garamond, serif' }}
                  >
                    {formatPrice(unit.price)}
                  </p>
                  <p className="text-xs text-gray-600 mt-1">
                    {unit.view}
                    {unit.ubicacion ? ` · ${unit.ubicacion}` : ''} · {unit.area}m²
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span 
                      className={`
                        text-[10px] px-2 py-0.5 rounded-full
                        ${unit.status === 'Disponible' ? 'bg-[#10b981]/20 text-[#10b981]' : ''}
                        ${unit.status === 'Reservado' ? 'bg-[#e08433]/20 text-[#e08433]' : ''}
                        ${unit.status === 'Vendido' ? 'bg-[#f97316]/20 text-[#f97316]' : ''}
                        ${unit.status === 'Bloqueado' ? 'bg-[#64748b]/20 text-[#64748b]' : ''}
                      `}
                    >
                      {unit.status}
                    </span>
                  </div>
                </div>
              )}

              {/* Vista + número: vista a la izquierda, centrada en altura con el cuadro del apto */}
              <div className="absolute bottom-1 left-1 right-1 z-[5] flex flex-row items-center justify-end gap-[10px] pointer-events-none">
                <span
                  className="text-[7px] sm:text-[8px] leading-[1.1] text-right font-medium text-slate-900 line-clamp-2 min-w-0 flex-1 drop-shadow-[0_0_3px_rgba(255,255,255,0.95)]"
                  title={unit.view ? `${unit.view}${unit.ubicacion ? ` · ${unit.ubicacion}` : ''}` : ''}
                >
                  {unit.view || '—'}
                </span>
                <div
                  className={`
                    w-6 h-6 flex flex-shrink-0 items-center justify-center
                    text-xs font-medium rounded-sm transition-all duration-300
                    ${isHovered ? 'bg-slate-900 text-white' : 'bg-white/80 text-slate-900'}
                  `}
                >
                  {unit.apartment}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Zoom hint */}
      <div className="absolute bottom-2 right-2 lg:bottom-4 lg:right-4 flex items-center gap-2 text-gray-500">
        <Maximize2 className="w-4 h-4" />
        <span className="text-xs">Click para ver detalles</span>
      </div>
    </div>
  );
};

export default FloorPlan;
