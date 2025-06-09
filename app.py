import dash
from dash import html, dcc, Input, Output, State
import pandas as pd
import dash_bootstrap_components as dbc
from datetime import datetime

from modules import data_loader, geocoding, pvlib_calc, pricing, profitability, dmi_weather
from modules.dmi_weather import start_periodic_fetch


app = dash.Dash(__name__, external_stylesheets=[dbc.themes.CYBORG])
app.title = "Energitjek"
server = app.server

app.layout = dbc.Container(
    [
        dcc.Store(id="pv-settings-store", storage_type="local"),
        dbc.Row([
            dbc.Col(
                [
                    html.H2("Rentabilitetsberegner for solceller", className="mb-4"),

                html.A(
                    html.Img(
                        src="https://img.shields.io/badge/README-GitHub-black?logo=github",
                        alt="Se README på GitHub",
                    ),
                    href="https://github.com/jolsso/energitjek/blob/main/README.md",
                    target="_blank",
                    className="mb-3 d-block",
                ),

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
                html.H4("Opsætning af solcelle anlæg", className="mt-4"),
                dbc.InputGroup([
                    dbc.InputGroupText("Størrelse (kW)"),
                    dbc.Input(
                        id="pv-size",
                        type="number",
                        min=0,
                        max=100,
                        value=5,
                    ),
                    dbc.Button("?", id="pv-size-info-btn", color="secondary", outline=True),
                ], className="mb-2"),
                dbc.Popover(
                    [dbc.PopoverHeader("Solcelleanlæg størrelse"),
                     dbc.PopoverBody("Angiv den nominelle effekt af dit solcelleanlæg i kW")],
                    target="pv-size-info-btn",
                    trigger="click",
                    placement="right",
                ),

                dbc.InputGroup([
                    dbc.InputGroupText("Retning"),
                    dbc.Select(
                        id="pv-orientation",
                        options=[{"label": o, "value": o} for o in ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]],
                    ),
                    dbc.Button("?", id="pv-orientation-info-btn", color="secondary", outline=True),
                ], className="mb-2"),
                dbc.Popover(
                    [dbc.PopoverHeader("Panelretning"),
                     dbc.PopoverBody("Vælg hvilken kompasretning panelerne vender")],
                    target="pv-orientation-info-btn",
                    trigger="click",
                    placement="right",
                ),

                dbc.InputGroup([
                    dbc.InputGroupText("Hældning"),
                    dbc.Input(
                        id="pv-tilt",
                        type="number",
                        min=0,
                        max=90,
                        value=30,
                    ),
                    dbc.Button("?", id="pv-tilt-info-btn", color="secondary", outline=True),
                ], className="mb-2"),
                dbc.Popover(
                    [dbc.PopoverHeader("Hældning"),
                     dbc.PopoverBody("Indtast solcellernes vinkel i grader")],
                    target="pv-tilt-info-btn",
                    trigger="click",
                    placement="right",
                ),

                html.H4("Beregning af rentabilitet", className="mt-4"),
                dbc.InputGroup([
                    dbc.InputGroupText("Periode"),
                    dcc.DatePickerRange(
                        id="date-range",
                        start_date_placeholder_text="Start dato",
                        end_date_placeholder_text="Slut dato",
                        display_format="YYYY-MM-DD",
                    ),
                    dbc.Button("?", id="date-range-info-btn", color="secondary", outline=True),
                ], className="mb-2"),
                dbc.Popover(
                    [dbc.PopoverHeader("Beregningperiode"),
                     dbc.PopoverBody("Vælg start og slutdato for beregningen")],
                    target="date-range-info-btn",
                    trigger="click",
                    placement="right",
                ),
                dbc.Button("Beregn", id="calculate", color="success", className="mb-2"),
                dbc.Button("Simulér solcelleproduktion", id="simulate", color="info", className="mb-4"),
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
                dbc.Row(
                    dbc.Col(dbc.Card(dcc.Graph(id="dmi-production-graph"), body=True), width=12),
                    className="mt-4",
                ),
            ],
            md=9,
        ),
    ]),
    ],
    fluid=True,
)


@app.callback(
    Output("pv-settings-store", "data"),
    Input("calculate", "n_clicks"),
    Input("simulate", "n_clicks"),
    State("pv-size", "value"),
    State("pv-orientation", "value"),
    State("pv-tilt", "value"),
    State("pv-settings-store", "data"),
)
def save_pv_settings(calc_clicks, sim_clicks, size, orientation, tilt, current):
    if not calc_clicks and not sim_clicks:
        raise dash.exceptions.PreventUpdate

    data = {"pv_size": size, "orientation": orientation, "tilt": tilt}
    if current == data:
        raise dash.exceptions.PreventUpdate
    return data


@app.callback(
    Output("pv-size", "value"),
    Output("pv-orientation", "value"),
    Output("pv-tilt", "value"),
    Input("pv-settings-store", "data"),
)
def load_pv_settings(data):
    if not data:
        return dash.no_update, dash.no_update, dash.no_update
    return (
        data.get("pv_size", dash.no_update),
        data.get("orientation", dash.no_update),
        data.get("tilt", dash.no_update),
    )


@app.callback(
    Output('production-graph', 'figure'),
    Output('savings-graph', 'figure'),
    Input('calculate', 'n_clicks'),
    State('upload-consumption', 'contents'),
    State('address', 'value'),
    State('region', 'value'),
    State('pv-size', 'value'),
    State('date-range', 'start_date'),
    State('date-range', 'end_date'),
    State('pv-orientation', 'value'),
    State('pv-tilt', 'value')
)
def run_calculation(n_clicks, consumption_contents, address, region, pv_size,
                    start_date, end_date, orientation, tilt):
    if not n_clicks:
        return dash.no_update, dash.no_update

    consumption = data_loader.load_consumption(consumption_contents)
    if consumption is None:
        return dash.no_update, dash.no_update

    coords = geocoding.geocode_address(address)
    if not coords:
        return dash.no_update, dash.no_update
    lat, lon = coords

    start = pd.to_datetime(start_date) if start_date else consumption['time'].min()
    end = pd.to_datetime(end_date) if end_date else consumption['time'].max()

    azimuth = pvlib_calc.orientation_to_azimuth(orientation) if orientation else 180
    tilt_val = tilt if tilt is not None else 30

    production = pvlib_calc.estimate_production(
        lat,
        lon,
        pv_size,
        start,
        end,
        tilt=tilt_val,
        azimuth=azimuth,
    )
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


@app.callback(
    Output('dmi-production-graph', 'figure'),
    Input('simulate', 'n_clicks'),
    State('date-range', 'start_date'),
    State('date-range', 'end_date'),
    State('pv-size', 'value'),
)
def run_simulation(n_clicks, start_date, end_date, pv_size):
    if not n_clicks or not start_date or not end_date:
        return dash.no_update

    start = datetime.fromisoformat(start_date)
    end = datetime.fromisoformat(end_date)
    radiation = dmi_weather.get_hourly_global_radiation("06180", start, end)
    if radiation is None:
        return dash.no_update
    production = pvlib_calc.estimate_production_with_irradiance(radiation, pv_size)
    if production is None:
        return dash.no_update

    fig = {
        'data': [
            {'x': production.index, 'y': production, 'type': 'line', 'name': 'Simuleret PV'}
        ],
        'layout': {'title': 'DMI baseret produktion'}
    }
    return fig


if __name__ == '__main__':
    # Dash >=2.0 deprecates ``run_server`` in favor of ``run``.
    # Bind to all interfaces so the app works inside Docker.
    # Start periodic fetching of DMI observations in the background
    start_periodic_fetch("06180")
    app.run(debug=True, host="0.0.0.0")
