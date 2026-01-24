// First import createStore function from Framework7 core
import { createStore } from 'framework7/lite';

// create store
const store = createStore({
  // start with the state (store data)
  state: {
    activeDate: "",
    dates: []
  },

  // actions to operate with state and for async manipulations
  actions: {
    setActiveDate({state}: {state: any}, {d}: {d: string}) {
        state.activeDate = d;
    },
    setDates({state}: {state: any}, {dates}: {dates: string[]}) {
        state.dates =  dates
    },
  },

  // getters to retrieve the state
  getters: {
    activeDate({state}: {state: any}) {
        return state.activeDate;
    },
    dates({ state }: {state: any}) {
      return state.dates;
    }
  }

})

// export store
export default store;