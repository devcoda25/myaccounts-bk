declare module 'africastalking' {
    interface Options {
        apiKey: string;
        username: string;
    }

    interface SendOptions {
        to: string[];
        message: string;
        from?: string;
    }

    interface SendResult {
        SMSMessageData: {
            Message: string;
            Recipients: any[];
        };
    }

    interface SmsService {
        send(options: SendOptions): Promise<SendResult>;
    }

    interface Client {
        SMS: SmsService;
        PAYMENTS: any;
        VOICE: any;
    }

    function AfricasTalking(options: Options): Client;

    export = AfricasTalking;
}
