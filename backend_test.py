import requests
import sys
import json
from datetime import datetime

class RaamaERPTester:
    def __init__(self, base_url="https://shayari-platform.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.writer_token = None
        self.reader_token = None
        self.writer_user = None
        self.reader_user = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name}")
        else:
            print(f"❌ {name} - {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def make_request(self, method, endpoint, data=None, token=None, expected_status=200):
        """Make HTTP request with error handling"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['Authorization'] = f'Bearer {token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)

            success = response.status_code == expected_status
            return success, response.json() if response.content else {}, response.status_code

        except Exception as e:
            return False, {"error": str(e)}, 0

    def test_demo_login(self):
        """Test login with demo accounts"""
        print("\n🔐 Testing Demo Account Login...")
        
        # Test writer login
        success, response, status = self.make_request(
            'POST', 'auth/login',
            {"email": "writer@raama.com", "password": "password123"}
        )
        
        if success and 'token' in response:
            self.writer_token = response['token']
            self.writer_user = response['user']
            self.log_test("Writer login", True)
        else:
            self.log_test("Writer login", False, f"Status: {status}, Response: {response}")

        # Test reader login
        success, response, status = self.make_request(
            'POST', 'auth/login',
            {"email": "reader@raama.com", "password": "password123"}
        )
        
        if success and 'token' in response:
            self.reader_token = response['token']
            self.reader_user = response['user']
            self.log_test("Reader login", True)
        else:
            self.log_test("Reader login", False, f"Status: {status}, Response: {response}")

    def test_registration(self):
        """Test user registration"""
        print("\n📝 Testing User Registration...")
        
        test_user = {
            "email": f"test_user_{datetime.now().strftime('%H%M%S')}@test.com",
            "password": "TestPass123!",
            "firstName": "Test",
            "lastName": "User",
            "role": "reader"
        }
        
        success, response, status = self.make_request(
            'POST', 'auth/register', test_user
        )
        
        if success and 'token' in response:
            self.log_test("User registration", True)
        else:
            self.log_test("User registration", False, f"Status: {status}, Response: {response}")

    def test_auth_me(self):
        """Test /auth/me endpoint"""
        print("\n👤 Testing Auth Me...")
        
        if self.writer_token:
            success, response, status = self.make_request(
                'GET', 'auth/me', token=self.writer_token
            )
            self.log_test("Auth me (writer)", success, f"Status: {status}")
        
        if self.reader_token:
            success, response, status = self.make_request(
                'GET', 'auth/me', token=self.reader_token
            )
            self.log_test("Auth me (reader)", success, f"Status: {status}")

    def test_shayari_operations(self):
        """Test shayari CRUD operations"""
        print("\n📝 Testing Shayari Operations...")
        
        if not self.writer_token:
            self.log_test("Shayari operations", False, "No writer token available")
            return

        # Test create shayari (writer)
        test_shayari = {
            "title": "Test Shayari",
            "content": "This is a test shayari for API testing"
        }
        
        success, response, status = self.make_request(
            'POST', 'shayaris', test_shayari, self.writer_token, 200
        )
        
        shayari_id = None
        if success and 'id' in response:
            shayari_id = response['id']
            self.log_test("Create shayari (writer)", True)
        else:
            self.log_test("Create shayari (writer)", False, f"Status: {status}, Response: {response}")

        # Test create shayari (reader - should fail)
        if self.reader_token:
            success, response, status = self.make_request(
                'POST', 'shayaris', test_shayari, self.reader_token, 403
            )
            self.log_test("Create shayari (reader - should fail)", success, f"Status: {status}")

        # Test get all shayaris
        if self.writer_token:
            success, response, status = self.make_request(
                'GET', 'shayaris', token=self.writer_token
            )
            self.log_test("Get all shayaris", success, f"Status: {status}")

        # Test get my shayaris
        if self.writer_token:
            success, response, status = self.make_request(
                'GET', 'shayaris/my', token=self.writer_token
            )
            self.log_test("Get my shayaris", success, f"Status: {status}")

        # Test delete shayari
        if shayari_id and self.writer_token:
            success, response, status = self.make_request(
                'DELETE', f'shayaris/{shayari_id}', token=self.writer_token
            )
            self.log_test("Delete shayari", success, f"Status: {status}")

    def test_writers_endpoint(self):
        """Test writers endpoint"""
        print("\n👥 Testing Writers Endpoint...")
        
        if self.writer_token:
            success, response, status = self.make_request(
                'GET', 'users/writers', token=self.writer_token
            )
            self.log_test("Get writers list", success, f"Status: {status}")

    def test_notifications(self):
        """Test notifications endpoints"""
        print("\n🔔 Testing Notifications...")
        
        if self.writer_token:
            success, response, status = self.make_request(
                'GET', 'notifications', token=self.writer_token
            )
            self.log_test("Get notifications", success, f"Status: {status}")

    def test_stats(self):
        """Test stats endpoint"""
        print("\n📊 Testing Stats...")
        
        if self.writer_token:
            success, response, status = self.make_request(
                'GET', 'stats', token=self.writer_token
            )
            self.log_test("Get stats (writer)", success, f"Status: {status}")
        
        if self.reader_token:
            success, response, status = self.make_request(
                'GET', 'stats', token=self.reader_token
            )
            self.log_test("Get stats (reader)", success, f"Status: {status}")

    def run_all_tests(self):
        """Run all tests"""
        print("🚀 Starting Raama ERP Backend API Tests...")
        print(f"Testing against: {self.base_url}")
        
        self.test_demo_login()
        self.test_registration()
        self.test_auth_me()
        self.test_shayari_operations()
        self.test_writers_endpoint()
        self.test_notifications()
        self.test_stats()
        
        print(f"\n📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return 0
        else:
            print("❌ Some tests failed")
            return 1

def main():
    tester = RaamaERPTester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())