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


function clickOrDragHandler(event, networkGraph) {
    event.preventDefault()

    const getPosition = (ev) => ({ x: ev.clientX, y: ev.clientY })

    const target = d3.select(event.target)
    const data = target.data()
    let dragged = false
    let mousedown = true
    let startPosition = { event: getPosition(event), data: { x: data[0][1].x, y: data[0][1].y } }

    const drag = ev => {
        ev.preventDefault()
        if (mousedown) {
            dragged = true
            const currentPosition = getPosition(ev)
            const dx = networkGraph.x.invert(currentPosition.x - startPosition.event.x) - networkGraph.x.invert(0)
            const dy = networkGraph.y.invert(currentPosition.y - startPosition.event.y) - networkGraph.y.invert(0)

            if (data[0][1].x) {
                data[0][1].x = startPosition.data.x + dx * 1.3
                data[0][1].y = startPosition.data.y + dy * 1.3  // XXX: Magic factor 1.3
            }
            target.data(data)
            networkGraph.draw({ animate: false })
        }
    }
    const dragEnd = ev => {
        ev.preventDefault()
        if (mousedown && !dragged) { networkGraph.draw({ name: target.data()[0][1].name }) }
        mousedown = false
    }
    target
        .on("mousemove", drag)
        .on("mouseleave", dragEnd)
        .on("mouseup", dragEnd)
}

// function clickOrDragHandler(event, networkGraph) {
//     function dragStart(ev, d) { d3.select(this).attr() }
//     function drag(ev, d) { }
//     function dragEnd(ev, d) { }  // TODO: Implement <https://observablehq.com/@d3/circle-dragging-i>
//     return d3.drag()
//         .on("start", dragStart)
//         .on("drag", drag)
//         .on("end", dragEnd)
// }


export { dropHandler, dragOverHandler, clickHandler, clickOrDragHandler }
