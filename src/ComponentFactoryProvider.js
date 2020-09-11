import ComponentProvider from "./ComponentProvider";
import ComponentFactory from "./ComponentFactory";

export default class ComponentFactoryProvider extends ComponentProvider {

    /**
     * @param {Array} dependencies
     * @returns {object}
     * @private
     */
    _createInstance(dependencies) {
        return new ComponentFactory(this.classRef, dependencies);
    }

}