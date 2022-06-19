"use strict"


/**
 * Set-up pyodide, Python runtime on browser.
 */
async function setup() {
    globalThis.pyodide = await loadPyodide()
}


/**
 * Load a Python module.
 * @param {string} url - URL to Python file to load.
 * @returns {PyProxy|?} Python object or translated one, 'returned' by the Python code.
 */
async function getPythonModule(url) {
    if (!globalThis.pyodide) { await setup() }
    const response = await fetch(url)
    const script = await response.text()
    await pyodide.loadPackagesFromImports(script)
    return pyodide.runPython(script)
}


export { getPythonModule }
