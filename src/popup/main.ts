import { mount } from 'svelte';
import Popup from './Popup.svelte';
import './main.css';

export default mount(Popup, {
    // biome-ignore lint/style/noNonNullAssertion: element always exists
    target: document.getElementById('popup')!,
});
