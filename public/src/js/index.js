"use strict"

import * as event from "./event.js"


async function main() {

    d3.select("#data-file")
        .on("dragover", event.dragOverHandler)
        .on("drop", event.dropHandler)
    d3.select("#data-file-url-read")
        .on("click", event.clickHandler)

    const previousStructureTOML = [
        "https://raw.githubusercontent.com/necst-telescope/design/main/public/tests/example.toml",
    ]
    d3.select("#data-file-url")
        .property("value", previousStructureTOML.join(","))

}


document.addEventListener("DOMContentLoaded", main)
