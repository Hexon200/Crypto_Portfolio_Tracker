import { Navigate, Route, Routes } from 'react-router-dom'
import CoinDetailPanel from './components/CoinDetailPanel.jsx'
import Layout from './components/Layout.jsx'
import ToastViewport from './components/ToastViewport.jsx'
import { useAlertChecker } from './hooks/useAlertChecker.js'
import { useRealtimePrices } from './hooks/useRealtimePrices.js'
import Backup from './pages/Backup.jsx'
import Alerts from './pages/Alerts.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Transactions from './pages/Transactions.jsx'
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
        <Route path="/transactions" element={<Transactions />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/backup" element={<Backup />} />
        <Route path="/alerts" element={<Alerts />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ToastViewport />
      <CoinDetailPanel />
    </Layout>
  )
}
