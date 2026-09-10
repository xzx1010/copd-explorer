import { BrowserRouter } from 'react-router-dom'

import { ErrorBoundary } from './app/providers/ErrorBoundary'
import { AppRoutes } from './app/routes/AppRoutes'

function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <ErrorBoundary>
        <AppRoutes />
      </ErrorBoundary>
    </BrowserRouter>
  )
}

export default App
