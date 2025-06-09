import dash
from dash import html, dcc, Input, Output, State
import dash_bootstrap_components as dbc

from modules import data_loader, geocoding, pvlib_calc, pricing, profitability
from modules.dmi_weather import start_periodic_fetch


app = dash.Dash(__name__, external_stylesheets=[dbc.themes.CYBORG])
app.title = "Energitjek"
server = app.server

consent_modal = dbc.Modal(
    [
        dbc.ModalHeader("Samtykke til databehandling"),
        dbc.ModalBody(
            html.Ul(
                [
                    html.Li(
                        "Form\u00e5l: Beregning af rentabilitet for solceller p\u00e5 den angivne adresse."
                    ),
                    html.Li(
                        "Oplysninger: Uploadet elforbrug, adresse og valg gemmes kun midlertidigt og bruges kun i beregningen."
                    ),
                    html.Li("Retsgrundlag: Dine data behandles kun med dit samtykke."),
                    html.Li(
                        "Opbevaring: Data gemmes kun i denne session og slettes n\u00e5r siden lukkes."
                    ),
                    html.Li(
                        "Deling: Adressen sendes til OpenStreetMap for geokodning og vejrdata hentes fra DMI."
                    ),
                    html.Li(
                        "Rettigheder: Du kan til enhver tid tr\u00e6kke samtykket tilbage ved at genindl\u00e6se siden."
                    ),
                    html.Li(
                        "Kontakt: Privat projekt, inds\u00e6t evt. dine kontaktoplysninger her."
                    ),
                ]
            )
        ),
        dbc.ModalFooter(dbc.Button("Jeg accepterer", id="consent-accept", color="primary")),
    ],
    id="consent-modal",
    is_open=False,
    backdrop="static",
    keyboard=False,
)

app.layout = dbc.Container(
    [
        dbc.Row([
            dbc.Col(
                [
                    html.H2("Rentabilitetsberegner for solceller", className="mb-4"),
                    dcc.Upload(
                        id="upload-consumption",
                    children=dbc.Button("Upload elforbrug (CSV)", color="primary", className="mb-2"),
                ),
                dbc.Input(id="address", type="text", placeholder="Adresse", className="mb-2"),
                dbc.Select(
                    id="region",
                    options=[{"label": "Øst", "value": "east"}, {"label": "Vest", "value": "west"}],
                    placeholder="Vælg region",
                    className="mb-2",
                ),
                dbc.Input(id="pv-size", type="number", value=5, placeholder="kWp", className="mb-2"),
                dbc.Button("Beregn", id="calculate", color="success", className="mb-2"),
                dbc.Button("Samtykke", id="open-consent", color="secondary", className="mb-4"),
            ],
            md=3,
        ),
        dbc.Col(
            [
                dbc.Row(
                    dbc.Col(dbc.Card(dcc.Graph(id="production-graph"), body=True), width=12),
                    className="mb-4",
                ),
                dbc.Row(dbc.Col(dbc.Card(dcc.Graph(id="savings-graph"), body=True), width=12)),
            ],
            md=9,
        ),
    ]),
        dcc.Store(id="consent-store", storage_type="local"),
        consent_modal,
    ],
    fluid=True,
)


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


@app.callback(Output("consent-store", "data"), Input("consent-accept", "n_clicks"), prevent_initial_call=True)
def give_consent(n_clicks):
    """Store that the user has accepted the consent."""
    return "accepted"


@app.callback(Output("consent-modal", "is_open"), [Input("open-consent", "n_clicks"), Input("consent-store", "data")])
def toggle_consent(open_clicks, consent):
    """Show the consent modal until consent is given."""
    if open_clicks:
        return True
    return consent != "accepted"


if __name__ == '__main__':
    # Dash >=2.0 deprecates ``run_server`` in favor of ``run``.
    # Bind to all interfaces so the app works inside Docker.
    # Start periodic fetching of DMI observations in the background
    start_periodic_fetch("06180")
    app.run(debug=True, host="0.0.0.0")
