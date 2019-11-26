import getArgNames from "./util/getArgNames";

export default class ComponentProvider {

    dependencies = [];

    classRef;

    constructor(classRef, config) {
        if (typeof(classRef.dependencies) === "function") {
            this.dependencies = classRef.dependencies();
        } else {
            this.dependencies = getArgNames(classRef.constructor);
        }
        this.classRef = classRef;
        this.config = config;
    }

    provide() {
        let instance = new this.classRef(...arguments);
        if (this.config !== undefined && (typeof instance.postConstruct === 'function')) {
            instance.postConstruct(this.config);
        }
    }

    setConfig(config) {
        this.config = config;
    }

    getDependencies() {
        return this.dependencies;
    }

}
