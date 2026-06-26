import React from 'react'
import { Link } from 'react-router-dom'
import Buttons from '../components/Buttons'
import '../styles/buttons.css'

export default function Generate() {
  return (
    <>
    <Buttons/>
    <Link className="home-link" to="/">
      ← Return to Home
    </Link>
    </>
  )
}