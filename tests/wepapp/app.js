'use strict'

import {
    html,
    useState,
    useCallback,
    createStore,
    deleteStore,
    useStore
} from '@xpreact/bundle';

deleteStore('count')
const countStore = createStore('count', (store) => ({
    value: 0,
    inc: (by = 1) => {
        store.state = { value: store.state.value + by }
    },
    dec: (by = 1) => {
        store.state = { value: store.state.value - by }
    }
}));

function useCounter() {
    const [value, setValue] = useState(0);
    const inc = useCallback(() => {
        setValue(value + 1);
    }, [value]);  // <-- the dependency array
    const dec = useCallback(() => {
        setValue(value - 1);
    }, [value]);  // <-- the dependency array
    return { value, inc, dec };
}

function Counter({ name }) {
    const { value, inc, dec } = useCounter();

    return html`
    <div>
        <div>
            Local Counter ${name}: ${value}
        </div>
        <button onClick=${inc}>inc</button>
        <button onClick=${dec}>dec</button>
    </div>
  `;
}

function GlobalCounter({ name }) {
    const [count, countApi] = useStore('count');

    return html`
    <div>
        <div>
            Global Counter ${name}: ${count.value}
        </div>
        <button onClick=${()=> count.inc()}>inc</button>
        <button onClick=${()=> count.dec()}>dec</button>
    </div>
    `;
}

export default function App({ title }) {
    return html`
    <h2>This is the of the app: ${title}</h2>
    <p>ceci est un paragraphe...</p>
    <p>ceci est un autre paragraphe</p>
    <${Counter} name="A" />
    <${Counter} name="B" />
    <${GlobalCounter} name="C" />
    <${GlobalCounter} name="E" />
    `;
}
