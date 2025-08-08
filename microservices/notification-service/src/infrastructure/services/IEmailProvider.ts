import {EmailContent} from './emailBuilder';

export interface IEmailProvider {
    send(msg: EmailContent): Promise<any>;
    configure(config: Record<string, any>): void;
}