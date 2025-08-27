export interface DiscoveredService {
  discoveredClass: {
    instance: any;
  };
}

export type InterfaceChecker = (serviceInstance: any) => boolean;

export class InterfaceExplorer {
  static collect(
    discoveredList: DiscoveredService[],
    interfaceChecker: InterfaceChecker,
  ): any[] {
    const services: any[] = [];
    for (const service of discoveredList) {
      const serviceInstance = service.discoveredClass.instance;
      if (interfaceChecker(serviceInstance)) {
        services.push(serviceInstance);
      }
    }
    return services;
  }
}
