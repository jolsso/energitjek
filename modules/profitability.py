import pandas as pd


def calculate_profitability(consumption: pd.DataFrame, production: pd.Series,
                            prices: pd.Series, tariff: float) -> pd.DataFrame:
    """Combine data and compute cost savings."""
    df = consumption.copy()
    df = df.set_index('time')
    df = df.join(production.rename('production'), how='left')
    df = df.join(prices.rename('price'), how='left')
    df['tariff'] = tariff
    df['cost_no_pv'] = df['consumption_kwh'] * (df['price'] + tariff)
    df['net_consumption'] = df['consumption_kwh'] - df['production']
    df['net_consumption'] = df['net_consumption'].clip(lower=0)
    df['cost_with_pv'] = df['net_consumption'] * (df['price'] + tariff)
    df['savings'] = df['cost_no_pv'] - df['cost_with_pv']
    return df
