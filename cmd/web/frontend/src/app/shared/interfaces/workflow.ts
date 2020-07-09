

export interface Workflow {
  name: string;
  processors?: Array<Processor>;
  running: boolean;
}

export interface Processor {
  name: string;
  description: string;
  properties?: Array<Property>;
  running: boolean;
}

export interface Property {
  name: string;
  description: string;
  value: string;
  valid: boolean;
  required: boolean;
}


