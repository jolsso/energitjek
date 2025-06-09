import base64
import io
import logging
from typing import Optional
import pandas as pd

logger = logging.getLogger(__name__)

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
        logger.exception("Failed to parse consumption data: %s", exc)
        return None
