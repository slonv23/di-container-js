/**
 * @typedef {import('./Node').default} Node
 */

export default class DependencyGraph {

    /** @type {Node} */
    rootNode;

    /** @param {Node} rootNode */
    constructor(rootNode) {
        this.rootNode = rootNode;
    }

    *makeIterator(filter = () => true) {
        if (!this.rootNode.children) {
            return;
        }

        /** @type {Node[]} */
        const path = [this.rootNode];
        let currentNode = this.rootNode;
        let switchToNextChild = false;

        do {
            if (!filter(currentNode)) {
                switchToNextChild = true;
            }

            if (currentNode.children.length && !switchToNextChild) {
                path.push(currentNode);
                currentNode = currentNode.children[0];
                continue;
            }

            yield currentNode;

            const nextNodeIndex = currentNode.index + 1;
            if (nextNodeIndex < path[path.length - 1].children.length) {
                currentNode = path[path.length - 1].children[nextNodeIndex];
                switchToNextChild = false;
            } else {
                currentNode = path.pop();
                switchToNextChild = true;
            }
        } while (path.length);
    }

}
