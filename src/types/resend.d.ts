declare module 'resend' {
  export interface ResendEmail {
    id: string;
  }

  export interface ResendError {
    message?: string;
    name?: string;
    statusCode?: number;
  }

  export interface SendEmailResponse {
    data?: ResendEmail;
    error?: ResendError;
  }

  export interface SendEmailOptions {
    from: string;
    to: string | string[];
    subject: string;
    html?: string;
    text?: string;
    replyTo?: string;
    cc?: string | string[];
    bcc?: string | string[];
  }

  export interface Emails {
    send: (options: SendEmailOptions) => Promise<SendEmailResponse>;
  }

  export interface ResendClient {
    emails: Emails;
  }

  export class Resend implements ResendClient {
    constructor(apiKey: string);
    emails: Emails;
  }

  export { Resend as default, Resend };
}
