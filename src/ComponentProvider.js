import getArgNames from "./util/getArgNames";

export default class ComponentProvider {

    dependencies = [];

    classRef;

    constructor(classRef) {
        if (typeof(classRef.dependencies) === "function") {
            this.dependencies = classRef.dependencies();
        } else {
            this.dependencies = getArgNames(classRef.constructor);
        }
        this.classRef = classRef;
    }

    provide() {
        return new this.classRef(...arguments); //Reflect.construct(this.classRef, arguments);
    }

    getDependencies() {
        return this.dependencies;
    }

}
