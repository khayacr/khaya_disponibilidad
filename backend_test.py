#!/usr/bin/env python3

import requests
import sys
from datetime import datetime
import json

class KhayaAPITester:
    def __init__(self, base_url="https://luxury-residences-6.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, list):
                        print(f"   Response: List with {len(response_data)} items")
                    elif isinstance(response_data, dict):
                        print(f"   Response keys: {list(response_data.keys())}")
                except:
                    print(f"   Response: {response.text[:100]}...")
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")
                self.failed_tests.append({
                    'name': name,
                    'expected': expected_status,
                    'actual': response.status_code,
                    'response': response.text[:200]
                })

            return success, response.json() if success and response.text else {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.failed_tests.append({
                'name': name,
                'error': str(e)
            })
            return False, {}

    def test_health_endpoints(self):
        """Test basic health endpoints"""
        print("\n" + "="*50)
        print("TESTING HEALTH ENDPOINTS")
        print("="*50)
        
        self.run_test("API Root", "GET", "", 200)
        self.run_test("Health Check", "GET", "health", 200)

    def test_units_endpoints(self):
        """Test units-related endpoints"""
        print("\n" + "="*50)
        print("TESTING UNITS ENDPOINTS")
        print("="*50)
        
        # Test get all units
        success, units_data = self.run_test("Get All Units", "GET", "units", 200)
        if success and units_data:
            print(f"   Total units returned: {len(units_data)}")
            if len(units_data) == 140:
                print("✅ Correct number of units (140)")
            else:
                print(f"❌ Expected 140 units, got {len(units_data)}")
        
        # Test get units by floor
        for floor in [1, 7, 14]:
            success, floor_data = self.run_test(f"Get Floor {floor} Units", "GET", f"units/floor/{floor}", 200)
            if success and floor_data:
                if len(floor_data) == 10:
                    print(f"✅ Floor {floor} has correct number of units (10)")
                else:
                    print(f"❌ Floor {floor} expected 10 units, got {len(floor_data)}")
        
        # Test get specific unit
        self.run_test("Get Specific Unit", "GET", "units/1-1", 200)
        
        # Test units with filters
        self.run_test("Filter by Status", "GET", "units", 200, params={"status": "Disponible"})
        self.run_test("Filter by Floor", "GET", "units", 200, params={"floor": 10})
        self.run_test("Filter by View", "GET", "units", 200, params={"view": "Vista Este"})
        self.run_test("Filter by Type", "GET", "units", 200, params={"unit_type": "Esquinero"})
        self.run_test("Filter by Price Range", "GET", "units", 200, params={"min_price": 160000, "max_price": 180000})

    def test_stats_and_filters(self):
        """Test statistics and filters endpoints"""
        print("\n" + "="*50)
        print("TESTING STATS AND FILTERS")
        print("="*50)
        
        success, stats_data = self.run_test("Get Statistics", "GET", "stats", 200)
        if success and stats_data:
            expected_keys = ['total', 'disponibles', 'reservados', 'vendidos', 'bloqueados', 'percentage']
            if all(key in stats_data for key in expected_keys):
                print("✅ Statistics has all required keys")
                print(f"   Total: {stats_data.get('total')}")
                print(f"   Disponibles: {stats_data.get('disponibles')}")
                print(f"   Reservados: {stats_data.get('reservados')}")
                print(f"   Vendidos: {stats_data.get('vendidos')}")
                print(f"   Bloqueados: {stats_data.get('bloqueados')}")
            else:
                print("❌ Statistics missing required keys")
        
        success, filters_data = self.run_test("Get Filters", "GET", "filters", 200)
        if success and filters_data:
            expected_keys = ['floors', 'views', 'statuses', 'types', 'priceRange']
            if all(key in filters_data for key in expected_keys):
                print("✅ Filters has all required keys")
                print(f"   Floors: {len(filters_data.get('floors', []))}")
                print(f"   Views: {filters_data.get('views')}")
                print(f"   Statuses: {filters_data.get('statuses')}")
                print(f"   Types: {filters_data.get('types')}")
            else:
                print("❌ Filters missing required keys")

    def test_contact_endpoint(self):
        """Test contact form submission"""
        print("\n" + "="*50)
        print("TESTING CONTACT ENDPOINT")
        print("="*50)
        
        # Test contact form submission
        contact_data = {
            "name": "Test User",
            "email": "test@example.com",
            "phone": "+1234567890",
            "message": "Test message for unit inquiry",
            "unit": {
                "id": "14-1",
                "code": "E-14-1",
                "floor": 14,
                "apartment": 1,
                "price": 183150
            }
        }
        
        success, response = self.run_test("Submit Contact Form", "POST", "contact", 200, data=contact_data)
        if success:
            print("✅ Contact form submission successful")
        
        # Test getting contact requests
        self.run_test("Get Contact Requests", "GET", "contact", 200)

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting KHAYA API Testing...")
        print(f"Base URL: {self.base_url}")
        
        self.test_health_endpoints()
        self.test_units_endpoints()
        self.test_stats_and_filters()
        self.test_contact_endpoint()
        
        # Print final results
        print("\n" + "="*60)
        print("FINAL TEST RESULTS")
        print("="*60)
        print(f"📊 Tests passed: {self.tests_passed}/{self.tests_run}")
        print(f"📊 Success rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.failed_tests:
            print(f"\n❌ Failed tests ({len(self.failed_tests)}):")
            for i, test in enumerate(self.failed_tests, 1):
                print(f"   {i}. {test['name']}")
                if 'error' in test:
                    print(f"      Error: {test['error']}")
                else:
                    print(f"      Expected: {test['expected']}, Got: {test['actual']}")
        else:
            print("\n🎉 All tests passed!")
        
        return self.tests_passed == self.tests_run

def main():
    tester = KhayaAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())