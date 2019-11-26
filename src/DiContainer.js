import CyclicDependencyError from "./CyclicDependencyError";
import DependencyGraph from "./DependencyGraph";
import ComponentProvider from "./ComponentProvider";

export default class DiContainer {

    instances = {};

    dependencyProviders = {};

    dependencyGraphs = {};

    /**
     * @param {symbol|string} componentRef 
     * @param {ComponentProvider} componentProvider 
     */
    register(componentRef, componentProvider) {
        this.dependencyProviders[componentRef] = componentProvider;
    }

    /**
     * @param {symbol|string} componentRef 
     * @param {Function} classRef - reference to a class 
     * @param {object} config 
     */
    registerClass(componentRef, classRef, config) {
        this.dependencyProviders[componentRef] = new ComponentProvider(classRef, config);
    }

    /**
     * @param {symbol|string} componentRef 
     * @param {object} config 
     */
    configure(componentRef, config) {
        if (!this.isProvided(componentRef)) {
            throw new Error(`Cannot configure component '${componentRef.toString()}' because it is not provided`);
        }
        
        this.dependencyProviders[componentRef].setConfig(config);
    }

    /**
     * @param {symbol|string} componentRef
     * @returns {any}
     */
    get(componentRef) {
        if (!this.isInitialized(componentRef)) {
            this._initInstance(componentRef);
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

    _initInstance(componentRef) {
        const dependencyGraph = this._buildDependencyGraph(componentRef)

        let lowestLevel = dependencyGraph.nodes.reduce((p, v) => {
            return (p.level > v.level ? p.level : v.level);
        }, dependencyGraph.nodes[0].level);

        for (let i = lowestLevel; i >= 0; i--) {
            // init components on the lowest level first, because they don't have dependencies
            for (let j = 0; j < dependencyGraph.nodes.length; j++) {
                let node = dependencyGraph.nodes[j];
                if (node.level === i && !this.isInitialized(node.dependencyRef)) {
                    let resolvedDependencies = [];
                    for (let k = j + 1; k < dependencyGraph.nodes.length; k++) {
                        let childNode = dependencyGraph.nodes[k];
                        if (childNode.level != (node.level + 1)) {
                            // not a child node, all child nodes are passed
                            break;
                        }

                        console.assert((childNode.dependencyRef in this.instances),
                            "Attempting to get dependency to inject into parent node, but it is not initialized");

                        resolvedDependencies.push(this.instances[childNode.dependencyRef]);
                    }

                    this.instances[node.dependencyRef] = this.dependencyProviders[node.dependencyRef].provide(...resolvedDependencies);
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
                throw e;
            }
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

        this.dependencyProviders[dependencyRef].getDependencies().forEach(arg => {
            if (!this.isProvided(arg)) {
                throw new Error(`Unsatisfied dependency '${arg.toString()}' for component '${dependencyRef.toString()}'`);
            }

            if (!this.instances[arg]) {
                try {
                    this._addDependencySubGraph(arg, dependencySubGraph, level + 1);
                } catch (e) {
                    if (e instanceof CyclicDependencyError) {
                        e.requestingComponentsChain.push(dependencyRef);
                    }

                    throw e;
                }
            }
        });

        superGraph.addDependencies(dependencySubGraph);
    }

}
