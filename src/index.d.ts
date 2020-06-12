declare module 'di-container-js' {
    class DiContainer {
        registerClass(componentRef: symbol|string, classRef: Function, config?: object): void;
        configure(componentRef: symbol|string, config: object, mergeConfig?: boolean): void;
        get(componentRef: symbol|string): Promise<any>;
    }

    export = DiContainer
}
