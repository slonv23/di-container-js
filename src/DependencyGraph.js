/**
 * @typedef {object} Node
 * @property {number} level
 * @property {string} dependencyRef
 */

export default class DependencyGraph {

    /**
     * @type {Node[]}
     */
    nodes = [];

    /**
     * @param {string|null} [dependencyRef]
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
     * @param {number|null} atLevel
     * @returns {DependencyGraph}
     */
    addDependencies(dependencySubGraph, atLevel = null) {
        if (!dependencySubGraph.nodes.length) {
            return this;
        }

        const nodes = dependencySubGraph.nodes.map(node => {
            return Object.assign({}, node);
        });

        if (atLevel) {
            const levelsDiff = nodes[0].level - atLevel;
            nodes.forEach(node => {
                node.level -= levelsDiff;
            });
        }

        this.nodes.push(...nodes);

        return this;
    }

    level() {
        return this.nodes.length ? this.nodes[0].level : -1;
    }

    clone() {
        const clone = new DependencyGraph();
        this.nodes.forEach(node => {
            clone.nodes.push(Object.assign({}, node));
        });

        return clone;
    }

}
