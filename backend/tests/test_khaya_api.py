"""
KHAYA Real Estate API Tests
Tests for towers, units, stats, sync, and unit updates
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthAndBasics:
    """Health check and basic API tests"""
    
    def test_health_endpoint(self):
        """Test /api/health returns healthy status"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print("✓ Health endpoint working")
    
    def test_root_endpoint(self):
        """Test /api/ returns API info"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "KHAYA" in data["message"]
        print("✓ Root endpoint working")


class TestTowers:
    """Tower API tests - GET /api/towers"""
    
    def test_get_towers_returns_3_towers(self):
        """Test that /api/towers returns 3 towers (Torre E, F, G)"""
        response = requests.get(f"{BASE_URL}/api/towers")
        assert response.status_code == 200
        data = response.json()
        
        # Should have 3 towers
        assert len(data) == 3, f"Expected 3 towers, got {len(data)}"
        
        # Check tower names
        tower_names = list(data.keys())
        assert "Torre E" in tower_names, "Torre E not found"
        assert "Torre F" in tower_names, "Torre F not found"
        assert "Torre G" in tower_names, "Torre G not found"
        
        print(f"✓ Found 3 towers: {tower_names}")
    
    def test_tower_structure(self):
        """Test tower data structure"""
        response = requests.get(f"{BASE_URL}/api/towers")
        assert response.status_code == 200
        data = response.json()
        
        for tower_key, tower in data.items():
            assert "name" in tower, f"Tower {tower_key} missing 'name'"
            assert "floors" in tower, f"Tower {tower_key} missing 'floors'"
            assert "apartments" in tower, f"Tower {tower_key} missing 'apartments'"
            assert "delivery" in tower, f"Tower {tower_key} missing 'delivery'"
            assert tower["floors"] == 14, f"Tower {tower_key} should have 14 floors"
            assert tower["apartments"] == 10, f"Tower {tower_key} should have 10 apartments per floor"
        
        print("✓ All towers have correct structure")


class TestUnits:
    """Unit API tests - GET /api/units"""
    
    def test_get_all_units_returns_417(self):
        """Test that /api/units returns 417 total units"""
        response = requests.get(f"{BASE_URL}/api/units")
        assert response.status_code == 200
        data = response.json()
        
        # Should have 417 units (3 towers * 14 floors * ~10 apartments)
        # Note: Some apartments may not exist, so we check for reasonable count
        assert len(data) >= 400, f"Expected ~417 units, got {len(data)}"
        assert len(data) <= 420, f"Expected ~417 units, got {len(data)}"
        
        print(f"✓ Found {len(data)} units")
    
    def test_unit_statuses(self):
        """Test that units have correct status values"""
        response = requests.get(f"{BASE_URL}/api/units")
        assert response.status_code == 200
        data = response.json()
        
        valid_statuses = {"Disponible", "Vendido", "Bloqueado", "Reservado"}
        statuses_found = set()
        
        for unit in data:
            assert unit["status"] in valid_statuses, f"Invalid status: {unit['status']}"
            statuses_found.add(unit["status"])
        
        print(f"✓ Found statuses: {statuses_found}")
    
    def test_unit_structure(self):
        """Test unit data structure"""
        response = requests.get(f"{BASE_URL}/api/units")
        assert response.status_code == 200
        data = response.json()
        
        required_fields = ["id", "code", "tower", "floor", "apartment", "price", 
                          "view", "viewDirection", "type", "ubicacion", "status", "area", 
                          "parkingArea", "totalArea", "bedrooms", "bathrooms", 
                          "delivery", "rentability"]
        
        unit = data[0]
        for field in required_fields:
            assert field in unit, f"Unit missing field: {field}"
        
        print("✓ Unit structure is correct")
    
    def test_filter_by_tower(self):
        """Test filtering units by tower"""
        response = requests.get(f"{BASE_URL}/api/units?tower=Torre%20E")
        assert response.status_code == 200
        data = response.json()
        
        assert len(data) > 0, "No units found for Torre E"
        for unit in data:
            assert unit["tower"] == "Torre E", f"Unit {unit['id']} has wrong tower"
        
        print(f"✓ Torre E has {len(data)} units")
    
    def test_filter_by_floor(self):
        """Test filtering units by floor"""
        response = requests.get(f"{BASE_URL}/api/units?floor=14")
        assert response.status_code == 200
        data = response.json()
        
        assert len(data) > 0, "No units found for floor 14"
        for unit in data:
            assert unit["floor"] == 14, f"Unit {unit['id']} has wrong floor"
        
        print(f"✓ Floor 14 has {len(data)} units")
    
    def test_filter_by_status(self):
        """Test filtering units by status"""
        response = requests.get(f"{BASE_URL}/api/units?status=Disponible")
        assert response.status_code == 200
        data = response.json()
        
        for unit in data:
            assert unit["status"] == "Disponible", f"Unit {unit['id']} has wrong status"
        
        print(f"✓ Found {len(data)} Disponible units")
    
    def test_get_single_unit(self):
        """Test getting a single unit by ID"""
        response = requests.get(f"{BASE_URL}/api/units/E-14-8")
        assert response.status_code == 200
        data = response.json()
        
        assert data["id"] == "E-14-8"
        assert data["tower"] == "Torre E"
        assert data["floor"] == 14
        assert data["apartment"] == 8
        
        print(f"✓ Unit E-14-8 found with price {data['price']}")
    
    def test_get_nonexistent_unit(self):
        """Test getting a non-existent unit returns 404"""
        response = requests.get(f"{BASE_URL}/api/units/INVALID-99-99")
        assert response.status_code == 404
        print("✓ Non-existent unit returns 404")


class TestStats:
    """Stats API tests - GET /api/stats"""
    
    def test_get_stats(self):
        """Test /api/stats returns correct counts"""
        response = requests.get(f"{BASE_URL}/api/stats")
        assert response.status_code == 200
        data = response.json()
        
        # Check required fields
        assert "total" in data
        assert "disponibles" in data
        assert "reservados" in data
        assert "vendidos" in data
        assert "bloqueados" in data
        assert "percentage" in data
        
        # Total should be ~417
        assert data["total"] >= 400, f"Expected ~417 total, got {data['total']}"
        
        # Sum of statuses should equal total
        status_sum = data["disponibles"] + data["reservados"] + data["vendidos"] + data["bloqueados"]
        assert status_sum == data["total"], f"Status sum {status_sum} != total {data['total']}"
        
        print(f"✓ Stats: Total={data['total']}, Disponibles={data['disponibles']}, "
              f"Reservados={data['reservados']}, Vendidos={data['vendidos']}, Bloqueados={data['bloqueados']}")


class TestUnitUpdate:
    """Unit update tests - PUT /api/units/{id}"""
    
    def test_update_unit_status(self):
        """Test updating unit status and verify persistence"""
        unit_id = "E-14-8"
        
        # Get original status
        response = requests.get(f"{BASE_URL}/api/units/{unit_id}")
        assert response.status_code == 200
        original_status = response.json()["status"]
        
        # Change to a different status
        new_status = "Reservado" if original_status != "Reservado" else "Disponible"
        
        update_response = requests.put(
            f"{BASE_URL}/api/units/{unit_id}",
            json={"status": new_status},
            headers={"Content-Type": "application/json"}
        )
        assert update_response.status_code == 200
        updated_data = update_response.json()
        assert updated_data["status"] == new_status
        
        # Verify persistence with GET
        verify_response = requests.get(f"{BASE_URL}/api/units/{unit_id}")
        assert verify_response.status_code == 200
        assert verify_response.json()["status"] == new_status
        
        # Restore original status
        requests.put(
            f"{BASE_URL}/api/units/{unit_id}",
            json={"status": original_status},
            headers={"Content-Type": "application/json"}
        )
        
        print(f"✓ Unit status updated from {original_status} to {new_status} and verified")
    
    def test_update_unit_price(self):
        """Test updating unit price"""
        unit_id = "E-7-2"
        
        # Get original price
        response = requests.get(f"{BASE_URL}/api/units/{unit_id}")
        assert response.status_code == 200
        original_price = response.json()["price"]
        
        # Update price
        new_price = original_price + 1000
        update_response = requests.put(
            f"{BASE_URL}/api/units/{unit_id}",
            json={"price": new_price},
            headers={"Content-Type": "application/json"}
        )
        assert update_response.status_code == 200
        assert update_response.json()["price"] == new_price
        
        # Restore original price
        requests.put(
            f"{BASE_URL}/api/units/{unit_id}",
            json={"price": original_price},
            headers={"Content-Type": "application/json"}
        )
        
        print(f"✓ Unit price updated from {original_price} to {new_price}")
    
    def test_update_nonexistent_unit(self):
        """Test updating non-existent unit returns 404"""
        response = requests.put(
            f"{BASE_URL}/api/units/INVALID-99-99",
            json={"status": "Vendido"},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 404
        print("✓ Update non-existent unit returns 404")


class TestSync:
    """Sync API tests - POST /api/sync"""
    
    def test_sync_google_sheets(self):
        """Test triggering Google Sheets sync"""
        response = requests.post(f"{BASE_URL}/api/sync")
        assert response.status_code == 200
        data = response.json()
        
        assert data["status"] == "success"
        assert "units" in data
        assert "towers" in data
        assert data["units"] >= 400, f"Expected ~417 units after sync, got {data['units']}"
        
        print(f"✓ Sync successful: {data['units']} units, towers: {data['towers']}")


class TestFilters:
    """Filters API tests - GET /api/filters"""
    
    def test_get_filters(self):
        """Test /api/filters returns filter options"""
        response = requests.get(f"{BASE_URL}/api/filters")
        assert response.status_code == 200
        data = response.json()
        
        assert "towers" in data
        assert "floors" in data
        assert "views" in data
        assert "statuses" in data
        assert "types" in data
        assert "priceRange" in data
        
        # Verify towers
        assert len(data["towers"]) == 3
        
        # Verify floors (1-14)
        assert len(data["floors"]) == 14
        
        # Verify statuses
        valid_statuses = {"Disponible", "Vendido", "Bloqueado", "Reservado"}
        for status in data["statuses"]:
            assert status in valid_statuses
        
        # Verify price range
        assert data["priceRange"]["min"] > 0
        assert data["priceRange"]["max"] > data["priceRange"]["min"]
        
        print(f"✓ Filters: {len(data['towers'])} towers, {len(data['floors'])} floors, "
              f"price range ${data['priceRange']['min']}-${data['priceRange']['max']}")


class TestUnitsByFloor:
    """Units by floor API tests - GET /api/units/floor/{floor}"""
    
    def test_get_units_by_floor(self):
        """Test getting units by floor number"""
        response = requests.get(f"{BASE_URL}/api/units/floor/14")
        assert response.status_code == 200
        data = response.json()
        
        # Should have units from all 3 towers for floor 14
        assert len(data) >= 20, f"Expected ~30 units for floor 14, got {len(data)}"
        
        for unit in data:
            assert unit["floor"] == 14
        
        print(f"✓ Floor 14 has {len(data)} units across all towers")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
