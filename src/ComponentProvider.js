import getArgNames from "./util/getArgNames";

export default class ComponentProvider {

    dependencies = [];

    classRef;

    constructor(classRef, config) {
        if (typeof(classRef.dependencies) === "function") {
            this.dependencies = classRef.dependencies();
        } else {
            this.dependencies = getArgNames(classRef.prototype.constructor);
            // is constructor omitted?
            let ancestor = Object.getPrototypeOf(classRef);
            while (!this.dependencies.length) {
                if (ancestor === Function.prototype) {
                    // default constructor, no more ancestors
                    break;
                }
                this.dependencies = getArgNames(ancestor.prototype.constructor);
                ancestor = Object.getPrototypeOf(ancestor);
            }
        }
        this.classRef = classRef;
        this.config = config;
    }

    /**
     * @returns {Promise<*>}
     */
    provide() {
        let instance = new this.classRef(...arguments);
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

}
