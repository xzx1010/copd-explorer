import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import { AppShell } from '../layouts/AppShell'
import { LoadingScreen } from './LoadingScreen'

const HomePage = lazy(() => import('../../pages/HomePage/HomePage'))
const ExplorerPage = lazy(() => import('../../pages/ExplorerPage/ExplorerPage'))
const MechanismPage = lazy(
  () => import('../../pages/MechanismPage/MechanismPage'),
)
const AIDiagnosisPage = lazy(
  () => import('../../pages/AIDiagnosisPage/AIDiagnosisPage'),
)
const NotFoundPage = lazy(() => import('../../pages/NotFoundPage/NotFoundPage'))

export function AppRoutes() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<HomePage />} />
          <Route path="explorer" element={<ExplorerPage />} />
          <Route path="mechanism" element={<MechanismPage />} />
          <Route path="ai" element={<AIDiagnosisPage />} />
          <Route path="404" element={<NotFoundPage />} />
          <Route path="*" element={<Navigate replace to="/404" />} />
        </Route>
      </Routes>
    </Suspense>
  )
}
