// Pricing data from Excel - KHAYA Tower
// Prices in USD

const PRICES = {
  centrales: {
    14: 180950, 13: 178750, 12: 176550, 11: 174350, 10: 172150,
    9: 169950, 8: 167750, 7: 165550, 6: 163350, 5: 162250,
    4: 161150, 3: 160050, 2: 158950, 1: 156750
  },
  esquineros: {
    14: 183150, 13: 180950, 12: 178750, 11: 176550, 10: 173800,
    9: 171600, 8: 170500, 7: 169400, 6: 168300, 5: 166100,
    4: 165000, 3: 163900, 2: 162800, 1: 161700
  }
};

// View assignments based on the floor plan
// Vista Este: Apartments 8, 9, 10, 1, 2
// Vista Oeste: Apartments 7, 6, 5, 4, 3
const VIEWS = {
  1: { view: 'Este', type: 'Esquinero' },
  2: { view: 'Este', type: 'Central' },
  3: { view: 'Oeste', type: 'Esquinero' },
  4: { view: 'Oeste', type: 'Central' },
  5: { view: 'Oeste', type: 'Central' },
  6: { view: 'Oeste', type: 'Central' },
  7: { view: 'Oeste', type: 'Esquinero' },
  8: { view: 'Este', type: 'Esquinero' },
  9: { view: 'Este', type: 'Central' },
  10: { view: 'Este', type: 'Central' }
};

// Status options with distribution for demo
const STATUSES = ['Disponible', 'Disponible', 'Disponible', 'Disponible', 'Disponible', 
                  'Reservado', 'Reservado', 'Vendido', 'Vendido', 'Bloqueado'];

// Generate seeded random for consistent data
const seededRandom = (seed) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

// Generate all 140 units
export const generateUnits = () => {
  const units = [];
  
  for (let floor = 1; floor <= 14; floor++) {
    for (let apt = 1; apt <= 10; apt++) {
      const { view, type } = VIEWS[apt];
      const isEsquinero = type === 'Esquinero';
      const price = isEsquinero ? PRICES.esquineros[floor] : PRICES.centrales[floor];
      
      // Use seeded random for consistent status
      const seed = floor * 100 + apt;
      const statusIndex = Math.floor(seededRandom(seed) * STATUSES.length);
      const status = STATUSES[statusIndex];
      
      const baseArea = 67;
      const parkingArea = 14.3;
      
      units.push({
        id: `${floor}-${apt}`,
        code: `E-${floor.toString().padStart(2, '0')}-${apt}`,
        floor,
        apartment: apt,
        price,
        view: `Vista ${view}`,
        viewDirection: view,
        type,
        status,
        area: baseArea,
        parkingArea,
        totalArea: baseArea + parkingArea,
        bedrooms: isEsquinero ? 2 : 2,
        bathrooms: isEsquinero ? 2 : 1,
        delivery: 'Diciembre 2027',
        rentability: 8,
        ubicacion: '',
      });
    }
  }
  
  return units;
};

// Export the generated units
export const units = generateUnits();

// Get units by floor
export const getUnitsByFloor = (floor) => {
  return units.filter(unit => unit.floor === floor);
};

// Get unit by ID
export const getUnitById = (id) => {
  return units.find(unit => unit.id === id);
};

// Get available filters
export const getFilters = () => {
  return {
    floors: [...new Set(units.map(u => u.floor))].sort((a, b) => b - a),
    views: [...new Set(units.map(u => u.view))],
    statuses: [...new Set(units.map(u => u.status))],
    priceRange: {
      min: Math.min(...units.map(u => u.price)),
      max: Math.max(...units.map(u => u.price))
    }
  };
};

// Filter units
export const filterUnits = (filters) => {
  return units.filter(unit => {
    if (filters.floor && unit.floor !== filters.floor) return false;
    if (filters.view && unit.view !== filters.view) return false;
    if (filters.status && unit.status !== filters.status) return false;
    if (filters.minPrice && unit.price < filters.minPrice) return false;
    if (filters.maxPrice && unit.price > filters.maxPrice) return false;
    return true;
  });
};

// Statistics
export const getStats = () => {
  const disponibles = units.filter(u => u.status === 'Disponible').length;
  const reservados = units.filter(u => u.status === 'Reservado').length;
  const vendidos = units.filter(u => u.status === 'Vendido').length;
  const bloqueados = units.filter(u => u.status === 'Bloqueado').length;
  
  return {
    total: units.length,
    disponibles,
    reservados,
    vendidos,
    bloqueados,
    percentage: {
      disponibles: Math.round((disponibles / units.length) * 100),
      reservados: Math.round((reservados / units.length) * 100),
      vendidos: Math.round((vendidos / units.length) * 100),
      bloqueados: Math.round((bloqueados / units.length) * 100)
    }
  };
};

export default units;
