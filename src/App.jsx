import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import ToastViewport from './components/ToastViewport.jsx'
import { useAlertChecker } from './hooks/useAlertChecker.js'
import { useRealtimePrices } from './hooks/useRealtimePrices.js'
import Alerts from './pages/Alerts.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Portfolio from './pages/Portfolio.jsx'

function MarketRuntime() {
  useRealtimePrices()
  useAlertChecker()
  return null
}

export default function App() {
  return (
    <Layout>
      <MarketRuntime />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastViewport />
    </Layout>
  )
}
