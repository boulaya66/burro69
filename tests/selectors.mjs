'use strict'

import * as Bundle from '@xpreact/bundle';

console.log('---------------------------------------------------')

Bundle.storeManager.register(Bundle.withReducers);
Bundle.storeManager.register(Bundle.withSelectors);
Bundle.registerStorePlugin(Bundle.withStageCommit);
Bundle.registerStorePlugin(Bundle.withActions);

const store = Bundle.createStore('user',
    (store) => ({
        firstName: 'Philippe',
        lastName: 'Gensane',
        fullName: () => {
            store.state.firstName + ' ' + store.state.lastName
        },
        setRole: (role) => {
            store.state = { role };
        },
        users: []
    }))
    .reducer('login', function dologin(store, as) {
        return {
            isLoggedIn: true,
            role: as ? as : store.state.role
        }
    })
    .addReducer('logout', (store) => {
        return {
            isLoggedIn: false,
            role: 'undefined'
        }
    })
    .reducer('addUser', (store, user) => {
        return {
            users: store.state.users.concat([user]),
            other: 'other.' + store.state.other
        }
    })
    .action('login', function actnLogin(store, user) {
        const stage1 = store.stage();
        stage1.state.users = stage1.state.users.concat([user]);

        const stage2 = store.stage();
        stage2.state.isLoggedIn = true;
        stage2.state.role = user.role;

        store.commitAll();
    })
    .action('changeUser', (store, user, index) => {
        const _users = Array.from(store.state.users);
        _users[index] = user;
        store.setState({ ...store.state, users: _users }, true);

        //store.state.users[index] = user;
        //store.notify(store.state);
    });

store.subscribe(function watchAll(newState) {
    let _state = JSON.stringify(newState);
    if (_state.length >= 40)
        _state = _state.substring(1, 60) + '...}';
    console.log('  watch all     => New State : ', _state);
    throw new Error('error...')
});

const selectorFn = Bundle.createSelector(['role', 'isLoggedIn']);
// state => ({ role: state.role }));
store.subscribe((newState, error) => {
    if (error)
        console.log('  watch [role,isLoggedIn] => no change ');
    else
        console.log('  watch [r,isL] => New State : ', newState);
}, selectorFn, Bundle.shallowEqual);

const selectorFn2 = Bundle.createSelector('users.length');
store.subscribe((newState, error) => {
    if (error)
        console.log('  watch users.l => no change ');
    else
        console.log('  watch users.l => New State : ', newState);
}, selectorFn2);

const selectorFn3 = Bundle.createSelector('users[2]');
store.subscribe(function watchUser1(newState, error) {
    if (error)
        console.log('  watch user[2] => no change ');
    else
        console.log('  watch user[2] => New State : ', newState);
}, selectorFn3);//, Bundle.deepEqual);

Bundle.storeManager._dump();
console.log();

console.log("store.state.setRole('admin')")
store.state.setRole('admin');
console.log();

console.log("store.dispatch('login', 'user')")
store.dispatch('login', 'user')
console.log();

console.log("store.dispatch('logout', 'user')")
store.dispatch('logout', 'user')
console.log();

console.log("store.dispatch('addUser', {...})")
store.dispatch('addUser', {
    firstName: 'Philippe',
    lastName: 'Gensane'
})
console.log();

console.log("store.dispatch('addUser', {...})")
store.dispatch('addUser', {
    firstName: 'Christine',
    lastName: 'Gensane'
})
console.log();

console.log("store.exec('login', {...})")
store.exec('login', {
    firstName: 'Aurélien',
    lastName: 'Gensane',
    role: 'visitor'
})
console.log();

console.log("store.exec('changeUser', {...}, 2)")
store.exec('changeUser', {
    firstName: 'Adrien',
    lastName: 'Gensane',
    role: 'visitor'
}, 2)
console.log();



Bundle.storeManager._dump();
console.log();


/*__ EOF __ */