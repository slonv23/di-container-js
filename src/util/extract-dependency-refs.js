import getArgNames from "./get-arg-names";

export default function extractDependencyRefs(classRef) {
    let dependencies;
    if (typeof(classRef.dependencies) === "function") {
        dependencies = classRef.dependencies();
    } else {
        dependencies = getArgNames(classRef.prototype.constructor);
        // is constructor omitted?
        let ancestor = Object.getPrototypeOf(classRef);
        while (!dependencies.length) {
            if (ancestor === Function.prototype) {
                // default constructor, no more ancestors
                break;
            }
            dependencies = getArgNames(ancestor.prototype.constructor);
            ancestor = Object.getPrototypeOf(ancestor);
        }
    }

    return dependencies;
}