import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import logo from './assets/demand/logo.webp'
import './App.css'

type Material = { name: string; unit: string; required: number; available: number }
type Project = 'North Tower' | 'Garden Villas'

const initialMaterials: Record<Project, Material[]> = {
  'North Tower': [
    { name: 'Cement', unit: 'bags', required: 100, available: 70 },
    { name: 'Rebar', unit: 'tons', required: 10, available: 12 },
    { name: 'Tiles', unit: 'boxes', required: 50, available: 50 },
    { name: 'Concrete blocks', unit: 'pcs', required: 600, available: 450 },
    { name: 'PVC pipes', unit: 'm', required: 120, available: 150 },
    { name: 'Plywood', unit: 'sheets', required: 80, available: 60 },
    { name: 'Electrical cable', unit: 'm', required: 250, available: 250 },
  ],
  'Garden Villas': [],
}
const sections = [
  ['overview', 'Overview'], ['projects', 'Projects'], ['inventory', 'Inventory'],
  ['demand', 'Material Demand'], ['transfers', 'Transfers'], ['reports', 'Reports'],
]
const statuses = ['Shortage', 'Surplus', 'Balanced'] as const

function statusOf({ available, required }: Material) {
  if (available < required) return 'Shortage'
  if (available > required) return 'Surplus'
  return 'Balanced'
}

function App() {
  const [project, setProject] = useState<Project>('North Tower')
  const [projects, setProjects] = useState(initialMaterials)
  const dialog = useRef<HTMLDialogElement>(null)
  const materials = projects[project]

  function addDemand(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const fields = new FormData(form)
    const name = String(fields.get('name')).trim()
    const unit = String(fields.get('unit')).trim()
    if (!name || !unit) return
    const material = { name, unit, required: Number(fields.get('required')), available: Number(fields.get('available')) }
    setProjects(previous => ({ ...previous, [project]: [...previous[project], material] }))
    form.reset()
    dialog.current?.close()
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <img className="logo" src={logo} alt="ReBuild" />
        <ul className="sections" aria-label="Workspace sections">
          {sections.map(([icon, label]) => (
            <li key={icon} aria-current={icon === 'demand' ? 'page' : undefined}>
              <img src={new URL(`./assets/demand/${icon}.png`, import.meta.url).href} alt="" />{label}
            </li>
          ))}
        </ul>
      </aside>
      <main>
        <header>
          <div><h1>Material Demand</h1><p>Compare project needs with available stock.</p></div>
          <button className="add" onClick={() => dialog.current?.showModal()}>＋ Add demand</button>
        </header>
        <label className="project">Project
          <select value={project} onChange={e => setProject(e.target.value as Project)}>
            {Object.keys(projects).map(name => <option key={name}>{name}</option>)}
          </select>
        </label>
        <section className="summary" aria-label="Material status summary">
          {statuses.map(status => <div key={status}>{status}<strong>{materials.filter(m => statusOf(m) === status).length}</strong></div>)}
        </section>
        <h2 id="materials">Materials</h2>
        <div className="table-frame">
          <table aria-labelledby="materials">
            <thead><tr>{['Material','Required','Available','Difference','Status'].map(title => <th key={title} scope="col">{title}</th>)}</tr></thead>
            <tbody>{materials.map((m, index) => {
              const delta = Number((m.available - m.required).toFixed(2))
              const sign = delta < 0 ? '−' : delta > 0 ? '+' : ''
              const status = statusOf(m)
              return <tr key={index}><th scope="row">{m.name}</th><td>{m.required} {m.unit}</td><td>{m.available} {m.unit}</td><td>{sign}{Math.abs(delta)} {m.unit}</td><td><span className={'badge ' + status.toLowerCase()}>{status}</span></td></tr>
            })}
            {!materials.length && <tr><td colSpan={5}>No demands for this project yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </main>
      <dialog ref={dialog} aria-labelledby="form-title">
        <form onSubmit={addDemand}>
          <h2 id="form-title">Add demand</h2><p>{project}</p>
          <label>Material<input name="name" required pattern={'.*\\S.*'} /></label>
          <label>Unit<input name="unit" placeholder="e.g. bags" required pattern={'.*\\S.*'} /></label>
          <label>Required quantity<input name="required" type="number" min="0.01" step="0.01" required /></label>
          <label>Available quantity<input name="available" type="number" min="0" step="0.01" required /></label>
          <div className="actions"><button type="button" onClick={() => dialog.current?.close()}>Cancel</button><button className="add">Add demand</button></div>
        </form>
      </dialog>
    </div>
  )
}
export default App
