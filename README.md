# energitjek

Plotly Dash applikation til beregning af rentabilitet for private solceller.

Brugeren uploader sit elforbrug fra eloverblik.dk og angiver en adresse.
Backend geocoder adressen, estimerer forventet solcelleproduktion med PVlib
og kombinerer dette med spotpriser og lokale tariffer. Resultaterne vises som
grafer over produktion og økonomisk besparelse.
