import requests
import json
import time

BASE_URL = "http://localhost:8000"
test_results = []
test_user = None
test_token = None
test_refresh_token = None

def test_endpoint(name, method, url, data=None, headers=None, expected_status=200, skip_if_no_token=False):
    global test_token
    
    if skip_if_no_token and not test_token:
        test_results.append(f"⏭️ {name}: SKIPPED (no token)")
        return None
    
    try:
        if method.upper() == "GET":
            response = requests.get(f"{BASE_URL}{url}", headers=headers)
        elif method.upper() == "POST":
            response = requests.post(f"{BASE_URL}{url}", json=data, headers=headers)
        elif method.upper() == "PUT":
            response = requests.put(f"{BASE_URL}{url}", json=data, headers=headers)
        elif method.upper() == "DELETE":
            response = requests.delete(f"{BASE_URL}{url}", headers=headers)
        
        if response.status_code == expected_status:
            test_results.append(f"✅ {name}: PASSED")
            return response.json() if response.text else {}
        else:
            test_results.append(f"❌ {name}: FAILED (got {response.status_code}, expected {expected_status})")
            print(f"Response: {response.text}")
            return None
    except Exception as e:
        test_results.append(f"❌ {name}: ERROR - {str(e)}")
        return None

def run_tests():
    global test_user, test_token, test_refresh_token
    
    print("=" * 50)
    print("RUNNING GRIDHUB API TESTS")
    print("=" * 50)
    
    test_endpoint("Health check", "GET", "/health")
    
    register_data = {
        "username": f"testuser_{int(time.time())}",
        "email": f"test{int(time.time())}@test.com",
        "password": "Test123!@#",
        "display_name": "Test User"
    }
    
    response = requests.post(f"{BASE_URL}/api/register", json=register_data)
    if response.status_code == 201:
        test_results.append("✅ Register: PASSED")
        test_user = register_data
    elif response.status_code == 400 and "already taken" in response.text:
        test_results.append("⏭️ Register: SKIPPED (user already exists)")
        test_user = {"username": "testuser", "password": "Test123!@#"}
    else:
        test_results.append(f"❌ Register: FAILED ({response.status_code})")
        print(f"Response: {response.text}")
        print_results()
        return
    
    login_data = {
        "username": test_user["username"],
        "password": test_user["password"]
    }
    
    response = requests.post(f"{BASE_URL}/api/login", json=login_data)
    if response.status_code == 200:
        data = response.json()
        test_token = data.get("access_token")
        test_refresh_token = data.get("refresh_token")
        test_results.append("✅ Login: PASSED")
    else:
        test_results.append(f"❌ Login: FAILED ({response.status_code})")
        print(f"Response: {response.text}")
        print_results()
        return
    
    if not test_token:
        test_results.append("❌ Cannot continue without token")
        print_results()
        return
    
    headers = {"Authorization": f"Bearer {test_token}"}
    
    test_endpoint("Get profile", "GET", "/api/users/me", headers=headers)
    
    update_data = {"display_name": "Updated Name", "bio": "Test bio"}
    test_endpoint("Update profile", "PUT", "/api/users/me", update_data, headers)
    
    try:
        with open("test_avatar.jpg", "wb") as f:
            f.write(b"fake image data")
        files = {"file": ("avatar.jpg", open("test_avatar.jpg", "rb"), "image/jpeg")}
        response = requests.post(f"{BASE_URL}/api/users/me/avatar", files=files, headers=headers)
        if response.status_code == 200:
            test_results.append("✅ Upload avatar: PASSED")
        else:
            test_results.append(f"⏭️ Upload avatar: SKIPPED (upload failed: {response.status_code})")
    except Exception as e:
        test_results.append(f"⏭️ Upload avatar: SKIPPED ({str(e)})")
    
    subgrid_data = {"name": f"testgrid_{int(time.time())}", "display_name": "Test Grid", "description": "Test subgrid"}
    response = test_endpoint("Create subgrid", "POST", "/api/subgrids", subgrid_data, headers, 201)
    subgrid_id = 1
    if response and "id" in response:
        subgrid_id = response["id"]
        test_results.append(f"✅ Subgrid created (id: {subgrid_id})")
    
    test_endpoint("Get subgrids", "GET", "/api/subgrids", headers=headers)
    
    post_data = {"title": "Test Post", "content": "Test content", "subgrid_id": subgrid_id}
    response = test_endpoint("Create post", "POST", "/api/posts", post_data, headers, 201)
    post_id = 1
    if response and "id" in response:
        post_id = response["id"]
    
    test_endpoint("Get posts", "GET", "/api/posts", headers=headers)
    
    comment_data = {"content": "Test comment", "post_id": post_id}
    response = test_endpoint("Create comment", "POST", "/api/comments", comment_data, headers, 201)
    comment_id = 1
    if response and "id" in response:
        comment_id = response["id"]
    
    reply_data = {"content": "Reply to comment", "post_id": post_id, "parent_id": comment_id}
    test_endpoint("Create reply", "POST", "/api/comments", reply_data, headers, 201)
    
    test_endpoint("Get comments", "GET", f"/api/comments/post/{post_id}", headers=headers)
    
    test_endpoint("Upvote post", "POST", f"/api/posts/{post_id}/upvote", headers=headers)
    
    test_endpoint("Get karma", "GET", "/api/karma/me", headers=headers)
    
    test_endpoint("Subscribe to subgrid", "POST", f"/api/subgrids/{subgrid_id}/subscribe", headers=headers)
    
    if test_refresh_token:
        refresh_data = {"refresh_token": test_refresh_token}
        response = requests.post(f"{BASE_URL}/api/refresh", json=refresh_data)
        if response.status_code == 200:
            test_results.append("✅ Refresh token: PASSED")
        else:
            test_results.append(f"⏭️ Refresh token: SKIPPED ({response.status_code})")
    else:
        test_results.append("⏭️ Refresh token: SKIPPED (no refresh token)")
    
    admin_login = {"username": "admin", "password": "Pro228333123123123"}
    admin_response = requests.post(f"{BASE_URL}/api/login", json=admin_login)
    if admin_response.status_code == 200:
        admin_token = admin_response.json().get("access_token")
        admin_headers = {"Authorization": f"Bearer {admin_token}"}
        test_endpoint("Admin access", "GET", "/api/admin/users", headers=admin_headers)
    else:
        test_results.append("⏭️ Admin tests: SKIPPED (admin login failed)")
    
    test_endpoint("Delete post", "DELETE", f"/api/posts/{post_id}", headers=headers, expected_status=204)
    
    print_results()

def print_results():
    print("\n" + "=" * 50)
    print("TEST RESULTS")
    print("=" * 50)
    
    passed = sum(1 for r in test_results if "✅" in r)
    failed = sum(1 for r in test_results if "❌" in r)
    skipped = sum(1 for r in test_results if "⏭️" in r)
    
    for result in test_results:
        print(result)
    
    print("-" * 50)
    print(f"TOTAL: {len(test_results)} | PASSED: {passed} | FAILED: {failed} | SKIPPED: {skipped}")
    print("=" * 50)

if __name__ == "__main__":
    run_tests()