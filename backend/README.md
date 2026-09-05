# backend

Nothing in PediDrip calls this service.

The calculator is entirely client-side: every dose, rate and titration table is
computed in the browser or on the device from `frontend/src/data/drugs.js` (and
from the same table embedded in the root `index.html`). There is no API call
anywhere in the app — you can confirm with:

```sh
grep -rn "api/" index.html frontend/src frontend/App.js   # returns nothing
```

That is deliberate, and it is the reason the app works offline on a ward with no
signal, and the reason no patient identifier ever leaves the device.

## So why does this exist?

Two `/api/` endpoints that answer "yes, I am running". They are here for the
hosting platform's health check, not for the app. If your host does not need a
backend process, this whole directory can be deleted without touching the
calculator.

## If you keep it

```sh
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8001
```

Do not add calculation endpoints here. Splitting the dose logic across a client
and a server would create a second place for the numbers to live, and the whole
point of `frontend/scripts/check-calc.mjs` is that there is exactly one dose
table, verified in one place.
