import { mount } from 'svelte';
import { onActiveTabChanged } from '@/web-ext/browser';
import { limitPopupHeight } from './limit-popup-height';
import Popup from './Popup.svelte';
import './main.css';

void limitPopupHeight();

// the shown state belongs to the tab the popup was opened from. On Firefox, changing Ctrl+PageUp/Down change the tab while keeping the popup open, which makes the shown state inconsistent
void onActiveTabChanged(() => window.close());

export default mount(Popup, {
    // biome-ignore lint/style/noNonNullAssertion: element always exists
    target: document.getElementById('popup')!,
});
