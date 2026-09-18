import pytest
from django.urls import reverse
from users.tests.factories import UserFactory

pytestmark = pytest.mark.django_db

def test_register_success(client):
    resp = client.post(reverse('register'),{
        "username": "newuser", "email": "new@example.com", "password": "StrongPass123!"
    })
    assert resp.status_code == 201
    assert "access" in resp.json()

def test_login_success(client):
    UserFactory(email = "taken@example.com")
    resp = client.post(reverse('login'),{
        "email": "taken@example.com", "password": "testpass123"
    })
    assert resp.status_code == 200

def test_register_duplicate_email(client):
    UserFactory(email = "taken@example.com")
    resp = client.post(reverse('register'), {
        "email": "taken", "password": "StrongPass123!"
    })
    assert resp.status_code == 400

def test_login_wrong_password(client):
    UserFactory(email="user@example.com")
    resp = client.post(reverse('login'), {
        "email": "user@example.com", "password": "wrong"
    })
    assert resp.status_code == 401

def test_protected_endpoint_requires_token(client):
    resp = client.get(reverse('saved_vacancies_list_create'))
    assert resp.status_code == 401

# def test_cannot_access_others_saved_vacancies(client):
#     user_a = UserFactory()
#     user_b = UserFactory()
#     resp = client.post(reverse('login'), {
#             "email": str(user_a.email), "password": str(user_a.password)
#         })
    
    
    

