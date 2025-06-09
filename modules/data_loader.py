import base64
import io
from typing import Optional
import pandas as pd

def load_consumption(contents: str) -> Optional[pd.DataFrame]:
    """Parse CSV content from Dash upload component."""
    if contents is None:
        return None
    try:
        content_type, content_string = contents.split(',')
        decoded = base64.b64decode(content_string)
        df = pd.read_csv(io.StringIO(decoded.decode('utf-8')))
        df['time'] = pd.to_datetime(df['time'])
        return df
    except Exception as exc:
        print(f"Failed to parse consumption data: {exc}")
        return None
