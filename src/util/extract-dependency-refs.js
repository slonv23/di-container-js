import getArgNames from "./get-arg-names";

export default function extractDependencyRefs(object) {
    let dependencies;
    if (typeof(object.dependencies) === "function") {
        dependencies = object.dependencies();
    } else {
        if (typeof(object) === "function") {
            dependencies = getArgNames(object);
        } else if (object.prototype.constructor) {
            dependencies = getArgNames(object.prototype.constructor);
            // is constructor omitted?
            let ancestor = Object.getPrototypeOf(object);
            while (!dependencies.length) {
                if (ancestor === Function.prototype) {
                    // default constructor, no more ancestors
                    break;
                }
                dependencies = getArgNames(ancestor.prototype.constructor);
                ancestor = Object.getPrototypeOf(ancestor);
            }
        }
    }

    return dependencies;
}
