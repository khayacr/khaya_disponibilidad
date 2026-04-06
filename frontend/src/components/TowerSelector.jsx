import { Building2 } from 'lucide-react';

export const TowerSelector = ({ towers, selectedTower, onTowerSelect }) => {
  const towerList = Object.entries(towers);

  return (
    <div 
      data-testid="tower-selector"
      className="flex items-center gap-4 p-4 bg-white border-b border-black/10"
    >
      <div className="flex items-center gap-2 text-slate-600">
        <Building2 className="w-5 h-5" />
        <span className="text-xs tracking-[0.15em] uppercase">Torre</span>
      </div>
      
      <div className="flex gap-2">
        {towerList.map(([key, tower]) => (
          <button
            key={key}
            data-testid={`tower-${key}`}
            onClick={() => onTowerSelect(key)}
            className={`
              px-4 py-2 text-sm font-medium transition-all duration-300
              ${selectedTower === key 
                ? 'bg-[#e08433] text-black' 
                : 'bg-white text-slate-700 hover:bg-black/5 hover:text-slate-900 border border-black/10'
              }
            `}
          >
            {tower.name}
          </button>
        ))}
      </div>

      {selectedTower && towers[selectedTower] && (
        <div className="ml-auto text-xs text-slate-500">
          Entrega: <span className="text-[#e08433]">{towers[selectedTower].delivery}</span>
        </div>
      )}
    </div>
  );
};

export default TowerSelector;
