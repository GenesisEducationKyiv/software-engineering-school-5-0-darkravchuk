export interface IEmailProvider {
    send(msg: {
        to: string;
        from: string;
        subject: string;
        text: string;
        html: string;
    }): Promise<any>;
    configure(config: Record<string, any>): void;
}