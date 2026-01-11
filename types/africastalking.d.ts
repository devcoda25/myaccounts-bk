declare module 'africastalking' {
    export interface Options {
        apiKey: string;
        username: string;
    }

    export interface SendOptions {
        to: string[];
        message: string;
        from?: string;
    }

    export interface Recipient {
        number: string;
        status: string;
        cost: string;
        messageId: string;
    }

    export interface SendResult {
        SMSMessageData: {
            Message: string;
            Recipients: Recipient[];
        };
    }

    export interface SmsService {
        send(options: SendOptions): Promise<SendResult>;
    }

    export interface Client {
        SMS: SmsService;
        PAYMENTS: any;
        VOICE: any;
    }

    function AfricasTalking(options: Options): Client;

    export = AfricasTalking;
}
