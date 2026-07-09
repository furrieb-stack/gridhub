"""
Gridhub API tests — pytest + FastAPI TestClient.

Run:
  venv/bin/pip install pytest httpx
  venv/bin/python -m pytest tests/test_api.py -v

Uses PostgreSQL by default (reads DATABASE_URL from .env).
If using SQLite, JSONB columns won't work — configure PostgreSQL.
"""

import os
import sys
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from database import Base, get_db, User
from main import app
from app.core.security import hash_password, create_access_token

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./test_gridhub.db")
SQLALCHEMY_DATABASE_URL = DATABASE_URL
engine = create_engine(SQLALCHEMY_DATABASE_URL)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def setup_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db():
    db = TestingSessionLocal()
    yield db
    db.close()


@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture
def test_user(db):
    user = User(
        username="testuser",
        email="testuser@gmail.com",
        hashed_password=hash_password("Test123!@#"),
        display_name="Test User",
        is_active=True,
        is_verified=False,
        is_admin=False,
        is_mod=False,
        is_banned=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def admin_user(db):
    user = User(
        username="admin",
        email="admin@gmail.com",
        hashed_password=hash_password("Admin123!@#"),
        display_name="Admin",
        is_active=True,
        is_verified=True,
        is_admin=True,
        is_mod=True,
        is_banned=False,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def user_token(test_user):
    return create_access_token({"sub": test_user.id})


@pytest.fixture
def admin_token(test_user):
    admin = admin_user
    return create_access_token({"sub": admin.id})


@pytest.fixture
def auth_headers(client, test_user):
    resp = client.post("/api/login", json={
        "username": "testuser", "password": "Test123!@#",
    })
    data = resp.json()
    return {"Authorization": f"Bearer {data['access_token']}"}


@pytest.fixture
def admin_headers(client):
    resp = client.post("/api/login", json={
        "username": "admin", "password": "Admin123!@#",
    })
    data = resp.json()
    return {"Authorization": f"Bearer {data['access_token']}"}


# ─── Auth Tests ───

class TestAuth:
    def test_register(self, client):
        resp = client.post("/api/register", json={
            "username": "newuser",
            "email": "newuser@gmail.com",
            "password": "StrongPass1!",
        })
        assert resp.status_code == 201
        data = resp.json()
        assert data["username"] == "newuser"
        assert "email" not in data

    def test_register_duplicate_username(self, client, test_user):
        resp = client.post("/api/register", json={
            "username": "testuser",
            "email": "other@gmail.com",
            "password": "StrongPass1!",
        })
        assert resp.status_code == 400

    def test_login(self, client, test_user):
        resp = client.post("/api/login", json={
            "username": "testuser",
            "password": "Test123!@#",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert "user" in data
        assert "email" not in data["user"]

    def test_login_wrong_password(self, client, test_user):
        resp = client.post("/api/login", json={
            "username": "testuser",
            "password": "wrongpass",
        })
        assert resp.status_code == 401

    def test_refresh_token(self, client, test_user):
        login = client.post("/api/login", json={
            "username": "testuser", "password": "Test123!@#",
        }).json()
        resp = client.post("/api/refresh", json={
            "refresh_token": login["refresh_token"],
        })
        assert resp.status_code == 200
        assert "access_token" in resp.json()


# ─── User/Profile Tests ───

class TestUsers:
    def test_get_me(self, client, auth_headers):
        resp = client.get("/api/users/me", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["username"] == "testuser"
        assert "email" not in resp.json()

    def test_get_profile_by_username(self, client, test_user, auth_headers):
        resp = client.get("/api/users/by-username/testuser", headers=auth_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert data["username"] == "testuser"
        assert data["is_own_profile"] == True

    def test_update_profile(self, client, auth_headers):
        resp = client.put("/api/users/me", json={
            "display_name": "Updated Name",
            "bio": "Hello world",
        }, headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["display_name"] == "Updated Name"


# ─── Post Tests ───

class TestPosts:
    def test_create_post(self, client, auth_headers):
        resp = client.post("/api/posts", json={
            "content": "Hello Gridhub! #test",
        }, headers=auth_headers)
        assert resp.status_code == 201
        data = resp.json()
        assert data["content"] == "Hello Gridhub! #test"
        assert "author" in data
        assert "email" not in data["author"]
        assert data["user_vote"] == 0

    def test_get_posts(self, client, auth_headers):
        client.post("/api/posts", json={"content": "Post 1"}, headers=auth_headers)
        resp = client.get("/api/posts", headers=auth_headers)
        assert resp.status_code == 200
        assert len(resp.json()) >= 1

    def test_vote_post(self, client, auth_headers):
        post = client.post("/api/posts", json={"content": "Vote test"}, headers=auth_headers).json()
        resp = client.post(f"/api/posts/{post['id']}/vote?value=1", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["value"] == 1

    def test_save_post(self, client, auth_headers):
        post = client.post("/api/posts", json={"content": "Save test"}, headers=auth_headers).json()
        resp = client.post(f"/api/posts/{post['id']}/save", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["saved"] == True

    def test_share_post(self, client, auth_headers):
        post = client.post("/api/posts", json={"content": "Share test"}, headers=auth_headers).json()
        resp = client.post(f"/api/posts/{post['id']}/share", headers=auth_headers)
        assert resp.status_code == 200
        assert resp.json()["share_count"] >= 1


# ─── Subgrid Tests ───

class TestSubgrids:
    def test_create_subgrid(self, client, auth_headers):
        resp = client.post("/api/subgrids", json={
            "name": "testgrid",
            "display_name": "Test Grid",
        }, headers=auth_headers)
        assert resp.status_code == 201
        assert resp.json()["name"] == "testgrid"

    def test_get_subgrids(self, client, auth_headers):
        client.post("/api/subgrids", json={"name": "grid1"}, headers=auth_headers)
        resp = client.get("/api/subgrids", headers=auth_headers)
        assert resp.status_code == 200
        assert len(resp.json()) >= 1


# ─── Comment Tests ───

class TestComments:
    def test_create_comment(self, client, auth_headers):
        post = client.post("/api/posts", json={"content": "Post"}, headers=auth_headers).json()
        resp = client.post("/api/comments", json={
            "content": "Nice post!",
            "post_id": post["id"],
        }, headers=auth_headers)
        assert resp.status_code == 201
        assert resp.json()["content"] == "Nice post!"

    def test_get_comments(self, client, auth_headers):
        post = client.post("/api/posts", json={"content": "Post"}, headers=auth_headers).json()
        client.post("/api/comments", json={"content": "C1", "post_id": post["id"]}, headers=auth_headers)
        resp = client.get(f"/api/comments/post/{post['id']}", headers=auth_headers)
        assert resp.status_code == 200
        assert len(resp.json()) >= 1


# ─── Admin Tests ───

class TestAdmin:
    def test_admin_get_users(self, client, admin_headers):
        resp = client.get("/api/admin/users", headers=admin_headers)
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)

    def test_admin_user_count(self, client, admin_headers):
        resp = client.get("/api/admin/users/count", headers=admin_headers)
        assert resp.status_code == 200
        data = resp.json()
        assert "total" in data
        assert "admins" in data

    def test_admin_ban_unban_user(self, client, admin_headers, db):
        user = User(
            username="banme", email="banme@gmail.com",
            hashed_password=hash_password("Test123!@#"),
            is_active=True, is_banned=False,
        )
        db.add(user)
        db.commit()
        resp = client.put(f"/api/admin/users/{user.id}/ban", json={"reason": "Spam", "duration_hours": 24}, headers=admin_headers)
        assert resp.status_code == 200
        db.refresh(user)
        assert user.is_banned == True
        resp = client.put(f"/api/admin/users/{user.id}/unban", headers=admin_headers)
        assert resp.status_code == 200
        db.refresh(user)
        assert user.is_banned == False

    def test_admin_make_remove_mod(self, client, admin_headers, db):
        user = User(
            username="makemod", email="makemod@gmail.com",
            hashed_password=hash_password("Test123!@#"),
            is_active=True, is_mod=False,
        )
        db.add(user)
        db.commit()
        resp = client.put(f"/api/admin/users/{user.id}/make-mod", headers=admin_headers)
        assert resp.status_code == 200
        db.refresh(user)
        assert user.is_mod == True
        resp = client.put(f"/api/admin/users/{user.id}/remove-mod", headers=admin_headers)
        assert resp.status_code == 200
        db.refresh(user)
        assert user.is_mod == False

    def test_admin_cannot_ban_admin(self, client, admin_user, admin_headers):
        resp = client.put(f"/api/admin/users/{admin_user.id}/ban", json={"reason": "test"}, headers=admin_headers)
        assert resp.status_code == 400


# ─── Metadata Tests ───

class TestMetadata:
    def test_health(self, client):
        resp = client.get("/health")
        assert resp.status_code == 200

    def test_post_metadata(self, client, auth_headers):
        post = client.post("/api/posts", json={"content": "Meta post"}, headers=auth_headers).json()
        resp = client.get(f"/api/meta/post/{post['id']}")
        assert resp.status_code == 200
        data = resp.json()
        assert "title" in data
        assert "description" in data
        assert data["type"] == "article"

    def test_user_metadata(self, client, test_user):
        resp = client.get(f"/api/meta/user/{test_user.username}")
        assert resp.status_code == 200
        data = resp.json()
        assert "title" in data
        assert data["type"] == "profile"


# ─── Edge Cases ───

class TestEdgeCases:
    def test_create_post_empty_content(self, client, auth_headers):
        resp = client.post("/api/posts", json={"content": ""}, headers=auth_headers)
        assert resp.status_code == 422

    def test_create_post_too_long(self, client, auth_headers):
        resp = client.post("/api/posts", json={"content": "x" * 10001}, headers=auth_headers)
        assert resp.status_code == 422

    def test_unauthorized_access(self, client):
        resp = client.get("/api/users/me")
        assert resp.status_code == 401

    def test_non_admin_cannot_access_admin(self, client, auth_headers):
        resp = client.get("/api/admin/users", headers=auth_headers)
        assert resp.status_code == 403

    def test_delete_post(self, client, auth_headers):
        post = client.post("/api/posts", json={"content": "Delete me"}, headers=auth_headers).json()
        resp = client.delete(f"/api/posts/{post['id']}", headers=auth_headers)
        assert resp.status_code == 204