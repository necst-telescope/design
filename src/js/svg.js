"use strict"


function arrow(scale = 1) {
    const _arrow = d3.create("svg:marker")
        .attr("id", "arrow")
        .attr("markerUnits", "strokeWidth")
        .attr("markerWidth", 24)
        .attr("markerHeight", 24)
        .attr("viewBox", "0 0 24 24")
        .attr("refX", 12)
        .attr("refY", 12)
        .attr("orient", "auto")
        .attr("transform", `scale(${scale})`)
    _arrow.append("path")
        .attr("d", "M 4 4 L 20 12 L 4 20 L 12 12 L 4 4")
        .style("fill", "#6DA")
    return _arrow
}


export { arrow }
