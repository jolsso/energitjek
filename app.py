import dash
from dash import html, dcc, Input, Output, State

from modules import data_loader, geocoding, pvlib_calc, pricing, profitability


app = dash.Dash(__name__)
server = app.server

app.layout = html.Div([
    html.H1("Rentabilitetsberegner for solceller"),
    dcc.Upload(id='upload-consumption', children=html.Button('Upload elforbrug (CSV)')),
    dcc.Input(id='address', type='text', placeholder='Adresse'),
    dcc.Dropdown(id='region', options=[
        {'label': 'Øst', 'value': 'east'},
        {'label': 'Vest', 'value': 'west'},
    ], placeholder='Vælg region'),
    dcc.Input(id='pv-size', type='number', value=5, placeholder='kWp'),
    html.Button('Beregn', id='calculate'),
    dcc.Graph(id='production-graph'),
    dcc.Graph(id='savings-graph'),
])


@app.callback(
    Output('production-graph', 'figure'),
    Output('savings-graph', 'figure'),
    Input('calculate', 'n_clicks'),
    State('upload-consumption', 'contents'),
    State('address', 'value'),
    State('region', 'value'),
    State('pv-size', 'value')
)
def run_calculation(n_clicks, consumption_contents, address, region, pv_size):
    if not n_clicks:
        return dash.no_update, dash.no_update

    consumption = data_loader.load_consumption(consumption_contents)
    if consumption is None:
        return dash.no_update, dash.no_update

    coords = geocoding.geocode_address(address)
    if not coords:
        return dash.no_update, dash.no_update
    lat, lon = coords

    start = consumption['time'].min()
    end = consumption['time'].max()
    production = pvlib_calc.estimate_production(lat, lon, pv_size, start, end)
    if production is None:
        return dash.no_update, dash.no_update

    prices = pricing.get_spot_prices(start, end)
    tariff = pricing.get_local_tariffs(region)
    result = profitability.calculate_profitability(consumption, production, prices, tariff)

    prod_fig = {
        'data': [
            {'x': result.index, 'y': result['production'], 'type': 'line', 'name': 'PV Produktion'}
        ],
        'layout': {'title': 'Forventet Produktion'}
    }

    save_fig = {
        'data': [
            {'x': result.index, 'y': result['savings'].cumsum(), 'type': 'line', 'name': 'Akkumuleret besparelse'}
        ],
        'layout': {'title': 'Økonomisk besparelse'}
    }
    return prod_fig, save_fig


if __name__ == '__main__':
    app.run_server(debug=True)
