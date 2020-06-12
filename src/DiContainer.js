import CyclicDependencyError from "./CyclicDependencyError";
import DependencyGraph from "./DependencyGraph";
import ComponentProvider from "./ComponentProvider";

const diContainerRef = "diContainer";

export default class DiContainer {

    instances = {};

    dependencyProviders = {};

    dependencyGraphs = {};

    constructor() {
        this.instances[diContainerRef] = this;
    }

    /**
     * @param {symbol|string} componentRef
     * @param {ComponentProvider} componentProvider
     */
    register(componentRef, componentProvider) {
        if (componentRef === diContainerRef) {
            throw new Error(`"${diContainerRef}" is not owerwritable component`);
        }
        this.dependencyProviders[componentRef] = componentProvider;
    }

    /**
     * @param {symbol|string} componentRef
     * @param {Function} classRef - reference to a class
     * @param {object} [config]
     */
    registerClass(componentRef, classRef, config) {
        this.register(componentRef, new ComponentProvider(classRef, config));
    }

    /**
     * @param {symbol|string} componentRef
     * @param {object} config
     * @param {boolean} mergeConfig
     */
    configure(componentRef, config, mergeConfig = true) {
        if (!this.isProvided(componentRef)) {
            throw new Error(`Cannot configure component '${componentRef.toString()}' because it is not provided`);
        }

        if (mergeConfig) {
            this.dependencyProviders[componentRef].mergeConfig(config);
        } else {
            this.dependencyProviders[componentRef].setConfig(config);
        }
    }

    /**
     * @param {symbol|string} componentRef
     * @returns {Promise<any>}
     */
    get(componentRef) {
        if (!this.isInitialized(componentRef)) {
            return this._initInstance(componentRef).then(() => this.instances[componentRef]);
        }

        return this.instances[componentRef];
    }

    /**
     * @param {symbol|string} componentRef
     * @returns {boolean}
     */
    isInitialized(componentRef) {
        return Object.prototype.hasOwnProperty.call(this.instances, componentRef);
    }

    /**
     * @param {symbol|string} componentRef
     * @returns {boolean}
     */
    isProvided(componentRef) {
        return Object.prototype.hasOwnProperty.call(this.dependencyProviders, componentRef);
    }

    async _initInstance(componentRef) {
        const dependencyGraph = this._buildDependencyGraph(componentRef)

        let lowestLevel = dependencyGraph.nodes.reduce((p, v) => {
            return (p.level > v.level ? p : v);
        }, dependencyGraph.nodes[0]).level;

        for (let i = lowestLevel; i >= 0; i--) {
            // init components on the lowest level first, because they don't have dependencies
            for (let j = 0; j < dependencyGraph.nodes.length; j++) {
                let node = dependencyGraph.nodes[j];
                if (node.level === i && !this.isInitialized(node.dependencyRef)) {
                    let resolvedDependencies = [];
                    for (let k = j + 1; k < dependencyGraph.nodes.length; k++) {
                        let childNode = dependencyGraph.nodes[k];
                        if (childNode.level <= node.level) {
                            // not a child node, all child nodes are passed
                            break;
                        }
                        if (childNode.level > (node.level + 1)) {
                            // not a direct child node
                            continue;
                        }

                        console.assert((childNode.dependencyRef in this.instances),
                            "Attempting to get dependency to inject into parent node, but it is not initialized");

                        resolvedDependencies.push(this.instances[childNode.dependencyRef]);
                    }

                    this.instances[node.dependencyRef] = await this.dependencyProviders[node.dependencyRef].provide(...resolvedDependencies);
                }
            }
        }
    }

    _buildDependencyGraph(dependencyRef) {
        const dependencyGraph = new DependencyGraph();
        try {
            this._addDependencySubGraph(dependencyRef, dependencyGraph, 0);
            return dependencyGraph;
        } catch (e) {
            if (e instanceof CyclicDependencyError) {
                let requestChain = e.requestingComponentsChain.reverse()
                    .map((e) => e.toString())
                    .join(' -> ');
                console.error(`Cyclic dependency found ${requestChain} -> ${e.requiredComponent}`);
            }
            throw e;
        }
    }

    _addDependencySubGraph(dependencyRef, superGraph, level) {
        let dependencySubGraph;
        if (this.dependencyGraphs[dependencyRef]) {
            if (this.dependencyGraphs[dependencyRef].level() < level) {
                throw new CyclicDependencyError(dependencyRef);
            }
            dependencySubGraph = this.dependencyGraphs[dependencyRef];
            superGraph.addDependencies(dependencySubGraph);
            return;
        }

        dependencySubGraph = new DependencyGraph(dependencyRef, level);
        this.dependencyGraphs[dependencyRef] = dependencySubGraph;

        if (this.dependencyProviders[dependencyRef]) {
            this.dependencyProviders[dependencyRef].getDependencies().forEach(arg => {
                if (!this.instances[arg] && !this.isProvided(arg)) {
                    throw new Error(`Unsatisfied dependency '${arg.toString()}' for component '${dependencyRef.toString()}'`);
                }

                try {
                    this._addDependencySubGraph(arg, dependencySubGraph, level + 1);
                } catch (e) {
                    if (e instanceof CyclicDependencyError) {
                        e.requestingComponentsChain.push(dependencyRef);
                    }

                    throw e;
                }
            });
        }

        superGraph.addDependencies(dependencySubGraph);
    }

}
