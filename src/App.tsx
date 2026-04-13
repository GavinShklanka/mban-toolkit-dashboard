import { HashRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Cockpit from './pages/Cockpit'
import Ladder from './pages/Ladder'
import Courses from './pages/Courses'
import Methods from './pages/Methods'
import Projects from './pages/Projects'
import SolutionRouter from './pages/SolutionRouter'
import Refresh from './pages/Refresh'
import Governance from './pages/Governance'
import Evidence from './pages/Evidence'
import AskMBAN from './pages/AskMBAN'
import ModelLab from './pages/ModelLab'

function App() {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Cockpit />} />
          <Route path="/ladder" element={<Ladder />} />
          <Route path="/courses" element={<Courses />} />
          <Route path="/methods" element={<Methods />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/router" element={<SolutionRouter />} />
          <Route path="/refresh" element={<Refresh />} />
          <Route path="/governance" element={<Governance />} />
          <Route path="/admin/evidence" element={<Evidence />} />
          {/* Legacy redirect support */}
          <Route path="/evidence" element={<Evidence />} />
          <Route path="/ask" element={<AskMBAN />} />
          <Route path="/model-lab" element={<ModelLab />} />
        </Routes>
      </Layout>
    </HashRouter>
  )
}

export default App
