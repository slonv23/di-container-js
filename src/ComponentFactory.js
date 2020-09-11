export default class ComponentFactory {

    /** @type {Array} */
    dependencies;

    /** @type {Function} */
    classRef;

    constructor(classRef, dependencies) {
        this.classRef = classRef;
        this.dependencies = dependencies;
    }

    create() {
        return new this.classRef(...this.dependencies);
    }

}