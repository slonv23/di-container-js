/**
 * @typedef {import('./ComponentFactory').default} ComponentFactory
 */
import DependencyGraph from "./util/dependency-graph/DependencyGraph";
import ComponentProvider from "./ComponentProvider";
import Node from "./util/dependency-graph/Node";
import ComponentFactoryProvider from "./ComponentFactoryProvider";

const diContainerRef = "diContainer";

export default class DiContainer {

    instances = {};

    dependencyProviders = {};

    /** @type {object.<string, DependencyGraph>} */
    dependencyGraphs = {diContainer: new DependencyGraph(new Node('diContainer'))};

    constructor() {
        this.instances[diContainerRef] = this;
    }

    /**
     * @description Register a dependency using the ComponentProvider
     * @param {symbol|string} componentRef - dependency identifier
     * @param {ComponentProvider} componentProvider - provider which is used to construct a dependency instance
     */
    register(componentRef, componentProvider) {
        if (componentRef === diContainerRef) {
            throw new Error(`"${diContainerRef}" is not overridable component`);
        }
        this.dependencyProviders[componentRef] = componentProvider;
    }

    /**
     * @description Register a dependency using a class reference
     * @param {symbol|string} componentRef - dependency identifier
     * @param {Function} classRef - reference to a class
     * @param {object} [config] - configuration object which is passed to the postConstruct method of a class after it's creation
     */
    registerClass(componentRef, classRef, config) {
        if (componentRef === '') {
            throw new Error('\'componentRef\' could not be empty string');
        }
        this.register(componentRef, new ComponentProvider(classRef, config));
    }

    /**
     * @description Provide a component instance
     * @param {symbol|string} componentRef
     * @param {any} instance
     */
    provide(componentRef, instance) {
        this.instances[componentRef] = instance;
    }

    /**
     * @description Sets a configuration object which will be passed to 'postConstruct' method of a component
     * @param {symbol|string} componentRef
     * @param {object} config
     * @param {boolean} mergeConfig - whenever merge new config to old one
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
     * @description Retrieve a component instance
     * @param {symbol|string} componentRef
     * @returns {Promise<any>}
     */
    get(componentRef) {
        if (!this.isInitialized(componentRef)) {
            return this._initInstance(componentRef);
        }

        return this.instances[componentRef];
    }

    /**
     * @description Construct an instance of a class without registration in the DI container
     * @param {Function} classRef
     * @param {object} config
     * @returns {Promise<*|undefined>}
     */
    constructExternal(classRef, config) {
        const provider = new ComponentProvider(classRef, config);
        return this._initInstance('', provider);
    }

    /**
     * @description Construct a component without registration in the DI container
     * @param {ComponentProvider} provider
     * @returns {Promise<*|undefined>}
     */
    constructExternalUsingProvider(provider) {
        return this._initInstance('', provider);
    }

    /**
     * @description Create a factory for a class.
     * A factory allows to create multiple instances of a class and inject dependencies to them.
     * A factory itself is not registered in DI container
     * @param {Function} classRef
     * @returns {Promise<ComponentFactory>}
     */
    createFactory(classRef) {
        const provider = new ComponentFactoryProvider(classRef);
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
        try {
            const dependencyGraph = this._buildDependencyGraph(componentRef, provider);

            const it = dependencyGraph.makeIterator((node) => {
                return !this.isInitialized(node.dependencyRef);
            });
            for (const node of it) {
                if (node === dependencyGraph.rootNode && provider) {
                    // construct external component
                    return await provider.provide(...this._resolveDependencies(node));
                } else {
                    this.instances[node.dependencyRef] = await this.dependencyProviders[node.dependencyRef].provide(...this._resolveDependencies(node));
                }
            }

            return this.instances[componentRef];
        } catch (err) {
            console.error(err.toString());
            throw err;
        }
    }

    /**
     * @param {Node} node
     * @returns {Array}
     * @private
     */
    _resolveDependencies(node) {
        let resolvedDependencies = [];
        for (const childNode of node.children) {
            console.assert((childNode.dependencyRef in this.instances),
                "Attempting to get dependency to inject into parent node, but it is not initialized");

            resolvedDependencies.push(this.instances[childNode.dependencyRef]);
        }

        return resolvedDependencies;
    }

    _buildDependencyGraph(dependencyRef, provider) {
        let external = false;
        if (provider) {
            external = true;
        } else {
            if (this.dependencyGraphs[dependencyRef]) {
                return this.dependencyGraphs[dependencyRef];
            }
            if (!this.isProvided(dependencyRef)) {
                throw new Error(`No provider defined for '${dependencyRef.toString()}' component`);
            }
            provider = this.dependencyProviders[dependencyRef];
        }

        const rootNode = new Node(dependencyRef);
        const dependencyGraph = new DependencyGraph(rootNode);
        if (!external) {
            this.dependencyGraphs[dependencyRef] = dependencyGraph;
        }

        this._buildDependencyGraphRecursive(rootNode, provider);

        return dependencyGraph;
    }

    /**
     * @param {Node} rootNode
     * @param {ComponentProvider} provider
     * @private
     */
    _buildDependencyGraphRecursive(rootNode, provider) {
        /** @type {{node: Node, dependencyRef: string, provider: ComponentProvider}[]} */
        const unprocessedComponents = [
            {node: rootNode, dependencyRef: rootNode.dependencyRef, provider}
        ];

        let component;
        while ((component = unprocessedComponents.pop())) {
            const dependencies = component.provider.getDependencies();
            for (const dependencyRef of dependencies) {
                if (!this.instances[dependencyRef] && !this.isProvided(dependencyRef)) {
                    throw new Error(`Unsatisfied dependency '${dependencyRef.toString()}' for component '${component.dependencyRef.toString()}'`);
                }

                let node;
                if (!this.dependencyGraphs[dependencyRef]) {
                    node = new Node(dependencyRef);
                    const provider = this.dependencyProviders[dependencyRef];

                    this.dependencyGraphs[dependencyRef] = new DependencyGraph(node);
                    unprocessedComponents.push({node, dependencyRef, provider})
                } else {
                    node = this.dependencyGraphs[dependencyRef].rootNode;
                }

                component.node.addChild(node);
            }
        }
    }

}
