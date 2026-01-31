import { makeAutoObservable } from 'mobx'
import { createContext, useContext } from 'react'

class RootStore {
  count = 0

  constructor() {
    makeAutoObservable(this)
  }

  increment() {
    this.count++
  }

  decrement() {
    this.count--
  }
}

const store = new RootStore()
const StoreContext = createContext(store)

export const useStore = () => useContext(StoreContext)
