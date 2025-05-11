export interface IEventMessage {
    key: string;
    value: string | Buffer;
    partition?: number;
    headers?: Record<string, string>;
  }
  
  export interface ITopicMessages {
    topic: string;
    messages: IEventMessage[];
  }
  