import { mount } from 'svelte';
import { limitPopupHeight } from './limit-popup-height';
import Popup from './Popup.svelte';
import './main.css';

limitPopupHeight();

export default mount(Popup, {
    // biome-ignore lint/style/noNonNullAssertion: element always exists
    target: document.getElementById('popup')!,
});
