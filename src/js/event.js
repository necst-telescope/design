"use strict"

import * as data from "./data.js"
import * as graph from "./graph.js"


async function dropHandler(event) {
    event.preventDefault()  // Default is to open the file in another tab.

    d3.select(this)
        .classed("drag-over", false)

    console.info("File(s) dropped")

    const files = []
    if (event.dataTransfer.items) {
        for (let data of event.dataTransfer.items) {
            if (data.kind === "file") {
                const file = data.getAsFile()
                console.info(`Reading ${file.name}`)
                files.push(file)
            }
        }
    } else {
        for (let file of event.dataTransfer.files) {
            console.info(`Reading ${file.name}`)
            files.push(file)
        }
    }
    console.info(`Read ${files.length} file${files.length === 1 ? "" : "s"}`)

    const networkData = await data.readTOML(files)
    new graph.NetworkDiagram(networkData).draw()
}


function dragOverHandler(event) {
    event.preventDefault()

    d3.select(this)
        .classed("drag-over", true)
        .on("dragend", ev => d3.select(this).classed("drag-over", false))
        .on("dragleave", ev => d3.select(this).classed("drag-over", false))
}


async function clickHandler(event) {
    event.preventDefault()

    const url = d3.select("#data-file-url").property("value")
    const networkData = await data.readTOML(url)
    new graph.NetworkDiagram(networkData).draw()
}


export { dropHandler, dragOverHandler, clickHandler }
