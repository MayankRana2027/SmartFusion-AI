import React, { useEffect, useRef, useState } from 'react'
import '../styles/examples.css';

import input1 from '../example images/1 input.jpg'
import input2 from '../example images/2 input.jpg'
import input6 from '../example images/6 input.jpg'
import input4 from '../example images/4 input.jpg'
import input5 from '../example images/5 input.jpg'
import input7 from '../example images/7 input.jpg'
import input8 from '../example images/8 input.jpg'

import style1 from '../example images/1 style.jpg'
import style2 from '../example images/2 style.jpg'
import style6 from '../example images/6 style.jpg'
import style4 from '../example images/4 style.jpg'
import style5 from '../example images/5 style.jpg'
import style7 from '../example images/7 style.jpg'
import style8 from '../example images/8 style.jpg'

import output1 from '../example images/1 output.jpg'
import output2 from '../example images/2 output.jpg'
import output6 from '../example images/6 output.jpg'
import output4 from '../example images/4 output.jpg'
import output5 from '../example images/5 output.jpg'
import output7 from '../example images/7 output.jpg'
import output8 from '../example images/8 output.jpg'

const examplePairs = [
    { input: input5, style: style5, output: output5 },
    { input: input4, style: style4, output: output4 },
    { input: input2, style: style2, output: output2 },
    { input: input8, style: style8, output: output8 },
    { input: input6, style: style6, output: output6 },
    { input: input1, style: style1, output: output1 },
    { input: input7, style: style7, output: output7 },
]
function ExampleRow({ ex, index }) {
  const rowRef = useRef(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting) // true when entering, false when leaving
      },
      { threshold: 0.2 }
    )

    if (rowRef.current) observer.observe(rowRef.current)

    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={rowRef}
      className={`example-row ${isVisible ? 'is-visible' : ''}`}
    >
      <div className="example-cell">
        <img src={ex.input} alt={`Input ${index + 1}`} />
        <span className="example-label">Input</span>
      </div>

      <span className="example-arrow">+</span>

      <div className="example-cell">
        <img src={ex.style} alt={`Style ${index + 1}`} />
        <span className="example-label">Style</span>
      </div>

      <span className="example-arrow">→</span>

      <div className="example-cell">
        <img src={ex.output} alt={`Output ${index + 1}`} />
        <span className="example-label">Output</span>
      </div>
    </div>
  )
}

export default function Examples() {
  return (
    <>
    <h2 className="examples-heading">Here are some examples for your guidance:</h2>
    <div id="examples">
      {examplePairs.map((ex, i) => (
        <ExampleRow ex={ex} index={i} key={i} />
      ))}
    </div>
    </>
  )
}