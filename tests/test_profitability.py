from datetime import datetime
import pandas as pd
from modules import profitability


def test_calculate_profitability():
    consumption = pd.DataFrame({
        'time': [datetime(2024, 1, 1, 0), datetime(2024, 1, 1, 1)],
        'consumption_kwh': [1.0, 1.0],
    })
    production = pd.Series([0.5, 0.0], index=consumption['time'])
    prices = pd.Series([1.0, 1.0], index=consumption['time'])
    df = profitability.calculate_profitability(consumption, production, prices, 0.2)
    assert df['savings'].iloc[0] == 0.6  # (1*(1.2) - 0.5*1.2)
    assert df['savings'].iloc[1] == 0.0
