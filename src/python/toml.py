import tomli
from pyodide import to_js


def parseTOML(text: str) -> dict:
    parsed = tomli.loads(text)
    return to_js(parsed)  # Type translation, from Python 'dict' to JavaScript 'Map'.


# Module should 'return' objects to be exposed to the JavaScript environment.
parseTOML
