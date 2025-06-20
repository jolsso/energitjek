import dash
from dash import html, dcc, Input, Output, State
import pandas as pd
import dash_bootstrap_components as dbc
from datetime import datetime

from modules import data_loader, geocoding, pvlib_calc, pricing, profitability, dmi_weather
from modules.dmi_weather import available_cache_days, start_periodic_fetch


app = dash.Dash(__name__, external_stylesheets=[dbc.themes.CYBORG])
app.title = "Energitjek"
server = app.server

days = available_cache_days("06180")
if days:
    min_cache_day = days[0]
    max_cache_day = days[-1]
    disabled_days = [
        d.date().isoformat()
        for d in pd.date_range(min_cache_day, max_cache_day)
        if d.date() not in days
    ]
else:
    today = datetime.utcnow().date()
    min_cache_day = max_cache_day = today
    disabled_days = []

app.layout = dbc.Container(
    [
        dcc.Store(id="pv-settings-store", storage_type="local"),
        dcc.Store(id="input-store", storage_type="local"),
        dcc.Interval(id="dmi-cache-refresh", interval=3600*1000),
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
                        start_date=min_cache_day,
                        end_date=max_cache_day,
                        min_date_allowed=min_cache_day,
                        max_date_allowed=max_cache_day,
                        disabled_days=disabled_days,
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
                dbc.Button("Beregn", id="calculate", color="success", className="mb-4"),
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
    State("pv-size", "value"),
    State("pv-orientation", "value"),
    State("pv-tilt", "value"),
    State("pv-settings-store", "data"),
)
def save_pv_settings(calc_clicks, size, orientation, tilt, current):
    if not calc_clicks:
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
    Output("input-store", "data"),
    Input("address", "value"),
    Input("region", "value"),
    Input("date-range", "start_date"),
    Input("date-range", "end_date"),
    State("input-store", "data"),
)
def save_inputs(address, region, start_date, end_date, current):
    data = {
        "address": address,
        "region": region,
        "start_date": start_date,
        "end_date": end_date,
    }
    if current == data:
        raise dash.exceptions.PreventUpdate
    return data


@app.callback(
    Output("address", "value"),
    Output("region", "value"),
    Output("date-range", "start_date"),
    Output("date-range", "end_date"),
    Input("input-store", "modified_timestamp"),
    State("input-store", "data"),
)
def load_inputs(ts, data):  # noqa: ARG001
    if not data:
        return (
            dash.no_update,
            dash.no_update,
            dash.no_update,
            dash.no_update,
        )
    return (
        data.get("address", dash.no_update),
        data.get("region", dash.no_update),
        data.get("start_date", dash.no_update),
        data.get("end_date", dash.no_update),
    )


@app.callback(
    Output("date-range", "disabled_days"),
    Output("date-range", "min_date_allowed"),
    Output("date-range", "max_date_allowed"),
    Input("dmi-cache-refresh", "n_intervals"),
)
def refresh_datepicker(_):
    days = available_cache_days("06180")
    if not days:
        today = datetime.utcnow().date()
        return [], today, today
    min_day = days[0]
    max_day = days[-1]
    disabled = [
        d.date().isoformat()
        for d in pd.date_range(min_day, max_day)
        if d.date() not in days
    ]
    return disabled, min_day, max_day


@app.callback(
    Output('production-graph', 'figure'),
    Output('savings-graph', 'figure'),
    Output('dmi-production-graph', 'figure'),
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
        return dash.no_update, dash.no_update, dash.no_update

    consumption = data_loader.load_consumption(consumption_contents)
    if consumption is None:
        return dash.no_update, dash.no_update, dash.no_update

    coords = geocoding.geocode_address(address)
    if not coords:
        return dash.no_update, dash.no_update, dash.no_update
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
        return dash.no_update, dash.no_update, dash.no_update

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
    radiation = dmi_weather.get_hourly_global_radiation("06180", start, end)
    if radiation is not None:
        dmi_prod = pvlib_calc.estimate_production_with_irradiance(radiation, pv_size)
    else:
        dmi_prod = None

    if dmi_prod is not None:
        dmi_fig = {
            'data': [
                {'x': dmi_prod.index, 'y': dmi_prod, 'type': 'line', 'name': 'Simuleret PV'}
            ],
            'layout': {'title': 'DMI baseret produktion'}
        }
    else:
        dmi_fig = dash.no_update

    return prod_fig, save_fig, dmi_fig



if __name__ == '__main__':
    # Dash >=2.0 deprecates ``run_server`` in favor of ``run``.
    # Bind to all interfaces so the app works inside Docker.
    # Start periodic fetching of DMI observations in the background
    start_periodic_fetch("06180")
    app.run(debug=True, host="0.0.0.0")
