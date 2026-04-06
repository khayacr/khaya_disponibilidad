import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Slider } from './ui/slider';
import { Filter, X } from 'lucide-react';

export const Filters = ({ filters, onFilterChange, onClearFilters, units = [] }) => {
  // Calculate filter options from units
  const filterOptions = {
    floors: [...new Set(units.map(u => u.floor))].sort((a, b) => b - a),
    views: [...new Set(units.map(u => u.view))].sort(),
    statuses: [...new Set(units.map(u => u.status))].filter((s) => s !== 'Bloqueado').sort(),
    types: [...new Set(units.map(u => u.type))].sort(),
    priceRange: {
      min: units.length > 0 ? Math.min(...units.map(u => u.price)) : 0,
      max: units.length > 0 ? Math.max(...units.map(u => u.price)) : 0
    }
  };

  // Calculate stats
  const stats = {
    total: units.length,
    disponibles: units.filter(u => u.status === 'Disponible').length,
    reservados: units.filter(u => u.status === 'Reservado').length,
    vendidos: units.filter(u => u.status === 'Vendido').length,
    bloqueados: units.filter(u => u.status === 'Bloqueado').length
  };

  const hasActiveFilters = filters.view || filters.status || filters.type || 
    filters.minPrice || filters.maxPrice;

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
      data-testid="filters-panel"
      className="glass rounded-none p-4 lg:p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#e08433]" />
          <span className="text-xs tracking-[0.15em] uppercase text-slate-600">Filtros</span>
        </div>
        {hasActiveFilters && (
          <button
            data-testid="clear-filters-btn"
            onClick={onClearFilters}
            className="flex items-center gap-1 text-xs text-slate-600 hover:text-slate-900 transition-colors"
          >
            <X className="w-3 h-3" />
            Limpiar
          </button>
        )}
      </div>

      {/* Filter Controls */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* View Filter */}
        <div>
          <label className="text-[10px] tracking-[0.15em] uppercase text-gray-500 mb-2 block">
            Vista
          </label>
          <Select 
            value={filters.view || 'all'} 
            onValueChange={(value) => onFilterChange('view', value === 'all' ? null : value)}
          >
            <SelectTrigger 
              data-testid="filter-view"
            className="bg-white border-black/10 text-slate-900 h-10"
            >
              <SelectValue placeholder="Todas" />
            </SelectTrigger>
          <SelectContent className="bg-white border-black/10">
            <SelectItem value="all" className="text-slate-900 hover:bg-black/5">Todas</SelectItem>
              {filterOptions.views.map((view) => (
              <SelectItem key={view} value={view} className="text-slate-900 hover:bg-black/5">
                  {view}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter */}
        <div>
          <label className="text-[10px] tracking-[0.15em] uppercase text-gray-500 mb-2 block">
            Estado
          </label>
          <Select 
            value={filters.status || 'all'} 
            onValueChange={(value) => onFilterChange('status', value === 'all' ? null : value)}
          >
            <SelectTrigger 
              data-testid="filter-status"
            className="bg-white border-black/10 text-slate-900 h-10"
            >
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
          <SelectContent className="bg-white border-black/10">
            <SelectItem value="all" className="text-slate-900 hover:bg-black/5">Todos</SelectItem>
              {filterOptions.statuses.map((status) => (
              <SelectItem key={status} value={status} className="text-slate-900 hover:bg-black/5">
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Type Filter */}
        <div>
          <label className="text-[10px] tracking-[0.15em] uppercase text-gray-500 mb-2 block">
            Tipo
          </label>
          <Select 
            value={filters.type || 'all'} 
            onValueChange={(value) => onFilterChange('type', value === 'all' ? null : value)}
          >
            <SelectTrigger 
              data-testid="filter-type"
            className="bg-white border-black/10 text-slate-900 h-10"
            >
              <SelectValue placeholder="Todos" />
            </SelectTrigger>
          <SelectContent className="bg-white border-black/10">
            <SelectItem value="all" className="text-slate-900 hover:bg-black/5">Todos</SelectItem>
              {filterOptions.types.map((type) => (
              <SelectItem key={type} value={type} className="text-slate-900 hover:bg-black/5">
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Price Range */}
        <div>
          <label className="text-[10px] tracking-[0.15em] uppercase text-gray-500 mb-2 block">
            Rango de Precio
          </label>
          <div className="text-xs text-slate-600 mb-2">
            {formatPrice(filters.minPrice || filterOptions.priceRange.min)} - {formatPrice(filters.maxPrice || filterOptions.priceRange.max)}
          </div>
          <Slider
            data-testid="filter-price-range"
            min={filterOptions.priceRange.min}
            max={filterOptions.priceRange.max}
            step={1000}
            value={[
              filters.minPrice || filterOptions.priceRange.min,
              filters.maxPrice || filterOptions.priceRange.max
            ]}
            onValueChange={([min, max]) => {
              onFilterChange('minPrice', min === filterOptions.priceRange.min ? null : min);
              onFilterChange('maxPrice', max === filterOptions.priceRange.max ? null : max);
            }}
            className="w-full"
          />
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 pt-6 border-t border-black/10">
        <p className="text-[10px] tracking-[0.15em] uppercase text-slate-600 mb-3">Leyenda</p>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#10b981]" />
            <span className="text-xs text-slate-700">Disponible ({stats.disponibles})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#e08433]" />
            <span className="text-xs text-slate-700">Reservado ({stats.reservados})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#f97316]" />
            <span className="text-xs text-slate-700">Vendido ({stats.vendidos})</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#64748b]" />
            <span className="text-xs text-slate-700">Bloqueado ({stats.bloqueados})</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Filters;
