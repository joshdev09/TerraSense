import { useState } from 'react'
import Nav from './components/Nav'
import PampangaMap from './components/PampangaMap'
import AnalyticsView from './views/AnalyticsView'
import ExportView from './views/ExportView'
import CommunityView from './views/CommunityView'
import SourcesView from './views/SourcesView'
import type { AppView } from './components/BurgerMenuNav'

function App() {
  const [activeView, setActiveView] = useState<AppView>('map')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <div style={{ flexShrink: 0 }}>
        <Nav onNavigate={setActiveView} activeView={activeView} />
      </div>

      {activeView === 'map'       && <PampangaMap />}
      {activeView === 'analytics' && <AnalyticsView />}
      {activeView === 'export'    && <ExportView />}
      {activeView === 'community' && <CommunityView />}
      {activeView === 'sources'   && <SourcesView />}
    </div>
  )
}

export default App