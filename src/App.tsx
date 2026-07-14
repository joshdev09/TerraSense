import Nav from './components/Nav'
import PampangaMap from './components/PampangaMap'

function App() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <div style={{ flexShrink: 0 }}>
        <Nav />
      </div>
      
      <PampangaMap />
    </div>
  )
}

export default App