import { observer } from 'mobx-react-lite'
import { useStore } from './stores/useStore'
import './App.css'

const App = observer(() => {
  const store = useStore()

  return (
    <div className="App">
      <header className="App-header">
        <h1>Ekho Application</h1>
        <p>Count: {store.count}</p>
        <button onClick={() => store.increment()}>Increment</button>
        <button onClick={() => store.decrement()}>Decrement</button>
      </header>
    </div>
  )
})

export default App
