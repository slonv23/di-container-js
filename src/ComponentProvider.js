import getArgNames from "./util/getArgNames";

export default class ComponentProvider {

    dependencies = [];

    classRef;

    constructor(classRef, config) {
        if (typeof(classRef.dependencies) === "function") {
            this.dependencies = classRef.dependencies();
        } else {
            this.dependencies = getArgNames(classRef.prototype.constructor);
        }
        this.classRef = classRef;
        this.config = config;
    }

    /**
     * @returns {Promise<any>}
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

    setConfig(config) {
        this.config = config;
    }

    getDependencies() {
        return this.dependencies;
    }

}
