/* eslint-disable */
import React from 'react';
import diContainer from './di-container';
import {ComponentProvider} from 'di-container-js';

class ReactProvider extends ComponentProvider {

    constructor(classRef, config, props) {
        super(classRef, config);
        this.props = props;
    }

    provide() {
        const resolvedDependencies = this.dependencies.reduce((acc, dependencyName, index) => {
            acc[dependencyName] = arguments[index];
            return acc;
        }, {});

        const Component = this.classRef;
        return (props) => <Component {...resolvedDependencies} {...props} />;
    }

}

class InjectionHoc extends React.Component {

    state = {
        ready: false,
    };

    // TODO check if dependencies already initialized and set ready=true in constructor

    async componentDidMount() {
        const {component1, ...otherProps} = this.props;
        diContainer.constructExternalUsingProvider(new ReactProvider(component1, {}, otherProps))
            .then(component => {
                if (!this.unmounted) {
                    this.componentWithInjectedDependencies = component;
                    this.setState({ready: true});
                }
            });
    }

    componentWillUnmount() {
        this.unmounted = true;
    }

    render() {
        if (!this.state.ready) {
            return null;
        }

        const {component1, ...otherProps} = this.props;
        const Component = this.componentWithInjectedDependencies;
        return <Component {...otherProps} />;
    }

}

export function inject(component1) {
    return (props) => <InjectionHoc component1={component1} {...props} />;
}
