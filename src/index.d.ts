declare module 'di-container-js' {
    interface ComponentProvider {
        getDependencies(): string|symbol[];
        provide(...args: any[]): any;
        mergeConfig(config: any): void;
        setConfig(config: any): void;
    }

    interface ComponentFactory {
        create(): any;
    }

    class DiContainer {
        register(componentRef: symbol|string, componentProvider: ComponentProvider)
        registerClass(componentRef: symbol|string, classRef: Function, config?: object): void;
        configure(componentRef: symbol|string, config: object, mergeConfig?: boolean): void;
        get(componentRef: symbol|string, createNewInstance?: boolean): Promise<any>;
        constructExternal(classRef: Function, config?: object): Promise<any>;
        constructExternalUsingProvider(provider: any): Promise<any>;
        provide(componentRef: symbol|string, instance: any): void;
        createFactory(classRef: Function): Promise<ComponentFactory>;
        isInitialized(componentRef: symbol|string): boolean;
        isProvided(componentRef: symbol|string): boolean;
    }

    export = DiContainer
}
