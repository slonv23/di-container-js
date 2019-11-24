export default class CyclicDependencyError extends Error {

    requiredComponent;

    requestingComponentsChain = [];

    constructor(requiredComponent) {
        super();
        this.requiredComponent = requiredComponent;
        this.constructor = CyclicDependencyError 
        this.__proto__ = CyclicDependencyError.prototype
    }

}
