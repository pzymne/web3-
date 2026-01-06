import { useStorage } from '@vueuse/core'

const initalState = {
  token: undefined
}

// bind object
export default useStorage('vblog', initalState, localStorage, {
  mergeDefaults: true
})
