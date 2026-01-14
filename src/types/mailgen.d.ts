declare module 'mailgen' {
  interface IMailgenOptions {
    theme?: string;
    product: {
      name: string;
      link?: string;
      logo?: string;
      copyright?: string;
    };
  }

  interface IMailgenContent {
    body: {
      name?: string;
      intro?: string | string[];
      action?: {
        instructions?: string;
        button?: {
          color?: string;
          text: string;
          link: string;
        };
      };
      outro?: string | string[];
    };
  }

  class Mailgen {
    constructor(options: IMailgenOptions);

    generate(content: IMailgenContent): string;

    generatePlaintext(content: IMailgenContent): string;
  }

  export default Mailgen;
}
