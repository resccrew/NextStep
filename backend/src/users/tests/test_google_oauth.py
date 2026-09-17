import pytest
from unittest.mock import patch
from django.urls import reverse
from django.contrib.auth import get_user_model

User = get_user_model()
pytestmark = pytest.mark.django_db

@patch('users.views.id_token.verify_oauth2_token')
def test_google_login_creates_new_user(mock_verify, client):
    mock_verify.return_value = {
        "email": "newgoogleuser@gmail.com",
        "given_name": "Anna",
        "family_name": "Kowalska",
    }
    resp = client.post(reverse('google_login'), {
        "token": "fake-id-token"
    })
    assert resp.status_code == 200
    user = User.objects.get(email="newgoogleuser@gmail.com")
    assert not user.has_usable_password()

@patch('users.views.id_token.verify_oauth2_token')
def test_google_login_existing_user_no_duplicate(mock_verify, client, django_user_model):
    django_user_model.objects.create_user(
        username = "existing", email = 'existing@gmail.com', password = None
    )
    mock_verify.return_value = {"email": "existing@gmail.com"}
    resp = client.post(reverse('google_login'), {
        "token": "fake-id-token"
    })
    assert resp.status_code == 200
    assert django_user_model.objects.filter(email="existing@gmail.com").count() == 1

@patch('users.views.id_token.verify_oauth2_token')
def test_google_login_invalid_token(mock_verify, client):
    mock_verify.side_effect = ValueError("Invalid token")
    resp = client.post(reverse('google_login'), {
        "token": "bad-token"
    })
    assert resp.status_code == 400