"""Local server for the site that tells the browser never to cache.

`python -m http.server` sends no Cache-Control header, so browsers cache files by guesswork
and can mix new JavaScript with old CSS or old modules after an edit (a step then fails to
load, or new elements appear unstyled). This server sends `Cache-Control: no-store`.

    uv run python tools/serve.py          # http://localhost:8765
    uv run python tools/serve.py 8000
"""

import sys
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

SITE = Path(__file__).resolve().parent.parent / "site"


class NoStoreHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, fmt, *args):  # keep the terminal quiet apart from errors
        if args and str(args[1])[:1] in "45":
            super().log_message(fmt, *args)


def main() -> int:
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8765
    server = ThreadingHTTPServer(("127.0.0.1", port), partial(NoStoreHandler, directory=str(SITE)))
    print(f"smFISH Simulator on http://localhost:{port}/ (no caching; Ctrl+C to stop)")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    return 0


if __name__ == "__main__":
    sys.exit(main())
