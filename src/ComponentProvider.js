import extractDependencyRefs from "./util/extract-dependency-refs";

export default class ComponentProvider {

    /** @type {Array} */
    dependencies;

    /** @type {Function} */
    classRef;

    /** @type {string} */
    className;

    /**
     * @param {Function} object
     * @param {*} [config]
     */
    constructor(object, config) {
        this.classRef = object;
        this.config = config;
        this.className = object.constructor.name;
        this.dependencies = this.extractDependencyRefs();
    }

    /**
     * @param {Array} dependencies
     * @returns {Promise<*>}
     */
    provide(...dependencies) {
        let instance = this._createInstance(dependencies);
        if (typeof instance.postConstruct === 'function') {
            let result = instance.postConstruct(this.config);
            if (result instanceof Promise) {
                return result.then(() => instance);
            }
        }

        return Promise.resolve(instance);
    }

    mergeConfig(config) {
        if (!this.config) {
            this.config = config;
        } else {
            this.config = Object.assign({}, this.config, config);
        }
    }

    setConfig(config) {
        this.config = config;
    }

    getDependencies() {
        return this.dependencies;
    }

    /**
     * @returns {string|symbol[]}
     * @protected
     */
    extractDependencyRefs() {
        return extractDependencyRefs(this.classRef);
    }

    /**
     * @param {Array} dependencies
     * @returns {object}
     * @private
     */
    _createInstance(dependencies) {
        return new this.classRef(...dependencies);
    }

}
