export const FloorSelector = ({ selectedFloor, onFloorSelect, units = [] }) => {
  const floors = Array.from({ length: 14 }, (_, i) => 14 - i);

  const getFloorStats = (floor) => {
    const floorUnits = units.filter(u => u.floor === floor);
    const disponibles = floorUnits.filter(u => u.status === 'Disponible').length;
    return { total: floorUnits.length, disponibles };
  };

  return (
    <div 
      data-testid="floor-selector"
      className="w-full lg:w-16 bg-white border-r border-black/10 flex flex-row lg:flex-col overflow-x-auto lg:overflow-y-auto"
    >
      <div className="p-2 lg:p-3 border-b border-black/10 hidden lg:block">
        <p className="text-[10px] tracking-[0.15em] uppercase text-slate-600 text-center">Piso</p>
      </div>
      
      <div className="flex lg:flex-col">
        {floors.map((floor) => {
          const stats = getFloorStats(floor);
          const isSelected = selectedFloor === floor;
          
          return (
            <button
              key={floor}
              data-testid={`floor-${floor}`}
              onClick={() => onFloorSelect(floor)}
              className={`
                relative min-w-[60px] lg:min-w-0 p-3 lg:p-4 flex flex-col items-center justify-center
                transition-all duration-300 group
                ${isSelected 
                  ? 'bg-[#e08433] text-black' 
                  : 'hover:bg-black/5 text-slate-900'
                }
              `}
            >
              <span 
                className="text-lg lg:text-xl font-light"
                style={{ fontFamily: 'Cormorant Garamond, serif' }}
              >
                {floor}
              </span>
              
              {/* Availability indicator */}
              <div className="flex gap-0.5 mt-1">
                {stats.disponibles > 0 && (
                  <span 
                    className={`text-[8px] ${isSelected ? 'text-[#050505]/70' : 'text-[#10b981]'}`}
                  >
                    {stats.disponibles}
                  </span>
                )}
              </div>

              {/* Active indicator line */}
              {isSelected && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-black/70 hidden lg:block" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default FloorSelector;
