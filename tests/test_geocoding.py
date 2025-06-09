from unittest import mock
from modules import geocoding


def test_geocode_address_success():
    response = mock.Mock()
    response.raise_for_status.return_value = None
    response.json.return_value = [{"lat": "55.0", "lon": "10.0"}]
    with mock.patch("modules.geocoding.requests.get", return_value=response) as m:
        coords = geocoding.geocode_address("Some address")
        assert coords == (55.0, 10.0)
        m.assert_called_once()


def test_geocode_address_failure():
    response = mock.Mock()
    response.raise_for_status.side_effect = Exception("fail")
    with mock.patch("modules.geocoding.requests.get", return_value=response):
        assert geocoding.geocode_address("bad") is None
