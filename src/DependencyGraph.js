export default class DependencyGraph {

    /**
     * @typedef {object} Node
     * @property {number} level
     * @property {string} dependencyRef
     */

    /**
     * @type {Node[]}
     */
    nodes = [];

    /**
     * @param {string} dependencyRef
     * @param {number} level 
     */
    constructor(dependencyRef, level = 0) {
        if (dependencyRef) {
            this.nodes.push({
                level,
                dependencyRef
            });
        }
    }

    /**
     * @param {DependencyGraph} dependencySubGraph 
     */
    addDependencies(dependencySubGraph) {
        dependencySubGraph.nodes.forEach((node) => {
            node = Object.assign({}, node);
            this.nodes.push(node);
        });
    }

    level() {
        return this.nodes.length ? this.nodes[0].level : -1;
    }

}
