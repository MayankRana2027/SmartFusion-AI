import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import './styles/main.css'
import './styles/header.css'
import Home from './pages/Home'
import Generate from './pages/Generate'
import Header from './components/Header'

function App() {
  const [theme, setTheme] = useState(() => {
    return window.localStorage.getItem('sf-theme') || 'dark'
  })

  useEffect(() => {
    document.body.classList.toggle('theme-light', theme === 'light')
    window.localStorage.setItem('sf-theme', theme)
  }, [theme])

  return (
    <>
    <BrowserRouter>
    <Header theme={theme} onSelectTheme={setTheme}/> {/* Will appear in every page */}
    <Routes>
      <Route path = '/' element={<Home/>}/>
      <Route path = '/generate' element={<Generate/>}/>
    </Routes>
    </BrowserRouter>
    </>
  )
}

export default App