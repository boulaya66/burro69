'use strict';

// preact
import { Component } from '@xpreact/hpreact';

// preact-router
import { Router } from './preactrouter';

/********************************************
 * package: @xpreact/router/redirect
 *  dependencies
 *      @hpreact
 *      @router/preactrouter
 *  exports:
 *     - custom Redirect component
 ********************************************/

export class Redirect extends Component {
    componentWillMount() {
        Router.route(this.props.to, true);
    }

    render() {
        return null;
    }
}

//__ EOF __