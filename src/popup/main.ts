import { mount } from 'svelte'
import Popup from './Popup.svelte'
import './main.css'

export default mount(Popup, {
    target: document.getElementById('popup')!,
})
