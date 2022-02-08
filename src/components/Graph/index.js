import React, {useEffect, useRef} from 'react'
import { select } from 'd3'

const scale = 0.1
const canvasHeight = 470
const canvasWeight = 800

const Graph = ({ historic = [] }) => {
  const svgRef = useRef(null)

  useEffect( () => {
    const height = select(svgRef.current).node()
    console.log(height)
    select(svgRef.current)
      .selectAll("rect")
        .data(historic)
        .enter()
          .append('rect')
          .attr('width', 10)
          .attr('height', datapoint => datapoint * scale)
          .attr('fill', 'orange')
          .attr('x', (datapoint, iteration) => iteration * 15)
          .attr('y', datapoint => canvasHeight - datapoint * scale)

  }, [historic])

  if( historic.length < 1 ) return 'waiting'
  return (
    <>
      <svg ref={svgRef} className='graph-container'> </svg>
    </>
  )
}

export default Graph