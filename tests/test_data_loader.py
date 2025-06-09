import base64
from modules import data_loader


def test_load_consumption_valid():
    csv = "time,consumption_kwh\n2024-01-01 00:00:00,1.0\n2024-01-01 01:00:00,2.0\n"
    encoded = base64.b64encode(csv.encode()).decode()
    contents = f"data:text/csv;base64,{encoded}"
    df = data_loader.load_consumption(contents)
    assert df is not None
    assert len(df) == 2
    assert df['consumption_kwh'].iloc[0] == 1.0


def test_load_consumption_none():
    assert data_loader.load_consumption(None) is None
