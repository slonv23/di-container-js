import CyclicDependencyError from "./CyclicDependencyError";

export default class Node {

    /** @type {Node[]} */
    children = [];

    /** @type {string} */
    dependencyRef;

    index;

    /**
     * @description Nodes which added this node to children
     * @type {Node[]}
     * */
    references = [];

    constructor(dependencyRef) {
        if (dependencyRef == null) {
            throw new Error("Dependency reference is not defined");
        }
        this.dependencyRef = dependencyRef;
    }

    /** @param {Node} node */
    addChild(node) {
        const nodeCopy = new Node(node.dependencyRef);
        nodeCopy.index = this.children.length;
        nodeCopy.children = node.children;
        nodeCopy.references = node.references;
        nodeCopy.references.push(this);

        const nodesToCheck = [...nodeCopy.references];
        let ancestorNode;
        while ((ancestorNode = nodesToCheck.pop())) {
            if (nodeCopy.dependencyRef !== 'diContainer' && ancestorNode.dependencyRef === nodeCopy.dependencyRef) {
                throw this._createCyclicDependencyError(nodeCopy);
            }
            if (ancestorNode.references.length) {
                nodesToCheck.push(...ancestorNode.references);
            }
        }

        this.children.push(nodeCopy);
    }

    _createCyclicDependencyError(node) {
        const nodesToCheck = [...node.references];
        let path = [], ancestorNode, findCyclicDependency = false;
        while ((ancestorNode = nodesToCheck.pop())) {
            path.push(ancestorNode.dependencyRef);

            if (node.dependencyRef !== 'diContainer' && ancestorNode.dependencyRef === node.dependencyRef) {
                findCyclicDependency = true;
            }

            if (ancestorNode.references.length) {
                nodesToCheck.push(...ancestorNode.references);
            } else if (!findCyclicDependency) {
                path = [];
            } else {
                break;
            }
        }

        const error = new CyclicDependencyError(node.dependencyRef);
        error.requestingComponentsChain = path;
        throw error;
    }

}
