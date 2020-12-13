'use strict'

import { html, render, deleteStore } from '@xpreact/bundle';

import App from './app.js';

render(html`<${App} title="My title"/>`, document.body);

if (module.hot) {
    module.hot.accept(()=>{
    });
}