import logging
import sys

# Configure logging to only use console
def setup_logging():
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(levelname)s - %(message)s',
        handlers=[logging.StreamHandler(sys.stdout)]
    )

# Setup logging
setup_logging()
logger = logging.getLogger(__name__)