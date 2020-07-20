import CyclicDependencyError from "./CyclicDependencyError";
import DependencyGraph from "./DependencyGraph";
import ComponentProvider from "./ComponentProvider";

const diContainerRef = "diContainer";

export default class DiContainer {

    instances = {};

    dependencyProviders = {};

    /** @type {{string: DependencyGraph}} */
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
            throw new Error(`"${diContainerRef}" is not overridable component`);
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
     * @param {boolean} createNewInstance
     * @returns {Promise<any>}
     */
    get(componentRef, createNewInstance = false) {
        if (createNewInstance || !this.isInitialized(componentRef)) {
            return this._initInstance(componentRef).then(() => this.instances[componentRef]);
        }

        return this.instances[componentRef];
    }

    constructExternal(classRef, config) {
        const provider = new ComponentProvider(classRef, config);
        return this._initInstance('', provider);
    }

    constructExternalUsingProvider(provider) {
        return this._initInstance('', provider);
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

    async _initInstance(componentRef = '', provider = null) {
        let external = false;
        if (provider) {
            external = true;
        } else {
            provider = this.dependencyProviders[componentRef];
        }

        const dependencyGraph = this._buildDependencyGraph(componentRef, provider);

        let lowestLevel = dependencyGraph.nodes.reduce((p, v) => {
            return (p.level > v.level ? p : v);
        }, dependencyGraph.nodes[0]).level;

        for (let i = lowestLevel; i >= 0; i--) {
            // init components on the lowest level first, because they don't have dependencies
            for (let j = 0; j < dependencyGraph.nodes.length; j++) {
                let node = dependencyGraph.nodes[j];
                if (node.level === i && (i === 0 || !this.isInitialized(node.dependencyRef))) {
                    let resolvedDependencies = this._resolveDependencies(dependencyGraph, node.level, j + 1);

                    if (i === 0 && external) {
                        return await provider.provide(...resolvedDependencies);
                    } else {
                        this.instances[node.dependencyRef] = await this.dependencyProviders[node.dependencyRef].provide(...resolvedDependencies);
                    }
                }
            }
        }
    }

    _resolveDependencies(dependencyGraph, parentNodeLevel, startNodeIndex) {
        let resolvedDependencies = [];
        for (let k = startNodeIndex; k < dependencyGraph.nodes.length; k++) {
            let childNode = dependencyGraph.nodes[k];
            if (childNode.level <= parentNodeLevel) {
                // not a child node, all child nodes are passed
                break;
            }
            if (childNode.level > (parentNodeLevel + 1)) {
                // not a direct child node
                continue;
            }

            console.assert((childNode.dependencyRef in this.instances),
                "Attempting to get dependency to inject into parent node, but it is not initialized");

            resolvedDependencies.push(this.instances[childNode.dependencyRef]);
        }

        return resolvedDependencies;
    }

    _buildDependencyGraph(dependencyRef, provider) {
        const dependencyGraph = new DependencyGraph();
        try {
            this._addDependencySubGraph(dependencyRef, provider, dependencyGraph, 0);
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

    _addDependencySubGraph(dependencyRef, dependencyProvider, dependencyGraph, level) {
        this._checkForCyclicDependencies(dependencyRef, dependencyGraph, level);

        dependencyGraph.pushNode({level, dependencyRef});

        if (dependencyProvider) {
            dependencyProvider.getDependencies().forEach(arg => {
                if (!this.instances[arg] && !this.isProvided(arg)) {
                    throw new Error(`Unsatisfied dependency '${arg.toString()}' for component '${dependencyRef.toString()}'`);
                }

                try {
                    this._addDependencySubGraph(arg, this.dependencyProviders[arg], dependencyGraph, level + 1);
                } catch (e) {
                    if (e instanceof CyclicDependencyError) {
                        e.requestingComponentsChain.push(dependencyRef);
                    }

                    throw e;
                }
            });
        }
    }

    _checkForCyclicDependencies(dependencyRef, superGraph, currentLevel) {
        const nodesCount = superGraph.nodes.length;

        for (let i = nodesCount - 1; i >= 0; i--) {
            const node = superGraph.nodes[i];
            if (node.level < currentLevel) {
                currentLevel = node.level;
            } else if (node.level >= currentLevel) {
                continue;
            }

            if (dependencyRef !== 'diContainer' && node.dependencyRef === dependencyRef) {
                throw new CyclicDependencyError(dependencyRef);
            }
        }
    }

}
