export interface AclInterface {
    microservice: string;
    create?: boolean;
    read?: boolean;
    update?: boolean;
    delete?: boolean;
}