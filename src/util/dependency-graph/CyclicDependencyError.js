export default class CyclicDependencyError extends Error {

    requiredComponent;

    requestingComponentsChain = [];

    constructor(requiredComponent) {
        super();
        this.requiredComponent = requiredComponent;
        this.constructor = CyclicDependencyError
        this.__proto__ = CyclicDependencyError.prototype
    }

    toString() {
        const path = this.requestingComponentsChain.reverse()
            .map((e) => e.toString())
            .join(' -> ')
            .concat(` -> ${this.requiredComponent}`);

        return 'Cyclic dependency found: ' + path;
    }

}
